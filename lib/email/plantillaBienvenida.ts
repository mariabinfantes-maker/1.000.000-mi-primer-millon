import { LEAD_MAGNET, urlLeadMagnet } from "./leadMagnet";

/**
 * Contenido del email de bienvenida (la "automatización de bienvenida").
 * Vive en código (no en una plantilla del panel de Brevo) a propósito: así
 * queda listo y probado desde el primer commit, sin depender de que exista
 * ya una cuenta de Brevo configurada a mano — ver el comentario de
 * `proveedores/brevo.ts`.
 *
 * HTML de tabla, con estilos inline: es la única forma fiable de que un
 * email se vea igual en Gmail, Outlook y el resto de clientes — el CSS
 * moderno (flexbox, grid, clases) se pierde o se rompe en muchos de ellos.
 */

export const ASUNTO_BIENVENIDA = "Tu guía está lista: 7 preguntas antes de elegir cualquier software";

const COLOR_MARCA = "#6e5fe4";
const COLOR_TEXTO = "#1e293b";
const COLOR_TEXTO_SUAVE = "#64748b";
const COLOR_FONDO = "#f8fafc";

export function construirHtmlBienvenida(): string {
  const enlacePdf = urlLeadMagnet();

  return `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:${COLOR_FONDO};font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOR_FONDO};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background-color:${COLOR_MARCA};padding:28px 32px;">
                <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.01em;">Molnip</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${COLOR_TEXTO};">Gracias por suscribirte</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${COLOR_TEXTO};">
                  Aquí tienes tu guía, tal y como prometimos:
                </p>
                <p style="margin:0 0 24px;">
                  <a href="${enlacePdf}" style="display:inline-block;background-color:${COLOR_MARCA};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:10px;">
                    Descargar «${LEAD_MAGNET.titulo}»
                  </a>
                </p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${COLOR_TEXTO};">
                  A partir de ahora te avisaremos cuando encontremos herramientas nuevas que encajen con lo que buscas, y de vez en cuando compartiremos algo útil sobre cómo elegir mejor la tecnología de tu empresa. Nada de spam: solo lo que de verdad ayuda a decidir.
                </p>
                <p style="margin:0;font-size:15px;line-height:1.6;color:${COLOR_TEXTO};">
                  Un saludo,<br />El equipo de Molnip
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:${COLOR_TEXTO_SUAVE};">
                  Recibes este email porque te suscribiste en molnip.com. Puedes darte de baja cuando quieras desde el enlace que incluyen todos nuestros próximos envíos.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
