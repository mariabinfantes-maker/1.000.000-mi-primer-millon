import { describe, expect, it } from "vitest";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { getPlan, getSelecciones } from "../repositorio";

/**
 * La selección congelada del lote 1.
 *
 * No comprueba que sea la mejor selección posible —eso es un juicio, y está
 * escrito en el campo `criterio`—, sino que sigue siendo la misma. La razón
 * está en el esquema: al verificar, la tentación es quitar de la lista lo que
 * no aparece en la fuente, y entonces el resultado sale perfecto porque se ha
 * borrado la pregunta incómoda en vez de responderla.
 *
 * Las tres sondas de cada categoría existen precisamente para eso. Si alguien
 * las quita, esta prueba lo dice.
 */
describe("la selección congelada del lote 1", () => {
  const lote1 = getPlan().lotes.find((l) => l.numero === 1)!;
  const selecciones = getSelecciones().filter((s) => s.lote === 1);
  const categorias = new Map(getTodasLasHerramientas().map((h) => [h.id, h.categoriaId]));

  const NUCLEO = [
    "cap.workflow_automation",
    "cap.app_integrations",
    "cap.public_api",
    "cap.webhooks",
    "cap.dashboards",
    "cap.custom_reports",
    "cap.data_export",
    "cap.data_import_and_migration",
    "cap.roles_and_permissions",
    "cap.single_sign_on",
    "cap.two_factor_authentication",
    "cap.audit_log",
  ];

  /** Lo que el motor da hoy por bueno sin haberlo comprobado nunca. */
  const SONDAS: Record<string, string[]> = {
    crm: [
      "cap.online_self_service_booking",
      "cap.customer_appointment_reminders",
      "cap.invoicing",
    ],
    "gestion-proyectos": ["cap.work_orders", "cap.online_self_service_booking"],
  };

  it("hay una selección por cada herramienta del lote, ni una más ni una menos", () => {
    expect(selecciones.map((s) => s.herramientaId).sort()).toEqual([...lote1.herramientaIds].sort());
  });

  it("ninguna herramienta aparece dos veces", () => {
    const ids = selecciones.map((s) => s.herramientaId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todas llevan el núcleo transversal completo", () => {
    for (const s of selecciones) {
      const faltan = NUCLEO.filter((c) => !s.capacidadIds.includes(c));
      expect(faltan, `${s.herramientaId} ha perdido del núcleo: ${faltan.join(", ")}`).toEqual([]);
    }
  });

  it("todas conservan las sondas incómodas de su categoría", () => {
    for (const s of selecciones) {
      const categoria = categorias.get(s.herramientaId);
      const sondas = SONDAS[categoria ?? ""] ?? [];
      expect(sondas.length, `${s.herramientaId}: categoría "${categoria}" sin sondas definidas`).toBeGreaterThan(0);
      const faltan = sondas.filter((c) => !s.capacidadIds.includes(c));
      expect(
        faltan,
        `${s.herramientaId}: se han quitado sondas (${faltan.join(", ")}). Si no aparecen en la fuente, el registro es "desconocido" o "descartado", no se borran de aquí.`
      ).toEqual([]);
    }
  });

  it("todas están fechadas el día en que se congelaron", () => {
    for (const s of selecciones) expect(s.fecha, s.herramientaId).toBe("2026-09-07");
  });

  it("el trabajo del lote 1 son 765 pares herramienta-capacidad", () => {
    const total = selecciones.reduce((n, s) => n + s.capacidadIds.length, 0);
    expect(total).toBe(765);
  });
});
