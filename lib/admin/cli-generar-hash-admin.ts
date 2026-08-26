import { generarHashPassword } from "./passwordHash";

/**
 * `npm run generar-hash-admin -- "tu-contraseña"`
 *
 * Genera el valor de `ADMIN_PANEL_PASSWORD_HASH` a partir de la contraseña
 * con la que se entrará al panel. Se ejecuta en tu máquina; la contraseña
 * no se envía a ningún sitio ni se guarda en ningún archivo.
 *
 * El aviso de abajo sobre recordar la contraseña no es decorativo: el hash
 * es una huella de un solo sentido, así que de él NO se puede recuperar la
 * contraseña. Perderla obliga a elegir otra y reemplazar el valor en el
 * entorno de despliegue.
 *
 * Para `ADMIN_PANEL_SECRETO` hay un comando distinto
 * (`npm run generar-secreto-admin`): son dos valores diferentes y no deben
 * confundirse.
 */

function main() {
  const password = process.argv[2];
  if (!password) {
    console.error('Uso: npm run generar-hash-admin -- "tu-contraseña"');
    console.error("");
    console.error("El texto que escribas entre comillas SERÁ tu contraseña del panel:");
    console.error("la que tendrás que teclear para entrar. Apúntala antes de continuar.");
    console.error("");
    console.error("Si lo que buscas es ADMIN_PANEL_SECRETO, usa:  npm run generar-secreto-admin");
    process.exitCode = 1;
    return;
  }

  const hash = generarHashPassword(password);

  console.log("");
  console.log("Copia este valor completo en la variable  ADMIN_PANEL_PASSWORD_HASH");
  console.log("");
  console.log(hash);
  console.log("");
  console.log("IMPORTANTE: tu contraseña es el texto que has escrito entre comillas,");
  console.log("no esta cadena. Apúntala en un sitio seguro: de esta cadena NO se puede");
  console.log("recuperar, y sin ella no podrás entrar al panel.");
  console.log("");
  console.log("Para ADMIN_PANEL_SECRETO usa otro comando:  npm run generar-secreto-admin");
  console.log("");
}

main();
