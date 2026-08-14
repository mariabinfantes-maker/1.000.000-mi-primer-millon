import { describe, expect, it } from "vitest";
import { priorizarCuentasPendientesDeSolicitud } from "../priorizador";
import type { Herramienta } from "@/data/esquema";
import type { CuentaAfiliado, EstrategiaAfiliacion } from "@/data/esquemaInterno";

function construirHerramienta(overrides: Partial<Herramienta> & Pick<Herramienta, "id" | "nombre">): Herramienta {
  return {
    paginaOficial: `https://ejemplo.test/${overrides.id}`,
    categoriaId: "plataformas-todo-en-uno",
    descripcion: "Herramienta de prueba.",
    problemasQueResuelve: [],
    casosDeUso: [],
    idealPara: "",
    segmentosIdeales: [],
    industriasIdeales: [],
    noRecomendadaPara: "",
    casosNoRecomendados: [],
    funcionesPrincipales: [],
    integraciones: [],
    integracionesPrincipales: [],
    curvaDeAprendizaje: "media",
    precioInicial: "Desde 10€/mes",
    modeloDePrecio: ["suscripcion_mensual"],
    tienePlanGratuito: false,
    idiomasDisponibles: ["español"],
    puntuaciones: { facilidadDeUso: 5, calidad: 5, fiabilidad: 5, atencionAlCliente: 5, escalabilidad: 5, nivelTecnicoRequerido: 5 },
    metodologiaValoracion: "Valoración editorial de Atlas.",
    ventajas: [],
    inconvenientes: [],
    estado: "activo",
    fechaAltaEnAtlas: "2026-01-01",
    fechaUltimaRevision: "2026-01-01",
    ...overrides,
  };
}

function construirCuenta(overrides: Partial<CuentaAfiliado> & Pick<CuentaAfiliado, "id" | "estado">): CuentaAfiliado {
  return { plataforma: "PartnerStack", enlaces: [], ultimaRevision: "2026-08-03", ...overrides };
}

describe("priorizarCuentasPendientesDeSolicitud", () => {
  it("devuelve [] si no hay ninguna estrategia", () => {
    expect(priorizarCuentasPendientesDeSolicitud([], [])).toEqual([]);
  });

  it("solo incluye cuentas en estado no_solicitado", () => {
    const estrategias: EstrategiaAfiliacion[] = [
      {
        herramientaId: "hubspot",
        cuentas: [
          construirCuenta({ id: "a", estado: "no_solicitado" }),
          construirCuenta({ id: "b", estado: "activo" }),
          construirCuenta({ id: "c", estado: "pendiente" }),
        ],
      },
    ];

    const resultado = priorizarCuentasPendientesDeSolicitud(estrategias, []);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].cuentaId).toBe("a");
  });

  it("ordena de mayor a menor Puntuación Atlas", () => {
    const herramientas = [
      construirHerramienta({
        id: "baja",
        nombre: "Baja",
        puntuaciones: { facilidadDeUso: 3, calidad: 3, fiabilidad: 3, atencionAlCliente: 3, escalabilidad: 3, nivelTecnicoRequerido: 3 },
      }),
      construirHerramienta({
        id: "alta",
        nombre: "Alta",
        puntuaciones: { facilidadDeUso: 9, calidad: 9, fiabilidad: 9, atencionAlCliente: 9, escalabilidad: 9, nivelTecnicoRequerido: 3 },
      }),
    ];
    const estrategias: EstrategiaAfiliacion[] = [
      { herramientaId: "baja", cuentas: [construirCuenta({ id: "a", estado: "no_solicitado" })] },
      { herramientaId: "alta", cuentas: [construirCuenta({ id: "b", estado: "no_solicitado" })] },
    ];

    const resultado = priorizarCuentasPendientesDeSolicitud(estrategias, herramientas);

    expect(resultado.map((c) => c.herramientaId)).toEqual(["alta", "baja"]);
  });

  it("incluye la comisión y el nombre del programa tal cual, sin transformarlos", () => {
    const estrategias: EstrategiaAfiliacion[] = [
      {
        herramientaId: "hubspot",
        cuentas: [construirCuenta({ id: "a", estado: "no_solicitado", comision: "40-50% lifetime", nombrePrograma: "HubSpot Partners" })],
      },
    ];

    const resultado = priorizarCuentasPendientesDeSolicitud(estrategias, []);

    expect(resultado[0].comision).toBe("40-50% lifetime");
    expect(resultado[0].nombrePrograma).toBe("HubSpot Partners");
  });

  it("usa el herramientaId como nombre y puntuacionAtlas null si la herramienta no está en el catálogo dado", () => {
    const estrategias: EstrategiaAfiliacion[] = [
      { herramientaId: "no-existe", cuentas: [construirCuenta({ id: "a", estado: "no_solicitado" })] },
    ];

    const resultado = priorizarCuentasPendientesDeSolicitud(estrategias, []);

    expect(resultado[0].nombreHerramienta).toBe("no-existe");
    expect(resultado[0].puntuacionAtlas).toBeNull();
  });

  it("coloca las herramientas sin puntuación calculable al final", () => {
    const herramientas = [
      construirHerramienta({
        id: "con-puntuacion",
        nombre: "Con Puntuación",
        puntuaciones: { facilidadDeUso: 8, calidad: 8, fiabilidad: 8, atencionAlCliente: 8, escalabilidad: 8, nivelTecnicoRequerido: 3 },
      }),
    ];
    const estrategias: EstrategiaAfiliacion[] = [
      { herramientaId: "sin-catalogo", cuentas: [construirCuenta({ id: "a", estado: "no_solicitado" })] },
      { herramientaId: "con-puntuacion", cuentas: [construirCuenta({ id: "b", estado: "no_solicitado" })] },
    ];

    const resultado = priorizarCuentasPendientesDeSolicitud(estrategias, herramientas);

    expect(resultado.map((c) => c.herramientaId)).toEqual(["con-puntuacion", "sin-catalogo"]);
  });
});
