import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  comprobarAutorizacion,
  leerAutorizacionAfiliacion,
  registrarAutorizacionAfiliacion,
} from "../autorizacionAfiliacion";
import { registrarDecision } from "../decision";
import { ejecutarLote } from "../lote";
import { leerPendiente } from "../pendientes";
import type { ProveedorIA } from "@/agents/compartido/proveedorIA";

const MOTIVO = "Única herramienta que cubre reserva online en español para peluquerías.";

describe("REGRESIÓN · 2. la autorización está atada a la excepción concreta", () => {
  let dirBase: string;

  beforeEach(() => {
    dirBase = fs.mkdtempSync(path.join(os.tmpdir(), "reg2-"));
  });
  afterEach(() => fs.rmSync(dirBase, { recursive: true, force: true }));

  it("sin autorización no se abre la excepción, por mucha decisión editorial que haya", () => {
    registrarDecision("viday", "aprobado", "La ficha está muy completa.", { dirBase });

    const r = comprobarAutorizacion("viday", "no_consta", { dirBase });

    expect(r.autorizada).toBe(false);
    if (!r.autorizada) expect(r.explicacion).toContain("autorizar-afiliacion");
  });

  it("la autorización vale sólo para el estado exacto que se autorizó", () => {
    registrarAutorizacionAfiliacion("viday", "no_consta", MOTIVO, { dirBase });

    expect(comprobarAutorizacion("viday", "no_consta", { dirBase }).autorizada).toBe(true);

    const otra = comprobarAutorizacion("viday", "ausencia_demostrada", { dirBase });
    expect(otra.autorizada).toBe(false);
    if (!otra.autorizada) expect(otra.explicacion).toContain("ya no es lo que hay");
  });

  it("la autorización de una herramienta no sirve para otra", () => {
    registrarAutorizacionAfiliacion("viday", "no_consta", MOTIVO, { dirBase });

    expect(comprobarAutorizacion("fresha", "no_consta", { dirBase }).autorizada).toBe(false);
  });

  it("un motivo vacío o de relleno no es una justificación", () => {
    for (const malo of ["", "   ", "x", "ok", "porque si"]) {
      expect(() => registrarAutorizacionAfiliacion("viday", "no_consta", malo, { dirBase })).toThrow(/al menos/);
    }
    expect(leerAutorizacionAfiliacion("viday", { dirBase })).toBeUndefined();
  });

  it("una afiliación confirmada no necesita autorización ninguna", () => {
    expect(comprobarAutorizacion("hubspot", "confirmada", { dirBase }).autorizada).toBe(true);
  });

  it("ningún id de autorización sale de su carpeta", () => {
    expect(() => registrarAutorizacionAfiliacion("../fuera", "no_consta", MOTIVO, { dirBase })).toThrow(/inválido/);
    expect(fs.existsSync(path.join(dirBase, "fuera.json"))).toBe(false);
  });
});

describe("REGRESIÓN · 3. ningún camino investiga sin la autorización específica", () => {
  let dirBase: string;

  beforeEach(() => {
    dirBase = fs.mkdtempSync(path.join(os.tmpdir(), "reg3-"));
  });
  afterEach(() => fs.rmSync(dirBase, { recursive: true, force: true }));

  /** Responde al prechequeo "sin programa" y, a la investigación completa, una ficha cualquiera. */
  function proveedorQueCuenta() {
    const llamadas: string[] = [];
    const proveedor: ProveedorIA = {
      nombre: "p",
      generarJson: vi.fn(async (prompt: string) => {
        const esPrechequeo = prompt.includes("RÁPIDA y previa");
        llamadas.push(esPrechequeo ? "prechequeo" : "investigacion");
        return esPrechequeo
          ? { hasAffiliateProgram: false, affiliateStatus: "not_available" }
          : { datos: { nombre: "ViDay" }, affiliateData: { hasAffiliateProgram: false }, fuentes: ["https://viday.es"] };
      }),
    };
    return { proveedor, llamadas };
  }

  it("el lote para en el prechequeo: nunca llega a la investigación completa", async () => {
    const { proveedor, llamadas } = proveedorQueCuenta();

    const resumen = await ejecutarLote([{ nombreHerramienta: "ViDay" }], [], proveedor, { dirBaseBorradores: dirBase, prechequearAfiliacion: true });

    expect(resumen.resultados[0].estado).toBe("pendiente_de_decision");
    expect(llamadas).toEqual(["prechequeo"]);
  });

  /**
   * Una autorización registrada NO hace que el lote investigue por su
   * cuenta: el lote siempre para, y quien reanuda es
   * `investigar-pendiente`, a mano. Autorizar no es encargar.
   */
  it("ni siquiera con autorización registrada el lote se lanza a investigar solo", async () => {
    registrarAutorizacionAfiliacion("viday", "no_consta", MOTIVO, { dirBase });
    const { proveedor, llamadas } = proveedorQueCuenta();

    await ejecutarLote([{ nombreHerramienta: "ViDay" }], [], proveedor, { dirBaseBorradores: dirBase, prechequearAfiliacion: true });

    expect(llamadas).toEqual(["prechequeo"]);
    expect(leerPendiente("viday", { dirBase })).toBeDefined();
  });

  it("la puerta que usan los tres caminos es la misma función, y niega por defecto", () => {
    // `cli.ts`, `cli-investigar-pendiente.ts` y `promover.ts` llaman todos aquí.
    expect(comprobarAutorizacion("viday", "no_consta", { dirBase }).autorizada).toBe(false);
    expect(comprobarAutorizacion("viday", "ausencia_demostrada", { dirBase }).autorizada).toBe(false);
  });
});

describe("REGRESIÓN · 3 bis. los tres CLI comparten la puerta", () => {
  const raiz = path.join(process.cwd(), "agents", "atlas-researcher");

  for (const cli of ["cli.ts", "cli-investigar-pendiente.ts", "promover.ts"]) {
    it(`${cli} pasa por comprobarAutorizacion`, () => {
      expect(fs.readFileSync(path.join(raiz, cli), "utf-8")).toContain("comprobarAutorizacion");
    });
  }

  it("ya no queda ninguna bandera que abra la excepción sin registro", () => {
    for (const fichero of fs.readdirSync(raiz).filter((f) => f.endsWith(".ts"))) {
      const codigo = fs.readFileSync(path.join(raiz, fichero), "utf-8");
      expect(codigo).not.toContain("admitirSinAfiliacion");
      expect(codigo).not.toContain("justificacionSinAfiliacion");
    }
  });
});
