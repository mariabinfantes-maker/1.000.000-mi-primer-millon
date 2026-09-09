import { describe, expect, it } from "vitest";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { getPlan, getSelecciones } from "../repositorio";

/**
 * La selección congelada del lote 3: las catorce suites.
 *
 * Aquí la lista no la decide una categoría ni un subtipo, porque «plataforma
 * todo en uno» no describe ninguna función: decir que una suite es una suite no
 * dice qué comprobar. La decide `modulosIncluidos` de cada ficha —lo que la
 * herramienta DICE tener—, y eso sólo elige la pregunta: no demuestra nada. Si
 * al mirar la fuente oficial el módulo declarado no aparece, el par queda
 * «desconocido» como cualquier otro.
 *
 * Estas pruebas existen para que esa correspondencia no se afloje al verificar,
 * que es cuando aprieta.
 */
describe("la selección congelada del lote 3", () => {
  const lote3 = getPlan().lotes.find((l) => l.numero === 3)!;
  const selecciones = getSelecciones().filter((s) => s.lote === 3);
  const fichas = new Map(getTodasLasHerramientas().map((h) => [h.id, h]));

  /** Las mismas doce de los lotes 1 y 2, para poder comparar los tres. */
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
   * Las mismas dos de los lotes 1 y 2. Sirven para que la misma pregunta llegue
   * a las 62 fichas, no para evaluar la vertical de citas: son dos capacidades
   * de las nueve de su dominio.
   */
  const SONDAS = ["cap.online_self_service_booking", "cap.customer_appointment_reminders"];

  const POR_MODULO: Record<string, string[]> = {
    crm: [
      "cap.customer_contact_records",
      "cap.customer_interaction_history",
      "cap.sales_pipeline",
      "cap.lead_capture",
    ],
    email_marketing: ["cap.email_campaigns", "cap.marketing_automation"],
    embudos_de_venta: ["cap.conversion_funnels", "cap.landing_pages"],
    facturacion: ["cap.invoicing", "cap.payment_collection"],
    gestion_proyectos: ["cap.task_management", "cap.project_planning", "cap.time_tracking"],
    atencion_cliente: ["cap.shared_inbox", "cap.client_portal"],
    comercio_electronico: ["cap.online_store", "cap.payment_collection"],
    creador_de_sitios_web: ["cap.website_builder"],
    asistente_ia: ["cap.text_generation", "cap.ai_task_agents"],
    recursos_humanos: ["cap.time_and_attendance"],
  };

  it("hay una selección por cada suite del lote, ni una más ni una menos", () => {
    expect(selecciones.map((s) => s.herramientaId).sort()).toEqual([...lote3.herramientaIds].sort());
  });

  it("ninguna herramienta aparece dos veces", () => {
    const ids = selecciones.map((s) => s.herramientaId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("las catorce son suites: el lote 3 no recoge especializadas", () => {
    for (const s of selecciones) {
      expect(fichas.get(s.herramientaId)?.tipoProducto, s.herramientaId).toBe("suite");
    }
  });

  it("todas llevan el núcleo transversal completo, el mismo de los lotes 1 y 2", () => {
    for (const s of selecciones) {
      const faltan = NUCLEO.filter((c) => !s.capacidadIds.includes(c));
      expect(faltan, `${s.herramientaId} ha perdido del núcleo: ${faltan.join(", ")}`).toEqual([]);
    }
  });

  it("todas conservan las dos sondas incómodas", () => {
    for (const s of selecciones) {
      const faltan = SONDAS.filter((c) => !s.capacidadIds.includes(c));
      expect(
        faltan,
        `${s.herramientaId}: se han quitado sondas (${faltan.join(", ")}). Si no aparecen en la fuente, la capacidad queda "desconocida"; cualquier afirmación que incumpla las reglas puede quedar descartada por el validador. No se borran de aquí.`
      ).toEqual([]);
    }
  });

  /**
   * El corazón del lote 3: lo que se pregunta sale de los módulos que la ficha
   * declara, ni uno más ni uno menos. Si mañana alguien quita un módulo de la
   * ficha o una capacidad de la selección, esto lo dice.
   */
  it("cada suite lleva exactamente los bloques de los módulos que declara su ficha", () => {
    for (const s of selecciones) {
      const modulos = fichas.get(s.herramientaId)?.modulosIncluidos ?? [];
      expect(modulos.length, `${s.herramientaId} no declara módulos`).toBeGreaterThan(0);
      const sinBloque = modulos.filter((m) => !POR_MODULO[m]);
      expect(sinBloque, `${s.herramientaId}: módulos sin bloque definido`).toEqual([]);
      const esperada = [
        ...new Set([...NUCLEO, ...modulos.flatMap((m) => POR_MODULO[m]), ...SONDAS]),
      ].sort();
      expect(
        [...s.capacidadIds].sort(),
        `${s.herramientaId} ya no coincide con los módulos que declara`
      ).toEqual(esperada);
    }
  });

  it("ninguna selección repite una capacidad", () => {
    for (const s of selecciones) {
      expect(new Set(s.capacidadIds).size, s.herramientaId).toBe(s.capacidadIds.length);
    }
  });

  it("todas están fechadas el día en que se congelaron", () => {
    for (const s of selecciones) expect(s.fecha, s.herramientaId).toBe("2026-09-09");
  });

  it("el trabajo del lote 3 son 395 pares herramienta-capacidad", () => {
    const total = selecciones.reduce((n, s) => n + s.capacidadIds.length, 0);
    expect(total).toBe(395);
  });

  it("ninguna suite del lote 3 estaba ya en los lotes 1 o 2", () => {
    const previos = new Set([...getPlan().lotes[0].herramientaIds, ...getPlan().lotes[1].herramientaIds]);
    expect(selecciones.filter((s) => previos.has(s.herramientaId)).map((s) => s.herramientaId)).toEqual([]);
  });

  it("con los tres lotes, las 62 fichas del catálogo quedan incluidas", () => {
    const enLotes = new Set(getPlan().lotes.flatMap((l) => l.herramientaIds));
    expect(enLotes.size).toBe(getTodasLasHerramientas().length);
    const conSeleccion = new Set(getSelecciones().map((s) => s.herramientaId));
    expect([...enLotes].filter((id) => !conSeleccion.has(id))).toEqual([]);
  });
});
