/**
 * Script de verificación de la base de conocimiento.
 *
 * Ejecutar con `npm run verificar-datos` cada vez que se añada o edite una
 * herramienta. Falla (exit code 1) si algún archivo JSON no cumple el
 * esquema mínimo — pensado para ejecutarse antes de fusionar cambios cuando
 * el catálogo tenga muchos colaboradores y cientos de fichas.
 */
import { detectarCuentasActivasSinEnlace } from "@/agents/atlas-affiliate-manager/consistencia";
import { getAffiliateData } from "./repositorioAfiliados";
import { getCategorias, getTodasLasHerramientas } from "./repositorio";
import { getTodasLasEstrategiasAfiliacion } from "./repositorioEstrategiaAfiliacion";

async function main() {
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

  // La regla obligatoria de Atlas (ver agents/atlas-researcher/agente.ts) exige un
  // programa de afiliados activo y fiable para dar de alta una herramienta. Esta
  // comprobación detecta si esa condición se ha roto DESPUÉS del alta — por
  // ejemplo, si alguien edita data/herramientas/{id}.json a mano y pone
  // estado: "activo" sin comprobar que su afiliados/{id}.json siga existiendo
  // y siga marcado como hasAffiliateProgram: true.
  for (const h of activas) {
    const datosAfiliados = getAffiliateData(h.id);
    if (!datosAfiliados) {
      errores.push(`"${h.id}" está activa pero no tiene ningún data/afiliados/${h.id}.json`);
    } else if (datosAfiliados.hasAffiliateProgram !== true) {
      errores.push(`"${h.id}" está activa pero su afiliados/${h.id}.json no tiene hasAffiliateProgram: true`);
    }
  }

  // Una cuenta de afiliado "activo" sin ningún enlace es comisión que se
  // está perdiendo en silencio (ver agents/atlas-affiliate-manager/consistencia.ts):
  // Atlas ya está aprobado como afiliado, pero el redirect de producción no
  // tiene ningún enlace propio que servir.
  const estrategias = await getTodasLasEstrategiasAfiliacion();
  const cuentasSinEnlace = detectarCuentasActivasSinEnlace(estrategias);
  errores.push(...cuentasSinEnlace.map((aviso) => aviso.mensaje));

  if (errores.length > 0) {
    console.error("\n❌ Errores encontrados:");
    errores.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log("\n✅ Base de conocimiento válida.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
