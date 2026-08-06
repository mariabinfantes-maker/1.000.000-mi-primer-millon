import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ejecutarLote, type CandidatoLote } from "../lote";
import type { ProveedorIA } from "@/agents/compartido/proveedorIA";

const AFFILIATE_FIABLE = { hasAffiliateProgram: true, affiliateStatus: "active", confidenceLevel: "medium", source: "https://x.com" };
const AFFILIATE_SIN_PROGRAMA = { hasAffiliateProgram: false, affiliateStatus: "not_available" };

function esPromptDePrechequeo(prompt: string): boolean {
  return prompt.includes("RÁPIDA y previa");
}

/** Proveedor falso: decide su respuesta según si el prompt es de prechequeo o de investigación completa, y según qué herramienta menciona. */
function proveedorPorHerramienta(
  comportamiento: Record<string, { prechequeo?: unknown; investigacion?: unknown }>
): ProveedorIA {
  return {
    nombre: "proveedor-falso",
    generarJson: vi.fn(async (prompt: string) => {
      const nombre = Object.keys(comportamiento).find((n) => prompt.includes(n));
      if (!nombre) throw new Error(`Prompt inesperado en el test: ${prompt.slice(0, 60)}...`);
      const respuestas = comportamiento[nombre];
      return esPromptDePrechequeo(prompt) ? respuestas.prechequeo : respuestas.investigacion;
    }),
  };
}

describe("ejecutarLote", () => {
  let dirTemporal: string;

  beforeEach(() => {
    dirTemporal = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-lote-"));
  });

  afterEach(() => {
    fs.rmSync(dirTemporal, { recursive: true, force: true });
  });

  it("marca como duplicado un candidato cuyo id ya existe, sin llamar al proveedor", async () => {
    const proveedor = proveedorPorHerramienta({});
    const candidatos: CandidatoLote[] = [{ nombreHerramienta: "HubSpot" }];

    const resumen = await ejecutarLote(candidatos, ["hubspot"], proveedor, { dirBaseBorradores: dirTemporal });

    expect(resumen.resultados[0]).toMatchObject({ estado: "duplicado", id: "hubspot" });
    expect(proveedor.generarJson).not.toHaveBeenCalled();
    expect(resumen.totales).toMatchObject({ total: 1, duplicados: 1, aceptados: 0 });
  });

  it("deduplica dentro del mismo lote cuando dos candidatos generan el mismo id", async () => {
    const proveedor = proveedorPorHerramienta({
      HubSpot: { prechequeo: AFFILIATE_FIABLE, investigacion: { datos: { nombre: "HubSpot" }, affiliateData: AFFILIATE_FIABLE, fuentes: ["https://hubspot.com"] } },
    });
    const candidatos: CandidatoLote[] = [{ nombreHerramienta: "HubSpot" }, { nombreHerramienta: "HubSpot" }];

    const resumen = await ejecutarLote(candidatos, [], proveedor, { dirBaseBorradores: dirTemporal });

    const estados = resumen.resultados.map((r) => r.estado);
    expect(estados.filter((e) => e === "duplicado")).toHaveLength(1);
    expect(estados.filter((e) => e === "aceptado")).toHaveLength(1);
  });

  it("descarta en el prechequeo sin llegar a investigar (ahorra la llamada completa)", async () => {
    const proveedor = proveedorPorHerramienta({
      SinAfiliados: { prechequeo: AFFILIATE_SIN_PROGRAMA },
    });
    const candidatos: CandidatoLote[] = [{ nombreHerramienta: "SinAfiliados" }];

    const resumen = await ejecutarLote(candidatos, [], proveedor, { dirBaseBorradores: dirTemporal });

    expect(resumen.resultados[0].estado).toBe("descartado_prechequeo");
    expect(proveedor.generarJson).toHaveBeenCalledTimes(1);
    expect(resumen.totales.descartados).toBe(1);
  });

  it("pasa el prechequeo pero la investigación completa descarta por la regla de negocio: no escribe borrador", async () => {
    const proveedor = proveedorPorHerramienta({
      DudosaEnDetalle: {
        prechequeo: AFFILIATE_FIABLE,
        investigacion: { datos: { nombre: "DudosaEnDetalle" }, affiliateData: AFFILIATE_SIN_PROGRAMA, fuentes: ["https://x.com"] },
      },
    });
    const candidatos: CandidatoLote[] = [{ nombreHerramienta: "DudosaEnDetalle" }];

    const resumen = await ejecutarLote(candidatos, [], proveedor, { dirBaseBorradores: dirTemporal });

    expect(resumen.resultados[0].estado).toBe("descartado_investigacion");
    expect(fs.existsSync(path.join(dirTemporal, "herramientas", "dudosaendetalle.json"))).toBe(false);
  });

  it("acepta y escribe el borrador cuando pasa las dos etapas", async () => {
    const proveedor = proveedorPorHerramienta({
      HubSpot: {
        prechequeo: AFFILIATE_FIABLE,
        investigacion: { datos: { nombre: "HubSpot", descripcion: "Un CRM." }, affiliateData: AFFILIATE_FIABLE, fuentes: ["https://hubspot.com"] },
      },
    });
    const candidatos: CandidatoLote[] = [{ nombreHerramienta: "HubSpot" }];

    const resumen = await ejecutarLote(candidatos, [], proveedor, { dirBaseBorradores: dirTemporal });

    expect(resumen.resultados[0].estado).toBe("aceptado");
    expect(fs.existsSync(path.join(dirTemporal, "herramientas", "hubspot.json"))).toBe(true);
    expect(resumen.totales).toMatchObject({ total: 1, aceptados: 1 });
  });

  it("reintenta un fallo transitorio del proveedor y acepta si el reintento tiene éxito", async () => {
    let intentos = 0;
    const proveedor: ProveedorIA = {
      nombre: "proveedor-falso",
      generarJson: vi.fn(async (prompt: string) => {
        if (esPromptDePrechequeo(prompt)) {
          intentos += 1;
          if (intentos === 1) throw new Error("Fallo transitorio de red.");
          return AFFILIATE_FIABLE;
        }
        return { datos: { nombre: "HubSpot" }, affiliateData: AFFILIATE_FIABLE, fuentes: ["https://hubspot.com"] };
      }),
    };
    const candidatos: CandidatoLote[] = [{ nombreHerramienta: "HubSpot" }];

    const resumen = await ejecutarLote(candidatos, [], proveedor, {
      dirBaseBorradores: dirTemporal,
      reintentos: 1,
      esperaBaseReintentoMs: 0,
    });

    expect(resumen.resultados[0].estado).toBe("aceptado");
    expect(intentos).toBe(2);
  });

  it("marca como fallido tras agotar los reintentos", async () => {
    const proveedor: ProveedorIA = {
      nombre: "proveedor-falso",
      generarJson: vi.fn(async () => {
        throw new Error("La API no responde.");
      }),
    };
    const candidatos: CandidatoLote[] = [{ nombreHerramienta: "HubSpot" }];

    const resumen = await ejecutarLote(candidatos, [], proveedor, {
      dirBaseBorradores: dirTemporal,
      reintentos: 1,
      esperaBaseReintentoMs: 0,
    });

    expect(resumen.resultados[0]).toMatchObject({ estado: "fallido" });
    // Prechequeo: 1 intento inicial + 1 reintento = 2 llamadas. Nunca llega a la investigación completa.
    expect(proveedor.generarJson).toHaveBeenCalledTimes(2);
  });

  it("no supera la concurrencia configurada", async () => {
    let enVuelo = 0;
    let maximoObservado = 0;
    const proveedor: ProveedorIA = {
      nombre: "proveedor-falso",
      generarJson: vi.fn(async (prompt: string) => {
        enVuelo += 1;
        maximoObservado = Math.max(maximoObservado, enVuelo);
        await new Promise((resolve) => setTimeout(resolve, 5));
        enVuelo -= 1;
        return esPromptDePrechequeo(prompt) ? AFFILIATE_SIN_PROGRAMA : {};
      }),
    };
    const candidatos: CandidatoLote[] = Array.from({ length: 6 }, (_, i) => ({ nombreHerramienta: `Herramienta${i}` }));

    await ejecutarLote(candidatos, [], proveedor, { dirBaseBorradores: dirTemporal, concurrencia: 2 });

    expect(maximoObservado).toBeLessThanOrEqual(2);
  });

  it("el resumen cuenta correctamente cada categoría", async () => {
    const proveedor = proveedorPorHerramienta({
      Aceptada: {
        prechequeo: AFFILIATE_FIABLE,
        investigacion: { datos: { nombre: "Aceptada" }, affiliateData: AFFILIATE_FIABLE, fuentes: ["https://x.com"] },
      },
      Descartada: { prechequeo: AFFILIATE_SIN_PROGRAMA },
    });
    const candidatos: CandidatoLote[] = [{ nombreHerramienta: "Aceptada" }, { nombreHerramienta: "Descartada" }, { nombreHerramienta: "Aceptada" }];

    const resumen = await ejecutarLote(candidatos, [], proveedor, { dirBaseBorradores: dirTemporal });

    expect(resumen.totales).toEqual({ total: 3, aceptados: 1, duplicados: 1, descartados: 1, fallidos: 0 });
  });

  describe("límite de velocidad (maxPeticionesPorMinuto)", () => {
    it("no permite más de maxPeticionesPorMinuto llamadas dentro de la ventana configurada", async () => {
      const marcasDeTiempo: number[] = [];
      const proveedor: ProveedorIA = {
        nombre: "proveedor-falso",
        generarJson: vi.fn(async () => {
          marcasDeTiempo.push(Date.now());
          return AFFILIATE_SIN_PROGRAMA; // se descarta en el prechequeo: una sola llamada por candidato
        }),
      };
      const candidatos: CandidatoLote[] = Array.from({ length: 4 }, (_, i) => ({ nombreHerramienta: `Herramienta${i}` }));

      await ejecutarLote(candidatos, [], proveedor, {
        dirBaseBorradores: dirTemporal,
        concurrencia: 4,
        maxPeticionesPorMinuto: 2,
        ventanaLimiteMs: 200,
      });

      expect(marcasDeTiempo).toHaveLength(4);
      // Con hueco para 2 peticiones por ventana de 200ms, la 3ª y 4ª deben esperar a que las 2 primeras "caduquen".
      expect(marcasDeTiempo[2] - marcasDeTiempo[0]).toBeGreaterThanOrEqual(190);
      expect(marcasDeTiempo[3] - marcasDeTiempo[1]).toBeGreaterThanOrEqual(190);
    });

    it("sin maxPeticionesPorMinuto no aplica ningún límite", async () => {
      const inicio = Date.now();
      const proveedor: ProveedorIA = {
        nombre: "proveedor-falso",
        generarJson: vi.fn(async () => AFFILIATE_SIN_PROGRAMA),
      };
      const candidatos: CandidatoLote[] = Array.from({ length: 4 }, (_, i) => ({ nombreHerramienta: `Herramienta${i}` }));

      await ejecutarLote(candidatos, [], proveedor, { dirBaseBorradores: dirTemporal, concurrencia: 4 });

      expect(Date.now() - inicio).toBeLessThan(190);
    });
  });

  describe("backoff ante error de cuota", () => {
    it("espera el tiempo que sugiere el proveedor en el mensaje, no el backoff corto genérico", async () => {
      let intentosPrechequeo = 0;
      const marcasPrechequeo: number[] = [];
      const proveedor: ProveedorIA = {
        nombre: "proveedor-falso",
        generarJson: vi.fn(async (prompt: string) => {
          if (!esPromptDePrechequeo(prompt)) {
            return { datos: { nombre: "HubSpot" }, affiliateData: AFFILIATE_FIABLE, fuentes: ["https://hubspot.com"] };
          }
          marcasPrechequeo.push(Date.now());
          intentosPrechequeo += 1;
          if (intentosPrechequeo === 1) {
            throw new Error("Quota exceeded for quota metric. Please retry in ~0.3s.");
          }
          return AFFILIATE_FIABLE;
        }),
      };
      const candidatos: CandidatoLote[] = [{ nombreHerramienta: "HubSpot" }];

      await ejecutarLote(candidatos, [], proveedor, {
        dirBaseBorradores: dirTemporal,
        reintentos: 1,
        esperaBaseReintentoMs: 0, // un fallo genérico esperaría ~0ms; el de cuota debe ignorar esto
        margenEsperaCuotaMs: 0,
      });

      expect(marcasPrechequeo).toHaveLength(2);
      expect(marcasPrechequeo[1] - marcasPrechequeo[0]).toBeGreaterThanOrEqual(290);
    });

    it("usa una espera fija por defecto si el mensaje de cuota no incluye un tiempo sugerido", async () => {
      let intentosPrechequeo = 0;
      const marcasPrechequeo: number[] = [];
      const proveedor: ProveedorIA = {
        nombre: "proveedor-falso",
        generarJson: vi.fn(async (prompt: string) => {
          if (!esPromptDePrechequeo(prompt)) {
            return { datos: { nombre: "HubSpot" }, affiliateData: AFFILIATE_FIABLE, fuentes: ["https://hubspot.com"] };
          }
          marcasPrechequeo.push(Date.now());
          intentosPrechequeo += 1;
          if (intentosPrechequeo === 1) throw new Error("Quota exceeded, sin pista de tiempo de espera.");
          return AFFILIATE_FIABLE;
        }),
      };
      const candidatos: CandidatoLote[] = [{ nombreHerramienta: "HubSpot" }];

      await ejecutarLote(candidatos, [], proveedor, {
        dirBaseBorradores: dirTemporal,
        reintentos: 1,
        esperaCuotaPorDefectoMs: 150,
        margenEsperaCuotaMs: 0,
      });

      expect(marcasPrechequeo).toHaveLength(2);
      expect(marcasPrechequeo[1] - marcasPrechequeo[0]).toBeGreaterThanOrEqual(140);
    });

    it("un fallo genérico (no de cuota) sigue usando el backoff exponencial corto", async () => {
      let intentosPrechequeo = 0;
      const marcasPrechequeo: number[] = [];
      const proveedor: ProveedorIA = {
        nombre: "proveedor-falso",
        generarJson: vi.fn(async (prompt: string) => {
          if (!esPromptDePrechequeo(prompt)) {
            return { datos: { nombre: "HubSpot" }, affiliateData: AFFILIATE_FIABLE, fuentes: ["https://hubspot.com"] };
          }
          marcasPrechequeo.push(Date.now());
          intentosPrechequeo += 1;
          if (intentosPrechequeo === 1) throw new Error("Fallo de red puntual, no relacionado con cuota.");
          return AFFILIATE_FIABLE;
        }),
      };
      const candidatos: CandidatoLote[] = [{ nombreHerramienta: "HubSpot" }];

      const inicio = Date.now();
      await ejecutarLote(candidatos, [], proveedor, {
        dirBaseBorradores: dirTemporal,
        reintentos: 1,
        esperaBaseReintentoMs: 0,
        esperaCuotaPorDefectoMs: 10000, // si se confundiera con un error de cuota, tardaría segundos
      });

      expect(Date.now() - inicio).toBeLessThan(500);
    });
  });
});
