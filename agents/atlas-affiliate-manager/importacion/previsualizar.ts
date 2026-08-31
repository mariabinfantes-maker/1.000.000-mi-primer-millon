import type { EstrategiaAfiliacion, CuentaAfiliado } from "@/data/esquemaInterno";
import { esEstadoAfiliacionValido } from "../estrategiaAfiliacion";
import { resolverCuentaId } from "./resolverCuenta";
import { enlaceEsUsable } from "../reglasEnlace";
import { comprobarProteccion } from "./protegidas";
import type { EntradaLoteEstrategia } from "../lote";

/**
 * Qué pasaría si se aplicara el archivo, sin aplicar nada.
 *
 * Es la pieza que hace que esta importación se pueda usar sin miedo. Toca
 * los enlaces de los que depende cobrar, en muchas herramientas a la vez, y
 * la tabla de estrategias no lleva papelera: lo único que evita un desastre
 * es poder mirar antes.
 *
 * Las filas que ACTIVAN van aparte. Activar cambia lo que hace la web
 * pública —a partir de ese momento los botones «Ir al proveedor» llevan ese
 * enlace— así que no debe colarse dentro de un "aplicar 40 cambios" que
 * nadie lee entero.
 */

export type Veredicto = "creara" | "cambiara" | "sin_cambios" | "error";

export type CambioCampo = { campo: string; antes: string | undefined; despues: string };

export type FilaPrevisualizada = {
  fila: number;
  id: string;
  cuentaId: string;
  nombre?: string;
  veredicto: Veredicto;
  errores: string[];
  cambios: CambioCampo[];
  /** La fila deja la cuenta en "activo" y antes no lo estaba. */
  activa: boolean;
};

export type ResumenPrevisualizacion = {
  filas: FilaPrevisualizada[];
  total: number;
  creara: number;
  cambiara: number;
  sinCambios: number;
  conError: number;
  /** Filas válidas que NO activan: son las que aplica el botón principal. */
  aplicables: number;
  /** Filas válidas que activan: necesitan su propia confirmación. */
  activaciones: number;
  /** Motivo por el que no se debe aplicar nada de nada. */
  bloqueo?: string;
};

/** Por encima de esta proporción de filas con error, casi siempre son las columnas mal emparejadas. */
export const UMBRAL_ABORTAR = 0.5;

const CAMPOS_COMPARABLES: { campo: keyof EntradaLoteEstrategia; en: keyof CuentaAfiliado; etiqueta: string }[] = [
  { campo: "estado", en: "estado", etiqueta: "Estado" },
  { campo: "plataforma", en: "plataforma", etiqueta: "Plataforma" },
  { campo: "nombrePrograma", en: "nombrePrograma", etiqueta: "Programa" },
  { campo: "comision", en: "comision", etiqueta: "Comisión" },
  { campo: "cookie", en: "duracionCookie", etiqueta: "Duración de la cookie o atribución" },
  { campo: "urlSolicitud", en: "urlSolicitud", etiqueta: "URL de solicitud" },
  { campo: "usuarioRegistro", en: "usuarioRegistro", etiqueta: "Usuario de registro" },
  { campo: "metodoPago", en: "metodoPago", etiqueta: "Método de pago" },
  { campo: "frecuenciaPago", en: "frecuenciaPago", etiqueta: "Frecuencia de pago" },
  { campo: "notas", en: "observaciones", etiqueta: "Notas" },
  { campo: "requisitos", en: "requisitosPrograma", etiqueta: "Requisitos" },
  { campo: "borrador", en: "borradorSolicitud", etiqueta: "Borrador" },
];

export type ContextoPrevisualizacion = {
  /** Ids que existen de verdad en el catálogo. */
  idsValidos: ReadonlySet<string>;
  /** Nombre legible por id, solo para enseñarlo. */
  nombres: Readonly<Record<string, string>>;
  /** Lo que hay guardado hoy, por herramienta. */
  existentes: ReadonlyMap<string, EstrategiaAfiliacion>;
  /** Si es false, se saltan las protecciones (solo para pruebas). Por defecto, activas. */
  aplicarProtecciones?: boolean;
};

function cuentaDe(estrategia: EstrategiaAfiliacion | undefined, cuentaId: string): CuentaAfiliado | undefined {
  return estrategia?.cuentas.find((c) => c.id === cuentaId);
}

function enlaceGlobalDe(cuenta: CuentaAfiliado | undefined, segmento: string): string | undefined {
  return cuenta?.enlaces.find((e) => e.segmento === segmento)?.url;
}

export function previsualizarLote(
  entradas: EntradaLoteEstrategia[],
  contexto: ContextoPrevisualizacion
): ResumenPrevisualizacion {
  const filas: FilaPrevisualizada[] = [];
  const vistas = new Set<string>();

  for (const [indice, entrada] of entradas.entries()) {
    const numero = indice + 1;
    const id = (entrada.id ?? "").trim();
    const errores: string[] = [];
    const cambios: CambioCampo[] = [];

    // La misma resolución que usa el paso de aplicar: si difirieran, la
    // vista previa describiría algo distinto de lo que va a ocurrir.
    const cuentaId = resolverCuentaId(entrada, contexto.existentes.get(id));
    const segmento = entrada.segmento?.trim() || "global";

    if (!id) {
      filas.push({ fila: numero, id: "", cuentaId, veredicto: "error", errores: ["Falta la columna «id»."], cambios: [], activa: false });
      continue;
    }

    if (!contexto.idsValidos.has(id)) {
      errores.push(`«${id}» no existe en el catálogo.`);
    }

    const clave = `${id}::${cuentaId}`;
    if (vistas.has(clave)) {
      // Sin esto, la segunda fila pisaría a la primera sin que nadie lo viera.
      errores.push(`Repetida: ya hay otra fila para «${id}» y la cuenta «${cuentaId}».`);
    }
    vistas.add(clave);

    if (entrada.estado !== undefined && !esEstadoAfiliacionValido(entrada.estado)) {
      errores.push(`Estado no válido: «${entrada.estado}». Debe ser no_solicitado, pendiente, aprobado, rechazado o activo.`);
    }

    if (entrada.enlace !== undefined && !enlaceEsUsable(entrada.enlace)) {
      errores.push("El enlace no es una dirección completa; tiene que empezar por https://");
    }

    const existente = contexto.existentes.get(id);
    const cuenta = cuentaDe(existente, cuentaId);

    if (contexto.aplicarProtecciones !== false) {
      const proteccion = comprobarProteccion(id, cuenta, { enlace: entrada.enlace, estado: entrada.estado });
      if (proteccion) errores.push(proteccion.motivo);
    }
    const enlaceActual = enlaceGlobalDe(cuenta, segmento);
    const enlaceFinal = entrada.enlace ?? enlaceActual;
    const estadoFinal = entrada.estado ?? cuenta?.estado ?? "no_solicitado";

    // La misma regla que el panel: activa sin enlace no puede cobrar.
    if (estadoFinal === "activo" && !enlaceFinal) {
      errores.push("No se puede dejar en «activo» sin enlace: una cuenta activa sin enlace no genera comisión.");
    }

    for (const { campo, en, etiqueta } of CAMPOS_COMPARABLES) {
      const nuevo = entrada[campo];
      if (nuevo === undefined) continue;
      const antes = cuenta?.[en] as string | undefined;
      if (antes !== nuevo) cambios.push({ campo: etiqueta, antes, despues: nuevo });
    }

    if (entrada.enlace !== undefined && entrada.enlace !== enlaceActual) {
      cambios.push({ campo: `Enlace (${segmento})`, antes: enlaceActual, despues: entrada.enlace });
    }

    const activa = estadoFinal === "activo" && cuenta?.estado !== "activo";

    let veredicto: Veredicto;
    if (errores.length > 0) veredicto = "error";
    else if (!cuenta) veredicto = "creara";
    else if (cambios.length > 0) veredicto = "cambiara";
    else veredicto = "sin_cambios";

    filas.push({
      fila: numero,
      id,
      cuentaId,
      nombre: contexto.nombres[id],
      veredicto,
      errores,
      cambios,
      activa: veredicto === "error" ? false : activa,
    });
  }

  const conError = filas.filter((f) => f.veredicto === "error").length;
  const validas = filas.filter((f) => f.veredicto !== "error" && f.veredicto !== "sin_cambios");
  const activaciones = validas.filter((f) => f.activa).length;

  const resumen: ResumenPrevisualizacion = {
    filas,
    total: filas.length,
    creara: filas.filter((f) => f.veredicto === "creara").length,
    cambiara: filas.filter((f) => f.veredicto === "cambiara").length,
    sinCambios: filas.filter((f) => f.veredicto === "sin_cambios").length,
    conError,
    aplicables: validas.length - activaciones,
    activaciones,
  };

  if (filas.length > 0 && conError / filas.length > UMBRAL_ABORTAR) {
    resumen.bloqueo = `Fallan ${conError} de ${filas.length} filas. Casi siempre significa que las columnas no están bien emparejadas; revisa el paso anterior antes de aplicar nada.`;
  }

  return resumen;
}

/** Las filas que aplicaría el botón principal (todo menos activaciones y errores). */
export function filasAAplicar(resumen: ResumenPrevisualizacion, incluirActivaciones: boolean): number[] {
  if (resumen.bloqueo) return [];
  return resumen.filas
    .filter((f) => f.veredicto !== "error" && f.veredicto !== "sin_cambios")
    .filter((f) => (f.activa ? incluirActivaciones : true))
    .map((f) => f.fila);
}
