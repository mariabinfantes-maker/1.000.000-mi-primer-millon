import fs from "node:fs";
import path from "node:path";
import type { Pool } from "pg";
import type { Herramienta } from "@/data/esquema";
import type { AffiliateData, CuentaAfiliado, EstrategiaAfiliacion } from "@/data/esquemaInterno";
import { getTodasLasCategorias, getTodasLasHerramientas, validarHerramienta } from "@/data/repositorio";
import { getEstrategiaAfiliacion, guardarEstrategiaAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";
import { calcularPuntuacionAtlas } from "@/lib/puntuacionAtlas";
import { detectarCasiDuplicados } from "@/agents/atlas-curator/duplicados";
import { leerBorrador } from "./borrador";
import { comprobarAutorizacion } from "./autorizacionAfiliacion";
import { decidirEstadoAfiliacion } from "./estadoAfiliacion";
import { evaluarCriteriosDeCalidad } from "./criteriosCalidad";
import { examinarParaEntrar } from "./examenDeEntrada";
import { contarCapacidadesVerificadas } from "./capacidadesVerificadas";
import { leerDecision } from "./decision";
import { generarIdCuenta } from "@/agents/atlas-affiliate-manager/estrategiaAfiliacion";
import { registrarEnHistorial } from "./historialAprobaciones";

/**
 * Promoción (etapa final del flujo: investigar → informe → revisión →
 * aprobación → promoción).
 *
 * Es el ÚNICO módulo de esta fase que escribe en `data/herramientas/` y
 * `data/afiliados/` — el catálogo real. Todo lo demás (lote.ts, borrador.ts)
 * solo llega hasta `data/borradores/`. Antes de copiar nada, exige que
 * exista una decisión humana "aprobado" registrada (`decision.ts`) — Atlas
 * nunca promueve una herramienta sin esa aprobación manual explícita, sea
 * cual sea la calidad del borrador — y corre las mismas comprobaciones que
 * `data/verificar.ts` (esquema válido, categoría existente) más las propias
 * de la promoción: que el id no colisione con uno ya promovido, que no sea
 * un casi-duplicado de otra herramienta ya en el catálogo bajo otro id
 * (Atlas Curator, `detectarCasiDuplicados` — ver ATLAS.md), que supere el
 * criterio de calidad (`criteriosCalidad.ts`: confianza de la
 * investigación, advertencias, Puntuación Molnip mínima), y que la regla
 * obligatoria de afiliados se siga cumpliendo con lo que quedó guardado en
 * el borrador (cinturón y tirantes, igual que la doble comprobación que ya
 * hace `agente.ts`).
 *
 * Al promover con éxito, siembra también un registro inicial de
 * `EstrategiaAfiliacion` con una primera cuenta (estado "no_solicitado",
 * precargada con lo ya investigado) si todavía no existe ninguno para ese
 * id — nunca lo sobrescribe si ya había progreso real de una solicitud de
 * afiliación.
 *
 * Último paso, aprobado el 2026-08-18: cada intento de promoción —
 * aceptado o rechazado — queda registrado en el historial de aprobaciones
 * (`historialAprobaciones.ts`), la auditoría interna de por qué una
 * herramienta entró o no al catálogo. Se registra siempre que exista un
 * borrador que evaluar, gane o pierda.
 *
 * Anulación explícita de un aviso de Curator (`ignorarAvisosDuplicado`,
 * añadido el 2026-08-19): el aviso de casi-duplicado tiene falsos
 * positivos reales y esperables (mismo proveedor, productos distintos —
 * primer caso real: "Zoho CRM" frente a "Zoho One", ambos en zoho.com).
 * Curator nunca decide por su cuenta si es un falso positivo; solo una
 * persona puede anularlo, y solo con `justificacionAnulacion` explícita —
 * queda registrada tal cual en el historial de aprobaciones, nunca en
 * silencio. El resto de comprobaciones (esquema, categoría, criterio de
 * calidad, regla de afiliados) se siguen aplicando sin excepción.
 */

export type ResultadoPromocion =
  | { ok: true; id: string; rutaHerramienta: string; rutaAfiliados: string }
  | { ok: false; id: string; errores: string[] };

export type OpcionesPromocion = {
  /** De dónde leer el borrador. Por defecto `data/borradores` — solo para pruebas. */
  dirBaseBorradores?: string;
  /** Dónde escribir el catálogo real (debe contener `herramientas/` y `afiliados/`). Por defecto `data`, la ruta real del proyecto — solo para pruebas. */
  dirDatos?: string;
  /** Pool de Postgres para leer/escribir la estrategia de afiliación al sembrar el registro inicial. Por defecto el pool real (`obtenerPool()`) — solo para pruebas. */
  poolEstrategia?: Pool;
  /** Dónde escribir el historial de aprobaciones. Por defecto `data/historial-aprobaciones.json` — solo para pruebas. */
  rutaHistorial?: string;
  /** Anula el aviso de casi-duplicado de Atlas Curator para este intento — nunca por defecto. Exige `justificacionAnulacion`. */
  ignorarAvisosDuplicado?: boolean;
  /** Por qué se anula el aviso de duplicado — obligatorio si `ignorarAvisosDuplicado` es `true`; queda en el historial de aprobaciones tal cual. */
  justificacionAnulacion?: string;
};

/**
 * DESCONECTADA POR ORDEN DE LA PROPIETARIA (2026-09-28).
 *
 * Ya no se llama. La promoción no mira la afiliación: una herramienta útil
 * entra aunque no tenga programa. La falta de afiliación sólo afecta a la
 * monetización y nunca convierte una herramienta adecuada en descartada; no
 * se usa como criterio de orden, descarte ni exclusión (AGENTS.md).
 *
 * Es la misma orden que ya se cumplió en el Researcher el 2026-09-16 y en
 * `data/verificar.ts` el 2026-09-28. Este punto se quedó atrás: la orden se
 * aplicaba donde se estaba trabajando y quedaba una copia en otro archivo.
 * Se vio al preguntar la propietaria cómo entran al catálogo 30 herramientas
 * nuevas encontradas fuera de él.
 *
 * Se conserva entera, con lo que decía cuando estaba viva, porque la
 * decisión tiene que poder revertirse sin rehacer el trabajo de quien la
 * pensó. Lo que decía:
 *
 *   «La afiliación sigue siendo la vía habitual y sigue bloqueando por
 *   defecto — lo que cambia es que deja de ser incondicional. La excepción
 *   NO la abre una bandera de línea de comandos: la abre una autorización
 *   registrada, atada a esta herramienta y al estado de afiliación exacto
 *   que tiene ahora. Una decisión editorial antigua, tomada por otro motivo,
 *   ya no sirve para esto — era el agujero que encontró la revisión.»
 *
 * Para volver a encenderla, se vuelve a llamar desde `promoverBorrador`,
 * donde está marcada la línea. El resto de comprobaciones —esquema,
 * categoría, duplicados, calidad y la aprobación manual— siguen intactas:
 * lo que se apaga es la puerta de la afiliación, nada más.
 */
function bloquearPorAfiliacion(
  id: string,
  datosAfiliados: Partial<AffiliateData>,
  opciones: OpcionesPromocion
): { bloquea: false; anulacion?: string } | { bloquea: true; motivo: string } {
  const estado = decidirEstadoAfiliacion(datosAfiliados);
  if (estado === "confirmada") return { bloquea: false };

  const autorizacion = comprobarAutorizacion(id, estado, { dirBase: opciones.dirBaseBorradores });
  if (!autorizacion.autorizada) return { bloquea: true, motivo: autorizacion.explicacion };

  return { bloquea: false, anulacion: `Admitida sin afiliación confirmada (estado "${estado}"): ${autorizacion.motivo}` };
}

export async function promoverBorrador(id: string, opciones: OpcionesPromocion = {}): Promise<ResultadoPromocion> {
  const dirDatos = opciones.dirDatos ?? path.join(process.cwd(), "data");
  const dirBaseBorradores = opciones.dirBaseBorradores;

  const borrador = leerBorrador(id, { dirBase: dirBaseBorradores });
  if (!borrador) {
    return { ok: false, id, errores: [`No existe ningún borrador con id "${id}".`] };
  }

  const errores: string[] = [];

  const decision = leerDecision(id, { dirBase: dirBaseBorradores });
  const aprobacionCeo = decision?.decision === "aprobado";
  if (!aprobacionCeo) {
    errores.push(
      `"${id}" no tiene una decisión "aprobado" registrada. Revisa el informe y ejecuta primero: ` +
        `npm run aprobar-borrador -- ${id} --decision aprobado --notas "..."`
    );
  }

  let herramienta: Herramienta | undefined;
  try {
    herramienta = validarHerramienta(borrador.datos, `borradores/${id}.json`);
  } catch (error) {
    errores.push(error instanceof Error ? error.message : String(error));
  }

  const catalogoExistente = getTodasLasHerramientas();
  const datosAfiliados = borrador.datosAfiliados as Partial<AffiliateData>;

  let verificacionAfiliacionPendiente = false;
  let calidadSuperada = false;
  let anulacionDuplicadoAplicada: string | null = null;

  if (herramienta) {
    const idsCategorias = new Set(getTodasLasCategorias().map((c) => c.id));
    if (!idsCategorias.has(herramienta.categoriaId)) {
      errores.push(`"${id}" referencia una categoría inexistente: "${herramienta.categoriaId}".`);
    }

    const avisosDuplicado = detectarCasiDuplicados(herramienta, catalogoExistente);
    if (avisosDuplicado.length > 0) {
      if (opciones.ignorarAvisosDuplicado && opciones.justificacionAnulacion?.trim()) {
        anulacionDuplicadoAplicada =
          `Aviso de Curator anulado explícitamente: ${avisosDuplicado.map((a) => a.motivo).join(" ")} ` +
          `Justificación: ${opciones.justificacionAnulacion.trim()}`;
      } else if (opciones.ignorarAvisosDuplicado) {
        errores.push('"ignorarAvisosDuplicado" exige "justificacionAnulacion" — explica por qué no es un duplicado real.');
      } else {
        for (const aviso of avisosDuplicado) {
          errores.push(
            `Atlas Curator: ${aviso.motivo} Si de verdad son herramientas distintas, ajusta el nombre para diferenciarlas ` +
              "antes de promover; si es la misma, no la promuevas dos veces."
          );
        }
      }
    }

    /**
     * EL EXAMEN DE ENTRADA (propietaria, 2026-09-29).
     *
     * Sustituye al umbral de 80/100 de `evaluarCriteriosDeCalidad`, que no se
     * borra: sigue ahí, con su porqué, y se vuelve a llamar desde aquí si
     * algún día hace falta. Lo que medía el 80 y por qué dejó de valer está
     * escrito entero en `examenDeEntrada.ts`.
     *
     * En corto: el 80 se calculaba con la nota de G2/Capterra y las siete
     * valoraciones que nos poníamos nosotros. Lo aprobaba el 92 % del catálogo
     * y sólo lo podían aprobar las herramientas grandes e internacionales,
     * porque G2 y Capterra son del mercado en inglés. El examen nuevo pregunta
     * qué sabemos de ella y podemos demostrar.
     *
     * La confianza de la investigación y sus advertencias siguen bloqueando:
     * eso no era el umbral, es otra cosa, y sigue valiendo.
     */
    const confianza = borrador.metadatos?.confianza;
    if (confianza === "baja") {
      errores.push('Criterio de calidad: la investigación tiene confianza "baja" — complétala antes de promover.');
    }
    const advertencias = borrador.metadatos?.advertencias ?? [];
    if (advertencias.length > 0) {
      errores.push(`Criterio de calidad: quedan ${advertencias.length} advertencia(s) sin resolver: ${advertencias.join("; ")}`);
    }

    const examen = examinarParaEntrar(herramienta, {
      capacidadesVerificadas: contarCapacidadesVerificadas(id, dirDatos),
    });
    if (!examen.ok) {
      errores.push(...examen.errores.map((e) => `Examen de entrada: ${e}`));
    }

    if (confianza !== "baja" && advertencias.length === 0 && examen.ok) {
      calidadSuperada = true;
      verificacionAfiliacionPendiente = datosAfiliados.confidenceLevel === "medium";
    }

    // Desconectado con el umbral de 80. Se conserva para poder volver.
    void evaluarCriteriosDeCalidad;
  }

  const idsExistentes = new Set(catalogoExistente.map((h) => h.id));
  if (idsExistentes.has(id)) {
    errores.push(`"${id}" ya existe en el catálogo real: promoverlo lo sobrescribiría. Revísalo a mano si es intencionado.`);
  }

  // Aquí se llamaba a `bloquearPorAfiliacion`. Desconectada el 2026-09-28 por
  // orden de la propietaria — ver la nota sobre esa función. Para volver a
  // encenderla, se restaura esta llamada.
  void bloquearPorAfiliacion;
  const anulacionAfiliacionAplicada: string | undefined = undefined;

  const nombreHerramienta = herramienta?.nombre ?? id;
  const puntuacionMolnip = herramienta ? (calcularPuntuacionAtlas(herramienta)?.puntuacion ?? null) : null;
  const estadoAfiliacion = calidadSuperada ? (verificacionAfiliacionPendiente ? "pendiente_de_verificar" : "confirmada") : null;

  if (errores.length > 0 || !herramienta) {
    registrarEnHistorial(
      {
        herramientaId: id,
        nombreHerramienta,
        resultado: "rechazada",
        puntuacionMolnip,
        estadoAfiliacion,
        observaciones: [
          decision?.notas,
          anulacionDuplicadoAplicada,
          anulacionAfiliacionAplicada,
          `Motivos del bloqueo: ${errores.join(" | ")}`,
        ]
          .filter(Boolean)
          .join(" "),
        aprobacionCeo,
      },
      { ruta: opciones.rutaHistorial }
    );
    return { ok: false, id, errores };
  }

  const dirHerramientas = path.join(dirDatos, "herramientas");
  const dirAfiliados = path.join(dirDatos, "afiliados");
  fs.mkdirSync(dirHerramientas, { recursive: true });
  fs.mkdirSync(dirAfiliados, { recursive: true });

  const hoy = new Date().toISOString().slice(0, 10);
  const herramientaFinal: Herramienta = { ...herramienta, estado: "activo", fechaUltimaRevision: hoy };

  const rutaHerramienta = path.join(dirHerramientas, `${id}.json`);
  const rutaAfiliados = path.join(dirAfiliados, `${id}.json`);

  fs.writeFileSync(rutaHerramienta, `${JSON.stringify(herramientaFinal, null, 2)}\n`, "utf-8");
  fs.writeFileSync(rutaAfiliados, `${JSON.stringify(datosAfiliados, null, 2)}\n`, "utf-8");

  if (!(await getEstrategiaAfiliacion(id, { pool: opciones.poolEstrategia }))) {
    const observaciones = verificacionAfiliacionPendiente
      ? "Creada automáticamente al promover, a partir de los datos investigados. Pendiente de solicitar el programa. " +
        "Verificación pendiente: la confianza de la investigación de afiliados era media — confirma comisión y " +
        "plataforma antes de solicitar el programa o dar la cuenta por lista para monetizar."
      : "Creada automáticamente al promover, a partir de los datos investigados. Pendiente de solicitar el programa.";

    const cuentaInicial: CuentaAfiliado = {
      id: generarIdCuenta(datosAfiliados.affiliatePlatform),
      estado: "no_solicitado",
      nombrePrograma: datosAfiliados.affiliateProgramName,
      plataforma: datosAfiliados.affiliatePlatform ?? "Por determinar",
      urlSolicitud: datosAfiliados.affiliateUrl,
      comision: datosAfiliados.commission,
      duracionCookie: datosAfiliados.cookieDuration,
      metodoPago: datosAfiliados.payoutMethod,
      frecuenciaPago: datosAfiliados.payoutFrequency,
      enlaces: [],
      ultimaRevision: hoy,
      observaciones,
      ...(verificacionAfiliacionPendiente ? { verificacionPendiente: true } : {}),
    };
    const estrategiaInicial: EstrategiaAfiliacion = { herramientaId: id, cuentas: [cuentaInicial] };
    await guardarEstrategiaAfiliacion(estrategiaInicial, { pool: opciones.poolEstrategia, usuario: "sistema-promocion" });
  }

  registrarEnHistorial(
    {
      herramientaId: id,
      nombreHerramienta,
      resultado: "aceptada",
      puntuacionMolnip,
      estadoAfiliacion,
      observaciones:
        [decision?.notas, anulacionDuplicadoAplicada, anulacionAfiliacionAplicada].filter(Boolean).join(" ") ||
        "Sin observaciones.",
      aprobacionCeo,
    },
    { ruta: opciones.rutaHistorial }
  );

  return { ok: true, id, rutaHerramienta, rutaAfiliados };
}
