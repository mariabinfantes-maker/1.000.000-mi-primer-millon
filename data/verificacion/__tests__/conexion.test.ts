import { describe, expect, it } from "vitest";
import { getTodasLasHerramientas } from "@/data/repositorio";
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
   * El número que autorizó conectar. Si algún día deja de ser cero, conectar
   * habrá pasado a cambiar lo que se recomienda, y eso es una decisión de la
   * propietaria, no un efecto secundario de un cambio de datos.
   */
  it("no cambia ni uno de los 840 resultados de la simulación", () => {
    const distintos: string[] = [];
    for (const fila of RUTAS_CONGELADAS) {
      const perfiles = perfilesDePrueba({ categoriaId: fila.categoriaId, subtipoId: fila.subtipoId });
      expect(perfiles.length).toBe(120);
      for (const perfil of perfiles) {
        const sin = recomendarHerramientas(perfil, catalogo).top.map((e) => e.herramienta.id);
        const con = recomendarHerramientas(perfil, catalogo, { evidencia }).top.map((e) => e.herramienta.id);
        if (sin.join(">") !== con.join(">")) distintos.push(`${fila.ambito}: ${sin.join(">")} → ${con.join(">")}`);
      }
    }
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
      expect(r.necesidadSinConfirmar, fila.ambito).toBeUndefined();
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
