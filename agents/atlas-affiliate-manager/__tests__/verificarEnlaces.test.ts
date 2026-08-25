import { describe, expect, it, vi } from "vitest";
import type { EstrategiaAfiliacion } from "@/data/esquemaInterno";
import { verificarEnlacesActivos } from "../verificarEnlaces";

function respuestaFalsa(status: number): Response {
  return { status } as Response;
}

describe("verificarEnlacesActivos", () => {
  it("marca ok:true un enlace que responde 200 en HEAD", async () => {
    const fetchFalso = vi.fn(async () => respuestaFalsa(200));
    const estrategias: EstrategiaAfiliacion[] = [
      {
        herramientaId: "hubspot",
        cuentas: [
          {
            id: "partnerstack",
            estado: "activo",
            plataforma: "PartnerStack",
            enlaces: [{ segmento: "global", url: "https://hubspot.com/?a=atlas" }],
            ultimaRevision: "2026-08-25",
          },
        ],
      },
    ];

    const resultados = await verificarEnlacesActivos(estrategias, fetchFalso as unknown as typeof fetch);

    expect(resultados).toHaveLength(1);
    expect(resultados[0]).toMatchObject({ herramientaId: "hubspot", cuentaId: "partnerstack", ok: true, estadoHttp: 200 });
  });

  it("reintenta con GET si HEAD devuelve 4xx/5xx, y usa ese resultado", async () => {
    const fetchFalso = vi
      .fn()
      .mockResolvedValueOnce(respuestaFalsa(405))
      .mockResolvedValueOnce(respuestaFalsa(200));
    const estrategias: EstrategiaAfiliacion[] = [
      {
        herramientaId: "hubspot",
        cuentas: [
          {
            id: "partnerstack",
            estado: "activo",
            plataforma: "PartnerStack",
            enlaces: [{ segmento: "global", url: "https://hubspot.com/?a=atlas" }],
            ultimaRevision: "2026-08-25",
          },
        ],
      },
    ];

    const resultados = await verificarEnlacesActivos(estrategias, fetchFalso as unknown as typeof fetch);

    expect(fetchFalso).toHaveBeenCalledTimes(2);
    expect(resultados[0].ok).toBe(true);
  });

  it("marca ok:false un enlace que responde 404 en ambos intentos", async () => {
    const fetchFalso = vi.fn(async () => respuestaFalsa(404));
    const estrategias: EstrategiaAfiliacion[] = [
      {
        herramientaId: "hubspot",
        cuentas: [
          {
            id: "partnerstack",
            estado: "activo",
            plataforma: "PartnerStack",
            enlaces: [{ segmento: "global", url: "https://hubspot.com/roto" }],
            ultimaRevision: "2026-08-25",
          },
        ],
      },
    ];

    const resultados = await verificarEnlacesActivos(estrategias, fetchFalso as unknown as typeof fetch);

    expect(resultados[0].ok).toBe(false);
    expect(resultados[0].estadoHttp).toBe(404);
  });

  it("captura un error de red sin lanzar, y lo reporta en el resultado", async () => {
    const fetchFalso = vi.fn(async () => {
      throw new Error("getaddrinfo ENOTFOUND");
    });
    const estrategias: EstrategiaAfiliacion[] = [
      {
        herramientaId: "hubspot",
        cuentas: [
          {
            id: "partnerstack",
            estado: "activo",
            plataforma: "PartnerStack",
            enlaces: [{ segmento: "global", url: "https://dominio-que-no-existe.invalid" }],
            ultimaRevision: "2026-08-25",
          },
        ],
      },
    ];

    const resultados = await verificarEnlacesActivos(estrategias, fetchFalso as unknown as typeof fetch);

    expect(resultados[0].ok).toBe(false);
    expect(resultados[0].error).toContain("ENOTFOUND");
  });

  it("devuelve un array vacío si ninguna cuenta tiene enlaces", async () => {
    const fetchFalso = vi.fn(async () => respuestaFalsa(200));
    const estrategias: EstrategiaAfiliacion[] = [
      { herramientaId: "hubspot", cuentas: [{ id: "partnerstack", estado: "no_solicitado", plataforma: "PartnerStack", enlaces: [], ultimaRevision: "2026-08-25" }] },
    ];

    const resultados = await verificarEnlacesActivos(estrategias, fetchFalso as unknown as typeof fetch);

    expect(resultados).toEqual([]);
    expect(fetchFalso).not.toHaveBeenCalled();
  });
});
