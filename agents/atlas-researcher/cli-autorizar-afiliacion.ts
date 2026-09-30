import { registrarAutorizacionAfiliacion } from "./autorizacionAfiliacion";
import { leerPendiente } from "./pendientes";

/**
 * `npm run autorizar-afiliacion -- viday --motivo "Única que cubre reserva online en español para peluquerías."`
 *
 * Registra la autorización de la propietaria para seguir adelante con una
 * herramienta **pese a su afiliación**.
 *
 * El estado no se escribe a mano: se lee del pendiente, para que la
 * autorización quede atada al estado que la herramienta tiene de verdad en
 * este momento. Si más adelante ese estado cambia, la autorización deja de
 * cubrirla y hay que volver a autorizarla — lo autorizado ya no sería lo
 * que hay.
 */

function leerFlag(args: string[], nombre: string): string | undefined {
  const indice = args.indexOf(`--${nombre}`);
  if (indice === -1 || indice + 1 >= args.length) return undefined;
  return args[indice + 1];
}

function main() {
  const args = process.argv.slice(2);
  const id = args[0]?.trim();
  const motivo = leerFlag(args, "motivo");

  if (!id || id.startsWith("--") || !motivo) {
    console.error('Uso: npm run autorizar-afiliacion -- id-de-la-herramienta --motivo "por qué entra pese a su afiliación"');
    process.exitCode = 1;
    return;
  }

  let pendiente;
  try {
    pendiente = leerPendiente(id);
  } catch (error) {
    console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
    return;
  }

  if (!pendiente) {
    console.error(
      `✗ No hay ningún pendiente con id "${id}". Ejecuta "npm run investigar-pendiente" para ver qué está esperando.`
    );
    process.exitCode = 1;
    return;
  }

  try {
    const autorizacion = registrarAutorizacionAfiliacion(id, pendiente.estado, motivo);
    console.log(`✓ Autorizada "${id}" con la afiliación en "${autorizacion.estadoAutorizado}".`);
    console.log(`  Motivo: ${autorizacion.motivo}`);
    console.log(`\nAhora puedes investigarla: npm run investigar-pendiente -- ${id}`);
  } catch (error) {
    console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

main();
