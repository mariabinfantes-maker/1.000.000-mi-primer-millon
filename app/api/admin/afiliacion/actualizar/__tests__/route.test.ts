import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as actualizar } from "../route";
import { generarTokenSesion } from "@/lib/admin/sesion";
import { generarTokenCsrf } from "@/lib/admin/csrf";
import { getEstrategiaAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";
import { limpiarTablasDePrueba, poolDePrueba, postgresDisponible } from "@/data/db/__tests__/entornoPruebaPostgres";

/**
 * Regresión del bug encontrado durante el piloto (2026-08-25): al crear la
 * primera cuenta de una herramienta desde el panel sin pasar
 * plataforma/nombrePrograma explícitos (p. ej. al editar solo el enlace),
 * la columna "Programa" perdía el nombre real investigado por Researcher y
 * mostraba el id de cuenta genérico ("principal"). Usa
 * MOLNIP_E2E+POSTGRES_URL_TEST contra el Postgres local temporal de
 * `vitest.global-setup.postgres.ts` — nunca toca Neon real.
 */

const envOriginal = { ...process.env };

function peticionAutenticada(body: unknown): Request {
  const sesion = generarTokenSesion("admin-test");
  const csrf = generarTokenCsrf();
  return new Request("https://molnip.com/api/admin/afiliacion/actualizar", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: `molnip_admin_sesion=${sesion}; molnip_admin_csrf=${csrf}`,
      "x-csrf-token": csrf,
    },
    body: JSON.stringify(body),
  });
}

describe.skipIf(!postgresDisponible())("POST /api/admin/afiliacion/actualizar — siembra de plataforma/nombrePrograma en cuentas nuevas", () => {
  beforeEach(async () => {
    process.env.MOLNIP_E2E = "true";
    await limpiarTablasDePrueba();
  });

  afterEach(() => {
    process.env = { ...envOriginal };
  });

  it("crea la cuenta con el nombrePrograma investigado por Researcher, no con el id de cuenta genérico", async () => {
    // hubspot tiene AffiliateData real investigado en data/afiliados/hubspot.json
    const respuesta = await actualizar(peticionAutenticada({ herramientaId: "hubspot", enlaceUrl: "https://ejemplo.com/prueba" }));
    expect(respuesta.status).toBe(200);

    const guardado = await getEstrategiaAfiliacion("hubspot", { pool: poolDePrueba() });
    expect(guardado?.cuentas[0].nombrePrograma).not.toBe("principal");
    expect(typeof guardado?.cuentas[0].nombrePrograma).toBe("string");
    expect(guardado?.cuentas[0].nombrePrograma?.length ?? 0).toBeGreaterThan(0);
  });

  it("no pisa un nombrePrograma ya guardado en una cuenta existente", async () => {
    await actualizar(peticionAutenticada({ herramientaId: "hubspot", nombrePrograma: "Nombre corregido a mano" }));
    // Segunda edición, sin volver a pasar nombrePrograma:
    await actualizar(peticionAutenticada({ herramientaId: "hubspot", enlaceUrl: "https://ejemplo.com/otra" }));

    const guardado = await getEstrategiaAfiliacion("hubspot", { pool: poolDePrueba() });
    expect(guardado?.cuentas[0].nombrePrograma).toBe("Nombre corregido a mano");
  });

  it("respeta un nombrePrograma explícito en la propia petición de creación", async () => {
    const respuesta = await actualizar(peticionAutenticada({ herramientaId: "una-herramienta-sin-affiliate-data", nombrePrograma: "Programa X" }));
    expect(respuesta.status).toBe(200);

    const guardado = await getEstrategiaAfiliacion("una-herramienta-sin-affiliate-data", { pool: poolDePrueba() });
    expect(guardado?.cuentas[0].nombrePrograma).toBe("Programa X");
  });

  it("registra en el historial quién hizo el cambio (usuario de la sesión autenticada)", async () => {
    await actualizar(peticionAutenticada({ herramientaId: "hubspot", enlaceUrl: "https://ejemplo.com/prueba" }));

    const { rows } = await poolDePrueba().query(
      `SELECT usuario FROM historial_cambios_afiliacion WHERE herramienta_id = 'hubspot'`
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((f: { usuario: string }) => f.usuario === "admin-test")).toBe(true);
  });
});
