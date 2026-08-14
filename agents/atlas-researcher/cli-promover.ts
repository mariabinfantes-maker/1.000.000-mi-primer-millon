import { promoverBorrador } from "./promover";

/**
 * `npm run promover-borrador -- hubspot`
 *
 * Capa fina de línea de comandos sobre `promoverBorrador` (mismo patrón que
 * `cli.ts` sobre `agente.ts`, o `cli-lote.ts` sobre `lote.ts`): sin lógica
 * propia, solo argumentos y salida por consola.
 */
function main() {
  const id = process.argv[2]?.trim();
  if (!id) {
    console.error('Uso: npm run promover-borrador -- id-de-la-herramienta');
    process.exitCode = 1;
    return;
  }

  const resultado = promoverBorrador(id);

  if (!resultado.ok) {
    console.error(`✗ No se ha podido promover "${id}":`);
    for (const error of resultado.errores) console.error(`  - ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log(`✓ "${id}" promovido al catálogo real:`);
  console.log(`  - ${resultado.rutaHerramienta}`);
  console.log(`  - ${resultado.rutaAfiliados}`);
}

main();
