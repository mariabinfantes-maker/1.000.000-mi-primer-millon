import { getTodasLasHerramientas } from "@/data/repositorio";
import { recomendarHerramientas } from "@/agents/atlas-advisor/motor";
import { perfilesDePrueba } from "@/agents/atlas-advisor/__tests__/perfiles";
import type { RespuestasUsuario } from "@/agents/atlas-advisor/tipos";
import type { Herramienta } from "@/data/esquema";
import { getPuertaDeEvidencia, getPuertoDeEvidencia } from "./consulta";
import { RUTAS_CONGELADAS, cumpleLaRuta, type FilaDeRuta } from "./rutas";

/**
 * La simulación de F3 — bloque 4, ANTES de conectar nada.
 *
 * Corre el motor REAL, sin tocarlo, dos veces por perfil: una con el catálogo
 * tal cual está hoy en producción, y otra con las herramientas que no cumplen
 * su fila ya apartadas. La diferencia entre los dos tríos es lo que costaría
 * conectar la tabla.
 *
 * Se ejecuta así, y no hace ni una llamada a ninguna API ni escribe nada:
 *
 *     npx tsx data/verificacion/simulacion-f3.ts
 *
 * ── Qué compara exactamente ─────────────────────────────────────────────
 *
 * Desde el bloque 5 la puerta vive dentro del motor, así que aquí se mide lo
 * de verdad: la misma llamada, con y sin `evidencia`. Antes de conectar, esto
 * apartaba las candidatas por fuera para imitar la puerta sin escribirla; el
 * número que salía era el mismo, y esa continuidad es la que demuestra que
 * conectar no cambió la lógica.
 *
 * ── Lo que esta simulación NO dice ──────────────────────────────────────
 *
 * No dice que el resultado nuevo sea mejor: eso no se ha medido con gente. No
 * dice que las herramientas apartadas no sirvan, sino que no lo han
 * demostrado. Y sólo cubre las rutas con fila congelada: CRM y las suites
 * siguen pendientes, así que aquí no aparecen.
 */

const SUITES = "plataformas-todo-en-uno";

/** Las candidatas que la fila gobierna. Las suites compiten en las categorías especializadas. */
function universoDe(fila: FilaDeRuta, catalogo: Herramienta[]): Herramienta[] {
  return catalogo.filter((h) =>
    fila.subtipoId
      ? h.categoriaId === fila.categoriaId && h.subtipoId === fila.subtipoId
      : h.categoriaId === fila.categoriaId || h.categoriaId === SUITES
  );
}

const PUERTA = getPuertaDeEvidencia();

/** El trío que devuelve el motor, con la puerta puesta o sin ella. */
function tríoDe(respuestas: RespuestasUsuario, catalogo: Herramienta[], conPuerta: boolean): string[] {
  const opciones = conPuerta ? { evidencia: PUERTA } : {};
  return recomendarHerramientas(respuestas, catalogo, opciones).top.map((e) => e.herramienta.id);
}

/**
 * Las que el motor evalúa DE VERDAD en esa ruta.
 *
 * No coincide con el universo de la fila y conviene no confundirlos: la fila
 * mira la categoría más todas las suites, pero el motor sólo admite la suite
 * que declara cubrir esa categoría. En gestión de proyectos son 19, no 29. Una
 * herramienta apartada por la fila que el motor nunca iba a considerar no
 * cambia nada, y decir «apartadas 11» sin esto haría creer que sí.
 */
function candidatasDelMotor(respuestas: RespuestasUsuario, catalogo: Herramienta[]): string[] {
  return recomendarHerramientas(respuestas, catalogo).todas.map((e) => e.herramienta.id);
}

function main(): void {
  const catalogo = getTodasLasHerramientas();
  const puerto = getPuertoDeEvidencia();
  const loDemuestra = (h: string, c: string) => puerto.estadoDe(h, c).estado === "demostrada";

  let ejecuciones = 0;
  let cambian = 0;

  console.log(`Simulación de F3 · ${RUTAS_CONGELADAS.length} rutas con fila congelada · catálogo de ${catalogo.length}\n`);

  for (const fila of RUTAS_CONGELADAS) {
    const universo = universoDe(fila, catalogo);
    const apartadas = universo.filter((h) => !cumpleLaRuta(fila, h.id, loDemuestra));
    const base: RespuestasUsuario = { categoriaId: fila.categoriaId, subtipoId: fila.subtipoId };
    const perfiles = perfilesDePrueba(base);

    let cambiosDeRuta = 0;
    const entran = new Map<string, number>();
    const salen = new Map<string, number>();

    for (const perfil of perfiles) {
      const antes = tríoDe(perfil, catalogo, false);
      const despues = tríoDe(perfil, catalogo, true);
      ejecuciones++;
      if (antes.join(">") === despues.join(">")) continue;
      cambiosDeRuta++;
      for (const id of despues) if (!antes.includes(id)) entran.set(id, (entran.get(id) ?? 0) + 1);
      for (const id of antes) if (!despues.includes(id)) salen.set(id, (salen.get(id) ?? 0) + 1);
    }
    cambian += cambiosDeRuta;

    const orden = (m: Map<string, number>) =>
      [...m.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => `${id} (${n})`).join(", ") || "—";

    const candidatas = candidatasDelMotor(perfiles[0], catalogo);
    const apartadasQueCompetian = apartadas.filter((h) => candidatas.includes(h.id));

    console.log(`${fila.ambito}`);
    console.log(`  exige alguna de: ${fila.exigeAlgunaDe.join(", ")}`);
    console.log(`  universo de la fila ${universo.length} · pasan ${universo.length - apartadas.length} · apartadas ${apartadas.length}`);
    console.log(`  el motor evalúa ${candidatas.length}, de las que la fila aparta ${apartadasQueCompetian.length}`);
    if (apartadasQueCompetian.length)
      console.log(`  apartadas que sí competían: ${apartadasQueCompetian.map((h) => h.id).sort().join(", ")}`);
    console.log(`  perfiles que cambian el trío: ${cambiosDeRuta}/${perfiles.length}`);
    console.log(`  entran: ${orden(entran)}`);
    console.log(`  salen:  ${orden(salen)}\n`);
  }

  console.log(`TOTAL: ${cambian} de ${ejecuciones} ejecuciones cambian el trío.`);
  console.log("Ninguna herramienta apartada ha demostrado que no sirva: no lo ha demostrado, que es distinto.");
}

main();
