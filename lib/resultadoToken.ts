import { createHmac, timingSafeEqual } from "node:crypto";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import type { TipoOrigenDiagnostico } from "@/lib/origenDiagnostico";

/**
 * Persistencia de resultados sin base de datos: todo el estado necesario
 * para reconstruir "exactamente tu recomendación" viaja dentro de la propia
 * URL (`/resultado/[token]`), comprimido y firmado. Cero infraestructura
 * que mantener o escalar — coherente con cómo ya funciona el resto de
 * Atlas (sin cuentas, sin almacenamiento en servidor, ver `/privacidad`) —
 * y un enlace sigue siendo válido aunque cambie de dispositivo, de sesión
 * o pase un año.
 *
 * Deliberadamente NO incluye `detalles`/`razones` de `HerramientaEvaluada`
 * (el desglose interno de criterios): ninguna pantalla los muestra hoy
 * (ver `lib/vistaRecomendacion.ts`), y cada uno añade texto que solo
 * infla el token. Si algún día una pantalla nueva los necesita, es el
 * primer sitio a tocar.
 */

export type ItemTokenResultado = {
  /** Herramienta.id — la ficha completa se rehidrata siempre desde el repositorio en vez de viajar en el token, para que precio/estado reflejen el catálogo actual, no una foto congelada. */
  id: string;
  /** HerramientaEvaluada.puntuacionTotal, solo para poder recalcular "mejor encaje" en el comparador sin reordenar (el orden del array ya es el ranking). */
  puntuacion: number;
  explicacion: string;
  advertencia: boolean;
};

export type PayloadTokenResultado = {
  v: 1;
  origenTipo: TipoOrigenDiagnostico;
  origenId: string;
  items: ItemTokenResultado[];
  /** ISO 8601 — momento en que Atlas calculó esta recomendación, para mostrarlo al recuperar un enlace antiguo. */
  generadoEn: string;
};

// Sin `RESULTADO_TOKEN_SECRETO` en el entorno, cualquiera con el código
// fuente podría forjar un enlace que aparente ser una recomendación real
// de Molnip — dañino para la confianza que el resto del producto cuida
// tanto. El valor de repuesto solo existe para que `npm run dev`/tests
// funcionen sin configuración: se avisa igual que ya hace `URL_BASE` con
// `NEXT_PUBLIC_SITE_URL`.
const SECRETO = process.env.RESULTADO_TOKEN_SECRETO ?? "atlas-dev-secreto-no-usar-en-produccion";

function aBase64Url(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function desdeBase64Url(texto: string): Buffer {
  const normalizado = texto.replace(/-/g, "+").replace(/_/g, "/");
  const relleno = normalizado.length % 4 === 0 ? "" : "=".repeat(4 - (normalizado.length % 4));
  return Buffer.from(normalizado + relleno, "base64");
}

function firmar(datosComprimidos: Buffer): Buffer {
  // Truncada a 10 bytes: suficiente para que forjar una firma sea
  // inviable por fuerza bruta, sin alargar la URL más de lo necesario.
  return createHmac("sha256", SECRETO).update(datosComprimidos).digest().subarray(0, 10);
}

/** Serializa, comprime y firma un resultado. Nunca lanza: si algo falla en la compresión (no debería, con datos propios), el error sube tal cual porque indicaría un bug, no una entrada de usuario. */
export function generarTokenResultado(payload: Omit<PayloadTokenResultado, "v">): string {
  const completo: PayloadTokenResultado = { v: 1, ...payload };
  const comprimido = deflateRawSync(Buffer.from(JSON.stringify(completo), "utf8"));
  const firma = firmar(comprimido);
  return `${aBase64Url(comprimido)}.${aBase64Url(firma)}`;
}

/** Decodifica y verifica un token recibido de fuera (la URL). `null` ante cualquier token inválido, corrupto, falsificado o de una versión futura desconocida — nunca lanza, para que la ruta pueda mostrar un mensaje de enlace no válido en vez de un error 500. */
export function leerTokenResultado(token: string): PayloadTokenResultado | null {
  const partes = token.split(".");
  if (partes.length !== 2) return null;

  try {
    const comprimido = desdeBase64Url(partes[0]);
    const firmaRecibida = desdeBase64Url(partes[1]);
    const firmaEsperada = firmar(comprimido);
    if (firmaRecibida.length !== firmaEsperada.length || !timingSafeEqual(firmaRecibida, firmaEsperada)) {
      return null;
    }

    const payload = JSON.parse(inflateRawSync(comprimido).toString("utf8")) as PayloadTokenResultado;
    if (payload.v !== 1 || !Array.isArray(payload.items) || payload.items.length === 0) return null;
    return payload;
  } catch {
    return null;
  }
}
