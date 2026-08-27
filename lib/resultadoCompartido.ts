import { getCategoria, getHerramienta, getProblema } from "@/data/repositorio";
import type { HerramientaEvaluada } from "@/agents/atlas-advisor";
import type { OrigenDiagnostico } from "@/lib/origenDiagnostico";
import { leerTokenResultado, type PayloadTokenResultado } from "@/lib/resultadoToken";

/**
 * Puente servidor entre un token de `/resultado/[token]` y lo que la
 * pantalla necesita para pintarse — la contraparte de
 * `lib/resultadosSesion.ts` (que este archivo sustituye) pero leyendo de
 * la URL en vez de `sessionStorage`, así que solo puede ejecutarse en el
 * servidor: usa `data/repositorio.ts` (`node:fs`) para rehidratar cada
 * herramienta con sus datos actuales.
 */

export type ResultadoCompartido = {
  origen: OrigenDiagnostico;
  top: HerramientaEvaluada[];
  generadoEn: string;
};

/**
 * Resuelve un token a un resultado listo para pintar, o `null` si el
 * token no es válido, ha caducado su firma, apunta a un origen que ya no
 * existe (una categoría o un objetivo renombrado/retirado), o ninguna de
 * las herramientas que recomendaba sigue en el catálogo.
 */
export function resolverResultadoCompartido(token: string): ResultadoCompartido | null {
  const payload = leerTokenResultado(token);
  if (!payload) return null;

  const origen = construirOrigen(payload);
  if (!origen) return null;

  const top: HerramientaEvaluada[] = [];
  for (const item of payload.items) {
    const herramienta = getHerramienta(item.id);
    // Herramienta retirada del catálogo desde que se generó el enlace: se
    // omite en vez de romper todo el resultado por una sola baja.
    if (!herramienta) continue;
    top.push({
      herramienta,
      puntuacionTotal: item.puntuacion,
      detalles: [],
      razones: [],
      explicacion: item.explicacion,
      tieneAdvertencia: item.advertencia,
    });
  }
  if (top.length === 0) return null;

  return { origen, top, generadoEn: payload.generadoEn };
}

function construirOrigen(payload: PayloadTokenResultado): OrigenDiagnostico | null {
  if (payload.origenTipo === "libre") {
    return { tipo: "libre", id: "libre", titulo: "Tu diagnóstico", rutaBase: "/libre" };
  }
  if (payload.origenTipo === "categoria") {
    const categoria = getCategoria(payload.origenId);
    if (!categoria) return null;
    return { tipo: "categoria", id: categoria.id, titulo: categoria.nombre, rutaBase: `/categoria/${categoria.id}` };
  }
  const problema = getProblema(payload.origenId);
  if (!problema) return null;
  return { tipo: "objetivo", id: problema.id, titulo: problema.titulo, rutaBase: `/problema/${problema.id}` };
}
