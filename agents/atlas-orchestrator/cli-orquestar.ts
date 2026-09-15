import { describirPasada, orquestar } from "./index";

/**
 * `npm run orquestar` — una pasada del Orchestrator.
 *
 * `--solo-plan` planifica y deja las solicitudes creadas, pero no ejecuta
 * nada. Es la forma de ver qué haría antes de dejarle hacerlo.
 *
 * Necesita `POSTGRES_URL`. No aprovisiona el esquema por su cuenta: si las
 * tablas no están, falla diciendo qué falta. Crear tablas en la base de la
 * propietaria es una de las cosas que jamás hace sin que se lo pidan.
 */

async function main() {
  const soloPlanificar = process.argv.slice(2).includes("--solo-plan");

  const resumen = await orquestar({ soloPlanificar });

  console.log(`Atlas Orchestrator · pasada ${resumen.ejecucionId}${soloPlanificar ? " (sólo plan)" : ""}`);
  for (const linea of describirPasada(resumen)) console.log(linea);

  const fallidas = resumen.ejecutadas.filter((e) => e.rechazo || e.resultado?.ok === false);
  if (fallidas.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
