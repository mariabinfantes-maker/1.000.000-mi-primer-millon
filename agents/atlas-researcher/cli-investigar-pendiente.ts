import { investigarHerramienta } from "./agente";
import { escribirBorrador } from "./borrador";
import { leerDecision } from "./decision";
import { eliminarPendiente, leerPendiente, listarPendientes } from "./pendientes";
import { crearProveedorGemini } from "@/agents/compartido/proveedores/gemini";

/**
 * `npm run investigar-pendiente` — lista lo que espera decisión.
 * `npm run investigar-pendiente -- simplybook-me` — investiga una, si está autorizada.
 *
 * Cierra el bucle que abre `lote.ts`. Sin este comando, "queda pendiente
 * de decisión" no tendría forma de terminar: la candidata se guardaría y
 * ahí se quedaría para siempre.
 *
 * La autorización es la misma que ya usa todo el sistema —una decisión
 * "aprobado" registrada con `npm run aprobar-borrador`— y es obligatoria:
 * el sentido de haber parado es que la investigación completa no se gaste
 * hasta que una persona diga que merece la pena.
 */

function imprimirListado(): void {
  const pendientes = listarPendientes();
  if (pendientes.length === 0) {
    console.log("No hay ninguna herramienta esperando decisión.");
    return;
  }

  console.log(`${pendientes.length} herramienta(s) esperando tu decisión:\n`);
  for (const p of pendientes) {
    console.log(`  ${p.id}  (${p.nombreHerramienta})  [${p.estado}]  ${p.fecha}`);
    console.log(`    ${p.motivo}`);
    if (p.pruebaDeAusencia) console.log(`    «${p.pruebaDeAusencia.cita}» — ${p.pruebaDeAusencia.fuente}`);
  }
  console.log('\nPara autorizar una: npm run aprobar-borrador -- <id> --decision aprobado --notas "..."');
  console.log("Después:            npm run investigar-pendiente -- <id>");
}

async function main() {
  const id = process.argv[2]?.trim();
  if (!id) {
    imprimirListado();
    return;
  }

  const pendiente = leerPendiente(id);
  if (!pendiente) {
    console.error(`✗ No hay ningún pendiente con id "${id}". Ejecuta "npm run investigar-pendiente" para ver la lista.`);
    process.exitCode = 1;
    return;
  }

  const decision = leerDecision(id);
  if (decision?.decision !== "aprobado") {
    console.error(
      `✗ "${id}" sigue esperando tu decisión: ${pendiente.motivo}\n` +
        `  Autorízala primero: npm run aprobar-borrador -- ${id} --decision aprobado --notas "..."`
    );
    process.exitCode = 1;
    return;
  }

  const resultado = await investigarHerramienta({ nombreHerramienta: pendiente.nombreHerramienta }, crearProveedorGemini());
  if (!resultado.ok) {
    console.error(`✗ No se ha podido investigar "${pendiente.nombreHerramienta}": ${resultado.error}`);
    process.exitCode = 1;
    return;
  }

  const borrador = escribirBorrador(id, resultado.propuesta);
  eliminarPendiente(id);

  console.log(`✓ "${id}" investigada y convertida en borrador:`);
  console.log(`  - ${borrador.rutaHerramienta}`);
  console.log(`  - ${borrador.rutaAfiliados}`);
  if (resultado.estadoAfiliacion !== "confirmada") {
    console.log(
      `\n⚠ Su afiliación sigue en "${resultado.estadoAfiliacion}". Para promoverla harán falta ` +
        "--admitir-sin-afiliacion y --motivo-sin-afiliacion."
    );
  }
}

main();
