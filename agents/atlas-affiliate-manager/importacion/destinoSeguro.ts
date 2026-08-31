import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

/**
 * Adónde se le permite al servidor hacer una petición al comprobar un enlace.
 *
 * Comprobar enlaces significa que el servidor va a pedir una dirección que
 * alguien ha escrito en un archivo. Sin restricciones, eso es una puerta para
 * pedirle al servidor que hable con cosas que no están en internet: la propia
 * máquina, la red interna del proveedor de alojamiento, o el servicio de
 * metadatos que en las nubes públicas responde en 169.254.169.254 y entrega
 * credenciales. Es la familia de fallos que se conoce como SSRF, y el
 * atacante ni siquiera necesita ser un extraño: basta un archivo mal
 * intencionado o copiado de cualquier sitio.
 *
 * Se comprueba el destino ANTES de cada petición y también en CADA
 * redirección, porque un servidor legítimo puede redirigir a una dirección
 * interna y esa segunda petición la haría el servidor igualmente.
 *
 * LÍMITE CONOCIDO: entre que se resuelve el nombre y que se conecta, el DNS
 * podría devolver otra dirección (lo que se llama "DNS rebinding"). Cerrarlo
 * del todo exige conectar a la IP ya validada con la cabecera Host puesta a
 * mano, algo que `fetch` no permite. Aquí no se cierra, y se deja escrito en
 * vez de fingir que sí: esta función la usa solo el panel de administración,
 * detrás de sesión, y quien la alcanza ya está autenticado.
 */

export type Veredicto = { permitido: true } | { permitido: false; motivo: string };

const PROTOCOLOS = new Set(["http:", "https:"]);

/** Nombres que nunca salen a internet, se resuelvan como se resuelvan. */
const NOMBRES_PROHIBIDOS = [
  "localhost",
  "metadata.google.internal",
  "metadata",
  "instance-data",
];
const SUFIJOS_PROHIBIDOS = [".localhost", ".local", ".internal", ".home.arpa"];

function troceaIpv4(ip: string): number[] | undefined {
  const partes = ip.split(".");
  if (partes.length !== 4) return undefined;
  const numeros = partes.map((p) => Number(p));
  if (numeros.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return undefined;
  return numeros;
}

/** Rangos IPv4 que no son internet público. */
function ipv4EsPublica(ip: string): boolean {
  const o = troceaIpv4(ip);
  if (!o) return false;
  const [a, b] = o;

  if (a === 0) return false; // "esta red"
  if (a === 10) return false; // privada
  if (a === 127) return false; // bucle local
  if (a === 169 && b === 254) return false; // enlace local — incluye 169.254.169.254 (metadatos)
  if (a === 172 && b >= 16 && b <= 31) return false; // privada
  if (a === 192 && b === 168) return false; // privada
  if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT
  if (a === 198 && (b === 18 || b === 19)) return false; // pruebas de rendimiento
  if (a === 192 && o[1] === 0 && o[2] === 0) return false; // IETF
  if (a === 192 && o[1] === 0 && o[2] === 2) return false; // documentación
  if (a === 198 && o[1] === 51 && o[2] === 100) return false; // documentación
  if (a === 203 && o[1] === 0 && o[2] === 113) return false; // documentación
  if (a === 192 && o[1] === 88 && o[2] === 99) return false; // 6to4 retirado
  if (a >= 224) return false; // multidifusión, reservado y difusión
  return true;
}

function ipv6EsPublica(ip: string): boolean {
  const bajo = ip.toLowerCase().split("%")[0]; // se descarta la zona (fe80::1%eth0)

  if (bajo === "::" || bajo === "::1") return false;

  // IPv4 embebida: ::ffff:1.2.3.4 y ::ffff:0102:0304
  const mapeada = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(bajo);
  if (mapeada) return ipv4EsPublica(mapeada[1]);
  if (bajo.startsWith("::ffff:")) return false; // forma hexadecimal: no se intenta adivinar

  if (/^f[cd]/.test(bajo)) return false; // fc00::/7 — direcciones locales únicas
  if (/^fe[89ab]/.test(bajo)) return false; // fe80::/10 — enlace local
  if (bajo.startsWith("ff")) return false; // multidifusión
  if (bajo.startsWith("2001:db8")) return false; // documentación
  if (bajo.startsWith("64:ff9b")) return false; // NAT64
  return true;
}

export function ipEsPublica(ip: string): boolean {
  const familia = isIP(ip);
  if (familia === 4) return ipv4EsPublica(ip);
  if (familia === 6) return ipv6EsPublica(ip);
  return false;
}

/**
 * En pruebas hace falta poder apuntar a un servidor local. Se permite solo
 * fuera de producción Y con la variable puesta a propósito: dos condiciones,
 * para que activarla por descuido en producción no sirva de nada.
 */
export function seAdmiteRedLocal(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.MOLNIP_PERMITIR_RED_LOCAL === "true";
}

/** Comprueba una dirección: protocolo, nombre y todas las IP a las que resuelve. */
export async function destinoEsSeguro(
  url: string,
  resolver: (nombre: string) => Promise<string[]> = resolverPorDefecto
): Promise<Veredicto> {
  let analizada: URL;
  try {
    analizada = new URL(url);
  } catch {
    return { permitido: false, motivo: "No es una dirección válida." };
  }

  if (!PROTOCOLOS.has(analizada.protocol)) {
    return { permitido: false, motivo: `Solo se admiten http y https (esta usa "${analizada.protocol}").` };
  }

  if (analizada.username || analizada.password) {
    // usuario:clave@destino es una forma clásica de disimular a dónde apunta.
    return { permitido: false, motivo: "La dirección no debe llevar usuario ni contraseña." };
  }

  const nombre = analizada.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (seAdmiteRedLocal()) return { permitido: true };

  if (NOMBRES_PROHIBIDOS.includes(nombre) || SUFIJOS_PROHIBIDOS.some((s) => nombre.endsWith(s))) {
    return { permitido: false, motivo: `"${nombre}" no es una dirección de internet.` };
  }

  // Si el nombre YA es una IP, se comprueba directamente.
  if (isIP(nombre)) {
    return ipEsPublica(nombre)
      ? { permitido: true }
      : { permitido: false, motivo: `${nombre} pertenece a una red interna o reservada.` };
  }

  if (!nombre.includes(".")) {
    return { permitido: false, motivo: `"${nombre}" no parece un dominio de internet.` };
  }

  let direcciones: string[];
  try {
    direcciones = await resolver(nombre);
  } catch {
    return { permitido: false, motivo: `No se ha podido resolver "${nombre}".` };
  }

  if (direcciones.length === 0) {
    return { permitido: false, motivo: `"${nombre}" no resuelve a ninguna dirección.` };
  }

  // TODAS tienen que ser públicas: basta una interna para que el destino
  // sirva para alcanzar la red de dentro.
  const interna = direcciones.find((d) => !ipEsPublica(d));
  if (interna) {
    return { permitido: false, motivo: `"${nombre}" resuelve a ${interna}, que es una red interna o reservada.` };
  }

  return { permitido: true };
}

async function resolverPorDefecto(nombre: string): Promise<string[]> {
  const encontradas = await lookup(nombre, { all: true });
  return encontradas.map((e) => e.address);
}
