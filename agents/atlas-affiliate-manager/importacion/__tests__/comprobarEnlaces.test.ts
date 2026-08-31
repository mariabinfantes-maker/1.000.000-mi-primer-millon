import { describe, it, expect, vi } from "vitest";
import { comprobarEnlaces, REDIRECCIONES_MAXIMAS } from "../comprobarEnlaces";

/** Resolver de mentira: todo dominio de prueba apunta a una IP pública. */
const resolver = async () => ["93.184.216.34"];

function respuesta(status: number, cabeceras: Record<string, string> = {}, cuerpo?: string): Response {
  return new Response(cuerpo ?? null, { status, headers: cabeceras });
}

describe("comprobarEnlaces", () => {
  it("un enlace que responde 200 sale bien", async () => {
    const fetchImpl = vi.fn(async () => respuesta(200)) as unknown as typeof fetch;
    const r = await comprobarEnlaces(["https://bueno.test/x"], { fetchImpl, resolver });
    expect(r.get("https://bueno.test/x")).toMatchObject({ ok: true, estadoHttp: 200 });
  });

  it("un 404 sale mal y dice el código", async () => {
    const fetchImpl = vi.fn(async () => respuesta(404)) as unknown as typeof fetch;
    const r = await comprobarEnlaces(["https://roto.test/x"], { fetchImpl, resolver });
    expect(r.get("https://roto.test/x")).toMatchObject({ ok: false, estadoHttp: 404 });
  });

  it("prueba primero con HEAD y solo cae a GET si hace falta", async () => {
    const llamadas: string[] = [];
    const fetchImpl = vi.fn(async (_u: unknown, init?: RequestInit) => {
      llamadas.push(init?.method ?? "GET");
      return respuesta(llamadas.length === 1 ? 405 : 200);
    }) as unknown as typeof fetch;

    const r = await comprobarEnlaces(["https://sinhead.test/x"], { fetchImpl, resolver });
    expect(llamadas).toEqual(["HEAD", "GET"]);
    expect(r.get("https://sinhead.test/x")?.ok).toBe(true);
  });

  it("sigue las redirecciones a mano y devuelve el destino final", async () => {
    const fetchImpl = vi.fn(async (u: unknown) => {
      const url = String(u);
      if (url.includes("/salto1")) return respuesta(302, { location: "https://destino.test/final" });
      return respuesta(200);
    }) as unknown as typeof fetch;

    const r = await comprobarEnlaces(["https://origen.test/salto1"], { fetchImpl, resolver });
    expect(r.get("https://origen.test/salto1")).toMatchObject({
      ok: true,
      destinoFinal: "https://destino.test/final",
    });
  });

  it("COMPRUEBA el destino de cada redirección: no vale redirigir a la red interna", async () => {
    // Un proveedor legítimo que redirige a 169.254.169.254 conseguiría que el
    // servidor pidiera los metadatos de la nube. Aquí se corta en el salto.
    const fetchImpl = vi.fn(async () =>
      respuesta(302, { location: "http://169.254.169.254/latest/meta-data/" })
    ) as unknown as typeof fetch;

    const r = await comprobarEnlaces(["https://parece-bueno.test/x"], { fetchImpl, resolver });
    const resultado = r.get("https://parece-bueno.test/x")!;
    expect(resultado.ok).toBe(false);
    expect(resultado.motivo).toMatch(/redirige a un destino no permitido/i);
  });

  it("corta un bucle de redirecciones", async () => {
    const fetchImpl = vi.fn(async () => respuesta(302, { location: "https://bucle.test/x" })) as unknown as typeof fetch;
    const r = await comprobarEnlaces(["https://bucle.test/x"], { fetchImpl, resolver });
    expect(r.get("https://bucle.test/x")?.motivo).toMatch(new RegExp(`${REDIRECCIONES_MAXIMAS} redirecciones`));
  });

  it("una redirección sin destino se rechaza", async () => {
    const fetchImpl = vi.fn(async () => respuesta(302)) as unknown as typeof fetch;
    const r = await comprobarEnlaces(["https://a.test/x"], { fetchImpl, resolver });
    expect(r.get("https://a.test/x")?.motivo).toMatch(/sin decir adónde/i);
  });

  it("no descarga el cuerpo entero", async () => {
    let cancelado = false;
    const enorme = new ReadableStream({
      pull(controlador) {
        controlador.enqueue(new Uint8Array(8 * 1024));
      },
      cancel() {
        cancelado = true;
      },
    });
    const fetchImpl = vi.fn(async (_u: unknown, init?: RequestInit) =>
      init?.method === "HEAD" ? respuesta(405) : new Response(enorme, { status: 200 })
    ) as unknown as typeof fetch;

    const r = await comprobarEnlaces(["https://pesado.test/x"], { fetchImpl, resolver });
    expect(r.get("https://pesado.test/x")?.ok).toBe(true);
    // El flujo se cancela: si se descargara entero, esto no acabaría nunca.
    expect(cancelado).toBe(true);
  });

  it("un enlace a una dirección interna se rechaza sin llegar a pedirlo", async () => {
    const fetchImpl = vi.fn(async () => respuesta(200)) as unknown as typeof fetch;
    const r = await comprobarEnlaces(["http://127.0.0.1:8080/x"], { fetchImpl, resolver });
    expect(r.get("http://127.0.0.1:8080/x")?.ok).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("un error de red se cuenta como que no responde, no revienta", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    }) as unknown as typeof fetch;
    const r = await comprobarEnlaces(["https://caido.test/x"], { fetchImpl, resolver });
    expect(r.get("https://caido.test/x")).toMatchObject({ ok: false });
  });

  it("nunca lanza más peticiones a la vez que el tope", async () => {
    let enVuelo = 0;
    let maximo = 0;
    const fetchImpl = vi.fn(async () => {
      enVuelo++;
      maximo = Math.max(maximo, enVuelo);
      await new Promise((r) => setTimeout(r, 5));
      enVuelo--;
      return respuesta(200);
    }) as unknown as typeof fetch;

    const urls = Array.from({ length: 20 }, (_, i) => `https://p${i}.test/x`);
    await comprobarEnlaces(urls, { fetchImpl, resolver, concurrencia: 3 });
    expect(maximo).toBeLessThanOrEqual(3);
  });

  it("no repite una misma dirección repetida en el archivo", async () => {
    const fetchImpl = vi.fn(async () => respuesta(200)) as unknown as typeof fetch;
    await comprobarEnlaces(["https://a.test/x", "https://a.test/x", "https://a.test/x"], { fetchImpl, resolver });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
