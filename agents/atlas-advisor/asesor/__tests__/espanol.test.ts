import { describe, expect, it } from "vitest";
import { getHerramienta } from "@/data/repositorio";
import {
  ORDEN_DEL_ESPANOL,
  avisoDelEspanol,
  espanolDe,
  espanolDeLaPaginaDeCliente,
  espanolDelPanel,
} from "../espanol";
import type { Herramienta } from "@/data/esquema";

const como = (p: Partial<Herramienta>) => p as Herramienta;

describe("el español tiene tres estados, no dos", () => {
  it("«no lo hemos mirado» no es «no lo tiene»", () => {
    expect(espanolDelPanel(como({}))).toBe("sin_confirmar");
    expect(espanolDelPanel(como({ disponibleEnEspanol: false }))).toBe("no_disponible");
    expect(espanolDelPanel(como({ disponibleEnEspanol: true }))).toBe("confirmado");
  });

  it("el recibo partido manda sobre el booleano de siempre", () => {
    const h = como({
      disponibleEnEspanol: true,
      idiomaComprobado: {
        panel: { hayEspanol: false, idiomas: ["en"], url: "https://x/y", cita: "English only", fecha: "2026-09-29" },
      },
    });
    expect(espanolDelPanel(h)).toBe("no_disponible");
  });

  /**
   * La regla que obligó a partir el campo: una pantalla NO demuestra la otra.
   * Ni el panel en español demuestra que la página de reservas lo esté, ni al
   * revés. Sin recibo propio, la página del cliente está sin confirmar aunque
   * el panel esté confirmadísimo.
   */
  it("la página del cliente no se hereda del panel", () => {
    expect(espanolDeLaPaginaDeCliente(como({ disponibleEnEspanol: true }))).toBe("sin_confirmar");
  });

  it("ordena confirmado, sin confirmar y no disponible, en ese orden", () => {
    expect(ORDEN_DEL_ESPANOL.confirmado).toBeLessThan(ORDEN_DEL_ESPANOL.sin_confirmar);
    expect(ORDEN_DEL_ESPANOL.sin_confirmar).toBeLessThan(ORDEN_DEL_ESPANOL.no_disponible);
  });

  it("de la confirmada no hay nada que advertir; de las otras dos sí, y distinto", () => {
    expect(avisoDelEspanol({ panel: "confirmado", paginaDeCliente: "sin_confirmar" })).toBeUndefined();
    expect(avisoDelEspanol({ panel: "sin_confirmar", paginaDeCliente: "sin_confirmar" })).toMatch(/no hemos confirmado/i);
    expect(avisoDelEspanol({ panel: "no_disponible", paginaDeCliente: "sin_confirmar" })).toMatch(/no está en español/i);
    expect(avisoDelEspanol({ panel: "no_disponible", paginaDeCliente: "confirmado" })).toMatch(/tus clientes sí/i);
  });
});

describe("los dos casos reales del catálogo que obligaron a esto", () => {
  /**
   * Koibox caía en el paso 2 de 5 del desempate por no tener el booleano
   * puesto, teniendo su propio soporte el selector de idiomas publicado.
   */
  it("Koibox: el panel está confirmado en español, con su cita", () => {
    const h = getHerramienta("koibox");
    expect(espanolDelPanel(h)).toBe("confirmado");
    expect(h?.idiomaComprobado?.panel?.cita).toContain("Español");
  });

  /**
   * Schedulista es el caso que un solo booleano no sabe contar: `true`
   * mentiría sobre el panel y `false` mentiría sobre la página de reservas.
   */
  it("Schedulista: el panel no está en español, y de su página de reservas no nos consta", () => {
    const h = getHerramienta("schedulista");
    expect(espanolDelPanel(h)).toBe("no_disponible");
    expect(espanolDeLaPaginaDeCliente(h)).toBe("sin_confirmar");
    expect(espanolDe(h)).toEqual({ panel: "no_disponible", paginaDeCliente: "sin_confirmar" });
  });
});
