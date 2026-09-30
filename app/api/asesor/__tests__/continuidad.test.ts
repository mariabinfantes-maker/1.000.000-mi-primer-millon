import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * LO QUE RECIBE LA PÁGINA AL SEGUIR LA CONVERSACIÓN.
 *
 * El modelo se sustituye por respuestas fijas —la cola de abajo—; lo que se
 * prueba es el contrato de la ruta: con estado, un mensaje se lee dentro del
 * caso; si no cambia nada, sólo vuelve la nota y la página conserva el
 * consejo; y los botones guardan la respuesta como respuesta.
 */
const cola: unknown[] = [];
vi.mock("@/agents/compartido/proveedores/gemini", () => ({
  crearProveedorGemini: () => ({ nombre: "fijo", generarJson: async () => cola.shift() ?? {} }),
}));

let POST: (r: Request) => Promise<Response>;
beforeAll(async () => {
  // La ruta decide si hay IA al cargarse: la clave tiene que estar antes.
  vi.stubEnv("GEMINI_API_KEY", "prueba");
  ({ POST } = await import("../route"));
}, 60_000);

async function pedir(cuerpo: unknown) {
  const res = await POST(new Request("http://x/api/asesor", { method: "POST", body: JSON.stringify(cuerpo) }));
  return res.json();
}

const CITAS = "dim.como-se-asignan-las-citas";
const nombre = (k: { loQueHaria: { piezas: { nombre: string }[] } | null }) => k.loQueHaria?.piezas.map((p) => p.nombre).join(" + ");

describe("la ruta del asesor, a mitad de conversación", () => {
  beforeEach(() => {
    cola.length = 0;
  });

  it("clínica dental → botón → WhatsApp → corrección → mensaje no entendido", async () => {
    // 1. Primer mensaje.
    cola.push({
      necesidades: [
        { id: "nec.que-reserven-solos", porQue: "no cogemos el teléfono" },
        { id: "nec.emitir-una-factura-legal", porQue: "llevamos las facturas a mano" },
      ],
    });
    const uno = await pedir({ texto: "Somos una clínica dental. Perdemos pacientes porque no cogemos el teléfono y llevamos las facturas a mano" });
    expect(uno.estado.necesidades.map((n: { id: string }) => n.id)).toEqual(["nec.que-reserven-solos", "nec.emitir-una-factura-legal"]);

    // 2. El botón «El paciente elige profesional»: Koibox, y ya no se pregunta.
    const dos = await pedir({ estado: uno.estado, respondida: { dimensionId: CITAS, respuestaId: "elige-el-cliente" } });
    expect(nombre(dos.consejo)).toBe("Koibox");
    expect(dos.estado.respuestas).toEqual([{ dimensionId: CITAS, respuestaId: "elige-el-cliente" }]);
    expect(dos.yaRespondio).toBe(true);
    expect(dos.ultimaRespuesta).toBe("El paciente elige profesional");
    expect(dos.preguntas.map((p: { id: string }) => p.id)).not.toContain(CITAS);

    // 3. «También necesito WhatsApp»: el caso entero sigue y se añade.
    cola.push({ anade: [{ id: "nec.responder-por-donde-escriban", porQue: "necesito WhatsApp" }] });
    const tres = await pedir({ texto: "También necesito WhatsApp", estado: dos.estado });
    const deTres = tres.comprension.necesidades.map((n: { necesidad: { id: string } }) => n.necesidad.id).sort();
    expect(deTres).toEqual(["nec.emitir-una-factura-legal", "nec.mi-agenda", "nec.que-reserven-solos", "nec.responder-por-donde-escriban"]);
    expect(tres.continuacion.sinCambios).toBe(false);
    expect(tres.continuacion.lineas).toEqual(["Añado «responder por donde me escriban sin perder a nadie»."]);
    expect(tres.ultimaRespuesta).toBe("El paciente elige profesional");

    // 4. Corrige la respuesta: se sustituye, y la agenda que trajo se va.
    cola.push({ respuestas: [{ dimensionId: CITAS, respuestaId: "lo-asignamos", porQue: "las citas las asignamos nosotros" }] });
    const cuatro = await pedir({ texto: "No, las citas las asignamos nosotros.", estado: tres.estado });
    expect(cuatro.estado.respuestas).toEqual([{ dimensionId: CITAS, respuestaId: "lo-asignamos" }]);
    const deCuatro = cuatro.comprension.necesidades.map((n: { necesidad: { id: string } }) => n.necesidad.id).sort();
    expect(deCuatro).toEqual(["nec.emitir-una-factura-legal", "nec.que-reserven-solos", "nec.responder-por-donde-escriban"]);
    expect(cuatro.ultimaRespuesta).toBe("Lo asignamos nosotros");

    // 5. No se entiende: SÓLO vuelve la nota. Ni consejo ni caso nuevos que puedan pisar los de antes.
    cola.push({ noEntendido: ["lo del tema ese"] });
    const cinco = await pedir({ texto: "Oye, y lo del tema ese", estado: cuatro.estado });
    expect(cinco.consejo).toBeUndefined();
    expect(cinco.comprension).toBeUndefined();
    expect(cinco.continuacion).toMatchObject({ sinCambios: true, noEntendido: ["lo del tema ese"], estado: cuatro.estado });
  }, 60_000);

  it("«¿Para qué quieres usar WhatsApp?»: se pregunta sin tocar el caso, y la elección entra en el mismo estado", async () => {
    const estado = {
      necesidades: [
        { id: "nec.que-reserven-solos", importancia: "imprescindible" },
        { id: "nec.emitir-una-factura-legal", importancia: "imprescindible" },
      ],
      respuestas: [{ dimensionId: CITAS, respuestaId: "elige-el-cliente" }],
      circunstancias: ["clínica dental"],
    };
    cola.push({ ambiguos: [{ termino: "WhatsApp" }] });
    const pregunta = await pedir({ texto: "También necesito WhatsApp", estado });
    expect(pregunta.consejo).toBeUndefined();
    expect(pregunta.continuacion.sinCambios).toBe(true);
    expect(pregunta.continuacion.noEntendido).toEqual([]);
    expect(pregunta.continuacion.aclaraciones[0].opciones.map((o: { titulo: string }) => o.titulo)).toContain(
      "Responder por donde me escriban sin perder a nadie"
    );

    const elegida = await pedir({ estado: pregunta.continuacion.estado, aclarada: { termino: "WhatsApp", necesidadId: "nec.responder-por-donde-escriban" } });
    const caso = elegida.comprension.necesidades.map((n: { necesidad: { id: string } }) => n.necesidad.id).sort();
    expect(caso).toEqual(["nec.emitir-una-factura-legal", "nec.mi-agenda", "nec.que-reserven-solos", "nec.responder-por-donde-escriban"]);
    expect(elegida.estado.respuestas).toEqual(estado.respuestas);
    expect(elegida.estado.circunstancias).toEqual(["clínica dental"]);
    expect(elegida.continuacion.lineas).toEqual(["Añado «responder por donde me escriban sin perder a nadie»."]);
  });

  it("«Te explico cómo lo hacemos»: el mensaje contesta la pregunta abierta por el mismo camino", async () => {
    const estado = { necesidades: [{ id: "nec.que-reserven-solos", importancia: "imprescindible" }], respuestas: [], circunstancias: [] };
    cola.push({ respuestas: [{ dimensionId: CITAS, respuestaId: "elige-el-cliente", porQue: "cada paciente escoge dentista" }] });
    const r = await pedir({ texto: "Aquí cada paciente escoge dentista", estado, preguntaAbierta: CITAS });
    expect(r.estado.respuestas).toEqual([{ dimensionId: CITAS, respuestaId: "elige-el-cliente" }]);
    expect(r.continuacion.lineas).toEqual(["Apunto que el paciente elige profesional."]);
  });
});
