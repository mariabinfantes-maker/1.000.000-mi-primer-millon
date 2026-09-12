import { promoverBorrador } from "./promover";

/**
 * `npm run promover-borrador -- hubspot`
 * `npm run promover-borrador -- zoho-crm --ignorar-duplicado --justificacion "Producto distinto de Zoho One, mismo proveedor."`
 *
 * Capa fina de línea de comandos sobre `promoverBorrador` (mismo patrón que
 * `cli.ts` sobre `agente.ts`, o `cli-lote.ts` sobre `lote.ts`): sin lógica
 * propia, solo argumentos y salida por consola.
 *
 * `--ignorar-duplicado` anula un aviso de casi-duplicado de Atlas Curator
 * cuando es un falso positivo (mismo proveedor, productos distintos) —
 * exige `--justificacion`, que queda registrada tal cual en el historial
 * de aprobaciones. Nunca anula ninguna otra comprobación.
 *
 * `--admitir-sin-afiliacion` abre la excepción de la política de
 * «Herramientas sin afiliación»: cubre un hueco o demuestra ventaja
 * material. Exige `--motivo-sin-afiliacion`, que también queda en el
 * historial. Tampoco anula ninguna otra comprobación: la decisión
 * editorial aprobada sigue siendo obligatoria.
 */

function leerFlag(args: string[], nombre: string): string | undefined {
  const indice = args.indexOf(`--${nombre}`);
  if (indice === -1 || indice + 1 >= args.length) return undefined;
  return args[indice + 1];
}

async function main() {
  const args = process.argv.slice(2);
  const id = args[0]?.trim();
  if (!id || id.startsWith("--")) {
    console.error(
      "Uso: npm run promover-borrador -- id-de-la-herramienta " +
        '[--ignorar-duplicado --justificacion "..."] [--admitir-sin-afiliacion --motivo-sin-afiliacion "..."]'
    );
    process.exitCode = 1;
    return;
  }

  const ignorarAvisosDuplicado = args.includes("--ignorar-duplicado");
  const justificacionAnulacion = leerFlag(args, "justificacion");

  const admitirSinAfiliacion = args.includes("--admitir-sin-afiliacion");
  const justificacionSinAfiliacion = leerFlag(args, "motivo-sin-afiliacion");

  const resultado = await promoverBorrador(id, {
    ignorarAvisosDuplicado,
    justificacionAnulacion,
    admitirSinAfiliacion,
    justificacionSinAfiliacion,
  });

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
