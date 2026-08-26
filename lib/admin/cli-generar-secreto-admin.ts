import { randomBytes } from "node:crypto";

/**
 * `npm run generar-secreto-admin`
 *
 * Genera el valor de `ADMIN_PANEL_SECRETO`: la llave con la que se firman
 * las sesiones del panel. Es aleatorio, no lo elige nadie y no hay que
 * recordarlo — a diferencia de la contraseña.
 *
 * Existe como comando separado de `generar-hash-admin` a propósito. Cuando
 * los dos valores salían del mismo comando, era fácil confundirlos: el
 * mensaje decía siempre "pega esto en ADMIN_PANEL_PASSWORD_HASH", incluso
 * cuando lo que se estaba generando era el secreto de sesión (ocurrió de
 * verdad al configurarlo por primera vez, el 2026-08-26). Ahora cada
 * comando dice exactamente en qué variable va su resultado.
 *
 * Se ejecuta en tu máquina; el valor no se envía a ningún sitio.
 */

function main() {
  const secreto = randomBytes(48).toString("base64url");

  console.log("");
  console.log("Copia este valor completo en la variable  ADMIN_PANEL_SECRETO");
  console.log("(NO en ADMIN_PANEL_PASSWORD_HASH — esa es otra cosa distinta)");
  console.log("");
  console.log(secreto);
  console.log("");
  console.log("No hace falta que lo apuntes ni que lo recuerdes: nunca se escribe a mano.");
  console.log("Si algún día lo cambias, se cerrarán todas las sesiones abiertas del panel.");
  console.log("");
}

main();
