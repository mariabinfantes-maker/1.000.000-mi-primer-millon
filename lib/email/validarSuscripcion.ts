import type { OrigenSuscripcion } from "./proveedorEmail";

/**
 * Validación pura del cuerpo de `POST /api/suscribir`, separada de la ruta
 * en sí (igual que `validarPropuesta` en Atlas Researcher) para poder
 * probarla sin depender de Next.js ni de ningún servidor real.
 *
 * Regex de email deliberadamente simple: no intenta cubrir el 100% de la
 * RFC 5322 (nadie lo hace de forma fiable), solo descartar valores
 * obviamente inválidos antes de gastar una llamada al proveedor de email.
 */
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ORIGENES_VALIDOS: OrigenSuscripcion[] = ["pie-de-pagina", "resultados"];

export type CuerpoSuscripcion = {
  email?: unknown;
  origen?: unknown;
  categoriaId?: unknown;
  problemaId?: unknown;
  /**
   * Campo "trampa para bots" (honeypot): invisible para una persona real
   * (oculto por CSS en el formulario), pero un bot que rellena todos los
   * campos de un formulario a ciegas sí lo completa. Si llega con
   * contenido, se descarta la petición sin más — sin necesidad de un
   * captcha ni de ningún servicio externo.
   */
  webComoTeLlamas?: unknown;
};

export type ResultadoValidacionSuscripcion =
  | {
      ok: true;
      email: string;
      origen: OrigenSuscripcion;
      categoriaId?: string;
      problemaId?: string;
    }
  | { ok: false; error: string };

export function validarSuscripcion(cuerpo: CuerpoSuscripcion): ResultadoValidacionSuscripcion {
  if (typeof cuerpo.webComoTeLlamas === "string" && cuerpo.webComoTeLlamas.trim() !== "") {
    return { ok: false, error: "Petición descartada." };
  }

  if (typeof cuerpo.email !== "string" || !REGEX_EMAIL.test(cuerpo.email.trim())) {
    return { ok: false, error: "Introduce un email válido." };
  }

  if (typeof cuerpo.origen !== "string" || !ORIGENES_VALIDOS.includes(cuerpo.origen as OrigenSuscripcion)) {
    return { ok: false, error: "Falta el origen de la suscripción." };
  }

  return {
    ok: true,
    email: cuerpo.email.trim().toLowerCase(),
    origen: cuerpo.origen as OrigenSuscripcion,
    categoriaId: typeof cuerpo.categoriaId === "string" && cuerpo.categoriaId.trim() ? cuerpo.categoriaId : undefined,
    problemaId: typeof cuerpo.problemaId === "string" && cuerpo.problemaId.trim() ? cuerpo.problemaId : undefined,
  };
}
