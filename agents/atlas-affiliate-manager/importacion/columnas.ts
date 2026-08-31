import { normalizarEncabezado } from "./leerCsv";
import type { EntradaLoteEstrategia } from "../lote";

/**
 * Qué columna del archivo corresponde a qué campo.
 *
 * El vocabulario de destino es el que ya usa `lote.ts` —y por tanto el CLI—
 * para que una hoja de cálculo y una orden de terminal produzcan exactamente
 * el mismo efecto. Aquí solo se añaden los sinónimos que de verdad escribe
 * una persona o exporta un panel de afiliación.
 */

export type CampoLote = keyof EntradaLoteEstrategia;

/** Sinónimos aceptados por campo, ya normalizados (sin tildes, sin espacios, en minúscula). */
export const SINONIMOS: Record<CampoLote, string[]> = {
  id: ["id", "herramienta", "herramientaid", "idherramienta", "tool", "slug"],
  cuenta: ["cuenta", "cuentaid", "idcuenta", "account"],
  estado: ["estado", "status"],
  plataforma: ["plataforma", "red", "network", "platform"],
  nombrePrograma: ["nombreprograma", "programa", "program", "nombredelprograma"],
  urlSolicitud: ["urlsolicitud", "urldelprograma", "urlprograma", "paginadelprograma"],
  usuarioRegistro: ["usuarioregistro", "usuario", "cuentadeacceso"],
  fechaSolicitud: ["fechasolicitud", "fechadesolicitud"],
  fechaAprobacion: ["fechaaprobacion", "fechadeaprobacion"],
  comision: ["comision", "commission", "comisión"].map(normalizarEncabezado),
  cookie: [
    "cookie",
    "duracioncookie",
    "duraciondelacookie",
    "atribucion",
    "duraciondelacookieoatribucion",
    "cookieduration",
  ],
  metodoPago: ["metodopago", "metododepago", "cobro"],
  frecuenciaPago: ["frecuenciapago", "frecuenciadepago"],
  enlace: ["enlace", "enlaceafiliado", "enlacedeafiliada", "url", "link", "affiliatelink"],
  segmento: ["segmento", "segment"],
  notas: ["notas", "nota", "observaciones", "comentarios"],
  requisitos: ["requisitos", "requisitosprograma", "requisitosdelprograma"],
  borrador: ["borrador", "borradorsolicitud", "borradordesolicitud"],
};

export type Emparejamiento = Partial<Record<CampoLote, string>>;

/**
 * Propone el emparejamiento a partir de los encabezados. Deliberadamente no
 * adivina por posición ni por parecido aproximado: si una columna no se
 * reconoce, se deja sin emparejar y la persona la asigna. Adivinar de más en
 * un archivo que toca enlaces de dinero sale muy caro.
 */
export function proponerEmparejamiento(encabezados: string[]): {
  emparejamiento: Emparejamiento;
  sinReconocer: string[];
} {
  const emparejamiento: Emparejamiento = {};
  const sinReconocer: string[] = [];

  for (const encabezado of encabezados) {
    const clave = normalizarEncabezado(encabezado);
    if (!clave) continue;
    const campo = (Object.keys(SINONIMOS) as CampoLote[]).find(
      (c) => SINONIMOS[c].includes(clave) && emparejamiento[c] === undefined
    );
    if (campo) emparejamiento[campo] = clave;
    else sinReconocer.push(encabezado);
  }

  return { emparejamiento, sinReconocer };
}

/** Convierte una fila leída del archivo en una entrada del lote, según el emparejamiento. */
export function aEntradaLote(
  fila: Record<string, string>,
  emparejamiento: Emparejamiento
): EntradaLoteEstrategia {
  const entrada = {} as Record<string, string>;
  for (const [campo, columna] of Object.entries(emparejamiento)) {
    if (!columna) continue;
    const valor = fila[columna];
    // Una celda vacía NO borra lo que ya hay: se omite el campo, y
    // `fusionarEstrategiaAfiliacion` conserva el valor anterior. Es la
    // diferencia entre "no lo he rellenado" y "quiero dejarlo en blanco".
    if (valor !== undefined && valor.trim() !== "") entrada[campo] = valor.trim();
  }
  return entrada as EntradaLoteEstrategia;
}

/** Encabezados de la plantilla que se ofrece para descargar. */
export const PLANTILLA_CSV = [
  "id,cuenta,estado,plataforma,nombrePrograma,comision,cookie,enlace,segmento,notas",
  "ejemplo-herramienta,principal,aprobado,Programa propio,Programa de ejemplo,30 % recurrente,90 días,https://ejemplo.test/?ref=molnip,global,",
].join("\n");
