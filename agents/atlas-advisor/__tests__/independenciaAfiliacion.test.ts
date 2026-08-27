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

  it("ningún criterio, de ninguna de las dos rutas, menciona la afiliación en su código", () => {
    const prohibido = /afilia|comision|comisión|enlaceAfiliado|EstrategiaAfiliacion/i;
    const archivos = ["criterios.ts", "criteriosRuta.ts", "motor.ts", "todoEnUnoVsEspecializada.ts"];

    for (const archivo of archivos) {
      const contenido = readFileSync(path.join(process.cwd(), "agents", "atlas-advisor", archivo), "utf-8");
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

  it("el conjunto de criterios no incluye ninguno relacionado con ingresos", () => {
    const nombres = [
      ...CRITERIOS.map((c) => c.name),
      ...[...CRITERIOS_SUITE, ...CRITERIOS_ESPECIALIZADA].map((c) => c.evaluar.name),
    ];
    expect(nombres.filter((n) => /afilia|comision|ingreso|revenue/i.test(n))).toEqual([]);
  });
});
