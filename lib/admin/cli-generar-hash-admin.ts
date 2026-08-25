import { generarHashPassword } from "./passwordHash";

/**
 * `npm run generar-hash-admin -- "tu-contraseña"`
 *
 * Genera el hash que se pega en `ADMIN_PANEL_PASSWORD_HASH` (Vercel u otro
 * entorno de despliegue) — se ejecuta en tu máquina, nunca envía la
 * contraseña a ningún sitio. El texto plano no se guarda en ningún
 * archivo ni se registra en ningún log.
 */

function main() {
  const password = process.argv[2];
  if (!password) {
    console.error('Uso: npm run generar-hash-admin -- "tu-contraseña"');
    process.exitCode = 1;
    return;
  }

  const hash = generarHashPassword(password);
  console.log("\nCopia este valor completo en ADMIN_PANEL_PASSWORD_HASH:\n");
  console.log(hash);
  console.log("\nNo compartas ni pegues aquí la contraseña en texto plano en ningún otro sitio.\n");
}

main();
