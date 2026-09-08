import { describe, expect, it } from "vitest";
import { getTodasLasHerramientas } from "@/data/repositorio";
import type { RegistroVerificacion, SeleccionPlausible } from "../esquema";
import {
  capacidadIdsDelVocabulario,
  erroresDeRegistro,
  erroresDeSeleccion,
  erroresDeSustitucion,
  getSustituciones,
  esFecha,
  getRegistros,
  getSelecciones,
} from "../repositorio";

/**
 * Las reglas que la propietaria fijó al autorizar F2, convertidas en
 * comprobaciones. Ninguna se puede saltar «por esta vez»: si el validador las
 * acepta, entran datos malos y el motor los creerá en F3.
 *
 * Los datos reales todavía no existen —F2 se detuvo antes de verificar—, así
 * que el validador se ejercita con casos inventados. Es a propósito: vale más
 * que funcione el día que haga falta que estrenarlo ese mismo día.
 */
describe("los registros de verificación", () => {
  const herramientas = getTodasLasHerramientas().map((h) => h.id);
  const capacidades = capacidadIdsDelVocabulario();

  const valido: RegistroVerificacion = {
    herramientaId: "pipedrive",
    capacidadId: "cap.sales_pipeline",
    estado: "verificado",
    profundidad: "nativa",
    planMinimo: "Lite",
    fuentes: [
      { tipo: "pagina_oficial", url: "https://ejemplo.test/precios", fechaConsulta: "2026-09-03" },
    ],
    confianza: "alta",
    proximaRevision: "2027-02-01",
  };
  const e = (cambios: Partial<RegistroVerificacion>) =>
    erroresDeRegistro({ ...valido, ...cambios }, herramientas, capacidades).join(" | ");

  it("los registros que existan hoy son todos válidos", () => {
    const rotos = getRegistros().flatMap((r) => erroresDeRegistro(r, herramientas, capacidades));
    expect(rotos).toEqual([]);
  });

  it("acepta un registro bien hecho", () => {
    expect(e({})).toBe("");
  });

  describe("identidad", () => {
    it("rechaza una herramienta que no existe", () => {
      expect(e({ herramientaId: "inventada" })).toContain("la herramienta no existe");
    });
    it("rechaza una capacidad que no existe", () => {
      expect(e({ capacidadId: "cap.inventada" })).toContain("la capacidad no existe");
    });
  });

  describe("fuentes", () => {
    it("rechaza un registro sin ninguna fuente", () => {
      expect(e({ fuentes: [] })).toContain("no tiene ninguna fuente");
    });
    it("rechaza una URL que no lo es", () => {
      expect(
        e({ fuentes: [{ tipo: "pagina_oficial", url: "pipedrive.com", fechaConsulta: "2026-09-03" }] })
      ).toContain("URL inválida");
    });
    it("rechaza una fecha de consulta que no existe", () => {
      expect(
        e({
          fuentes: [
            { tipo: "pagina_oficial", url: "https://a.test/b", fechaConsulta: "2026-02-30" },
          ],
        })
      ).toContain("fechaConsulta inválida");
    });
    it("una fuente secundaria NUNCA sostiene confianza alta", () => {
      expect(
        e({
          fuentes: [
            { tipo: "fuente_secundaria", url: "https://blog.test/x", fechaConsulta: "2026-09-03" },
          ],
        })
      ).toContain("confianza alta sin ninguna fuente de primera mano");
    });
    it("pero sí sostiene confianza media", () => {
      expect(
        e({
          confianza: "media",
          fuentes: [
            { tipo: "fuente_secundaria", url: "https://blog.test/x", fechaConsulta: "2026-09-03" },
          ],
        })
      ).toBe("");
    });
    it("las cuatro fuentes de primera mano sí valen para confianza alta", () => {
      for (const tipo of ["pagina_oficial", "documentacion", "tarifa_oficial", "prueba_directa"] as const) {
        expect(
          e({ fuentes: [{ tipo, url: "https://a.test/b", fechaConsulta: "2026-09-03" }] }),
          tipo
        ).toBe("");
      }
    });
  });

  describe("«no está documentado» no es «no disponible»", () => {
    it("un desconocido no puede llevar profundidad", () => {
      expect(e({ estado: "desconocido", nota: "buscado en precios y ayuda" })).toContain(
        "no puede llevar profundidad"
      );
    });
    it("un desconocido tiene que explicar qué se buscó", () => {
      expect(e({ estado: "desconocido", profundidad: undefined, planMinimo: undefined })).toContain(
        "tiene que explicar por qué"
      );
    });
    it("un desconocido bien hecho se acepta", () => {
      expect(
        e({
          estado: "desconocido",
          profundidad: undefined,
          planMinimo: undefined,
          nota: "No aparece ni en la página de producto ni en la tabla de precios; no hay evidencia de que exista ni de que falte.",
          confianza: "baja",
        })
      ).toBe("");
    });
    it("un descartado también tiene que motivarse", () => {
      expect(e({ estado: "descartado", profundidad: undefined, planMinimo: undefined })).toContain(
        "tiene que explicar por qué"
      );
    });
  });

  describe("profundidad y plan", () => {
    it("verificado sin profundidad se rechaza", () => {
      expect(e({ profundidad: undefined })).toContain("verificado sin profundidad");
    });
    it("una integración tiene que decir con qué se integra", () => {
      expect(e({ profundidad: "integracion", planMinimo: undefined })).toContain(
        "tiene que decir con qué se integra"
      );
    });
    it("una integración bien declarada se acepta", () => {
      expect(e({ profundidad: "integracion", planMinimo: undefined, integraCon: "Zapier" })).toBe("");
    });
    it("nativa y módulo conservan el plan mínimo real", () => {
      for (const profundidad of ["nativa", "modulo"] as const) {
        expect(e({ profundidad, planMinimo: undefined }), profundidad).toContain(
          "falta el plan mínimo real"
        );
      }
    });
    it("una función sólo del plan caro conserva ESE plan, no el más barato", () => {
      expect(e({ planMinimo: "Ultimate" })).toBe("");
    });
    it("no disponible no puede llevar plan", () => {
      expect(e({ profundidad: "no_disponible", planMinimo: "Lite" })).toContain(
        "no disponible no puede tener plan"
      );
    });
  });

  describe("fechas de revisión", () => {
    it("rechaza una próxima revisión que no existe", () => {
      expect(e({ proximaRevision: "2027-02-30" })).toContain("proximaRevision inválida");
    });
    it("rechaza revisar antes de haber consultado", () => {
      expect(e({ proximaRevision: "2026-01-01" })).toContain("no puede ser anterior a la consulta");
    });
    it("lo que depende del plan se revisa a los 6 meses, no a los 12", () => {
      expect(e({ proximaRevision: "2027-09-03" })).toContain("más allá de 6 meses");
    });
    it("lo que no depende del plan admite 12", () => {
      expect(
        e({ profundidad: "integracion", planMinimo: undefined, integraCon: "Zapier", proximaRevision: "2027-08-01" })
      ).toBe("");
    });
    it("esFecha descarta el 30 de febrero y acierta con los bisiestos", () => {
      expect(esFecha("2024-02-29")).toBe(true);
      expect(esFecha("2025-02-29")).toBe(false);
      expect(esFecha("2026-02-30")).toBe(false);
      expect(esFecha("2026-9-3")).toBe(false);
    });
  });
});

describe("las selecciones de capacidades plausibles", () => {
  const herramientas = getTodasLasHerramientas().map((h) => h.id);
  const capacidades = capacidadIdsDelVocabulario();
  const valida: SeleccionPlausible = {
    herramientaId: "pipedrive",
    criterio: "CRM especializado: se comprueban las capacidades de clientes, presupuestos y datos.",
    capacidadIds: ["cap.sales_pipeline", "cap.customer_contact_records"],
    fecha: "2026-09-03",
    lote: 1,
  };
  const e = (cambios: Partial<SeleccionPlausible>) =>
    erroresDeSeleccion({ ...valida, ...cambios }, herramientas, capacidades).join(" | ");

  it("las selecciones que existan hoy son todas válidas", () => {
    const rotas = getSelecciones().flatMap((s) => erroresDeSeleccion(s, herramientas, capacidades));
    expect(rotas).toEqual([]);
  });

  it("acepta una selección bien hecha", () => {
    expect(e({})).toBe("");
  });

  it("exige criterio escrito: sin él, la lista se estrecha luego a conveniencia", () => {
    expect(e({ criterio: "  " })).toContain("sin criterio escrito");
  });

  it("rechaza una selección vacía", () => {
    expect(e({ capacidadIds: [] })).toContain("selección vacía");
  });

  it("rechaza capacidades repetidas", () => {
    expect(e({ capacidadIds: ["cap.sales_pipeline", "cap.sales_pipeline"] })).toContain(
      "capacidades repetidas"
    );
  });

  it("rechaza una capacidad inventada", () => {
    expect(e({ capacidadIds: ["cap.no_existe"] })).toContain('la capacidad "cap.no_existe" no existe');
  });

  it("rechaza una herramienta inventada", () => {
    expect(e({ herramientaId: "inventada" })).toContain("la herramienta no existe");
  });

  it("rechaza una fecha imposible", () => {
    expect(e({ fecha: "2026-02-30" })).toContain("fecha inválida");
  });
});

/**
 * Las direcciones del catálogo son datos de producto. Si la de una herramienta
 * lleva a otro sitio, eso es una incidencia del catálogo y la decide la
 * propietaria: no se arregla en silencio para que salga mejor una verificación.
 * Por eso una sustitución sin motivo escrito no vale.
 */
describe("las sustituciones de direcciones", () => {
  const herramientas = getTodasLasHerramientas().map((h) => h.id);
  const valida = {
    herramientaId: "insightly",
    urlPrecios: "https://www.insightly.com/pricing-plans/",
    motivo: "La dirección de la ficha redirige aquí, comprobado con la cadena HTTP.",
    fecha: "2026-09-07",
  };
  const e = (cambios: Record<string, unknown>) =>
    erroresDeSustitucion({ ...valida, ...cambios } as never, herramientas).join(" | ");

  it("las que existan hoy son válidas", () => {
    expect(getSustituciones().flatMap((s) => erroresDeSustitucion(s, herramientas))).toEqual([]);
  });

  it("acepta una sustitución bien hecha", () => {
    expect(e({})).toBe("");
  });

  it("rechaza una herramienta que no existe", () => {
    expect(e({ herramientaId: "inventada" })).toContain("la herramienta no existe");
  });

  it("rechaza una sustitución sin motivo escrito", () => {
    expect(e({ motivo: "   " })).toContain("sin motivo escrito");
  });

  it("rechaza una fecha inventada", () => {
    expect(e({ fecha: "2026-02-30" })).toContain("fecha inválida");
  });

  it("rechaza una sustitución que no sustituye nada", () => {
    expect(e({ urlPrecios: undefined, documentacion: [] })).toContain("no sustituye ni añade nada");
  });

  it("rechaza una dirección que no es una dirección", () => {
    expect(e({ urlPrecios: "insightly.com" })).toContain("URL inválida");
  });

  it("admite declarar documentación oficial", () => {
    expect(e({ urlPrecios: undefined, documentacion: ["https://support.insightly.com/planes"] })).toBe("");
  });

  /**
   * Cuando la portada de la ficha redirige, Gemini lee la dirección final y
   * cita la que se le pidió, y la afirmación cae por la regla de
   * redirecciones aunque la equivalencia sea real. Declararla aquí es lo que
   * la convierte en comprobada — y por eso se guardan las DOS direcciones: la
   * prueba de la equivalencia es el par, no la de destino sola.
   */
  describe("redirecciones de la portada", () => {
    const conPortada = (paginaOficial: unknown) =>
      e({ urlPrecios: undefined, paginaOficial });

    it("acepta una portada redirigida bien declarada", () => {
      expect(
        conPortada({ solicitada: "https://zenkit.com", resuelta: "https://zenkit.com/en/" })
      ).toBe("");
    });

    it("declarar sólo la portada ya es sustituir algo", () => {
      expect(
        conPortada({ solicitada: "https://zenkit.com", resuelta: "https://zenkit.com/en/" })
      ).not.toContain("no sustituye ni añade nada");
    });

    it("rechaza que falte la dirección que se pidió", () => {
      expect(conPortada({ solicitada: "", resuelta: "https://zenkit.com/en/" })).toContain(
        "no dice qué dirección se pidió"
      );
    });

    it("rechaza que falte la dirección a la que llevó", () => {
      expect(conPortada({ solicitada: "https://zenkit.com", resuelta: "" })).toContain(
        "no dice a dónde llevó"
      );
    });

    it("rechaza direcciones que no son direcciones", () => {
      expect(conPortada({ solicitada: "zenkit.com", resuelta: "https://zenkit.com/en/" })).toContain(
        "URL inválida"
      );
    });

    it("rechaza una redirección que no redirige: no habría nada que declarar", () => {
      expect(
        conPortada({ solicitada: "https://zenkit.com", resuelta: "https://zenkit.com" })
      ).toContain("no redirige a ninguna parte");
    });

    it("y la misma página escrita de otra forma tampoco es una redirección", () => {
      expect(
        conPortada({ solicitada: "https://zenkit.com", resuelta: "https://www.zenkit.com/" })
      ).toContain("no redirige a ninguna parte");
    });
  });
});
