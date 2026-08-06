import { describe, expect, it } from "vitest";
import { construirHerramienta } from "@/agents/atlas-advisor/__tests__/fixtures";
import type { AvisoFrescura } from "../frescura";
import { priorizarAvisosFrescura } from "../priorizacion";

describe("priorizarAvisosFrescura", () => {
  it("ordena los avisos de mayor a menor Puntuación Atlas", () => {
    const alta = construirHerramienta({
      id: "alta",
      nombre: "Alta",
      puntuaciones: { facilidadDeUso: 9, calidad: 9, fiabilidad: 9, atencionAlCliente: 9, escalabilidad: 9, nivelTecnicoRequerido: 5 },
    });
    const baja = construirHerramienta({
      id: "baja",
      nombre: "Baja",
      puntuaciones: { facilidadDeUso: 3, calidad: 3, fiabilidad: 3, atencionAlCliente: 3, escalabilidad: 3, nivelTecnicoRequerido: 5 },
    });

    const avisos: AvisoFrescura[] = [
      { herramientaId: "baja", dias: 200, mensaje: "..." },
      { herramientaId: "alta", dias: 200, mensaje: "..." },
    ];

    const resultado = priorizarAvisosFrescura(avisos, [alta, baja]);

    expect(resultado.map((r) => r.herramientaId)).toEqual(["alta", "baja"]);
    expect(resultado[0].nombreHerramienta).toBe("Alta");
    expect(resultado[0].puntuacionAtlas).toBeGreaterThan(resultado[1].puntuacionAtlas ?? 0);
  });

  it("usa el herramientaId como nombre de repuesto si la herramienta no se encuentra en el catálogo", () => {
    const avisos: AvisoFrescura[] = [{ herramientaId: "no-existe", dias: 200, mensaje: "..." }];

    const resultado = priorizarAvisosFrescura(avisos, []);

    expect(resultado[0].nombreHerramienta).toBe("no-existe");
    expect(resultado[0].puntuacionAtlas).toBeNull();
  });
});
