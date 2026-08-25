import { describe, expect, it } from "vitest";
import type { EstrategiaAfiliacion } from "@/data/esquemaInterno";
import { aplicarLoteEstrategia, type EntradaLoteEstrategia } from "../lote";

function crearAlmacenFalso(inicial: EstrategiaAfiliacion[] = []) {
  const almacen = new Map(inicial.map((e) => [e.herramientaId, e]));
  return {
    obtener: (id: string) => almacen.get(id),
    guardar: (estrategia: EstrategiaAfiliacion) => almacen.set(estrategia.herramientaId, estrategia),
    almacen,
  };
}

describe("aplicarLoteEstrategia", () => {
  it("aplica varias filas independientes, cada una a su propia herramienta", () => {
    const { obtener, guardar, almacen } = crearAlmacenFalso();
    const entradas: EntradaLoteEstrategia[] = [
      { id: "hubspot", plataforma: "PartnerStack", estado: "no_solicitado" },
      { id: "asana", plataforma: "Impact", estado: "pendiente", fechaSolicitud: "2026-08-25" },
    ];

    const resultados = aplicarLoteEstrategia(entradas, obtener, guardar, "2026-08-25");

    expect(resultados).toHaveLength(2);
    expect(resultados.every((r) => r.ok)).toBe(true);
    expect(almacen.get("hubspot")?.cuentas[0].estado).toBe("no_solicitado");
    expect(almacen.get("asana")?.cuentas[0].estado).toBe("pendiente");
  });

  it("un error en una fila no aborta el resto del lote", () => {
    const { obtener, guardar, almacen } = crearAlmacenFalso();
    const entradas: EntradaLoteEstrategia[] = [
      { id: "hubspot", estado: "no_es_un_estado_valido" },
      { id: "asana", estado: "pendiente" },
    ];

    const resultados = aplicarLoteEstrategia(entradas, obtener, guardar, "2026-08-25");

    expect(resultados[0].ok).toBe(false);
    expect(resultados[1].ok).toBe(true);
    expect(almacen.has("hubspot")).toBe(false);
    expect(almacen.get("asana")?.cuentas[0].estado).toBe("pendiente");
  });

  it("reporta error legible si falta el id en una fila", () => {
    const { obtener, guardar } = crearAlmacenFalso();
    const resultados = aplicarLoteEstrategia([{ id: "" }], obtener, guardar, "2026-08-25");

    expect(resultados[0].ok).toBe(false);
    if (!resultados[0].ok) {
      expect(resultados[0].error).toContain("Falta 'id'");
    }
  });

  it("actualiza una cuenta ya existente conservando los campos no indicados, igual que el CLI de una cuenta", () => {
    const existente: EstrategiaAfiliacion = {
      herramientaId: "hubspot",
      cuentas: [
        {
          id: "partnerstack",
          estado: "pendiente",
          plataforma: "PartnerStack",
          comision: "20% recurrente",
          enlaces: [],
          ultimaRevision: "2026-08-01",
        },
      ],
    };
    const { obtener, guardar, almacen } = crearAlmacenFalso([existente]);

    const resultados = aplicarLoteEstrategia(
      [{ id: "hubspot", cuenta: "partnerstack", estado: "aprobado", fechaAprobacion: "2026-08-25" }],
      obtener,
      guardar,
      "2026-08-25"
    );

    expect(resultados[0].ok).toBe(true);
    const cuenta = almacen.get("hubspot")!.cuentas[0];
    expect(cuenta.estado).toBe("aprobado");
    expect(cuenta.fechaAprobacion).toBe("2026-08-25");
    expect(cuenta.comision).toBe("20% recurrente");
  });

  it("aplica requisitos y borrador desde una fila del lote", () => {
    const { obtener, guardar, almacen } = crearAlmacenFalso();

    aplicarLoteEstrategia(
      [
        {
          id: "hubspot",
          plataforma: "PartnerStack",
          requisitos: "Mínimo 10k visitas/mes",
          borrador: "Estimado equipo de PartnerStack...",
        },
      ],
      obtener,
      guardar,
      "2026-08-25"
    );

    const cuenta = almacen.get("hubspot")!.cuentas[0];
    expect(cuenta.requisitosPrograma).toBe("Mínimo 10k visitas/mes");
    expect(cuenta.borradorSolicitud).toBe("Estimado equipo de PartnerStack...");
  });
});
