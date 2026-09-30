import { describe, expect, it } from "vitest";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { getCapacidad } from "@/data/vocabulario/repositorio";
import type { RegistroDeIdioma, RegistroDeRecorrido, RegistroVerificacion } from "../esquema";
import {
  capacidadIdsDelVocabulario,
  erroresDeIdioma,
  erroresDeRecorrido,
  erroresDeRegistro,
  getIdiomas,
  getRecorridos,
  getRegistros,
} from "../repositorio";
import { RECORRIDOS, USOS, getUso, usosDeCapacidad } from "../usos";

/**
 * Los usos y los recorridos (2026-09-16, tercera ronda): la lista cerrada y
 * las reglas que impiden afirmar un uso sin la frase que lo demuestra.
 */
const herramientas = getTodasLasHerramientas().map((h) => h.id);
const capacidades = capacidadIdsDelVocabulario();
const fuente = { tipo: "pagina_oficial" as const, url: "https://ejemplo.test/funciones", fechaConsulta: "2026-09-16" };
const conCita = { ...fuente, cita: "Book a haircut with its own duration and price, online, any time." };

describe("la lista cerrada de usos y recorridos", () => {
  it("cada uso cuelga de una capacidad activa del vocabulario", () => {
    for (const u of USOS) {
      const c = getCapacidad(u.capacidadId);
      expect(c, u.id).toBeDefined();
      expect(c?.estado, u.id).toBe("activa");
    }
  });

  it("los ids son únicos, permanentes por forma, y con etiqueta y definición", () => {
    expect(new Set(USOS.map((u) => u.id)).size).toBe(USOS.length);
    expect(new Set(RECORRIDOS.map((r) => r.id)).size).toBe(RECORRIDOS.length);
    for (const u of USOS) {
      expect(u.id).toMatch(/^uso\.[a-z_]+$/);
      expect(u.etiqueta.trim().length).toBeGreaterThan(10);
      expect(u.definicion.trim().length).toBeGreaterThan(20);
    }
    for (const r of RECORRIDOS) expect(r.id).toMatch(/^rec\.[a-z_]+$/);
  });

  it("cada pieza de cada recorrido es «alguna de» capacidades activas, y hay al menos dos piezas", () => {
    for (const r of RECORRIDOS) {
      expect(r.piezas.length, r.id).toBeGreaterThanOrEqual(2);
      for (const pieza of r.piezas) {
        expect(pieza.length, r.id).toBeGreaterThan(0);
        for (const c of pieza) expect(getCapacidad(c)?.estado, `${r.id} → ${c}`).toBe("activa");
      }
    }
  });

  it("las etiquetas hablan como una persona, sin jerga", () => {
    for (const texto of [...USOS.map((u) => u.etiqueta), ...RECORRIDOS.map((r) => r.etiqueta)]) {
      expect(texto).not.toMatch(/cap\.|uso\.|rec\.|verificad|evidencia|registro/i);
    }
  });

  it("se pueden buscar por id y por capacidad", () => {
    expect(getUso("uso.reserva_de_servicio")?.capacidadId).toBe("cap.online_self_service_booking");
    expect(usosDeCapacidad("cap.customer_appointment_reminders").map((u) => u.id)).toContain("uso.recordatorio_por_whatsapp");
    expect(getUso("uso.inventado")).toBeUndefined();
  });
});

describe("los usos dentro de un registro", () => {
  const base: RegistroVerificacion = {
    herramientaId: "pipedrive",
    capacidadId: "cap.online_self_service_booking",
    estado: "verificado",
    profundidad: "nativa",
    planEstado: "desconocido",
    fuentes: [conCita],
    confianza: "alta",
    proximaRevision: "2027-06-01",
  };
  const e = (cambios: Partial<RegistroVerificacion>) => erroresDeRegistro({ ...base, ...cambios }, herramientas, capacidades).join(" | ");

  it("un registro sin usos sigue siendo válido: los 1.544 anteriores no cambian", () => {
    expect(e({})).toBe("");
  });

  it("acepta un uso demostrado con fuente de primera mano y cita", () => {
    expect(e({ usos: [{ usoId: "uso.reserva_de_servicio", estado: "demostrado", fuentes: [conCita] }] })).toBe("");
  });

  it("acepta un uso que no consta con nota y sin cita", () => {
    expect(e({ usos: [{ usoId: "uso.reserva_de_servicio", estado: "no_consta", fuentes: [fuente], nota: "Se buscó «servicio» y «duración» en funciones y tarifas." }] })).toBe("");
  });

  it("un uso demostrado sin cita no vale: lo concreto se demuestra con la frase", () => {
    expect(e({ usos: [{ usoId: "uso.reserva_de_servicio", estado: "demostrado", fuentes: [fuente] }] })).toContain("sin una fuente de primera mano con cita");
  });

  it("una reseña no sostiene un uso demostrado", () => {
    expect(e({ usos: [{ usoId: "uso.reserva_de_servicio", estado: "demostrado", fuentes: [{ ...conCita, tipo: "fuente_secundaria" }] }] })).toContain("sin una fuente de primera mano con cita");
  });

  it("«no lo hace» exige la misma cita que «demostrado»: no consta nunca se convierte en no lo hace", () => {
    expect(e({ usos: [{ usoId: "uso.reserva_de_servicio", estado: "no_lo_hace", fuentes: [fuente], nota: "no aparece" }] })).toContain("no_lo_hace sin una fuente de primera mano con cita");
    expect(e({ usos: [{ usoId: "uso.reserva_de_servicio", estado: "no_lo_hace", fuentes: [{ ...conCita, cita: "Only meetings and calls can be booked." }] }] })).toBe("");
  });

  it("un no consta sin nota, o con cita, no vale", () => {
    expect(e({ usos: [{ usoId: "uso.reserva_de_servicio", estado: "no_consta", fuentes: [fuente] }] })).toContain("tiene que decir qué se buscó");
    expect(e({ usos: [{ usoId: "uso.reserva_de_servicio", estado: "no_consta", fuentes: [conCita], nota: "x" }] })).toContain("no puede llevar cita");
  });

  it("el uso tiene que colgar de ESTA capacidad, existir y no repetirse", () => {
    expect(e({ usos: [{ usoId: "uso.pago_unico_y_a_plazos", estado: "demostrado", fuentes: [conCita] }] })).toContain("cuelga de cap.payment_collection, no de esta capacidad");
    expect(e({ usos: [{ usoId: "uso.inventado", estado: "demostrado", fuentes: [conCita] }] })).toContain('el uso "uso.inventado" no existe');
    expect(
      e({ usos: [{ usoId: "uso.reserva_de_servicio", estado: "demostrado", fuentes: [conCita] }, { usoId: "uso.reserva_de_servicio", estado: "demostrado", fuentes: [conCita] }] })
    ).toContain("está repetido");
  });

  it("sólo una capacidad verificada y disponible puede llevar usos", () => {
    const uso = { usoId: "uso.reserva_de_servicio", estado: "demostrado" as const, fuentes: [conCita] };
    expect(e({ estado: "desconocido", profundidad: undefined, planEstado: undefined, nota: "no está", usos: [uso] })).toContain("sólo una capacidad verificada y disponible puede llevar usos");
    expect(e({ profundidad: "no_disponible", planEstado: undefined, usos: [uso] })).toContain("sólo una capacidad verificada y disponible puede llevar usos");
  });

  it("un estado inventado no cuela", () => {
    expect(e({ usos: [{ usoId: "uso.reserva_de_servicio", estado: "quizas" as never, fuentes: [conCita] }] })).toContain("estado de uso \"quizas\" desconocido");
  });
});

describe("los recorridos", () => {
  const base: RegistroDeRecorrido = {
    herramientaId: "systeme-io",
    recorridoId: "rec.pagina_pago_y_acceso_al_curso",
    estado: "demostrado",
    planEstado: "verificado",
    planMinimo: "Free",
    fuentes: [{ tipo: "tarifa_oficial", url: "https://systeme.io/pricing", fechaConsulta: "2026-09-16", cita: "Free plan: 1 course, unlimited students, sell with payment links" }],
    limites: "1 curso en el plan gratuito",
    proximaRevision: "2027-03-01",
  };
  const e = (cambios: Partial<RegistroDeRecorrido>) => erroresDeRecorrido({ ...base, ...cambios }, herramientas).join(" | ");

  it("acepta uno bien hecho", () => expect(e({})).toBe(""));
  it("rechaza herramienta o recorrido inexistentes", () => {
    expect(e({ herramientaId: "nadie" })).toContain("la herramienta no existe");
    expect(e({ recorridoId: "rec.nada" })).toContain("el recorrido no existe");
  });
  it("demostrado exige cita de primera mano y decir qué se sabe del plan", () => {
    expect(e({ fuentes: [{ ...base.fuentes[0], cita: undefined }], planEstado: "desconocido", planMinimo: undefined })).toContain("demostrado sin una fuente de primera mano con cita");
    expect(e({ planEstado: undefined, planMinimo: undefined })).toContain("no dice si el plan está verificado o es desconocido");
  });
  it("el plan sólo se nombra si la cita lo nombra", () => {
    expect(e({ planMinimo: "Startup" })).toContain('ninguna cita nombra el plan "Startup"');
    expect(e({ planEstado: "desconocido" })).toContain("el plan es desconocido y aun así nombra");
    expect(e({ planEstado: "desconocido", planMinimo: undefined })).toBe("");
  });
  it("no consta: nota sí, cita y plan no", () => {
    expect(e({ estado: "no_consta", planEstado: undefined, planMinimo: undefined, fuentes: [{ ...base.fuentes[0], cita: undefined }], nota: "Se buscó en tarifas y funciones." })).toBe("");
    expect(e({ estado: "no_consta", planEstado: undefined, planMinimo: undefined, fuentes: [{ ...base.fuentes[0], cita: undefined }] })).toContain("tiene que decir qué se buscó");
    expect(e({ estado: "no_consta", fuentes: [{ ...base.fuentes[0], cita: undefined }], nota: "x" })).toContain("sólo un recorrido demostrado puede opinar sobre el plan");
  });
  it("la próxima revisión respeta los 6 meses cuando nombra plan", () => {
    expect(e({ proximaRevision: "2027-09-01" })).toContain("más allá de 6 meses");
    expect(e({ proximaRevision: "2026-09-16" })).toContain("no puede ser anterior a la consulta");
  });
});

describe("el idioma verificado", () => {
  const verificado = { estado: "verificado" as const, idiomas: ["es", "en"], fuentes: [{ ...conCita, cita: "Available in English and Spanish." }] };
  const desconocido = { estado: "desconocido" as const, fuentes: [fuente], nota: "Se buscó en la página de funciones y en la de tarifas." };
  const base: RegistroDeIdioma = { herramientaId: "pipedrive", interfaz: verificado, soporte: desconocido, proximaRevision: "2027-09-01" };
  const e = (cambios: Partial<RegistroDeIdioma>) => erroresDeIdioma({ ...base, ...cambios }, herramientas).join(" | ");

  it("acepta interfaz verificada y soporte desconocido: son dos certezas", () => expect(e({})).toBe(""));
  it("verificado exige códigos de idioma y cita", () => {
    expect(e({ interfaz: { ...verificado, idiomas: ["Español"] } })).toContain('"Español" no es un código de idioma');
    expect(e({ interfaz: { ...verificado, idiomas: [] } })).toContain("verificado sin ningún idioma");
    expect(e({ interfaz: { ...verificado, fuentes: [fuente] } })).toContain("sin una fuente de primera mano con cita");
  });
  it("desconocido exige nota y no puede nombrar idiomas", () => {
    expect(e({ soporte: { estado: "desconocido", fuentes: [fuente], nota: " " } })).toContain("tiene que decir qué se buscó");
    expect(e({ soporte: { estado: "desconocido", fuentes: [fuente], nota: "x", idiomas: ["es"] } as never })).toContain("no puede nombrar idiomas");
  });
  it("faltar una de las dos partes es un error", () => {
    expect(e({ soporte: undefined as never })).toContain("falta el soporte");
  });
});

describe("los archivos reales", () => {
  it("los recorridos e idiomas que existan hoy son válidos", () => {
    expect(getRecorridos().flatMap((r) => erroresDeRecorrido(r, herramientas))).toEqual([]);
    expect(getIdiomas().flatMap((r) => erroresDeIdioma(r, herramientas))).toEqual([]);
  });

  /**
   * El 2026-09-22 se comprobó el PRIMER uso de verdad: `uso.reserva_de_servicio`
   * en las ocho herramientas que demuestran reserva online. Las ocho salieron
   * `no_consta` — todas programan reuniones y llamadas, ninguna demuestra que
   * deje reservar un servicio con su duración y su precio.
   *
   * Antes esta prueba decía «ninguna lleva usos todavía». Que fallara fue la
   * señal de que el lote se había lanzado, no de que algo se hubiera roto.
   */
  it("los usos escritos son válidos y ninguno afirma más de lo que se leyó", () => {
    const conUsos = getRegistros().filter((r) => r.usos?.length);
    expect(conUsos.length).toBeGreaterThan(0);
    for (const r of conUsos) {
      for (const u of r.usos ?? []) {
        // `no_consta` obliga a decir qué se buscó, y no puede llevar cita.
        if (u.estado === "no_consta") {
          expect(u.nota, `${r.herramientaId}/${u.usoId}`).toBeTruthy();
          expect(u.fuentes.every((f) => f.cita === undefined)).toBe(true);
        }
        expect(u.fuentes.length).toBeGreaterThan(0);
      }
    }
  });

  it("de momento ningún uso está DEMOSTRADO en el catálogo, y se dice así", () => {
    const demostrados = getRegistros().flatMap((r) => (r.usos ?? []).filter((u) => u.estado === "demostrado"));
    expect(demostrados).toEqual([]);
  });
});
