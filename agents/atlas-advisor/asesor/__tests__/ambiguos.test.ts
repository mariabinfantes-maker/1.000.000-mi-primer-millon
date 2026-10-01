import { describe, expect, it } from "vitest";
import { aconsejar } from "../aconsejar";
import { leerComprension } from "../entender";
import { casoDe, conLaAclaracion, conUnaRespuesta, continuar, describirCambios, estadoDesde, hayCambios, leerContinuacion } from "../continuar";
import { significadosDe } from "../ambiguos";

/**
 * «¿PARA QUÉ QUIERES USAR WHATSAPP?»
 *
 * Propietaria, 2026-09-30: pedir aclaración cuando se reconoce el concepto
 * pero no para qué se quiere; ni elegir la interpretación más probable ni
 * tratarlo como si no se hubiera entendido nada; y que sea general, no un
 * parche para WhatsApp. Las opciones salen del vocabulario, no del modelo.
 */

const CITAS = "dim.como-se-asignan-las-citas";
const RESERVAS = "nec.que-reserven-solos";
const FACTURAS = "nec.emitir-una-factura-legal";
const AGENDA = "nec.mi-agenda";
const MENSAJES = "nec.responder-por-donde-escriban";
const WHATSAPP = ["nec.comprar-a-proveedores", "nec.hablar-con-mi-equipo", MENSAJES, "nec.vender-online"];

const lector = (salida: unknown) => {
  const prompts: string[] = [];
  return { prompts, leer: async (p: string) => (prompts.push(p), salida) };
};
const ids = (e: Parameters<typeof casoDe>[0]) => casoDe(e).map((n) => n.necesidad.id).sort();

/** La clínica dental con «el paciente elige profesional»: Koibox. */
function laClinica() {
  const c = leerComprension("Somos una clínica dental. Perdemos pacientes porque no cogemos el teléfono y llevamos las facturas a mano", {
    necesidades: [
      { id: RESERVAS, porQue: "no cogemos el teléfono" },
      { id: FACTURAS, porQue: "llevamos las facturas a mano" },
    ],
    circunstancias: ["clínica dental"],
  });
  return conUnaRespuesta(estadoDesde(c.necesidades, c.circunstancias), { dimensionId: CITAS, respuestaId: "elige-el-cliente" });
}

describe("una palabra con varios significados se pregunta", () => {
  it("«También necesito WhatsApp»: se pregunta para qué, con los significados del vocabulario, y el caso no se toca", async () => {
    const antes = laClinica();
    const c = await continuar("También necesito WhatsApp", antes, lector({ ambiguos: [{ termino: "WhatsApp" }], noEntendido: ["También necesito WhatsApp"] }).leer);

    expect(c.aclaraciones).toHaveLength(1);
    expect(c.aclaraciones[0].termino).toBe("WhatsApp");
    expect(c.aclaraciones[0].opciones.map((o) => o.id).sort()).toEqual(WHATSAPP);
    // En su idioma: los títulos del vocabulario, no ids.
    expect(c.aclaraciones[0].opciones.find((o) => o.id === MENSAJES)?.titulo).toBe("Responder por donde me escriban sin perder a nadie");
    // No se trata como «no entendido», y no se elige ninguna.
    expect(c.noEntendido).toEqual([]);
    expect(hayCambios(c.cambios)).toBe(false);
    expect(c.estado).toEqual(antes);
  });

  it("después de elegir para qué, se conserva todo el caso anterior y se añade lo elegido", async () => {
    const antes = laClinica();
    expect(aconsejar(casoDe(antes)).loQueHaria?.piezas.map((p) => p.nombre)).toEqual(["Koibox"]);

    const c = conLaAclaracion(antes, "WhatsApp", MENSAJES);
    expect(c.cambios.anadidas).toEqual([MENSAJES]);
    // Todo lo de antes, intacto: lo que contó, su respuesta y los datos sueltos.
    expect(ids(c.estado)).toEqual([AGENDA, FACTURAS, MENSAJES, RESERVAS].sort());
    expect(c.estado.respuestas).toEqual(antes.respuestas);
    expect(c.estado.circunstancias).toEqual(antes.circunstancias);
    expect(c.estado.necesidades.slice(0, antes.necesidades.length)).toEqual(antes.necesidades);
    expect(describirCambios(c.cambios)).toEqual(["Añado «responder por donde me escriban sin perder a nadie»."]);
    // El motor recibe el caso ampliado; lo que decida es cosa suya.
    expect(aconsejar(casoDe(c.estado)).caminos.length).toBeGreaterThan(0);
  });

  it("contestar el «¿para qué?» escribiendo entra por el mismo camino, y el modelo sabe qué se le preguntó", async () => {
    const antes = laClinica();
    const { leer, prompts } = lector({ anade: [{ id: MENSAJES, porQue: "para contestar a los pacientes" }] });
    const c = await continuar("Es para contestar a los pacientes", antes, leer, undefined, "WhatsApp");
    expect(prompts[0]).toContain("Le acabas de preguntar para qué quiere usar «WhatsApp»");
    expect(prompts[0]).toContain(`[${MENSAJES}]`);
    expect(ids(c.estado)).toEqual([AGENDA, FACTURAS, MENSAJES, RESERVAS].sort());
    expect(c.estado.respuestas).toEqual(antes.respuestas);
  });

  it("una opción que no es un significado de esa palabra no cambia nada", () => {
    const antes = laClinica();
    expect(conLaAclaracion(antes, "WhatsApp", "nec.expedientes").estado).toEqual(antes);
    expect(conLaAclaracion(antes, "WhatsApp", "nec.no-existe").estado).toEqual(antes);
  });

  it("no es un parche para WhatsApp: «papel» también se pregunta, con sus propios significados", () => {
    const antes = laClinica();
    const c = leerContinuacion("Lo llevamos todo en papel", { ambiguos: [{ termino: "papel" }] }, antes);
    expect(c.aclaraciones[0].opciones.map((o) => o.id).sort()).toEqual(significadosDe("papel").map((o) => o.id).sort());
    expect(c.aclaraciones[0].opciones.length).toBeGreaterThanOrEqual(2);
    expect(c.aclaraciones[0].opciones.map((o) => o.id)).not.toContain(MENSAJES);
  });

  it("una palabra que el vocabulario sólo lee de una forma no se pregunta", () => {
    const c = leerContinuacion("Y también por Instagram", { ambiguos: [{ termino: "Instagram" }] }, laClinica());
    expect(significadosDe("Instagram")).toHaveLength(1);
    expect(c.aclaraciones).toEqual([]);
    // No se pregunta, pero tampoco se calla: se le dice que eso no se ha entendido.
    expect(c.noEntendido).toEqual(["Instagram"]);
  });

  it("lo que el modelo aparta como ambiguo sin serlo nunca desaparece en silencio", () => {
    // El fallo medido: «no cogemos el teléfono» apartado como ambiguo; «teléfono»
    // sólo tiene un significado, y las reservas se perdían sin decirlo.
    const c = leerComprension("Perdemos pacientes porque no cogemos el teléfono", { necesidades: [], ambiguos: [{ termino: "teléfono" }] });
    expect(c.aclaraciones).toEqual([]);
    expect(c.noEntendido).toEqual(["teléfono"]);
  });

  it("si el modelo sí supo para qué, no se pregunta", () => {
    const c = leerContinuacion(
      "Necesito atender a los pacientes por WhatsApp",
      { anade: [{ id: MENSAJES, porQue: "atender a los pacientes por WhatsApp" }], ambiguos: [{ termino: "WhatsApp" }] },
      laClinica()
    );
    expect(c.cambios.anadidas).toEqual([MENSAJES]);
    expect(c.aclaraciones).toEqual([]);
  });

  it("lo que ya está en el caso no se ofrece otra vez", () => {
    const conMensajes = conLaAclaracion(laClinica(), "WhatsApp", MENSAJES).estado;
    const c = leerContinuacion("Y WhatsApp", { ambiguos: [{ termino: "WhatsApp" }] }, conMensajes);
    expect(c.aclaraciones[0].opciones.map((o) => o.id).sort()).toEqual(WHATSAPP.filter((x) => x !== MENSAJES));
  });

  it("una palabra que no está en su mensaje, o que sólo es un trozo de otra, no se pregunta", () => {
    expect(leerContinuacion("Necesito algo", { ambiguos: [{ termino: "WhatsApp" }] }, laClinica()).aclaraciones).toEqual([]);
    expect(leerContinuacion("Somos papelería", { ambiguos: [{ termino: "papel" }] }, laClinica()).aclaraciones).toEqual([]);
  });

  it("en el primer mensaje también se pregunta, y no cuenta como «no entendido»", () => {
    const c = leerComprension("Necesito WhatsApp para la clínica", {
      necesidades: [],
      ambiguos: [{ termino: "WhatsApp" }],
      noEntendido: ["Necesito WhatsApp para la clínica"],
    });
    expect(c.aclaraciones[0].opciones.map((o) => o.id).sort()).toEqual(WHATSAPP);
    expect(c.noEntendido).toEqual([]);
  });
});
