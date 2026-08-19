import fs from "node:fs";
import path from "node:path";
import type { Herramienta } from "@/data/esquema";
import type { AffiliateData, CuentaAfiliado, EstrategiaAfiliacion } from "@/data/esquemaInterno";
import { getCategorias, getTodasLasHerramientas, validarHerramienta } from "@/data/repositorio";
import { getEstrategiaAfiliacion, guardarEstrategiaAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";
import { calcularPuntuacionAtlas } from "@/lib/puntuacionAtlas";
import { detectarCasiDuplicados } from "@/agents/atlas-curator/duplicados";
import { leerBorrador } from "./borrador";
import { evaluarCriteriosDeCalidad } from "./criteriosCalidad";
import { leerDecision } from "./decision";
import { generarIdCuenta } from "./estrategiaAfiliacion";
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
  /** De dónde leer/escribir la estrategia de afiliación al sembrar el registro inicial. Por defecto `data/estrategia-afiliados` — solo para pruebas. */
  dirBaseEstrategia?: string;
  /** Dónde escribir el historial de aprobaciones. Por defecto `data/historial-aprobaciones.json` — solo para pruebas. */
  rutaHistorial?: string;
  /** Anula el aviso de casi-duplicado de Atlas Curator para este intento — nunca por defecto. Exige `justificacionAnulacion`. */
  ignorarAvisosDuplicado?: boolean;
  /** Por qué se anula el aviso de duplicado — obligatorio si `ignorarAvisosDuplicado` es `true`; queda en el historial de aprobaciones tal cual. */
  justificacionAnulacion?: string;
};

function tieneProgramaDeAfiliadosFiable(datosAfiliados: Partial<AffiliateData>): boolean {
  if (datosAfiliados.hasAffiliateProgram !== true) return false;
  return datosAfiliados.confidenceLevel !== "low";
}

export function promoverBorrador(id: string, opciones: OpcionesPromocion = {}): ResultadoPromocion {
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
    const idsCategorias = new Set(getCategorias().map((c) => c.id));
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

    const resultadoCalidad = evaluarCriteriosDeCalidad(herramienta, datosAfiliados, borrador.metadatos);
    if (!resultadoCalidad.ok) {
      errores.push(...resultadoCalidad.errores.map((e) => `Criterio de calidad: ${e}`));
    } else {
      calidadSuperada = true;
      verificacionAfiliacionPendiente = resultadoCalidad.verificacionAfiliacionPendiente;
    }
  }

  const idsExistentes = new Set(catalogoExistente.map((h) => h.id));
  if (idsExistentes.has(id)) {
    errores.push(`"${id}" ya existe en el catálogo real: promoverlo lo sobrescribiría. Revísalo a mano si es intencionado.`);
  }

  if (!tieneProgramaDeAfiliadosFiable(datosAfiliados)) {
    errores.push(`"${id}" no cumple la regla obligatoria de afiliados (programa activo y fiable) en el borrador.`);
  }

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
        observaciones: [decision?.notas, anulacionDuplicadoAplicada, `Motivos del bloqueo: ${errores.join(" | ")}`]
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

  if (!getEstrategiaAfiliacion(id, { dirBase: opciones.dirBaseEstrategia })) {
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
    guardarEstrategiaAfiliacion(estrategiaInicial, { dirBase: opciones.dirBaseEstrategia });
  }

  registrarEnHistorial(
    {
      herramientaId: id,
      nombreHerramienta,
      resultado: "aceptada",
      puntuacionMolnip,
      estadoAfiliacion,
      observaciones: [decision?.notas, anulacionDuplicadoAplicada].filter(Boolean).join(" ") || "Sin observaciones.",
      aprobacionCeo,
    },
    { ruta: opciones.rutaHistorial }
  );

  return { ok: true, id, rutaHerramienta, rutaAfiliados };
}
