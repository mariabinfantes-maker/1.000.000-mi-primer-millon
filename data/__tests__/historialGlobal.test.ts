import { beforeEach, describe, expect, it } from "vitest";
import { getHistorialGlobal, guardarEstrategiaAfiliacion } from "../repositorioEstrategiaAfiliacion";
import type { EstrategiaAfiliacion } from "../esquemaInterno";
import { limpiarTablasDePrueba, poolDePrueba, postgresDisponible } from "../db/__tests__/entornoPruebaPostgres";

/**
 * Consulta del historial que alimenta la pantalla del panel: búsqueda y
 * paginación se hacen en la base de datos, no trayéndose todo a memoria.
 * El historial es de solo inserción y crece sin techo, así que leerlo
 * entero dejaría de funcionar con el tiempo — no es una optimización
 * prematura, es la única forma que aguanta.
 */

function estrategia(herramientaId: string, cambios: Partial<EstrategiaAfiliacion["cuentas"][0]> = {}): EstrategiaAfiliacion {
  return {
    herramientaId,
    cuentas: [
      {
        id: "principal",
        estado: "no_solicitado",
        plataforma: "PartnerStack",
        enlaces: [],
        ultimaRevision: "2026-08-26",
        ...cambios,
      },
    ],
  };
}

describe.skipIf(!postgresDisponible())("getHistorialGlobal", () => {
  const opciones = () => ({ pool: poolDePrueba() });

  beforeEach(limpiarTablasDePrueba);

  it("devuelve vacío y total 0 cuando no hay nada", async () => {
    expect(await getHistorialGlobal({}, opciones())).toEqual({ eventos: [], total: 0 });
  });

  it("reúne los cambios de TODAS las herramientas, no solo de una", async () => {
    await guardarEstrategiaAfiliacion(estrategia("grammarly"), { pool: poolDePrueba(), usuario: "maria" });
    await guardarEstrategiaAfiliacion(estrategia("asana"), { pool: poolDePrueba(), usuario: "maria" });

    const { eventos } = await getHistorialGlobal({}, opciones());
    const herramientas = new Set(eventos.map((e) => e.herramientaId));

    expect(herramientas).toEqual(new Set(["grammarly", "asana"]));
  });

  it("ordena del más reciente al más antiguo", async () => {
    await guardarEstrategiaAfiliacion(estrategia("grammarly"), { pool: poolDePrueba(), usuario: "maria" });
    await guardarEstrategiaAfiliacion(estrategia("grammarly", { comision: "20%" }), { pool: poolDePrueba(), usuario: "maria" });

    const { eventos } = await getHistorialGlobal({}, opciones());

    expect(eventos.length).toBeGreaterThan(1);
    for (let i = 1; i < eventos.length; i++) {
      expect(Date.parse(eventos[i - 1].fecha)).toBeGreaterThanOrEqual(Date.parse(eventos[i].fecha));
    }
    // El cambio de comisión, que es el último hecho, va primero.
    expect(eventos[0].campo).toContain("comision");
  });

  it("filtra por herramienta", async () => {
    await guardarEstrategiaAfiliacion(estrategia("grammarly"), { pool: poolDePrueba(), usuario: "maria" });
    await guardarEstrategiaAfiliacion(estrategia("asana"), { pool: poolDePrueba(), usuario: "maria" });

    const { eventos, total } = await getHistorialGlobal({ herramientaId: "asana" }, opciones());

    expect(eventos.every((e) => e.herramientaId === "asana")).toBe(true);
    expect(total).toBe(eventos.length);
  });

  describe("búsqueda", () => {
    beforeEach(async () => {
      await guardarEstrategiaAfiliacion(estrategia("grammarly", { comision: "25% recurrente" }), {
        pool: poolDePrueba(),
        usuario: "maria",
        motivo: "Confirmado por correo",
      });
      await guardarEstrategiaAfiliacion(estrategia("asana", { comision: "10% único" }), {
        pool: poolDePrueba(),
        usuario: "carlos",
      });
    });

    it("encuentra por el contenido del valor", async () => {
      const { eventos } = await getHistorialGlobal({ busqueda: "25% recurrente" }, opciones());
      expect(eventos.length).toBeGreaterThan(0);
      expect(eventos.every((e) => e.herramientaId === "grammarly")).toBe(true);
    });

    it("encuentra por usuario", async () => {
      const { eventos } = await getHistorialGlobal({ busqueda: "carlos" }, opciones());
      expect(eventos.length).toBeGreaterThan(0);
      expect(eventos.every((e) => e.usuario === "carlos")).toBe(true);
    });

    it("encuentra por motivo", async () => {
      const { eventos } = await getHistorialGlobal({ busqueda: "Confirmado por correo" }, opciones());
      expect(eventos.length).toBeGreaterThan(0);
    });

    it("encuentra por nombre de campo", async () => {
      const { eventos } = await getHistorialGlobal({ busqueda: "comision" }, opciones());
      expect(eventos.every((e) => e.campo.includes("comision"))).toBe(true);
    });

    it("no distingue mayúsculas de minúsculas", async () => {
      const conMayusculas = await getHistorialGlobal({ busqueda: "CARLOS" }, opciones());
      const conMinusculas = await getHistorialGlobal({ busqueda: "carlos" }, opciones());
      expect(conMayusculas.total).toBe(conMinusculas.total);
      expect(conMayusculas.total).toBeGreaterThan(0);
    });

    it("devuelve vacío si no hay coincidencias, sin lanzar", async () => {
      expect(await getHistorialGlobal({ busqueda: "esto-no-existe-en-ningun-sitio" }, opciones())).toEqual({ eventos: [], total: 0 });
    });

    it("trata el texto buscado como texto, no como comodines de la base de datos", async () => {
      // Un "%" suelto seleccionaría TODO si se interpolara sin más. Aquí
      // debe buscarse literalmente el carácter dentro de los valores.
      const { eventos } = await getHistorialGlobal({ busqueda: "%" }, opciones());
      expect(eventos.every((e) => JSON.stringify(e).includes("%"))).toBe(true);
    });
  });

  describe("paginación", () => {
    beforeEach(async () => {
      // Varios cambios seguidos sobre la misma cuenta: cada uno deja su apunte.
      for (let i = 0; i < 12; i++) {
        await guardarEstrategiaAfiliacion(estrategia("grammarly", { comision: `${i}%` }), {
          pool: poolDePrueba(),
          usuario: "maria",
        });
      }
    });

    it("el total refleja TODAS las coincidencias, no solo la página pedida", async () => {
      const { eventos, total } = await getHistorialGlobal({ limite: 5 }, opciones());
      expect(eventos).toHaveLength(5);
      expect(total).toBeGreaterThan(5);
    });

    it("el desplazamiento avanza sin repetir ni saltarse apuntes", async () => {
      const primera = await getHistorialGlobal({ limite: 5, desplazamiento: 0 }, opciones());
      const segunda = await getHistorialGlobal({ limite: 5, desplazamiento: 5 }, opciones());

      const idsPrimera = primera.eventos.map((e) => e.id);
      const idsSegunda = segunda.eventos.map((e) => e.id);

      expect(idsPrimera.some((id) => idsSegunda.includes(id))).toBe(false);
      expect(new Set([...idsPrimera, ...idsSegunda]).size).toBe(idsPrimera.length + idsSegunda.length);
    });

    it("limita el tamaño de página aunque se pida un número desmesurado", async () => {
      const { eventos } = await getHistorialGlobal({ limite: 100000 }, opciones());
      expect(eventos.length).toBeLessThanOrEqual(200);
    });

    it("no se rompe con valores negativos o cero", async () => {
      await expect(getHistorialGlobal({ limite: 0, desplazamiento: -5 }, opciones())).resolves.toBeDefined();
    });
  });
});
