import { queSabemosDe, type LoQueSabemos } from "./queSabemos";

/**
 * npm run que-sabemos -- <id>      p. ej. npm run que-sabemos -- dricloud
 *
 * Imprime todo lo que Molnip tiene de una herramienta, capa por capa y con la
 * ruta de cada dato. SÓLO LEE. Ver `queSabemos.ts`.
 */

/**
 * Los datos que más se han echado en falta, y que conviene ver juntos de un
 * vistazo con su origen: lo que dice la ficha y lo que dice cada entrega.
 */
export const DATOS_CLAVE = [
  "tienePlanGratuito",
  "tipoPlanGratuito",
  "pruebaGratuitaDias",
  "fundamentoPlanGratuito",
  "citaPlanGratuito",
  "urlPlanGratuito",
  "precioInicial",
  "citaDelPrecio",
  "urlDelPrecio",
  "moneda",
  "segmentosIdeales",
  "porQueEseTamano",
  "limites",
  "curvaDeAprendizaje",
  "porQueEsaCurva",
  "idiomasDisponibles",
  "loQueNoPudeComprobar",
  "noConsta",
] as const;

const corto = (v: unknown, n = 220) => {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > n ? `${s.slice(0, n)}…` : s;
};

export function informe(s: LoQueSabemos): string {
  const l: string[] = [];
  l.push(`# Qué sabemos de ${s.nombre} (${s.id})`, "");
  l.push(`Ficha: data/herramientas/${s.id}.json${s.borrador ? ` · borrador: data/borradores/herramientas/${s.id}.json` : ""}`);
  l.push(`Capacidades: ${s.capacidades.verificadas} verificadas y ${s.capacidades.desconocidas} sin verificar (la verificación de capacidades)`);
  l.push(`Entregas de investigación: ${s.entregas.length} archivos · documentos que la nombran: ${s.documentos.length}`, "");

  l.push("## Datos clave, fuente por fuente", "");
  for (const clave of DATOS_CLAVE) {
    const filas: string[] = [];
    if (s.ficha && s.ficha[clave] !== undefined && s.ficha[clave] !== null) filas.push(`  - ficha: ${corto(s.ficha[clave])}`);
    for (const e of s.entregas) {
      for (const o of e.objetos) {
        const v = o.campos[clave];
        if (v === undefined || v === null || v === "") continue;
        filas.push(`  - ${e.ruta} (${e.fecha ?? "sin fecha"}): ${corto(v)}`);
      }
    }
    if (filas.length) l.push(`- **${clave}**`, ...filas);
  }
  l.push("");

  l.push("## Entregas de investigación", "");
  for (const e of s.entregas) {
    if (e.soloPorNombre) {
      l.push(`- ${e.ruta} (${e.fecha ?? "sin fecha"}) — volcado o archivo suyo sin campos estructurados`);
      continue;
    }
    for (const o of e.objetos) {
      const campos = Object.keys(o.campos).filter((k) => !["id", "nombre", "herramientaId"].includes(k));
      l.push(`- ${e.ruta} (${e.fecha ?? "sin fecha"}) · ${o.camino} · enlazado por ${o.enlace}`);
      l.push(`    campos: ${campos.join(", ") || "—"}`);
    }
  }
  l.push("");

  if (s.documentos.length) {
    l.push("## Documentos que la nombran", "");
    for (const d of s.documentos) {
      l.push(`- ${d.ruta} (${d.fecha ?? "sin fecha"})`);
      for (const x of d.lineas.slice(0, 3)) l.push(`    > ${corto(x, 180)}`);
    }
    l.push("");
  }

  l.push("## Capacidades verificadas", "");
  for (const r of s.capacidades.registros.filter((r) => r.estado === "verificado")) {
    const f = (r.fuentes as { url?: string; fechaConsulta?: string }[] | undefined)?.[0];
    l.push(`- ${r.capacidadId}${r.profundidad ? ` (${r.profundidad})` : ""}${r.planEstado ? ` · plan: ${r.planEstado}` : ""} · ${f?.url ?? "sin url"} ${f?.fechaConsulta ?? ""}`);
  }
  return l.join("\n");
}

if (process.argv[1]?.endsWith("cli-que-sabemos.ts")) {
  const id = process.argv[2];
  if (!id) {
    console.error("Uso: npm run que-sabemos -- <id de la herramienta>   (p. ej. dricloud)");
    process.exit(1);
  }
  const s = queSabemosDe(id);
  if (!s) {
    console.error(`No hay ninguna ficha con el id «${id}» en data/herramientas.`);
    process.exit(1);
  }
  console.log(informe(s));
}
