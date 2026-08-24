import { ErrorProveedorEmail, type DatosSuscripcion, type ProveedorEmail, type ResultadoOperacionEmail } from "../proveedorEmail";
import { ASUNTO_BIENVENIDA, construirHtmlBienvenida } from "../plantillaBienvenida";

const NOMBRE = "brevo";
const URL_CONTACTOS = "https://api.brevo.com/v3/contacts";
const URL_TRANSACCIONAL = "https://api.brevo.com/v3/smtp/email";
const NOMBRE_REMITENTE_POR_DEFECTO = "Molnip";

/**
 * Adaptador de Brevo — proveedor de email marketing elegido para Molnip
 * (ver ATLAS.md, sección "Sistema de captación de emails"): plan gratuito
 * con automatizaciones de bienvenida y gestión de listas ya incluidas.
 *
 * Igual que `crearProveedorGemini`, la clave se lee de una variable de
 * entorno en tiempo de ejecución, nunca se escribe en el código. A
 * diferencia de Gemini, aquí SÍ hay un proveedor de respaldo
 * (`proveedores/simulado.ts`) para cuando la clave todavía no existe — ver
 * `proveedorActivo.ts` — porque la captación de emails no debe bloquear el
 * resto del producto mientras se configura la cuenta real.
 *
 * Dos llamadas independientes a la API de Brevo, reflejando las dos
 * responsabilidades de `ProveedorEmail`:
 *  - `suscribir` → Contacts API (`POST /v3/contacts`): da de alta al
 *    contacto en la lista de Molnip (`BREVO_LIST_ID`) con sus atributos
 *    (origen, categoría o problema) — la base para segmentar campañas
 *    futuras directamente desde el panel de Brevo. `updateEnabled: true`
 *    para que suscribirse dos veces actualice el contacto en vez de fallar
 *    por duplicado.
 *  - `enviarTransaccional` → Transactional Email API (`POST /v3/smtp/email`):
 *    envío genérico (asunto + HTML propios), base de `enviarBienvenida` y de
 *    cualquier automatización futura (formulario de contacto, lista de
 *    espera, registro, notificaciones) que necesite enviar un correo sin
 *    depender de una plantilla ya configurada a mano en el panel de Brevo.
 *  - `enviarBienvenida` es solo `enviarTransaccional` con el asunto y el
 *    HTML del lead magnet ya fijados (`plantillaBienvenida.ts`).
 */
export function crearProveedorBrevo(): ProveedorEmail {
  async function enviarTransaccional(email: string, asunto: string, html: string): Promise<ResultadoOperacionEmail> {
    try {
      const apiKey = requerirApiKey();
      const remitente = requerirRemitente();

      const respuesta = await fetch(URL_TRANSACCIONAL, {
        method: "POST",
        headers: cabeceras(apiKey),
        body: JSON.stringify({ sender: remitente, to: [{ email }], subject: asunto, htmlContent: html }),
      });

      if (!respuesta.ok) {
        const detalle = await textoDeError(respuesta);
        return { ok: false, error: `No se pudo enviar el email transaccional (${respuesta.status}): ${detalle}` };
      }

      return { ok: true };
    } catch (error) {
      return { ok: false, error: mensajeDeError(error) };
    }
  }

  return {
    nombre: NOMBRE,
    enviarTransaccional,

    async suscribir(datos: DatosSuscripcion): Promise<ResultadoOperacionEmail> {
      const atributos: Record<string, string> = { ORIGEN: datos.origen };
      if (datos.categoriaId) atributos.CATEGORIA_ID = datos.categoriaId;
      if (datos.problemaId) atributos.PROBLEMA_ID = datos.problemaId;

      try {
        const apiKey = requerirApiKey();
        const listId = requerirListId();

        const respuesta = await fetch(URL_CONTACTOS, {
          method: "POST",
          headers: cabeceras(apiKey),
          body: JSON.stringify({
            email: datos.email,
            attributes: atributos,
            listIds: [listId],
            updateEnabled: true,
          }),
        });

        if (!respuesta.ok) {
          const detalle = await textoDeError(respuesta);
          return { ok: false, error: `No se pudo dar de alta el contacto en Brevo (${respuesta.status}): ${detalle}` };
        }

        return { ok: true };
      } catch (error) {
        return { ok: false, error: mensajeDeError(error) };
      }
    },

    enviarBienvenida(email: string): Promise<ResultadoOperacionEmail> {
      return enviarTransaccional(email, ASUNTO_BIENVENIDA, construirHtmlBienvenida());
    },
  };
}

function cabeceras(apiKey: string): Record<string, string> {
  return { "Content-Type": "application/json", Accept: "application/json", "api-key": apiKey };
}

function requerirApiKey(): string {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new ErrorProveedorEmail(NOMBRE, "BREVO_API_KEY no está configurada en el entorno del servidor.");
  return apiKey;
}

function requerirListId(): number {
  const listId = process.env.BREVO_LIST_ID;
  const numero = Number(listId);
  if (!listId || !Number.isInteger(numero)) {
    throw new ErrorProveedorEmail(NOMBRE, "BREVO_LIST_ID no está configurada (debe ser el id numérico de la lista en Brevo).");
  }
  return numero;
}

function requerirRemitente(): { name: string; email: string } {
  const email = process.env.BREVO_SENDER_EMAIL;
  if (!email) {
    throw new ErrorProveedorEmail(
      NOMBRE,
      "BREVO_SENDER_EMAIL no está configurada (debe ser un remitente verificado en Brevo, ej. hola@molnip.com)."
    );
  }
  return { name: process.env.BREVO_SENDER_NOMBRE?.trim() || NOMBRE_REMITENTE_POR_DEFECTO, email };
}

async function textoDeError(respuesta: Response): Promise<string> {
  try {
    const cuerpo = (await respuesta.json()) as { message?: string };
    return cuerpo.message ?? respuesta.statusText;
  } catch {
    return respuesta.statusText;
  }
}

function mensajeDeError(error: unknown): string {
  return error instanceof Error ? error.message : `Error desconocido del proveedor "${NOMBRE}".`;
}
