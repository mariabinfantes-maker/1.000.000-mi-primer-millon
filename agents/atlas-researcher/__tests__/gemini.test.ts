import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorProveedorIA } from "../proveedorIA";
import { crearProveedorGemini } from "../proveedores/gemini";

function respuestaFetch(cuerpo: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => cuerpo,
  } as Response;
}

function respuestaConTexto(texto: string): Response {
  return respuestaFetch({ candidates: [{ content: { parts: [{ text: texto }] } }] });
}

describe("crearProveedorGemini", () => {
  const claveOriginal = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "clave-de-prueba";
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    if (claveOriginal === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = claveOriginal;
    }
    vi.unstubAllGlobals();
  });

  it("se identifica como el proveedor gemini", () => {
    expect(crearProveedorGemini().nombre).toBe("gemini");
  });

  it("sin GEMINI_API_KEY, lanza sin siquiera llamar a fetch", async () => {
    delete process.env.GEMINI_API_KEY;
    const proveedor = crearProveedorGemini();

    await expect(proveedor.generarJson("prompt")).rejects.toBeInstanceOf(ErrorProveedorIA);
    await expect(proveedor.generarJson("prompt")).rejects.toThrow(/GEMINI_API_KEY/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("con una respuesta válida, parsea el JSON del primer candidato", async () => {
    vi.mocked(fetch).mockResolvedValue(respuestaConTexto('{"datos":{"nombre":"HubSpot"},"fuentes":[]}'));

    const resultado = await crearProveedorGemini().generarJson("investiga HubSpot");

    expect(resultado).toEqual({ datos: { nombre: "HubSpot" }, fuentes: [] });
  });

  it("incluye el modelo y la clave en la URL, y el prompt en el cuerpo de la petición", async () => {
    vi.mocked(fetch).mockResolvedValue(respuestaConTexto("{}"));

    await crearProveedorGemini().generarJson("investiga HubSpot");

    const [url, opciones] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain(":generateContent?key=clave-de-prueba");
    expect(String(url)).toContain("gemini-3.6-flash");
    const cuerpo = JSON.parse(String(opciones?.body));
    expect(cuerpo.contents[0].parts[0].text).toBe("investiga HubSpot");
    expect(cuerpo.generationConfig.responseMimeType).toBe("application/json");
  });

  it("respeta GEMINI_MODEL si se indica", async () => {
    process.env.GEMINI_MODEL = "gemini-otro-modelo";
    vi.mocked(fetch).mockResolvedValue(respuestaConTexto("{}"));

    await crearProveedorGemini().generarJson("prompt");

    const [url] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("gemini-otro-modelo");
    delete process.env.GEMINI_MODEL;
  });

  it("si la petición de red falla, lanza un ErrorProveedorIA legible", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("fallo de red"));

    await expect(crearProveedorGemini().generarJson("prompt")).rejects.toThrow(
      /No se ha podido contactar con la API de Gemini/
    );
  });

  it("si Gemini responde con error, reenvía su mensaje", async () => {
    vi.mocked(fetch).mockResolvedValue(
      respuestaFetch({ error: { message: "API key not valid" } }, false, 400)
    );

    await expect(crearProveedorGemini().generarJson("prompt")).rejects.toThrow(/API key not valid/);
  });

  it("si la respuesta no trae ningún candidato con texto, lanza un error claro", async () => {
    vi.mocked(fetch).mockResolvedValue(respuestaFetch({ candidates: [] }));

    await expect(crearProveedorGemini().generarJson("prompt")).rejects.toThrow(
      /no ha devuelto ningún contenido/
    );
  });

  it("si el texto del candidato no es JSON válido, lanza un error claro", async () => {
    vi.mocked(fetch).mockResolvedValue(respuestaConTexto("esto no es JSON"));

    await expect(crearProveedorGemini().generarJson("prompt")).rejects.toThrow(
      /no es un JSON válido/
    );
  });
});
