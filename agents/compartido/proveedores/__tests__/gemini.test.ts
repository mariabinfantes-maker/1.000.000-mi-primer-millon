import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorProveedorIA } from "../../proveedorIA";
import { crearProveedorGemini } from "../gemini";

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

  /**
   * Lo que sigue está calcado de una respuesta real de la API del 2026-09-07:
   * dos llamadas, una a la página de precios de Pipedrive y otra a una
   * dirección inventada del mismo dominio. Los nombres de campo y los valores
   * de estado son los que devolvió Gemini, no los que suponíamos. Si Google
   * los cambia, estas pruebas fallan y nos enteramos aquí y no en mitad de un
   * lote de verificación.
   */
  describe("generarJsonLeyendoUrls", () => {
    const conMetadatos = (texto: string, urlMetadata: unknown[]) =>
      respuestaFetch({
        candidates: [{ content: { parts: [{ text: texto }] } }, ].map((c) => ({
          ...c,
          urlContextMetadata: { urlMetadata },
        })),
      });

    it("pide a Gemini la herramienta url_context", async () => {
      vi.mocked(fetch).mockResolvedValue(respuestaConTexto("{}"));

      await crearProveedorGemini().generarJsonLeyendoUrls("verifica", ["https://ejemplo.test/precios"]);

      const cuerpo = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));
      expect(cuerpo.tools).toEqual([{ url_context: {} }]);
    });

    it("no pide responseMimeType, que no se puede combinar con herramientas", async () => {
      vi.mocked(fetch).mockResolvedValue(respuestaConTexto("{}"));

      await crearProveedorGemini().generarJsonLeyendoUrls("verifica", ["https://ejemplo.test/precios"]);

      const cuerpo = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));
      expect(cuerpo.generationConfig.responseMimeType).toBeUndefined();
    });

    it("mete las direcciones en el texto, no dependan de cómo venga el prompt", async () => {
      vi.mocked(fetch).mockResolvedValue(respuestaConTexto("{}"));

      await crearProveedorGemini().generarJsonLeyendoUrls("verifica", [
        "https://ejemplo.test/precios",
        "https://ejemplo.test/funciones",
      ]);

      const cuerpo = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));
      expect(cuerpo.contents[0].parts[0].text).toContain("https://ejemplo.test/precios");
      expect(cuerpo.contents[0].parts[0].text).toContain("https://ejemplo.test/funciones");
    });

    it("marca como recuperada sólo la que Gemini dice que leyó", async () => {
      vi.mocked(fetch).mockResolvedValue(
        conMetadatos('{"ok":true}', [
          {
            retrievedUrl: "https://www.pipedrive.com/es/pricing",
            urlRetrievalStatus: "URL_RETRIEVAL_STATUS_SUCCESS",
          },
          {
            retrievedUrl: "https://www.pipedrive.com/es/precios-historicos-2019-archivo",
            urlRetrievalStatus: "URL_RETRIEVAL_STATUS_ERROR",
          },
        ])
      );

      const r = await crearProveedorGemini().generarJsonLeyendoUrls("verifica", [
        "https://www.pipedrive.com/es/pricing",
        "https://www.pipedrive.com/es/precios-historicos-2019-archivo",
      ]);

      expect(r.datos).toEqual({ ok: true });
      expect(r.urls).toEqual([
        {
          url: "https://www.pipedrive.com/es/pricing",
          estado: "URL_RETRIEVAL_STATUS_SUCCESS",
          recuperada: true,
        },
        {
          url: "https://www.pipedrive.com/es/precios-historicos-2019-archivo",
          estado: "URL_RETRIEVAL_STATUS_ERROR",
          recuperada: false,
        },
      ]);
    });

    it("cualquier estado que no sea SUCCESS cuenta como no leída", async () => {
      for (const estado of ["URL_RETRIEVAL_STATUS_ERROR", "URL_RETRIEVAL_STATUS_UNSAFE", "LO_QUE_SEA", ""]) {
        vi.mocked(fetch).mockResolvedValue(
          conMetadatos("{}", [{ retrievedUrl: "https://ejemplo.test/x", urlRetrievalStatus: estado }])
        );
        const r = await crearProveedorGemini().generarJsonLeyendoUrls("v", ["https://ejemplo.test/x"]);
        expect(r.urls[0].recuperada, estado).toBe(false);
      }
    });

    it("si Gemini no devuelve metadatos, la lista queda vacía y no se inventa nada", async () => {
      vi.mocked(fetch).mockResolvedValue(respuestaConTexto("{}"));

      const r = await crearProveedorGemini().generarJsonLeyendoUrls("v", ["https://ejemplo.test/x"]);

      expect(r.urls).toEqual([]);
    });

    it("acepta el JSON envuelto en una valla de markdown", async () => {
      vi.mocked(fetch).mockResolvedValue(respuestaConTexto('```json\n{"plan":"Lite"}\n```'));

      const r = await crearProveedorGemini().generarJsonLeyendoUrls("v", ["https://ejemplo.test/x"]);

      expect(r.datos).toEqual({ plan: "Lite" });
    });

    it("sin ninguna dirección, no llama a Gemini", async () => {
      await expect(crearProveedorGemini().generarJsonLeyendoUrls("v", [])).rejects.toThrow(
        /ninguna dirección/
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it("con más de veinte direcciones, no llama a Gemini", async () => {
      const muchas = Array.from({ length: 21 }, (_, i) => `https://ejemplo.test/${i}`);

      await expect(crearProveedorGemini().generarJsonLeyendoUrls("v", muchas)).rejects.toThrow(/20/);
      expect(fetch).not.toHaveBeenCalled();
    });

    it("sin GEMINI_API_KEY, lanza sin llamar a fetch", async () => {
      delete process.env.GEMINI_API_KEY;

      await expect(
        crearProveedorGemini().generarJsonLeyendoUrls("v", ["https://ejemplo.test/x"])
      ).rejects.toThrow(/GEMINI_API_KEY/);
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  it("generarJson sigue sin pedir herramientas", async () => {
    vi.mocked(fetch).mockResolvedValue(respuestaConTexto("{}"));

    await crearProveedorGemini().generarJson("prompt");

    const cuerpo = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));
    expect(cuerpo.tools).toBeUndefined();
  });

});
