import { investigarHerramienta } from "./agente";
import { comprobarAutorizacion } from "./autorizacionAfiliacion";
import { generarId } from "./id";
import { registrarPendiente } from "./pendientes";
import { prechequearAfiliados } from "./prechequeoAfiliados";
import { crearProveedorGemini } from "@/agents/compartido/proveedores/gemini";

/**
 * `npm run investigar-herramienta -- "Nombre de la herramienta"`
 *
 * Prueba manual del pipeline completo.
 *
 * Desde la revisión de `6a12144` **también prechequea la afiliación antes
 * de investigar**. Antes no lo hacía: era el único camino por el que se
 * podía gastar una investigación completa sobre una herramienta cuya
 * afiliación no consta, sin que nadie lo hubiera autorizado. El lote y
 * `investigar-pendiente` ya lo impedían; éste no, y la regla tiene que
 * valer en los tres o no vale.
 */
async function main() {
  const nombreHerramienta = process.argv.slice(2).join(" ").trim();
  if (!nombreHerramienta) {
    console.error('Uso: npm run investigar-herramienta -- "Nombre de la herramienta"');
    process.exitCode = 1;
    return;
  }

  const proveedor = crearProveedorGemini();
  const id = generarId(nombreHerramienta);

  const prechequeo = await prechequearAfiliados(nombreHerramienta, proveedor);
  if (!prechequeo.ok) {
    console.error(`✗ No se ha podido comprobar la afiliación de "${nombreHerramienta}": ${prechequeo.error}`);
    process.exitCode = 1;
    return;
  }

  const autorizacion = comprobarAutorizacion(id, prechequeo.estado, {});
  // `comprobarAutorizacion` sólo puede negar cuando el estado no es
  // "confirmada", pero eso TypeScript no lo deduce: se estrecha a mano.
  if (!autorizacion.autorizada && prechequeo.estado !== "confirmada") {
    // Se anota como pendiente, igual que haría el lote: pararse no es
    // descartar, y la candidata tiene que quedar registrada esperando.
    registrarPendiente({
      id,
      nombreHerramienta,
      estado: prechequeo.estado,
      motivo: prechequeo.motivo,
      datosAfiliados: prechequeo.datosAfiliados,
      ...(prechequeo.pruebaDeAusencia ? { pruebaDeAusencia: prechequeo.pruebaDeAusencia } : {}),
    });
    console.error(`⏸ No se investiga todavía "${nombreHerramienta}" (${id}): ${prechequeo.motivo}`);
    console.error(`  ${autorizacion.explicacion}`);
    process.exitCode = 1;
    return;
  }

  const resultado = await investigarHerramienta({ nombreHerramienta }, proveedor);

  if (!resultado.ok) {
    console.error(`✗ No se ha podido investigar "${nombreHerramienta}": ${resultado.error}`);
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify(resultado.propuesta, null, 2));
}

main();
