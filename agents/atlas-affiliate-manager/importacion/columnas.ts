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

/**
 * Identificador real usado en la fila de ejemplo de la plantilla.
 *
 * Tiene que existir en el catálogo: con uno inventado, previsualizar la
 * plantilla recién descargada salía en rojo, y estrenar la función con un
 * error enseña a desconfiar de una pantalla que precisamente tiene que dar
 * confianza. Hay una prueba que falla si este id desaparece del catálogo.
 */
export const ID_EJEMPLO_PLANTILLA = "asana";

/**
 * La plantilla que se descarga.
 *
 * La fila de ejemplo lleva un id real y TODO LO DEMÁS VACÍO, a propósito. Una
 * casilla vacía no cambia nada, así que la vista previa dice «Sin cambios» y
 * no hay nada que aplicar: se puede previsualizar cien veces sin tocar un
 * dato.
 *
 * La alternativa —id real con valores de ejemplo rellenos— habría sido peor
 * que el error que venía a corregir: la plantilla propondría escribir
 * «Programa de ejemplo» y una dirección inventada sobre una herramienta de
 * verdad, y bastaría un clic de más. Los valores de ejemplo se enseñan en la
 * pantalla, donde no pueden aplicarse.
 */
export const PLANTILLA_CSV = [
  "id,cuenta,estado,plataforma,nombrePrograma,comision,cookie,enlace,segmento,notas",
  `${ID_EJEMPLO_PLANTILLA},,,,,,,,,`,
].join("\n");

/** Qué se espera en cada columna. Se enseña en pantalla, no en el archivo. */
export const EJEMPLOS_COLUMNA: { campo: string; ejemplo: string; nota?: string }[] = [
  { campo: "id", ejemplo: "asana", nota: "Obligatorio. El identificador de Molnip, el de la dirección de la ficha." },
  { campo: "cuenta", ejemplo: "principal", nota: "Solo si la herramienta tiene varias cuentas." },
  { campo: "estado", ejemplo: "aprobado", nota: "no_solicitado, pendiente, aprobado, rechazado o activo." },
  { campo: "plataforma", ejemplo: "PartnerStack" },
  { campo: "nombrePrograma", ejemplo: "Asana Affiliate Program" },
  { campo: "comision", ejemplo: "30 % recurrente durante 12 meses" },
  { campo: "cookie", ejemplo: "90 días", nota: "O «Permanente — sin caducidad» si no caduca." },
  { campo: "enlace", ejemplo: "https://proveedor.com/?ref=molnip", nota: "Entero, empezando por https://" },
  { campo: "segmento", ejemplo: "global" },
  { campo: "notas", ejemplo: "Lo que quieras recordar" },
];
