import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { recomendarHerramientas } from "../motor";
import { CRITERIOS } from "../criterios";
import { CRITERIOS_ESPECIALIZADA, CRITERIOS_SUITE } from "../criteriosRuta";
import { construirHerramienta } from "./fixtures";
import type { RespuestasUsuario } from "../tipos";

/**
 * La promesa que Molnip hace en su propia portada: "cobramos comisión de
 * los proveedores, nunca al revés: nunca cambia lo que te recomendamos".
 *
 * Estas pruebas la convierten en algo comprobable en vez de una frase de
 * marketing. Si alguien conectara algún día la afiliación al motor, aquí
 * es donde se rompería.
 */

const perfil: RespuestasUsuario = {
  problemaIdsCandidatos: ["conseguir-clientes"],
  tamanoEmpresa: "11-50",
  presupuesto: "medio",
};

describe("la afiliación no puede intervenir en la puntuación", () => {
  it("el motor da el mismo orden aunque se le cuelguen datos de afiliación a las fichas", () => {
    const a = construirHerramienta({ id: "a", nombre: "A", categoriaId: "crm", tipoProducto: "especializada" });
    const b = construirHerramienta({ id: "b", nombre: "B", categoriaId: "crm", tipoProducto: "especializada" });

    const sinAfiliacion = recomendarHerramientas(perfil, [a, b]);

    // Se le añaden a la ficha, a propósito, todos los campos que un
    // sistema sesgado podría mirar: comisión alta, enlace activo y estado
    // aprobado en la que va segunda.
    const bConAfiliacion = {
      ...b,
      comision: "80% recurrente",
      enlaceAfiliado: "https://ejemplo.test/ref/molnip",
      estadoAfiliacion: "activa",
      afiliacion: { comision: "80%", estado: "activa", enlace: "https://ejemplo.test/ref" },
    } as typeof b;

    const conAfiliacion = recomendarHerramientas(perfil, [a, bConAfiliacion]);

    expect(conAfiliacion.todas.map((e) => e.herramienta.id)).toEqual(sinAfiliacion.todas.map((e) => e.herramienta.id));
    expect(conAfiliacion.todas.map((e) => e.puntuacionTotal)).toEqual(
      sinAfiliacion.todas.map((e) => e.puntuacionTotal)
    );
  });

  /**
   * La lista de archivos se recorre, no se escribe a mano.
   *
   * Antes eran cuatro nombres fijos, y un módulo nuevo no entraba solo. Lo
   * destapó F3: el archivo que decide qué herramientas superan la puerta de
   * evidencia habría sido justo el único sin vigilar.
   */
  it("ningún módulo del motor menciona la afiliación en su código", () => {
    const prohibido = /afilia|comision|comisión|enlaceAfiliado|EstrategiaAfiliacion/i;
    const dir = path.join(process.cwd(), "agents", "atlas-advisor");
    const archivos = readdirSync(dir).filter((f) => f.endsWith(".ts"));
    expect(archivos.length, "si aquí no hay módulos, esta prueba no vigila nada").toBeGreaterThan(5);

    for (const archivo of archivos) {
      const contenido = readFileSync(path.join(dir, archivo), "utf-8");
      // Se permiten menciones en comentarios que documentan justo esta
      // separación; lo que no puede haber es código que la lea.
      const lineasDeCodigo = contenido
        .split("\n")
        .filter((linea) => !linea.trimStart().startsWith("*") && !linea.trimStart().startsWith("//"));
      expect(lineasDeCodigo.filter((l) => prohibido.test(l)), `${archivo} lee datos de afiliación`).toEqual([]);
    }
  });

  it("el módulo del motor no importa nada del repositorio de afiliación", () => {
    const dir = path.join(process.cwd(), "agents", "atlas-advisor");
    for (const archivo of readdirSync(dir).filter((f) => f.endsWith(".ts"))) {
      const contenido = readFileSync(path.join(dir, archivo), "utf-8");
      const importaciones = contenido.split("\n").filter((l) => l.trimStart().startsWith("import"));
      expect(
        importaciones.filter((l) => /repositorioAfiliados|repositorioEstrategiaAfiliacion|esquemaInterno/.test(l)),
        `${archivo} importa datos de afiliación`
      ).toEqual([]);
    }
  });

  /**
   * F3 añade un sitio nuevo por donde el dinero podría entrar: la puerta de
   * evidencia decide QUIÉN compite, que es más poderoso que decidir en qué
   * orden. Aquí se comprueba que no puede mirar la afiliación aunque quisiera.
   */
  it("la puerta de evidencia no puede ver la afiliación: sólo recibe dos identificadores", () => {
    const vistos: string[][] = [];
    const puerta = {
      filaDe: () => ({ ambito: "crm", necesidad: "llevar tus clientes", exigeAlgunaDe: ["cap.x"] }),
      loDemuestra: (herramientaId: string, capacidadId: string) => {
        vistos.push([herramientaId, capacidadId]);
        return true;
      },
    };
    const rica = {
      ...construirHerramienta({ id: "rica", nombre: "Rica", categoriaId: "crm", tipoProducto: "especializada" }),
      comision: "80% recurrente",
      enlaceAfiliado: "https://ejemplo.test/ref",
    };
    recomendarHerramientas({ categoriaId: "crm" }, [rica], { evidencia: puerta });
    expect(vistos).toEqual([["rica", "cap.x"]]);
  });

  it("el conjunto de criterios no incluye ninguno relacionado con ingresos", () => {
    const nombres = [
      ...CRITERIOS.map((c) => c.name),
      ...[...CRITERIOS_SUITE, ...CRITERIOS_ESPECIALIZADA].map((c) => c.evaluar.name),
    ];
    expect(nombres.filter((n) => /afilia|comision|ingreso|revenue/i.test(n))).toEqual([]);
  });
});

/**
 * La regla de producto de la propietaria (2026-09-16), convertida en algo
 * comprobable:
 *
 *   «Una herramienta útil entra en Molnip aunque no tenga programa de
 *   afiliación. La falta de afiliación sólo afecta a la monetización, nunca
 *   debe convertir una herramienta adecuada en descartada.»
 *
 * El caso que la obligó: Hotmart. Es la que mejor encaja con quien vende
 * cursos —sin cuota mensual, en español, cobra y entrega— y es la única de
 * su lote por la que Molnip no cobraría nada. Si la falta de afiliación
 * pesara en algún sitio, se notaría justo ahí.
 */
describe("una herramienta sin afiliación se recomienda igual", () => {
  const sinPrograma = construirHerramienta({ id: "sin-programa", nombre: "Sin programa", categoriaId: "crm", tipoProducto: "especializada" });
  const conPrograma = {
    ...construirHerramienta({ id: "con-programa", nombre: "Con programa", categoriaId: "crm", tipoProducto: "especializada" }),
    enlaceAfiliado: "https://ejemplo.test/ref/molnip",
    comision: "80% recurrente",
    estadoAfiliacion: "activa",
  } as ReturnType<typeof construirHerramienta>;

  // Por categoría, que es la entrada que sí puntúa fichas de prueba: el
  // `perfil` por objetivo de arriba filtra por `problemasIds` y las fixtures
  // no llevan ninguno, así que no compararía nada.
  const porCategoria = { categoriaId: "crm" as const };

  it("ni se descarta ni baja de puesto por no tener enlace de afiliado", () => {
    const r = recomendarHerramientas(porCategoria, [conPrograma, sinPrograma]);
    expect(r.todas.map((e) => e.herramienta.id)).toContain("sin-programa");
    // Fichas idénticas salvo la afiliación: tienen que empatar.
    const [a, b] = r.todas;
    expect(a.puntuacionTotal).toBe(b.puntuacionTotal);
  });

  it("da igual quién lleve la afiliación: el orden no se mueve", () => {
    const conLaOtra = { ...sinPrograma, enlaceAfiliado: "https://ejemplo.test/ref/molnip", comision: "80% recurrente" } as typeof sinPrograma;
    const unos = recomendarHerramientas(porCategoria, [conPrograma, sinPrograma]).todas.map((e) => e.herramienta.id);
    const otros = recomendarHerramientas(porCategoria, [{ ...conPrograma, enlaceAfiliado: undefined, comision: undefined } as typeof conPrograma, conLaOtra]).todas.map((e) => e.herramienta.id);
    expect(otros).toEqual(unos);
  });

  /**
   * Y lo que ve la persona cuando no hay comisión que cobrar: el enlace
   * oficial del proveedor. Es un componente de servidor, así que se lee su
   * código, como en `textoSinConfirmar.test.ts`.
   */
  it("sin enlace de afiliado, se manda al enlace oficial del proveedor", () => {
    const pagina = readFileSync(path.join(process.cwd(), "app", "herramienta", "[herramientaId]", "ir", "page.tsx"), "utf8");
    expect(pagina).toContain("enlaceAfiliado ?? herramienta.paginaOficial");
    // Y se registra cuál de los dos se usó, sin esconderlo.
    expect(pagina).toContain('tipoEnlace: enlaceAfiliado ? "afiliado" : "oficial"');
  });
});
