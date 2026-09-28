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
import { getTodasLasCategorias, getTodasLasHerramientas } from "./repositorio";
import { getTodasLasEstrategiasAfiliacion } from "./repositorioEstrategiaAfiliacion";

async function main() {
  const categorias = getTodasLasCategorias();
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

  /**
   * DESCONECTADA POR ORDEN DE LA PROPIETARIA (2026-09-16), APLICADA AQUÍ EL
   * 2026-09-28.
   *
   * Esto exigía un programa de afiliados activo para que una herramienta
   * pudiera estar en estado "activo". Era el reflejo, en el control de lote,
   * de la regla antigua del Researcher.
   *
   * La regla se sustituyó: «una herramienta útil entra aunque no tenga
   * programa. La falta de afiliación sólo afecta a la monetización y nunca
   * convierte una herramienta adecuada en descartada; no se usa como criterio
   * de orden, descarte ni exclusión» (AGENTS.md). El Researcher se reformó
   * entonces — ya no descarta, distingue tres estados y deriva a la
   * propietaria. Este archivo se quedó atrás y nadie volvió a leerlo, así que
   * la puerta siguió cerrada aquí.
   *
   * Se detectó el 2026-09-28 al preguntar qué hacía falta para dar de alta
   * herramientas de reservas encontradas fuera del catálogo: ninguna habría
   * pasado este control, por motivos que la propietaria ya había anulado.
   *
   * No se borra —se deja para que la decisión sea reversible y no se pierda el
   * trabajo de quien la pensó—: se deja de llamar. Si algún día vuelve a
   * hacer falta, vuelve a llamarse a `afiliacionRotaDespuesDelAlta` desde
   * `main`.
   */
  void afiliacionRotaDespuesDelAlta;

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

/**
 * La comprobación desconectada arriba, conservada tal cual estaba. Detectaba
 * si una herramienta activa se había quedado sin `data/afiliados/{id}.json`, o
 * con uno que ya no dice `hasAffiliateProgram: true` — es decir, si alguien
 * editaba la ficha a mano y rompía la condición DESPUÉS del alta.
 */
function afiliacionRotaDespuesDelAlta(activas: ReturnType<typeof getTodasLasHerramientas>): string[] {
  const errores: string[] = [];
  for (const h of activas) {
    const datosAfiliados = getAffiliateData(h.id);
    if (!datosAfiliados) {
      errores.push(`"${h.id}" está activa pero no tiene ningún data/afiliados/${h.id}.json`);
    } else if (datosAfiliados.hasAffiliateProgram !== true) {
      errores.push(`"${h.id}" está activa pero su afiliados/${h.id}.json no tiene hasAffiliateProgram: true`);
    }
  }
  return errores;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
