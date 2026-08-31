import { describe, expect, it } from "vitest";
import type { CuentaAfiliado } from "@/data/esquemaInterno";
import { calcularEstadoPanel, calcularProximaAccion } from "../proximaAccion";

function cuenta(parcial: Partial<CuentaAfiliado>): CuentaAfiliado {
  return {
    id: "principal",
    estado: "no_solicitado",
    plataforma: "PartnerStack",
    enlaces: [],
    ultimaRevision: "2026-08-01",
    ...parcial,
  };
}

describe("calcularEstadoPanel", () => {
  it("no_solicitado sin borrador → pendiente", () => {
    expect(calcularEstadoPanel(cuenta({ estado: "no_solicitado" }), "2026-08-25")).toBe("pendiente");
  });

  it("no_solicitado con borrador → preparada", () => {
    expect(calcularEstadoPanel(cuenta({ estado: "no_solicitado", borradorSolicitud: "..." }), "2026-08-25")).toBe("preparada");
  });

  it("pendiente reciente → enviada", () => {
    expect(calcularEstadoPanel(cuenta({ estado: "pendiente", ultimaRevision: "2026-08-20" }), "2026-08-25")).toBe("enviada");
  });

  it("pendiente estancada (≥60 días) → seguimiento", () => {
    expect(calcularEstadoPanel(cuenta({ estado: "pendiente", ultimaRevision: "2026-01-01" }), "2026-08-25")).toBe("seguimiento");
  });

  it("aprobado → aprobada", () => {
    expect(calcularEstadoPanel(cuenta({ estado: "aprobado" }), "2026-08-25")).toBe("aprobada");
  });

  it("activo → activa, y aprobado → aprobada: son estados distintos", () => {
    // Antes los dos se mostraban como "aprobada". Esa fusión ocultaba lo
    // único que decide si se cobra: `seleccionarEnlace.ts` solo usa los
    // enlaces de las cuentas en "activo".
    expect(calcularEstadoPanel(cuenta({ estado: "activo" }), "2026-08-25")).toBe("activa");
    expect(calcularEstadoPanel(cuenta({ estado: "aprobado" }), "2026-08-25")).toBe("aprobada");
  });

  it("rechazado → rechazada", () => {
    expect(calcularEstadoPanel(cuenta({ estado: "rechazado" }), "2026-08-25")).toBe("rechazada");
  });
});

describe("calcularProximaAccion", () => {
  it("pendiente sin requisitos → investigar requisitos", () => {
    expect(calcularProximaAccion(cuenta({ estado: "no_solicitado" }), "2026-08-25")).toBe(
      "Investigar los requisitos del programa"
    );
  });

  it("pendiente con requisitos ya documentados → preparar borrador", () => {
    expect(
      calcularProximaAccion(cuenta({ estado: "no_solicitado", requisitosPrograma: "Mínimo 10k visitas/mes" }), "2026-08-25")
    ).toBe("Preparar el borrador de solicitud");
  });

  it("preparada → revisar y enviar", () => {
    expect(calcularProximaAccion(cuenta({ estado: "no_solicitado", borradorSolicitud: "..." }), "2026-08-25")).toBe(
      "Revisar el borrador y enviar la solicitud"
    );
  });

  it("aprobada sin enlace → guardar el enlace", () => {
    expect(calcularProximaAccion(cuenta({ estado: "aprobado", enlaces: [] }), "2026-08-25")).toBe(
      "Guardar el enlace de afiliada conseguido"
    );
  });

  it("aprobada CON enlace todavía no cobra: la próxima acción es activarla", () => {
    const accion = calcularProximaAccion(
      cuenta({ estado: "aprobado", enlaces: [{ segmento: "global", url: "https://ejemplo.test" }] }),
      "2026-08-25"
    );
    expect(accion).toBe("Activar la cuenta — hasta entonces el enlace no se usa");
  });

  it("activa sin enlace se señala como el problema que es", () => {
    expect(calcularProximaAccion(cuenta({ estado: "activo", enlaces: [] }), "2026-08-25")).toBe(
      "Activa SIN enlace: no puede generar comisión"
    );
  });

  it("aprobada con enlace y verificación pendiente → verificar antes de monetizar", () => {
    expect(
      calcularProximaAccion(
        cuenta({ estado: "aprobado", enlaces: [{ segmento: "global", url: "https://x.com" }], verificacionPendiente: true }),
        "2026-08-25"
      )
    ).toBe("Verificar comisión/plataforma antes de darla por lista para monetizar");
  });

  it("aprobada con enlace y sin verificación pendiente → ninguna acción", () => {
    expect(
      calcularProximaAccion(cuenta({ estado: "activo", enlaces: [{ segmento: "global", url: "https://x.com" }] }), "2026-08-25")
    ).toBe("Ninguna — cuenta activa y con enlace");
  });

  it("rechazada → ninguna acción", () => {
    expect(calcularProximaAccion(cuenta({ estado: "rechazado" }), "2026-08-25")).toBe("Ninguna — programa rechazado");
  });
});
