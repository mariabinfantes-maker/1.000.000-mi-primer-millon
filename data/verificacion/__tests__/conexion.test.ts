import { describe, expect, it } from "vitest";
import { getProblemas, getTodasLasCategorias, getTodasLasHerramientas } from "@/data/repositorio";
import { recomendarHerramientas } from "@/agents/atlas-advisor/motor";
import { perfilesDePrueba } from "@/agents/atlas-advisor/__tests__/perfiles";
import { getPuertaDeEvidencia } from "../consulta";
import { RUTAS_CONGELADAS, RUTAS_PENDIENTES } from "../rutas";

/**
 * La conexión de verdad — F3, bloque 5, con los 1.544 registros y las 62
 * fichas reales.
 *
 * Las pruebas del motor usan puertas de mentira, que es lo correcto para
 * comprobar la conducta. Ésta comprueba lo otro: que enchufada a los datos que
 * hay, la puerta hace lo que la simulación midió y no otra cosa.
 */
describe("el motor con la verificación puesta", () => {
  const catalogo = getTodasLasHerramientas();
  const evidencia = getPuertaDeEvidencia();

  /**
   * La regresión COMPLETA, y completa quiere decir todas las puertas de
   * entrada: las 15 categorías, los 6 subtipos y los 5 objetivos, por los 120
   * perfiles de cada uno. 3.120 combinaciones.
   *
   * Antes esta prueba recorría sólo las 7 rutas con fila —840— mientras su
   * comentario hablaba de 2.160. Lo señaló la revisión independiente: el
   * comentario prometía una cobertura que el cuerpo no ejecutaba, que es peor
   * que no prometer nada.
   *
   * Si algún día deja de ser cero, conectar habrá pasado a cambiar lo que se
   * recomienda, y eso es una decisión de la propietaria, no un efecto
   * secundario de un cambio de datos.
   */
  it("no cambia ni uno de los 3.120 resultados: todas las categorías, subtipos y objetivos", () => {
    // Las 15 DECLARADAS, no las 4 públicas ni las 4 que hoy tienen fichas: una
    // categoría vacía también es un camino por el que se puede llegar, y ahí
    // el motor tiene que seguir diciendo lo mismo que antes de F3.
    const categorias = getTodasLasCategorias().map((c) => c.id).sort();
    const subtipos = [...new Set(catalogo.filter((h) => h.subtipoId).map((h) => `${h.categoriaId}/${h.subtipoId}`))].sort();
    const objetivos = getProblemas().map((p) => p.id).sort();
    expect(categorias.length).toBe(15);
    expect(subtipos.length).toBe(6);
    expect(objetivos.length).toBe(5);

    const ambitos = [
      ...categorias.map((categoriaId) => ({ categoriaId })),
      ...subtipos.map((s) => ({ categoriaId: s.split("/")[0], subtipoId: s.split("/")[1] })),
      ...objetivos.map((id) => ({ problemaIdsCandidatos: [id] })),
    ];

    const distintos: string[] = [];
    let combinaciones = 0;
    for (const ambito of ambitos) {
      for (const perfil of perfilesDePrueba(ambito)) {
        combinaciones++;
        const sin = recomendarHerramientas(perfil, catalogo).top.map((e) => e.herramienta.id);
        const con = recomendarHerramientas(perfil, catalogo, { evidencia }).top.map((e) => e.herramienta.id);
        if (sin.join(">") !== con.join(">")) {
          distintos.push(`${JSON.stringify(ambito)}: ${sin.join(">")} → ${con.join(">")}`);
        }
      }
    }
    expect(combinaciones).toBe(3120);
    expect(distintos).toEqual([]);
  });

  it("ninguna ruta congelada se queda sin candidatas", () => {
    for (const fila of RUTAS_CONGELADAS) {
      const r = recomendarHerramientas(
        { categoriaId: fila.categoriaId, subtipoId: fila.subtipoId },
        catalogo,
        { evidencia }
      );
      expect(r.todas.length, fila.ambito).toBeGreaterThan(0);
      expect(r.necesidadesSinConfirmar, fila.ambito).toBeUndefined();
    }
  });

  /**
   * Lo que SÍ se mueve, y conviene tenerlo escrito: en gestión de proyectos la
   * puntuación de las supervivientes baja hasta 0,5 puntos, porque varios
   * criterios son comparativos y el conjunto contra el que se comparan se ha
   * hecho más pequeño. El orden relativo no cambia, así que no cambia nada de
   * lo que se enseña.
   */
  it("el orden entre las supervivientes es el mismo con la puerta y sin ella", () => {
    for (const fila of RUTAS_CONGELADAS) {
      const perfil = { categoriaId: fila.categoriaId, subtipoId: fila.subtipoId };
      const sin = recomendarHerramientas(perfil, catalogo).todas.map((e) => e.herramienta.id);
      const con = recomendarHerramientas(perfil, catalogo, { evidencia }).todas.map((e) => e.herramienta.id);
      expect(con, fila.ambito).toEqual(sin.filter((id) => con.includes(id)));
    }
  });

  it("y la puerta aparta de verdad a alguien: si no, no estaría probando nada", () => {
    const perfil = { categoriaId: "gestion-proyectos" };
    const sin = recomendarHerramientas(perfil, catalogo).todas.length;
    const con = recomendarHerramientas(perfil, catalogo, { evidencia }).todas.length;
    expect(con).toBeLessThan(sin);
  });
});

describe("los ámbitos pendientes siguen sin regla", () => {
  const catalogo = getTodasLasHerramientas();
  const evidencia = getPuertaDeEvidencia();

  it.each(RUTAS_PENDIENTES.map((p) => p.ambito))("%s no tiene fila", (ambito) => {
    expect(evidencia.filaDe(ambito)).toBeUndefined();
  });

  it("CRM evalúa exactamente las mismas candidatas con la puerta y sin ella", () => {
    const perfil = { categoriaId: "crm" };
    const sin = recomendarHerramientas(perfil, catalogo).todas.map((e) => e.herramienta.id);
    const con = recomendarHerramientas(perfil, catalogo, { evidencia }).todas.map((e) => e.herramienta.id);
    expect(con).toEqual(sin);
    expect(con.length).toBeGreaterThan(0);
  });

  it("las plataformas todo en uno, igual", () => {
    const perfil = { categoriaId: "plataformas-todo-en-uno" };
    const sin = recomendarHerramientas(perfil, catalogo).todas.map((e) => e.herramienta.id);
    const con = recomendarHerramientas(perfil, catalogo, { evidencia }).todas.map((e) => e.herramienta.id);
    expect(con).toEqual(sin);
    expect(con.length).toBeGreaterThan(0);
  });
});

describe("lo que la puerta le cuenta al motor", () => {
  const evidencia = getPuertaDeEvidencia();

  it("sólo dice «sí» con una capacidad verificada", () => {
    // pipedrive/cap.sales_pipeline está verificada; su cap.audit_log, no.
    expect(evidencia.loDemuestra("pipedrive", "cap.sales_pipeline")).toBe(true);
    expect(evidencia.loDemuestra("pipedrive", "cap.audit_log")).toBe(false);
  });

  it("un par que nunca se preguntó responde igual que uno que no quedó claro", () => {
    expect(evidencia.loDemuestra("pipedrive", "cap.jamas_preguntada")).toBe(false);
    expect(evidencia.loDemuestra("herramienta-inventada", "cap.sales_pipeline")).toBe(false);
  });

  it("no expone el plan por ningún sitio", () => {
    expect(Object.keys(evidencia).sort()).toEqual(["filaDe", "loDemuestra"]);
  });
});
