import { investigarHerramienta } from "./agente";
import { comprobarAutorizacion } from "./autorizacionAfiliacion";
import { escribirBorrador } from "./borrador";
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
 * La autorización es la de `autorizacionAfiliacion.ts`, atada a esta
 * herramienta y a su estado de afiliación exacto — no la decisión
 * editorial genérica, que podía venir de meses antes y de otro asunto.
 * Es obligatoria: el sentido de haber parado es que la investigación
 * completa no se gaste hasta que una persona lo autorice para esto.
 */

function imprimirListado(): void {
  const { pendientes, corruptos } = listarPendientes();

  if (pendientes.length === 0 && corruptos.length === 0) {
    console.log("No hay ninguna herramienta esperando decisión.");
    return;
  }

  if (pendientes.length > 0) {
    console.log(`${pendientes.length} herramienta(s) esperando tu decisión:\n`);
    for (const p of pendientes) {
      const observaciones = p.observaciones?.length ?? 1;
      console.log(
        `  ${p.id}  (${p.nombreHerramienta})  [${p.estado}]  esperando desde ${p.fecha}` +
          (observaciones > 1 ? `  · ${observaciones} observaciones, última ${p.fechaUltimaObservacion}` : "")
      );
      console.log(`    ${p.motivo}`);
      if (p.pruebaDeAusencia) console.log(`    «${p.pruebaDeAusencia.cita}» — ${p.pruebaDeAusencia.fuente}`);
    }
    console.log('\nPara autorizar una: npm run autorizar-afiliacion -- <id> --motivo "..."');
    console.log("Después:            npm run investigar-pendiente -- <id>");
  }

  // Se reportan aparte y al final: un fichero roto no puede dejar a la
  // propietaria sin ver el resto de lo que espera.
  if (corruptos.length > 0) {
    console.log(`\n⚠ ${corruptos.length} fichero(s) de pendientes no se han podido leer:`);
    for (const c of corruptos) console.log(`  - ${c.fichero}: ${c.error}`);
  }
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

  const autorizacion = comprobarAutorizacion(id, pendiente.estado);
  if (!autorizacion.autorizada) {
    console.error(`✗ "${id}" sigue esperando tu decisión: ${pendiente.motivo}\n  ${autorizacion.explicacion}`);
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
