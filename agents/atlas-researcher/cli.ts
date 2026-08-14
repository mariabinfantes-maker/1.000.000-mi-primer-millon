import { investigarHerramienta } from "./agente";
import { crearProveedorGemini } from "@/agents/compartido/proveedores/gemini";

/**
 * `npm run investigar-herramienta -- "Nombre de la herramienta"`
 *
 * Prueba manual del pipeline completo. Hoy siempre termina en error, porque
 * `crearProveedorGemini` es un placeholder — y eso es lo esperado: confirma
 * que la solicitud, la construcción del prompt y el manejo de errores están
 * bien enlazados, sin haber conectado todavía ningún proveedor real.
 */
async function main() {
  const nombreHerramienta = process.argv.slice(2).join(" ").trim();
  if (!nombreHerramienta) {
    console.error('Uso: npm run investigar-herramienta -- "Nombre de la herramienta"');
    process.exitCode = 1;
    return;
  }

  const resultado = await investigarHerramienta({ nombreHerramienta }, crearProveedorGemini());

  if (!resultado.ok) {
    console.error(`✗ No se ha podido investigar "${nombreHerramienta}": ${resultado.error}`);
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify(resultado.propuesta, null, 2));
}

main();
