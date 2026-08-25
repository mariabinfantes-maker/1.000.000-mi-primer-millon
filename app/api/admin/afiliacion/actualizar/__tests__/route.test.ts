import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as actualizar } from "../route";
import { generarTokenSesion } from "@/lib/admin/sesion";
import { generarTokenCsrf } from "@/lib/admin/csrf";

/**
 * Regresión del bug encontrado durante el piloto (2026-08-25): al crear la
 * primera cuenta de una herramienta desde el panel sin pasar
 * plataforma/nombrePrograma explícitos (p. ej. al editar solo el enlace),
 * la columna "Programa" perdía el nombre real investigado por Researcher y
 * mostraba el id de cuenta genérico ("principal"). Usa
 * MOLNIP_E2E+ESTRATEGIA_AFILIACION_DIR con un directorio temporal propio
 * de este archivo — nunca toca `data/estrategia-afiliados/` real.
 */

const envOriginal = { ...process.env };
let dirTemporal: string;

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

describe("POST /api/admin/afiliacion/actualizar — siembra de plataforma/nombrePrograma en cuentas nuevas", () => {
  beforeEach(() => {
    dirTemporal = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-actualizar-route-"));
    process.env.MOLNIP_E2E = "true";
    process.env.ESTRATEGIA_AFILIACION_DIR = dirTemporal;
  });

  afterEach(() => {
    fs.rmSync(dirTemporal, { recursive: true, force: true });
    process.env = { ...envOriginal };
  });

  it("crea la cuenta con el nombrePrograma investigado por Researcher, no con el id de cuenta genérico", async () => {
    // hubspot tiene AffiliateData real investigado en data/afiliados/hubspot.json
    const respuesta = await actualizar(peticionAutenticada({ herramientaId: "hubspot", enlaceUrl: "https://ejemplo.com/prueba" }));
    expect(respuesta.status).toBe(200);

    const guardado = JSON.parse(fs.readFileSync(path.join(dirTemporal, "hubspot.json"), "utf-8"));
    expect(guardado.cuentas[0].nombrePrograma).not.toBe("principal");
    expect(typeof guardado.cuentas[0].nombrePrograma).toBe("string");
    expect(guardado.cuentas[0].nombrePrograma.length).toBeGreaterThan(0);
  });

  it("no pisa un nombrePrograma ya guardado en una cuenta existente", async () => {
    await actualizar(peticionAutenticada({ herramientaId: "hubspot", nombrePrograma: "Nombre corregido a mano" }));
    // Segunda edición, sin volver a pasar nombrePrograma:
    await actualizar(peticionAutenticada({ herramientaId: "hubspot", enlaceUrl: "https://ejemplo.com/otra" }));

    const guardado = JSON.parse(fs.readFileSync(path.join(dirTemporal, "hubspot.json"), "utf-8"));
    expect(guardado.cuentas[0].nombrePrograma).toBe("Nombre corregido a mano");
  });

  it("respeta un nombrePrograma explícito en la propia petición de creación", async () => {
    const respuesta = await actualizar(peticionAutenticada({ herramientaId: "una-herramienta-sin-affiliate-data", nombrePrograma: "Programa X" }));
    expect(respuesta.status).toBe(200);

    const guardado = JSON.parse(fs.readFileSync(path.join(dirTemporal, "una-herramienta-sin-affiliate-data.json"), "utf-8"));
    expect(guardado.cuentas[0].nombrePrograma).toBe("Programa X");
  });
});
