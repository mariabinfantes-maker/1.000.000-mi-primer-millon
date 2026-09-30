import { describe, expect, it } from "vitest";
import { recomendarHerramientas } from "../motor";
import { etiquetaDeEvidencia, type EstadoDeUnPar, type EstadoDeUnUso } from "../etiquetaEvidencia";
import type { FilaDeNecesidad } from "../necesidades";
import { construirHerramienta } from "./fixtures";
import type { PuertaDeEvidencia } from "../tipos";

/**
 * El uso concreto en el motor (2026-09-16, tercera ronda). Las puertas se
 * construyen a mano: aquí no se lee ninguna verificación.
 *
 * La fila de prueba es «servicio-reserva» de Ahorrar tiempo, que pide la
 * capacidad de reserva y, no imprescindible, el uso de reservar un servicio.
 * Para el caso imprescindible se usa una puerta cuya fila es la misma pero
 * se comprueba con una fila inventada, porque hoy ninguna fila lo es.
 */
const RESERVA = "cap.online_self_service_booking";
const USO = "uso.reserva_de_servicio";
const herramienta = (id: string) => construirHerramienta({ id, nombre: id, categoriaId: "crm", tipoProducto: "especializada" });
const catalogo = [herramienta("demuestra-uso"), herramienta("no-consta"), herramienta("no-lo-hace"), herramienta("sin-capacidad")];

function puerta(estados: Record<string, "demostrada" | "ausencia_demostrada" | "no_consta">, conUsos = true): PuertaDeEvidencia {
  return {
    filaDe: () => undefined,
    loDemuestra: (h, c) => c === RESERVA && h !== "sin-capacidad",
    ...(conUsos ? { estadoDeUso: (h: string, u: string) => (u === USO ? (estados[h] ?? "no_consta") : "no_consta") } : {}),
  };
}
const ESTADOS = { "demuestra-uso": "demostrada", "no-consta": "no_consta", "no-lo-hace": "ausencia_demostrada" } as const;
const perfil = { problemaIdsCandidatos: ["ahorrar-tiempo"] };
const ids = (r: { todas: { herramienta: { id: string } }[] }) => r.todas.map((e) => e.herramienta.id).sort();

describe("un uso NO imprescindible (la fila de servicios de hoy)", () => {
  it("pasan las que demuestran la capacidad, salvo la que consta que no hace el uso", () => {
    const r = recomendarHerramientas({ ...perfil, necesidadElegida: "servicio-reserva" }, catalogo, { evidencia: puerta(ESTADOS) });
    expect(ids(r)).toEqual(["demuestra-uso", "no-consta"]);
  });

  it("sin `estadoDeUso` en la puerta, se comporta exactamente como antes: sólo la capacidad", () => {
    const r = recomendarHerramientas({ ...perfil, necesidadElegida: "servicio-reserva" }, catalogo, { evidencia: puerta(ESTADOS, false) });
    expect(ids(r)).toEqual(["demuestra-uso", "no-consta", "no-lo-hace"]);
  });

  it("la fila hermana sin uso no mira los usos: la que consta que no hace el uso sigue pasando por reuniones", () => {
    const r = recomendarHerramientas({ ...perfil, necesidadElegida: "citas-reserva" }, catalogo, { evidencia: puerta(ESTADOS) });
    expect(ids(r)).toEqual(["demuestra-uso", "no-consta", "no-lo-hace"]);
  });
});

describe("un uso imprescindible", () => {
  // Hoy ninguna fila lo es; se comprueba la regla sobre la fila de servicios con la marca cambiada.
  const fila: FilaDeNecesidad = { id: "servicio-reserva", capacidades: [RESERVA], uso: { id: USO, imprescindible: true } };
  const estadoDe = (h: string): EstadoDeUnPar =>
    h === "sin-capacidad" ? { estado: "no_consta" } : { estado: "demostrada", profundidad: "nativa", fuente: { url: "https://ejemplo.test/p", fechaConsulta: "2026-09-16" } };

  it("sólo pasa quien lo ha DEMOSTRADO: no consta no basta", () => {
    // Se simula el filtro del motor sobre la fila: capacidad y después uso.
    const p = puerta(ESTADOS);
    const pasan = catalogo
      .filter((h) => fila.capacidades.some((c) => p.loDemuestra(h.id, c)))
      .filter((h) => p.estadoDeUso!(h.id, USO) === "demostrada")
      .map((h) => h.id);
    expect(pasan).toEqual(["demuestra-uso"]);
  });

  it("la etiqueta sólo lleva el uso cuando está demostrado, con su etiqueta en palabras y su fuente", () => {
    const usoDe = (h: string): EstadoDeUnUso =>
      h === "demuestra-uso"
        ? { estado: "demostrada", etiqueta: "reservar un servicio con su duración y su precio", nota: "Sólo desde el móvil.", fuente: { url: "https://ejemplo.test/u", fechaConsulta: "2026-09-16" } }
        : h === "no-lo-hace"
          ? { estado: "ausencia_demostrada", etiqueta: "reservar un servicio con su duración y su precio" }
          : { estado: "no_consta", etiqueta: "reservar un servicio con su duración y su precio" };
    const con = etiquetaDeEvidencia("demuestra-uso", fila, estadoDe, usoDe);
    expect(con).toMatchObject({
      tipo: "confirmada",
      uso: { id: USO, etiqueta: "reservar un servicio con su duración y su precio", anotado: "Sólo desde el móvil.", fuente: { url: "https://ejemplo.test/u", fecha: "2026-09-16" } },
    });
    for (const h of ["no-consta", "no-lo-hace"]) {
      const e = etiquetaDeEvidencia(h, fila, estadoDe, usoDe);
      expect(e?.tipo, h).toBe("confirmada");
      expect(e).not.toHaveProperty("uso");
    }
  });

  it("sin `usoDe`, o sin etiqueta en palabras, no viaja ningún uso: nunca se enseña un id", () => {
    expect(etiquetaDeEvidencia("demuestra-uso", fila, estadoDe)).not.toHaveProperty("uso");
    expect(etiquetaDeEvidencia("demuestra-uso", fila, estadoDe, () => ({ estado: "demostrada" }))).not.toHaveProperty("uso");
  });
});
