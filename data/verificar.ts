/**
 * Script de verificación de la base de conocimiento.
 *
 * Ejecutar con `npm run verificar-datos` cada vez que se añada o edite una
 * herramienta. Falla (exit code 1) si algún archivo JSON no cumple el
 * esquema mínimo — pensado para ejecutarse antes de fusionar cambios cuando
 * el catálogo tenga muchos colaboradores y cientos de fichas.
 */
import { getCategorias, getTodasLasHerramientas } from "./repositorio";

function main() {
  const categorias = getCategorias();
  const idsCategorias = new Set(categorias.map((c) => c.id));
  console.log(`Categorías: ${categorias.length}`);

  const herramientas = getTodasLasHerramientas();
  console.log(`Herramientas totales (incluye no activas): ${herramientas.length}`);

  const errores: string[] = [];
  const idsVistos = new Set<string>();

  for (const h of herramientas) {
    if (idsVistos.has(h.id)) {
      errores.push(`id duplicado: "${h.id}"`);
    }
    idsVistos.add(h.id);

    if (!idsCategorias.has(h.categoriaId)) {
      errores.push(`"${h.id}" referencia una categoría inexistente: "${h.categoriaId}"`);
    }
  }

  const activas = herramientas.filter((h) => h.estado === "activo");
  console.log(`Herramientas activas: ${activas.length}`);

  if (errores.length > 0) {
    console.error("\n❌ Errores encontrados:");
    errores.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log("\n✅ Base de conocimiento válida.");
}

main();
