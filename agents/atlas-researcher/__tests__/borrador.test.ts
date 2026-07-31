import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { borradorYaExiste, escribirBorrador, leerBorrador, listarIdsBorradores } from "../borrador";
import type { HerramientaPropuesta } from "../tipos";

const propuestaDeEjemplo: HerramientaPropuesta = {
  datos: { nombre: "HubSpot", descripcion: "Un CRM." },
  datosAfiliados: { hasAffiliateProgram: true, affiliateStatus: "active", confidenceLevel: "medium" },
  camposFaltantes: ["idealPara"],
  fuentes: ["https://hubspot.com"],
  confianza: "media",
  advertencias: [],
};

describe("borrador", () => {
  let dirTemporal: string;

  beforeEach(() => {
    dirTemporal = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-borradores-"));
  });

  afterEach(() => {
    fs.rmSync(dirTemporal, { recursive: true, force: true });
  });

  it("escribe el borrador público y el de afiliados en directorios separados", () => {
    const resultado = escribirBorrador("hubspot", propuestaDeEjemplo, { dirBase: dirTemporal });

    expect(fs.existsSync(resultado.rutaHerramienta)).toBe(true);
    expect(fs.existsSync(resultado.rutaAfiliados)).toBe(true);
    expect(resultado.rutaHerramienta).toContain(`${path.sep}herramientas${path.sep}`);
    expect(resultado.rutaAfiliados).toContain(`${path.sep}afiliados${path.sep}`);
  });

  it("estampa id, estado en_revision y fechas en el lado público", () => {
    escribirBorrador("hubspot", propuestaDeEjemplo, { dirBase: dirTemporal });

    const escrito = JSON.parse(fs.readFileSync(path.join(dirTemporal, "herramientas", "hubspot.json"), "utf-8"));

    expect(escrito.id).toBe("hubspot");
    expect(escrito.estado).toBe("en_revision");
    expect(escrito.fechaAltaEnAtlas).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(escrito.fechaUltimaRevision).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // El resto de la propuesta se conserva tal cual, huecos incluidos.
    expect(escrito.nombre).toBe("HubSpot");
    expect(escrito.idealPara).toBeUndefined();
  });

  it("estampa herramientaId en el lado de afiliados", () => {
    escribirBorrador("hubspot", propuestaDeEjemplo, { dirBase: dirTemporal });

    const escrito = JSON.parse(fs.readFileSync(path.join(dirTemporal, "afiliados", "hubspot.json"), "utf-8"));

    expect(escrito.herramientaId).toBe("hubspot");
    expect(escrito.hasAffiliateProgram).toBe(true);
  });

  it("borradorYaExiste refleja si ya se ha escrito ese id", () => {
    expect(borradorYaExiste("hubspot", { dirBase: dirTemporal })).toBe(false);
    escribirBorrador("hubspot", propuestaDeEjemplo, { dirBase: dirTemporal });
    expect(borradorYaExiste("hubspot", { dirBase: dirTemporal })).toBe(true);
  });

  it("listarIdsBorradores devuelve [] si el directorio no existe todavía", () => {
    expect(listarIdsBorradores({ dirBase: dirTemporal })).toEqual([]);
  });

  it("listarIdsBorradores lista todos los ids escritos", () => {
    escribirBorrador("hubspot", propuestaDeEjemplo, { dirBase: dirTemporal });
    escribirBorrador("zoho-one", propuestaDeEjemplo, { dirBase: dirTemporal });

    expect(listarIdsBorradores({ dirBase: dirTemporal }).sort()).toEqual(["hubspot", "zoho-one"]);
  });

  it("leerBorrador devuelve undefined si no existe", () => {
    expect(leerBorrador("no-existe", { dirBase: dirTemporal })).toBeUndefined();
  });

  it("leerBorrador devuelve datos y datosAfiliados ya escritos", () => {
    escribirBorrador("hubspot", propuestaDeEjemplo, { dirBase: dirTemporal });

    const leido = leerBorrador("hubspot", { dirBase: dirTemporal });

    expect(leido).toBeDefined();
    expect((leido?.datos as { nombre: string }).nombre).toBe("HubSpot");
    expect((leido?.datosAfiliados as { herramientaId: string }).herramientaId).toBe("hubspot");
  });
});
