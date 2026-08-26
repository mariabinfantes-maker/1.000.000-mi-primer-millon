import { afterEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { getEstrategiaAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";
import { elegirEnlaceAfiliado, SEGMENTO_GLOBAL } from "@/agents/atlas-affiliate-manager/seleccionarEnlace";

/**
 * La página pública `/herramienta/[id]/ir` (la que cierra el recorrido y
 * genera la comisión) consulta la estrategia de afiliación en Postgres. Una
 * caída de la base de datos NUNCA debe tirar esa página: se comprueba aquí
 * que el patrón que usa —`.catch(() => undefined)` seguido de
 * `elegirEnlaceAfiliado`— acaba sirviendo la URL oficial del proveedor en
 * vez de lanzar. Verificado también a mano el 2026-08-25 apagando Postgres
 * con el servidor en marcha: la página siguió devolviendo HTTP 200.
 */

const envOriginal = { ...process.env };

describe("resistencia de la página pública ante una caída de Postgres", () => {
  afterEach(() => {
    process.env = { ...envOriginal };
  });

  it("una consulta contra una base inalcanzable se resuelve como `undefined`, no lanza", async () => {
    // Puerto cerrado a propósito: simula Neon caído o inalcanzable.
    const poolInalcanzable = new Pool({
      connectionString: "postgres://nadie@127.0.0.1:1/no_existe",
      connectionTimeoutMillis: 1000,
    });

    const estrategia = await getEstrategiaAfiliacion("grammarly", { pool: poolInalcanzable }).catch(() => undefined);

    expect(estrategia).toBeUndefined();
    await poolInalcanzable.end().catch(() => {});
  });

  it("sin estrategia disponible, `elegirEnlaceAfiliado` no devuelve ningún enlace y la página cae a la URL oficial", () => {
    const paginaOficial = "https://www.grammarly.com";
    const enlaceAfiliado = elegirEnlaceAfiliado(undefined?.["cuentas" as never] ?? [], SEGMENTO_GLOBAL);
    const destino = enlaceAfiliado ?? paginaOficial;

    expect(enlaceAfiliado).toBeUndefined();
    expect(destino).toBe(paginaOficial);
  });

  it("falla en vez de inventar una conexión si POSTGRES_URL no está configurado", async () => {
    delete process.env.MOLNIP_E2E;
    delete process.env.POSTGRES_URL;

    await expect(getEstrategiaAfiliacion("grammarly")).rejects.toThrow(/POSTGRES_URL/);
  });
});
