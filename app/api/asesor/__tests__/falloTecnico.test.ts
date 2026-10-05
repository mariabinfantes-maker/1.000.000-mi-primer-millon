import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MENSAJE_DE_FALLO_TECNICO } from "@/app/asesor/falloTecnico";

/**
 * UN FALLO TÉCNICO DE LA IA NO ES «NO TE HE ENTENDIDO».
 *
 * Propietaria, 2026-10-03: ante un fallo técnico de Gemini, «Ahora mismo no
 * puedo entender lo que escribes. Inténtalo de nuevo en unos minutos.», y
 * «debe quedar claramente diferenciado de cuando Gemini está funcionando
 * correctamente pero no consigue interpretar lo que la persona quiere decir».
 * Y un interruptor propio de la IA del asesor.
 *
 * Nace de un fallo real: con la clave mal puesta en Vercel, el asesor estuvo
 * días contestando como si no entendiera, sin dejar rastro.
 */
const CLINICA = "Somos una clínica dental. Perdemos pacientes porque no cogemos el teléfono y llevamos las facturas a mano";
const LEIDA = {
  necesidades: [
    { id: "nec.que-reserven-solos", porQue: "no cogemos el teléfono" },
    { id: "nec.emitir-una-factura-legal", porQue: "llevamos las facturas a mano" },
  ],
};

/** Lo que contesta el modelo en cada llamada: un objeto, o un error que lanzar. */
const cola: unknown[] = [];
const opcionesPedidas: unknown[] = [];
vi.mock("@/agents/compartido/proveedores/gemini", () => ({
  crearProveedorGemini: (opciones?: unknown) => {
    opcionesPedidas.push(opciones);
    return {
      nombre: "fijo",
      generarJson: async () => {
        const siguiente = cola.shift() ?? {};
        if (siguiente instanceof Error) throw siguiente;
        return siguiente;
      },
    };
  },
}));

let POST: (r: Request) => Promise<Response>;
beforeAll(async () => {
  ({ POST } = await import("../route"));
}, 60_000);

async function pedir(cuerpo: unknown) {
  const res = await POST(new Request("http://x/api/asesor", { method: "POST", body: JSON.stringify(cuerpo) }));
  return { status: res.status, json: await res.json() };
}

let registro: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  cola.length = 0;
  opcionesPedidas.length = 0;
  vi.stubEnv("GEMINI_API_KEY", "prueba");
  vi.stubEnv("ATLAS_ASESOR_IA_ACTIVA", "true");
  registro = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  registro.mockRestore();
});

/** Lo que quedó escrito en el registro, en una sola cadena. */
const escrito = () => registro.mock.calls.flat().join(" ");

describe("el interruptor de la IA del asesor", () => {
  it("apagado, no llama a la IA y lo dice: es un estado buscado, no un fallo", async () => {
    vi.stubEnv("ATLAS_ASESOR_IA_ACTIVA", "");
    const { status, json } = await pedir({ texto: CLINICA });
    expect(status).toBe(200);
    expect(json.sinIA).toBe(true);
    expect(json.falloTecnico).toBeUndefined();
    expect(opcionesPedidas).toHaveLength(0);
    expect(registro).not.toHaveBeenCalled();
  });

  it("apagado y a mitad de conversación, conserva el caso sin llamar a la IA", async () => {
    const { json: uno } = await (cola.push(LEIDA), pedir({ texto: CLINICA }));
    vi.stubEnv("ATLAS_ASESOR_IA_ACTIVA", "false");
    const { status, json } = await pedir({ texto: "También necesito WhatsApp", estado: uno.estado });
    expect(status).toBe(200);
    expect(json.continuacion.sinIA).toBe(true);
    expect(json.continuacion.estado).toEqual(uno.estado);
    expect(registro).not.toHaveBeenCalled();
  });

  it("encendido y sin clave, es un fallo técnico, se registra y se dice", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const { status, json } = await pedir({ texto: CLINICA });
    expect(status).toBe(503);
    expect(json.falloTecnico.mensaje).toBe(MENSAJE_DE_FALLO_TECNICO);
    expect(escrito()).toContain("falta GEMINI_API_KEY");
  });
});

describe("primer mensaje", () => {
  it("si la IA falla, se registra la causa y la persona lee el mensaje acordado, no «no te entiendo»", async () => {
    cola.push(new Error("[gemini] API key not valid. Please pass a valid API key."));
    const { status, json } = await pedir({ texto: CLINICA });

    expect(status).toBe(503);
    expect(json).toEqual({ falloTecnico: { mensaje: MENSAJE_DE_FALLO_TECNICO } });
    expect(escrito()).toContain("[asesor] Fallo técnico de la IA al entender");
    expect(escrito()).toContain("API key not valid");
    // Lo que escribió la persona no se guarda en el registro.
    expect(escrito()).not.toContain("clínica dental");
  });

  it("si la IA contesta pero no saca nada, es «no entendido», con su camino de siempre", async () => {
    cola.push({ necesidades: [], noEntendido: ["algo raro"] });
    const { status, json } = await pedir({ texto: "patata azul" });

    expect(status).toBe(200);
    expect(json.falloTecnico).toBeUndefined();
    expect(json.comprension.necesidades).toEqual([]);
    expect(json.consejo.caminos).toEqual([]);
    expect(registro).not.toHaveBeenCalled();
  });

  it("con la IA bien, una frase real sigue dando consejo", async () => {
    cola.push(LEIDA);
    const { status, json } = await pedir({ texto: CLINICA });
    expect(status).toBe(200);
    expect(json.consejo.caminos.length).toBeGreaterThan(0);
    expect(registro).not.toHaveBeenCalled();
  });
});

describe("a mitad de conversación", () => {
  async function casoConocido() {
    cola.push(LEIDA);
    return (await pedir({ texto: CLINICA })).json;
  }

  it("si la IA falla, no devuelve caso ni consejo nuevos: la página conserva los suyos", async () => {
    const uno = await casoConocido();
    cola.push(new Error("[gemini] Error 500 desconocido al llamar a Gemini."));
    const { status, json } = await pedir({ texto: "También necesito WhatsApp", estado: uno.estado });

    expect(status).toBe(503);
    expect(json).toEqual({ falloTecnico: { mensaje: MENSAJE_DE_FALLO_TECNICO } });
    expect(escrito()).toContain("[asesor] Fallo técnico de la IA al continuar");
    expect(escrito()).toContain("Error 500");
  });

  it("si la IA contesta pero no saca nada, sigue siendo «esto no lo he entendido»", async () => {
    const uno = await casoConocido();
    cola.push({});
    const { status, json } = await pedir({ texto: "patata azul", estado: uno.estado });

    expect(status).toBe(200);
    expect(json.falloTecnico).toBeUndefined();
    expect(json.continuacion.noEntendido).toEqual(["patata azul"]);
    expect(json.continuacion.sinCambios).toBe(true);
    expect(registro).not.toHaveBeenCalled();
  });
});

describe("la prueba de fallo provocado (`?prueba=fallo`)", () => {
  it("pide un modelo inexistente, para que Google conteste con un error de verdad, y lo marca como prueba", async () => {
    cola.push(new Error("[gemini] models/modelo-inexistente-prueba-de-fallo-molnip is not found"));
    const { status, json } = await pedir({ texto: CLINICA, probarFallo: true });

    expect(opcionesPedidas).toEqual([{ modelo: "modelo-inexistente-prueba-de-fallo-molnip" }]);
    expect(status).toBe(503);
    expect(json.falloTecnico.mensaje).toBe(MENSAJE_DE_FALLO_TECNICO);
    expect(escrito()).toContain("(prueba provocada)");
    expect(escrito()).toContain("is not found");
  });

  it("sin pedirla, se usa el modelo de siempre", async () => {
    cola.push(LEIDA);
    await pedir({ texto: CLINICA });
    expect(opcionesPedidas).toEqual([{}]);
  });
});
