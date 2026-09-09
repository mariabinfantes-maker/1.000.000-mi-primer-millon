import { describe, expect, it } from "vitest";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { getPlan, getSelecciones } from "../repositorio";

/**
 * La selección congelada del lote 2: los seis subtipos de asistentes de IA.
 *
 * Igual que la del lote 1, no comprueba que sea la mejor selección posible
 * —eso es un juicio, y está escrito en el campo `criterio`—, sino que sigue
 * siendo la misma. Aquí el riesgo de que se mueva es mayor que en el lote 1:
 * la categoría junta seis productos que no se parecen, así que al verificar es
 * fácil convencerse de que a un limpiador de audio nunca tuvo sentido
 * preguntarle si redacta textos. Esa es exactamente la pregunta que hay que
 * hacer, y estas pruebas están para que nadie la borre.
 */
describe("la selección congelada del lote 2", () => {
  const lote2 = getPlan().lotes.find((l) => l.numero === 2)!;
  const selecciones = getSelecciones().filter((s) => s.lote === 2);
  const subtipos = new Map(getTodasLasHerramientas().map((h) => [h.id, h.subtipoId]));

  /** Las mismas doce del lote 1, para que los dos lotes se puedan comparar. */
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

  /**
   * Se pregunta a las dieciocho aunque no sea su especialidad: cualquiera de
   * estos productos podría tenerlo de verdad, y su ausencia dice algo.
   */
  const PUENTE = ["cap.text_generation", "cap.ai_task_agents"];

  /** Lo que el catálogo probablemente no cubre, y que nadie ha comprobado. */
  const SONDAS = ["cap.online_self_service_booking", "cap.customer_appointment_reminders"];

  const BLOQUES: Record<string, string[]> = {
    escritura: [
      "cap.text_generation",
      "cap.text_correction",
      "cap.translation",
      "cap.search_engine_optimization",
      "cap.brand_kit",
      "cap.document_templates",
    ],
    presentaciones: [
      "cap.presentation_building",
      "cap.graphic_design",
      "cap.brand_kit",
      "cap.document_templates",
      "cap.collaborative_document_editing",
    ],
    video: [
      "cap.video_editing",
      "cap.ai_video_generation",
      "cap.audio_editing",
      "cap.subtitles",
      "cap.audio_transcription",
      "cap.brand_kit",
    ],
    "reuniones-transcripcion": [
      "cap.audio_transcription",
      "cap.meeting_notes",
      "cap.audio_noise_removal",
      "cap.video_meetings",
      "cap.subtitles",
    ],
    "espacio-trabajo": [
      "cap.internal_knowledge_workspace",
      "cap.collaborative_document_editing",
      "cap.workspace_wide_search",
      "cap.document_version_history",
      "cap.file_storage",
      "cap.task_management",
      "cap.ai_task_agents",
    ],
    "agenda-planificacion": [
      "cap.personal_calendar_planning",
      "cap.automatic_rescheduling",
      "cap.task_management",
      "cap.team_workload_planning",
      "cap.time_tracking",
    ],
  };

  it("hay una selección por cada herramienta del lote, ni una más ni una menos", () => {
    expect(selecciones.map((s) => s.herramientaId).sort()).toEqual([...lote2.herramientaIds].sort());
  });

  it("ninguna herramienta aparece dos veces", () => {
    const ids = selecciones.map((s) => s.herramientaId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todas llevan el núcleo transversal completo, el mismo del lote 1", () => {
    for (const s of selecciones) {
      const faltan = NUCLEO.filter((c) => !s.capacidadIds.includes(c));
      expect(faltan, `${s.herramientaId} ha perdido del núcleo: ${faltan.join(", ")}`).toEqual([]);
    }
  });

  it("todas llevan el puente, también las que no son su especialidad", () => {
    for (const s of selecciones) {
      const faltan = PUENTE.filter((c) => !s.capacidadIds.includes(c));
      expect(
        faltan,
        `${s.herramientaId}: se ha quitado del puente ${faltan.join(", ")}. Que no sea su especialidad no es motivo: para eso está.`
      ).toEqual([]);
    }
  });

  it("todas conservan las dos sondas incómodas", () => {
    for (const s of selecciones) {
      const faltan = SONDAS.filter((c) => !s.capacidadIds.includes(c));
      expect(
        faltan,
        `${s.herramientaId}: se han quitado sondas (${faltan.join(", ")}). Si no aparecen en la fuente, el registro es "desconocido" o "descartado", no se borran de aquí.`
      ).toEqual([]);
    }
  });

  it("cada herramienta lleva el bloque de su subtipo, y ninguna capacidad de más", () => {
    for (const s of selecciones) {
      const subtipo = subtipos.get(s.herramientaId);
      const bloque = BLOQUES[subtipo ?? ""];
      expect(bloque, `${s.herramientaId}: subtipo "${subtipo}" sin bloque definido`).toBeDefined();
      const esperada = [...new Set([...NUCLEO, ...bloque, ...PUENTE, ...SONDAS])].sort();
      expect(
        [...s.capacidadIds].sort(),
        `${s.herramientaId} (${subtipo}) ya no coincide con su bloque congelado`
      ).toEqual(esperada);
    }
  });

  it("todas están fechadas el día en que se congelaron", () => {
    for (const s of selecciones) expect(s.fecha, s.herramientaId).toBe("2026-09-09");
  });

  it("el trabajo del lote 2 son 384 pares herramienta-capacidad", () => {
    const total = selecciones.reduce((n, s) => n + s.capacidadIds.length, 0);
    expect(total).toBe(384);
  });

  it("ninguna herramienta del lote 2 estaba ya en el lote 1", () => {
    const lote1 = new Set(getPlan().lotes[0].herramientaIds);
    expect(selecciones.filter((s) => lote1.has(s.herramientaId)).map((s) => s.herramientaId)).toEqual([]);
  });
});
