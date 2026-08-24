import type { DatosSuscripcion, ProveedorEmail, ResultadoOperacionEmail } from "../proveedorEmail";

const NOMBRE = "simulado";

/**
 * Proveedor de respaldo: se usa automáticamente mientras no exista
 * `BREVO_API_KEY` en el entorno (ver `proveedorActivo.ts`). No llama a
 * ningún servicio externo — registra la operación en el log del servidor y
 * responde como si hubiera ido bien.
 *
 * Por qué "ok" y no un error: el objetivo es dejar toda la infraestructura
 * de captación (formularios, ruta, plantilla de bienvenida) lista y
 * probada desde ya, sin que el sitio muestre un error a los usuarios ni se
 * rompa el build solo porque la cuenta de Brevo todavía no existe — ver
 * ATLAS.md, sección "Sistema de captación de emails".
 */
export function crearProveedorSimulado(): ProveedorEmail {
  return {
    nombre: NOMBRE,
    async suscribir(datos: DatosSuscripcion): Promise<ResultadoOperacionEmail> {
      console.log(`[${NOMBRE}] Suscripción simulada:`, datos);
      return { ok: true };
    },
    async enviarBienvenida(email: string): Promise<ResultadoOperacionEmail> {
      console.log(`[${NOMBRE}] Email de bienvenida simulado para: ${email}`);
      return { ok: true };
    },
    async enviarTransaccional(email: string, asunto: string): Promise<ResultadoOperacionEmail> {
      console.log(`[${NOMBRE}] Email transaccional simulado para: ${email} — asunto: "${asunto}"`);
      return { ok: true };
    },
  };
}
