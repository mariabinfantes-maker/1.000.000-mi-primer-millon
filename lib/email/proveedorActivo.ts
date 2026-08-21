import { crearProveedorBrevo } from "./proveedores/brevo";
import { crearProveedorSimulado } from "./proveedores/simulado";
import type { ProveedorEmail } from "./proveedorEmail";

/**
 * Único punto de decisión de qué `ProveedorEmail` usa la app: Brevo si
 * `BREVO_API_KEY` ya está configurada, el simulado en caso contrario.
 *
 * A propósito NO se llama igual que `crearProveedorGemini` (que exige la
 * clave y lanza si falta): la captación de emails es una capa de
 * crecimiento, no el producto en sí — mientras no exista cuenta de Brevo,
 * el sitio debe seguir funcionando exactamente igual, solo que las
 * suscripciones quedan registradas en el log del servidor en vez de
 * llegar de verdad. Ver ATLAS.md, sección "Sistema de captación de
 * emails".
 */
export function obtenerProveedorEmail(): ProveedorEmail {
  return process.env.BREVO_API_KEY ? crearProveedorBrevo() : crearProveedorSimulado();
}
