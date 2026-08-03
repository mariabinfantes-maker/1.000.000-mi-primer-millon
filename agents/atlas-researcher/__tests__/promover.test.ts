import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { escribirBorrador } from "../borrador";
import { registrarDecision } from "../decision";
import { promoverBorrador } from "../promover";
import type { HerramientaPropuesta } from "../tipos";
import { getEstrategiaAfiliacion, guardarEstrategiaAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";

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
  let dirEstrategia: string;

  beforeEach(() => {
    dirBorradores = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-promover-borradores-"));
    dirDatos = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-promover-datos-"));
    dirEstrategia = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-promover-estrategia-"));
  });

  afterEach(() => {
    fs.rmSync(dirBorradores, { recursive: true, force: true });
    fs.rmSync(dirDatos, { recursive: true, force: true });
    fs.rmSync(dirEstrategia, { recursive: true, force: true });
  });

  it("falla si no existe ningún borrador con ese id", () => {
    const resultado = promoverBorrador("no-existe", { dirBaseBorradores: dirBorradores, dirDatos, dirBaseEstrategia: dirEstrategia });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores[0]).toContain("No existe ningún borrador");
  });

  it("promueve un borrador válido y aprobado: escribe en el catálogo real y marca estado activo", () => {
    escribirBorrador("herramienta-de-prueba", propuestaValida, { dirBase: dirBorradores });
    registrarDecision("herramienta-de-prueba", "aprobado", "Datos completos, afiliado fiable.", { dirBase: dirBorradores });

    const resultado = promoverBorrador("herramienta-de-prueba", {
      dirBaseBorradores: dirBorradores,
      dirDatos,
      dirBaseEstrategia: dirEstrategia,
    });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      const escrita = JSON.parse(fs.readFileSync(resultado.rutaHerramienta, "utf-8"));
      expect(escrita.estado).toBe("activo");
      expect(escrita.nombre).toBe("Herramienta De Prueba");

      const escritaAfiliados = JSON.parse(fs.readFileSync(resultado.rutaAfiliados, "utf-8"));
      expect(escritaAfiliados.hasAffiliateProgram).toBe(true);
    }
  });

  it("siembra un registro inicial de estrategia de afiliación (no_solicitado) al promover con éxito", () => {
    escribirBorrador("herramienta-de-prueba", propuestaValida, { dirBase: dirBorradores });
    registrarDecision("herramienta-de-prueba", "aprobado", "Ok.", { dirBase: dirBorradores });

    promoverBorrador("herramienta-de-prueba", { dirBaseBorradores: dirBorradores, dirDatos, dirBaseEstrategia: dirEstrategia });

    const estrategia = getEstrategiaAfiliacion("herramienta-de-prueba", { dirBase: dirEstrategia });
    expect(estrategia?.cuentas[0].estado).toBe("no_solicitado");
    expect(estrategia?.herramientaId).toBe("herramienta-de-prueba");
  });

  it("no sobrescribe una estrategia de afiliación ya existente al promover", () => {
    escribirBorrador("herramienta-de-prueba", propuestaValida, { dirBase: dirBorradores });
    registrarDecision("herramienta-de-prueba", "aprobado", "Ok.", { dirBase: dirBorradores });
    guardarEstrategiaAfiliacion(
      {
        herramientaId: "herramienta-de-prueba",
        cuentas: [
          { id: "principal", estado: "activo", plataforma: "PartnerStack", fechaAprobacion: "2026-01-01", enlaces: [], ultimaRevision: "2026-01-01" },
        ],
      },
      { dirBase: dirEstrategia }
    );

    promoverBorrador("herramienta-de-prueba", { dirBaseBorradores: dirBorradores, dirDatos, dirBaseEstrategia: dirEstrategia });

    const estrategia = getEstrategiaAfiliacion("herramienta-de-prueba", { dirBase: dirEstrategia });
    expect(estrategia?.cuentas).toHaveLength(1);
    expect(estrategia?.cuentas[0].estado).toBe("activo");
    expect(estrategia?.cuentas[0].fechaAprobacion).toBe("2026-01-01");
  });

  it("falla si el borrador no cumple el esquema mínimo (campo obligatorio ausente)", () => {
    const propuestaIncompleta: HerramientaPropuesta = {
      ...propuestaValida,
      datos: { ...propuestaValida.datos, descripcion: undefined },
    };
    escribirBorrador("herramienta-incompleta", propuestaIncompleta, { dirBase: dirBorradores });

    const resultado = promoverBorrador("herramienta-incompleta", { dirBaseBorradores: dirBorradores, dirDatos, dirBaseEstrategia: dirEstrategia });

    expect(resultado.ok).toBe(false);
  });

  it("falla si la categoría referenciada no existe", () => {
    const propuestaCategoriaInvalida: HerramientaPropuesta = {
      ...propuestaValida,
      datos: { ...propuestaValida.datos, categoriaId: "categoria-inventada" },
    };
    escribirBorrador("herramienta-categoria-mala", propuestaCategoriaInvalida, { dirBase: dirBorradores });

    const resultado = promoverBorrador("herramienta-categoria-mala", { dirBaseBorradores: dirBorradores, dirDatos, dirBaseEstrategia: dirEstrategia });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores.some((e) => e.includes("categoría inexistente"))).toBe(true);
  });

  it("falla si el borrador no cumple la regla obligatoria de afiliados", () => {
    const propuestaSinAfiliados: HerramientaPropuesta = {
      ...propuestaValida,
      datosAfiliados: { hasAffiliateProgram: false, affiliateStatus: "not_available" },
    };
    escribirBorrador("herramienta-sin-afiliados", propuestaSinAfiliados, { dirBase: dirBorradores });

    const resultado = promoverBorrador("herramienta-sin-afiliados", { dirBaseBorradores: dirBorradores, dirDatos, dirBaseEstrategia: dirEstrategia });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores.some((e) => e.includes("regla obligatoria de afiliados"))).toBe(true);
  });

  it("falla si no hay ninguna decisión 'aprobado' registrada, aunque el borrador sea válido", () => {
    escribirBorrador("herramienta-sin-decision", propuestaValida, { dirBase: dirBorradores });
    // Deliberadamente sin registrarDecision: Atlas nunca debe promover sin aprobación explícita.

    const resultado = promoverBorrador("herramienta-sin-decision", { dirBaseBorradores: dirBorradores, dirDatos, dirBaseEstrategia: dirEstrategia });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.errores.some((e) => e.includes('no tiene una decisión "aprobado"'))).toBe(true);
    }
    expect(fs.existsSync(path.join(dirDatos, "herramientas", "herramienta-sin-decision.json"))).toBe(false);
  });

  it("falla si la decisión registrada es 'rechazado', aunque el borrador sea válido", () => {
    escribirBorrador("herramienta-rechazada", propuestaValida, { dirBase: dirBorradores });
    registrarDecision("herramienta-rechazada", "rechazado", "Comisión de afiliados sin confirmar.", {
      dirBase: dirBorradores,
    });

    const resultado = promoverBorrador("herramienta-rechazada", { dirBaseBorradores: dirBorradores, dirDatos, dirBaseEstrategia: dirEstrategia });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.errores.some((e) => e.includes('no tiene una decisión "aprobado"'))).toBe(true);
    }
  });

  it("falla si el id ya existe en el catálogo real (evita sobrescribir sin querer)", () => {
    escribirBorrador("hubspot", propuestaValida, { dirBase: dirBorradores });

    // "hubspot" ya existe en el catálogo real (data/herramientas/hubspot.json) — no se pasa dirDatos
    // de prueba aquí a propósito, para comprobar la colisión contra el catálogo real de verdad.
    const resultado = promoverBorrador("hubspot", { dirBaseBorradores: dirBorradores, dirBaseEstrategia: dirEstrategia });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores.some((e) => e.includes("ya existe en el catálogo real"))).toBe(true);
  });
});
