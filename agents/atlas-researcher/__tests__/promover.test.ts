import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { escribirBorrador } from "../borrador";
import { promoverBorrador } from "../promover";
import type { HerramientaPropuesta } from "../tipos";

/** Ficha completa y válida contra `validarHerramienta` — la categoría "plataformas-todo-en-uno" es real (la única en `data/categorias.json`). */
const propuestaValida: HerramientaPropuesta = {
  datos: {
    nombre: "Herramienta De Prueba",
    paginaOficial: "https://ejemplo.com",
    categoriaId: "plataformas-todo-en-uno",
    descripcion: "Una herramienta de prueba para los tests de promoción.",
    problemasQueResuelve: ["Gestión de clientes"],
    casosDeUso: ["Seguimiento de leads"],
    idealPara: "Pymes pequeñas.",
    segmentosIdeales: ["1-10"],
    industriasIdeales: ["Servicios"],
    noRecomendadaPara: "Grandes corporaciones.",
    casosNoRecomendados: ["Empresas con miles de empleados"],
    funcionesPrincipales: ["CRM básico"],
    integraciones: ["Gmail"],
    precioInicial: "Desde 10€/mes",
    modeloDePrecio: ["suscripcion_mensual"],
    tienePlanGratuito: true,
    idiomasDisponibles: ["Español"],
    ventajas: ["Fácil de usar"],
    inconvenientes: ["Pocas integraciones"],
    puntuaciones: {
      facilidadDeUso: 8,
      calidad: 7,
      fiabilidad: 7,
      atencionAlCliente: 6,
      escalabilidad: 5,
      nivelTecnicoRequerido: 3,
    },
    metodologiaValoracion: "Basada en la documentación pública, pendiente de contrastar con uso real.",
  },
  datosAfiliados: { hasAffiliateProgram: true, affiliateStatus: "active", confidenceLevel: "medium" },
  camposFaltantes: [],
  fuentes: ["https://ejemplo.com"],
  confianza: "media",
  advertencias: [],
};

describe("promoverBorrador", () => {
  let dirBorradores: string;
  let dirDatos: string;

  beforeEach(() => {
    dirBorradores = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-promover-borradores-"));
    dirDatos = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-promover-datos-"));
  });

  afterEach(() => {
    fs.rmSync(dirBorradores, { recursive: true, force: true });
    fs.rmSync(dirDatos, { recursive: true, force: true });
  });

  it("falla si no existe ningún borrador con ese id", () => {
    const resultado = promoverBorrador("no-existe", { dirBaseBorradores: dirBorradores, dirDatos });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores[0]).toContain("No existe ningún borrador");
  });

  it("promueve un borrador válido: escribe en el catálogo real y marca estado activo", () => {
    escribirBorrador("herramienta-de-prueba", propuestaValida, { dirBase: dirBorradores });

    const resultado = promoverBorrador("herramienta-de-prueba", { dirBaseBorradores: dirBorradores, dirDatos });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      const escrita = JSON.parse(fs.readFileSync(resultado.rutaHerramienta, "utf-8"));
      expect(escrita.estado).toBe("activo");
      expect(escrita.nombre).toBe("Herramienta De Prueba");

      const escritaAfiliados = JSON.parse(fs.readFileSync(resultado.rutaAfiliados, "utf-8"));
      expect(escritaAfiliados.hasAffiliateProgram).toBe(true);
    }
  });

  it("falla si el borrador no cumple el esquema mínimo (campo obligatorio ausente)", () => {
    const propuestaIncompleta: HerramientaPropuesta = {
      ...propuestaValida,
      datos: { ...propuestaValida.datos, descripcion: undefined },
    };
    escribirBorrador("herramienta-incompleta", propuestaIncompleta, { dirBase: dirBorradores });

    const resultado = promoverBorrador("herramienta-incompleta", { dirBaseBorradores: dirBorradores, dirDatos });

    expect(resultado.ok).toBe(false);
  });

  it("falla si la categoría referenciada no existe", () => {
    const propuestaCategoriaInvalida: HerramientaPropuesta = {
      ...propuestaValida,
      datos: { ...propuestaValida.datos, categoriaId: "categoria-inventada" },
    };
    escribirBorrador("herramienta-categoria-mala", propuestaCategoriaInvalida, { dirBase: dirBorradores });

    const resultado = promoverBorrador("herramienta-categoria-mala", { dirBaseBorradores: dirBorradores, dirDatos });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores.some((e) => e.includes("categoría inexistente"))).toBe(true);
  });

  it("falla si el borrador no cumple la regla obligatoria de afiliados", () => {
    const propuestaSinAfiliados: HerramientaPropuesta = {
      ...propuestaValida,
      datosAfiliados: { hasAffiliateProgram: false, affiliateStatus: "not_available" },
    };
    escribirBorrador("herramienta-sin-afiliados", propuestaSinAfiliados, { dirBase: dirBorradores });

    const resultado = promoverBorrador("herramienta-sin-afiliados", { dirBaseBorradores: dirBorradores, dirDatos });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores.some((e) => e.includes("regla obligatoria de afiliados"))).toBe(true);
  });

  it("falla si el id ya existe en el catálogo real (evita sobrescribir sin querer)", () => {
    escribirBorrador("hubspot", propuestaValida, { dirBase: dirBorradores });

    // "hubspot" ya existe en el catálogo real (data/herramientas/hubspot.json) — no se pasa dirDatos
    // de prueba aquí a propósito, para comprobar la colisión contra el catálogo real de verdad.
    const resultado = promoverBorrador("hubspot", { dirBaseBorradores: dirBorradores });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores.some((e) => e.includes("ya existe en el catálogo real"))).toBe(true);
  });
});
