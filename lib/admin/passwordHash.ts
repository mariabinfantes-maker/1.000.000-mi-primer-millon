import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Hash de contraseña para el panel interno de Affiliate Manager —
 * `scrypt` nativo de `node:crypto` (sin dependencias nuevas, mismo
 * criterio que `lib/resultadoToken.ts` con `createHmac`). La contraseña en
 * texto plano nunca se guarda en ningún sitio: solo su hash, generado una
 * vez con `npm run generar-hash-admin` y pegado a mano en
 * `ADMIN_PANEL_PASSWORD_HASH` del entorno de despliegue.
 *
 * Formato de almacenamiento: "salHex:hashHex" — la sal viaja junto al
 * hash porque `scrypt` la necesita para volver a calcular el mismo hash
 * al verificar; no es secreta por sí sola.
 */

const LONGITUD_SAL = 16;
const LONGITUD_CLAVE = 64;

export function generarHashPassword(password: string): string {
  const sal = randomBytes(LONGITUD_SAL);
  const hash = scryptSync(password, sal, LONGITUD_CLAVE);
  return `${sal.toString("hex")}:${hash.toString("hex")}`;
}

/**
 * Compara en tiempo constante. Nunca lanza ante un `hashAlmacenado` con
 * formato inesperado (p. ej. la variable de entorno todavía no está
 * configurada) — simplemente no autentica, para que un fallo de
 * configuración se trate igual que una contraseña incorrecta, nunca como
 * un error 500 que podría filtrar información en el mensaje.
 */
export function verificarPassword(password: string, hashAlmacenado: string | undefined): boolean {
  if (!hashAlmacenado) return false;

  const partes = hashAlmacenado.split(":");
  if (partes.length !== 2) return false;

  try {
    const sal = Buffer.from(partes[0], "hex");
    const hashEsperado = Buffer.from(partes[1], "hex");
    // Un hex inválido no lanza en Node: se detiene y devuelve un buffer
    // truncado, hasta vacío — sin este mínimo, dos hashes malformados que
    // decodifican ambos a longitud 0 se compararían "iguales" por
    // trivialidad (timingSafeEqual de dos buffers vacíos es true),
    // autenticando cualquier contraseña contra un ADMIN_PANEL_PASSWORD_HASH
    // roto o vacío. LONGITUD_CLAVE es la longitud real que genera esta
    // misma función, así que un hash legítimo nunca cae por debajo.
    if (sal.length < LONGITUD_SAL || hashEsperado.length < LONGITUD_CLAVE) return false;

    const hashCalculado = scryptSync(password, sal, hashEsperado.length);
    if (hashCalculado.length !== hashEsperado.length) return false;
    return timingSafeEqual(hashCalculado, hashEsperado);
  } catch {
    return false;
  }
}
