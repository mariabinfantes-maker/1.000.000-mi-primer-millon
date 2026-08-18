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
      facilidadDeUso: 9,
      calidad: 9,
      fiabilidad: 9,
      atencionAlCliente: 8,
      escalabilidad: 8,
      nivelTecnicoRequerido: 3,
    },
    metodologiaValoracion: "Basada en la documentación pública, pendiente de contrastar con uso real.",
  },
  // confidenceLevel "high" y puntuaciones altas: por encima del umbral del criterio de calidad
  // (agents/atlas-researcher/criteriosCalidad.ts) sin necesidad de reputación externa — los casos
  // límite de ese criterio (confianza media, puntuación insuficiente, advertencias) tienen sus
  // propios tests más abajo, para no acoplar este fixture "camino feliz" a esos umbrales.
  datosAfiliados: { hasAffiliateProgram: true, affiliateStatus: "active", confidenceLevel: "high" },
  camposFaltantes: [],
  fuentes: ["https://ejemplo.com"],
  confianza: "alta",
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

  it("falla si Atlas Curator detecta un casi-duplicado de otra herramienta ya en el catálogo, aunque el id sea distinto", () => {
    // Mismo nombre que "HubSpot" (data/herramientas/hubspot.json, catálogo real) bajo un id distinto —
    // exactamente el hueco que promoverBorrador() no cubría antes de Atlas Curator.
    const propuestaDuplicada: HerramientaPropuesta = {
      ...propuestaValida,
      datos: { ...propuestaValida.datos, nombre: "HubSpot" },
    };
    escribirBorrador("hubspot-marketing-hub", propuestaDuplicada, { dirBase: dirBorradores });
    registrarDecision("hubspot-marketing-hub", "aprobado", "Datos completos, afiliado fiable.", { dirBase: dirBorradores });

    const resultado = promoverBorrador("hubspot-marketing-hub", { dirBaseBorradores: dirBorradores, dirBaseEstrategia: dirEstrategia });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.errores.some((e) => e.startsWith("Atlas Curator:") && e.includes("HubSpot"))).toBe(true);
    }
  });

  it("falla si la Puntuación Molnip queda por debajo del umbral de calidad (regla aprobada el 2026-08-18)", () => {
    const propuestaMediocre: HerramientaPropuesta = {
      ...propuestaValida,
      datos: {
        ...propuestaValida.datos,
        puntuaciones: { facilidadDeUso: 5, calidad: 5, fiabilidad: 5, atencionAlCliente: 5, escalabilidad: 5, nivelTecnicoRequerido: 5 },
      },
    };
    escribirBorrador("herramienta-mediocre", propuestaMediocre, { dirBase: dirBorradores });
    registrarDecision("herramienta-mediocre", "aprobado", "Datos completos.", { dirBase: dirBorradores });

    const resultado = promoverBorrador("herramienta-mediocre", { dirBaseBorradores: dirBorradores, dirDatos, dirBaseEstrategia: dirEstrategia });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.errores.some((e) => e.startsWith("Criterio de calidad:") && e.includes("Puntuación Molnip"))).toBe(true);
    }
  });

  it("promueve y siembra la cuenta con verificacionPendiente cuando el programa de afiliados existe pero un dato secundario tiene confianza media", () => {
    const propuestaConfianzaMedia: HerramientaPropuesta = {
      ...propuestaValida,
      datosAfiliados: { hasAffiliateProgram: true, affiliateStatus: "active", confidenceLevel: "medium" },
    };
    escribirBorrador("herramienta-afiliacion-media", propuestaConfianzaMedia, { dirBase: dirBorradores });
    registrarDecision("herramienta-afiliacion-media", "aprobado", "Datos completos.", { dirBase: dirBorradores });

    const resultado = promoverBorrador("herramienta-afiliacion-media", {
      dirBaseBorradores: dirBorradores,
      dirDatos,
      dirBaseEstrategia: dirEstrategia,
    });

    // Sin reputación externa investigada — la política no la exige: lo único que importaba
    // bloquear era que el programa en sí no pudiera confirmarse, y aquí sí está confirmado.
    expect(resultado.ok).toBe(true);
    const estrategia = getEstrategiaAfiliacion("herramienta-afiliacion-media", { dirBase: dirEstrategia });
    expect(estrategia?.cuentas[0].verificacionPendiente).toBe(true);
    expect(estrategia?.cuentas[0].observaciones).toContain("Verificación pendiente");
  });

  it("no marca verificacionPendiente cuando la afiliación tiene confianza alta", () => {
    escribirBorrador("herramienta-confianza-alta", propuestaValida, { dirBase: dirBorradores });
    registrarDecision("herramienta-confianza-alta", "aprobado", "Datos completos.", { dirBase: dirBorradores });

    const resultado = promoverBorrador("herramienta-confianza-alta", {
      dirBaseBorradores: dirBorradores,
      dirDatos,
      dirBaseEstrategia: dirEstrategia,
    });

    expect(resultado.ok).toBe(true);
    const estrategia = getEstrategiaAfiliacion("herramienta-confianza-alta", { dirBase: dirEstrategia });
    expect(estrategia?.cuentas[0].verificacionPendiente).toBeUndefined();
  });
});
