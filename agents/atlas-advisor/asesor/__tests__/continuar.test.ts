import { describe, expect, it } from "vitest";
import { aconsejar } from "../aconsejar";
import { conLaRespuesta, necesidadesDeLaLista } from "../caso";
import { leerComprension } from "../entender";
import {
  casoDe,
  conUnaRespuesta,
  continuar,
  describirCambios,
  estadoDesde,
  estadoLimpio,
  hayCambios,
  leerContinuacion,
  preguntasContestadas,
  type EstadoDelCaso,
} from "../continuar";
import { getNecesidades } from "@/data/vocabulario/necesidades";
import { getDimensiones } from "@/data/vocabulario/asesor";

/**
 * LA CONVERSACIÓN SIGUE DENTRO DEL CASO.
 *
 * Propietaria, 2026-09-30: «cada nuevo mensaje del usuario debe interpretarse
 * dentro del caso que Molnip ya conoce, no como una consulta nueva». Y tres
 * comportamientos como mínimo: añadir, corregir y no entendido, más «Te
 * explico cómo lo hacemos» por el mismo camino.
 *
 * El modelo que lee el texto se sustituye aquí por respuestas fijas: lo que se
 * prueba es qué hace Molnip con lo que el modelo devuelve, que es lo que tiene
 * que ser determinista. El recorrido con el modelo real se comprobó aparte, en
 * el navegador.
 */

const CITAS = "dim.como-se-asignan-las-citas";
const RESERVAS = "nec.que-reserven-solos";
const FACTURAS = "nec.emitir-una-factura-legal";
const AGENDA = "nec.mi-agenda";
const WHATSAPP = "nec.responder-por-donde-escriban";

/** Un lector que devuelve siempre lo mismo, y apunta lo que se le preguntó. */
function lectorFijo(salida: unknown) {
  const prompts: string[] = [];
  const leer = async (prompt: string) => {
    prompts.push(prompt);
    return salida;
  };
  return { leer, prompts };
}

const nombreDe = (k: ReturnType<typeof aconsejar>) => k.loQueHaria?.piezas.map((p) => p.nombre).join(" + ") ?? null;
const ids = (e: EstadoDelCaso) => casoDe(e).map((n) => n.necesidad.id).sort();

/** La clínica dental, hasta «empezaría por Koibox», tal como la recorre la página. */
function laClinicaHastaKoibox() {
  const texto = "Somos una clínica dental. Perdemos pacientes porque no cogemos el teléfono y llevamos las facturas a mano";
  const comprension = leerComprension(texto, {
    necesidades: [
      { id: RESERVAS, porQue: "no cogemos el teléfono" },
      { id: FACTURAS, porQue: "llevamos las facturas a mano" },
    ],
    circunstancias: ["clínica dental"],
  });
  const inicio = estadoDesde(comprension.necesidades, comprension.circunstancias);
  const trasElBoton = conUnaRespuesta(inicio, { dimensionId: CITAS, respuestaId: "elige-el-cliente" });
  return { inicio, trasElBoton };
}

describe("el recorrido de la clínica dental, mensaje a mensaje", () => {
  it("reservas y facturas, y el paciente elige profesional: Koibox", () => {
    const { trasElBoton } = laClinicaHastaKoibox();
    expect(ids(trasElBoton)).toEqual([AGENDA, FACTURAS, RESERVAS].sort());
    expect(nombreDe(aconsejar(casoDe(trasElBoton)))).toBe("Koibox");
  });

  it("«También necesito WhatsApp»: se conserva todo el caso y se añade WhatsApp", async () => {
    const { trasElBoton } = laClinicaHastaKoibox();
    const { leer, prompts } = lectorFijo({ anade: [{ id: WHATSAPP, porQue: "necesito WhatsApp" }] });
    const c = await continuar("También necesito WhatsApp", trasElBoton, leer);

    expect(c.cambios.anadidas).toEqual([WHATSAPP]);
    expect(ids(c.estado)).toEqual([AGENDA, FACTURAS, RESERVAS, WHATSAPP].sort());
    // La respuesta de antes sigue ahí, tal cual, y no se vuelve a preguntar.
    expect(c.estado.respuestas).toEqual([{ dimensionId: CITAS, respuestaId: "elige-el-cliente" }]);
    expect(c.estado.circunstancias).toEqual(["clínica dental"]);
    // El modelo leyó el mensaje SABIENDO el caso: no fue una consulta nueva.
    expect(prompts[0]).toContain(`[${RESERVAS}]`);
    expect(prompts[0]).toContain("«El paciente elige profesional»");
    expect(describirCambios(c.cambios)).toEqual(["Añado «responder por donde me escriban sin perder a nadie»."]);
  });

  it("«No, las citas las asignamos nosotros»: se sustituye la respuesta y se va lo que ella trajo", async () => {
    const { trasElBoton } = laClinicaHastaKoibox();
    const conWhatsapp = (await continuar("También necesito WhatsApp", trasElBoton, lectorFijo({ anade: [{ id: WHATSAPP, porQue: "WhatsApp" }] }).leer)).estado;
    const { leer } = lectorFijo({
      respuestas: [{ dimensionId: CITAS, respuestaId: "lo-asignamos", porQue: "las citas las asignamos nosotros" }],
    });
    const c = await continuar("No, las citas las asignamos nosotros.", conWhatsapp, leer);

    // Una sola respuesta para esa pregunta: la nueva. Nunca dos contradictorias.
    expect(c.estado.respuestas.filter((r) => r.dimensionId === CITAS)).toEqual([{ dimensionId: CITAS, respuestaId: "lo-asignamos" }]);
    // La agenda la había traído «el paciente elige»; al cambiarla, se va. Lo demás se queda.
    expect(ids(c.estado)).toEqual([FACTURAS, RESERVAS, WHATSAPP].sort());
    expect(describirCambios(c.cambios)).toEqual([
      "Cambio lo que me dijiste: ahora «lo asignamos nosotros», en vez de «el paciente elige profesional».",
    ]);
  });

  it("un mensaje que no se entiende deja el caso y el consejo exactamente como estaban", async () => {
    const { trasElBoton } = laClinicaHastaKoibox();
    const antes = aconsejar(casoDe(trasElBoton));
    for (const salida of [{ noEntendido: ["lo del tema ese"] }, {}, null, "no es JSON", { anade: [{ id: "nec.no-existe", porQue: "tema" }] }]) {
      const c = await continuar("Oye, y lo del tema ese", trasElBoton, lectorFijo(salida).leer);
      expect(hayCambios(c.cambios)).toBe(false);
      expect(c.estado).toEqual(trasElBoton);
      expect(aconsejar(casoDe(c.estado))).toEqual(antes);
      expect(c.noEntendido.length).toBeGreaterThan(0);
    }
  });

  it("si el modelo falla, tampoco se toca nada", async () => {
    const { trasElBoton } = laClinicaHastaKoibox();
    const c = await continuar("También WhatsApp", trasElBoton, async () => {
      throw new Error("sin red");
    });
    expect(c.estado).toEqual(trasElBoton);
    expect(c.noEntendido).toEqual(["También WhatsApp"]);
  });

  it("«Te explico cómo lo hacemos» y lo explica: entra por el mismo camino y contesta la pregunta", async () => {
    const { inicio } = laClinicaHastaKoibox();
    const explicacion = "Cada paciente escoge con qué dentista quiere ir";
    const { leer, prompts } = lectorFijo({
      respuestas: [{ dimensionId: CITAS, respuestaId: "elige-el-cliente", porQue: explicacion }],
    });
    const c = await continuar(explicacion, inicio, leer, CITAS);

    expect(prompts[0]).toContain("te va a explicar esto con sus palabras");
    expect(c.estado.respuestas).toEqual([{ dimensionId: CITAS, respuestaId: "elige-el-cliente" }]);
    expect(ids(c.estado)).toEqual([AGENDA, FACTURAS, RESERVAS].sort());
    expect(nombreDe(aconsejar(casoDe(c.estado)))).toBe("Koibox");
  });

  it("si la explicación no contesta la pregunta, queda como «te lo explico» y no se vuelve a preguntar", async () => {
    const { inicio } = laClinicaHastaKoibox();
    const c = await continuar("Pues depende del día, la verdad", inicio, lectorFijo({ noEntendido: ["depende del día"] }).leer, CITAS);
    expect(hayCambios(c.cambios)).toBe(false);
    expect(preguntasContestadas(c.estado)).toEqual([CITAS]);
    expect(ids(c.estado)).toEqual(ids(inicio));
    expect(c.noEntendido).toEqual(["depende del día"]);
  });
});

describe("lo que no se sostiene no cambia el caso", () => {
  const { trasElBoton } = laClinicaHastaKoibox();

  it("una cita que no es suya no vale", () => {
    const c = leerContinuacion("Quiero algo para el WhatsApp", { anade: [{ id: WHATSAPP, porQue: "responder mensajes de Instagram" }] }, trasElBoton);
    expect(hayCambios(c.cambios)).toBe(false);
    expect(c.estado).toEqual(trasElBoton);
  });

  it("la cita se reconoce sin tildes, mayúsculas ni signos", () => {
    const c = leerContinuacion("¡También necesito WHATSAPP!", { anade: [{ id: WHATSAPP, porQue: "tambien necesito whatsapp" }] }, trasElBoton);
    expect(c.cambios.anadidas).toEqual([WHATSAPP]);
  });

  it("«te lo explico» no se puede elegir como respuesta desde el texto", () => {
    const c = leerContinuacion("te lo explico", { respuestas: [{ dimensionId: CITAS, respuestaId: "te-explico", porQue: "te lo explico" }] }, trasElBoton);
    expect(c.estado.respuestas).toEqual(trasElBoton.respuestas);
  });

  it("quitar algo que trajo una respuesta no se adivina: se dice y el caso queda igual", () => {
    const c = leerContinuacion("La agenda no la necesito", { quita: [{ id: AGENDA, porQue: "La agenda no la necesito" }] }, trasElBoton);
    expect(c.estado).toEqual(trasElBoton);
    expect(c.noEntendido).toEqual(["La agenda no la necesito"]);
  });

  it("quitar algo que ella contó, sí, cuando lo dice", () => {
    const c = leerContinuacion("Las facturas ya las tengo resueltas", { quita: [{ id: FACTURAS, porQue: "Las facturas ya las tengo resueltas" }] }, trasElBoton);
    expect(c.cambios.quitadas).toEqual([FACTURAS]);
    expect(ids(c.estado)).toEqual([AGENDA, RESERVAS].sort());
  });

  it("si la agenda la contó ella, cambiar la respuesta no se la quita", () => {
    const base = estadoDesde(necesidadesDeLaLista([RESERVAS, AGENDA]));
    const conBoton = conUnaRespuesta(base, { dimensionId: CITAS, respuestaId: "elige-el-cliente" });
    const corregido = conUnaRespuesta(conBoton, { dimensionId: CITAS, respuestaId: "lo-asignamos" });
    expect(ids(corregido)).toEqual([AGENDA, RESERVAS].sort());
  });

  it("un estado que llega del navegador se limpia: ids falsos fuera, una respuesta por pregunta", () => {
    const e = estadoLimpio({
      necesidades: [{ id: RESERVAS, importancia: "imprescindible" }, { id: "nec.falsa" }, { id: RESERVAS }],
      respuestas: [
        { dimensionId: CITAS, respuestaId: "elige-el-cliente" },
        { dimensionId: CITAS, respuestaId: "lo-asignamos" },
        { dimensionId: "dim.falsa", respuestaId: "x" },
      ],
      circunstancias: ["clínica", 3],
    });
    expect(e).toEqual({
      necesidades: [{ id: RESERVAS, importancia: "imprescindible" }],
      respuestas: [{ dimensionId: CITAS, respuestaId: "lo-asignamos" }],
      circunstancias: ["clínica"],
    });
  });
});

/**
 * LOS BOTONES NO CAMBIAN. Antes una respuesta se aplicaba sobre la lista plana
 * de necesidades; ahora se guarda como respuesta y el caso se calcula. Para
 * cada necesidad del vocabulario y cada respuesta de cada pregunta, el consejo
 * tiene que ser idéntico al del camino antiguo.
 */
describe("los botones de seguimiento dan el mismo consejo que antes", () => {
  it("para cada necesidad y cada respuesta, el mismo consejo por los dos caminos", () => {
    const respuestas = getDimensiones().flatMap((d) => d.respuestas.filter((r) => !r.loCuentaElla).map((r) => ({ dimensionId: d.id, respuestaId: r.id, trae: r.traeNecesidades?.length ?? 0 })));
    // Sólo las respuestas que traen algo pueden mover el consejo; de las que no
    // traen nada basta una, porque todas dejan el caso igual.
    const queMueven = [...respuestas.filter((r) => r.trae > 0), respuestas.find((r) => r.trae === 0)!];
    for (const n of getNecesidades()) {
      for (const r of queMueven) {
        const antiguo = aconsejar(conLaRespuesta(necesidadesDeLaLista([n.id]), r));
        const nuevo = aconsejar(casoDe(conUnaRespuesta(estadoDesde(necesidadesDeLaLista([n.id])), r)));
        expect(nuevo, `${n.id} + ${r.respuestaId}`).toEqual(antiguo);
      }
    }
  }, 120_000);
});
