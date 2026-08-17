import { describe, expect, it } from "vitest";
import { detectarProblemasPorTexto } from "../deteccionProblema";
import type { Problema } from "@/data/esquema";

const PROBLEMAS_DE_PRUEBA: Problema[] = [
  {
    id: "conseguir-clientes",
    titulo: "Conseguir más clientes",
    descripcion: "Atrae y convierte más leads en ventas.",
    preguntaHerramienta: "¿Ya utilizas algún CRM?",
    palabrasClave: ["leads", "seguimiento de clientes", "pipeline de ventas"],
  },
  {
    id: "organizar-empresa",
    titulo: "Organizar la empresa",
    descripcion: "Centraliza proyectos, tareas y documentación de tu equipo.",
    preguntaHerramienta: "¿Ya utilizas alguna herramienta de gestión de proyectos?",
    palabrasClave: ["hoja de cálculo", "excel", "se me escapan cosas"],
  },
  {
    id: "sin-palabras-clave",
    titulo: "Objetivo sin palabras clave todavía",
    descripcion: "Editorial pendiente.",
    preguntaHerramienta: "¿Ya utilizas alguna herramienta para esto?",
  },
];

describe("detectarProblemasPorTexto", () => {
  it("detecta el objetivo cuyas palabras clave aparecen en el texto libre", () => {
    const detectados = detectarProblemasPorTexto(
      "Se me acumulan los leads y no consigo hacer seguimiento de clientes a tiempo",
      PROBLEMAS_DE_PRUEBA
    );

    expect(detectados).toEqual(["conseguir-clientes"]);
  });

  it("ignora mayúsculas, tildes y el resto de texto irrelevante alrededor de la coincidencia", () => {
    const detectados = detectarProblemasPorTexto(
      "LLEVAMOS TODO EN UNA HOJA DE CÁLCULO y cada mes se nos escapan cosas",
      PROBLEMAS_DE_PRUEBA
    );

    expect(detectados).toEqual(["organizar-empresa"]);
  });

  it("devuelve varios ids empatados cuando el texto toca más de un objetivo con la misma fuerza", () => {
    const detectados = detectarProblemasPorTexto(
      "Tenemos leads sin seguimiento y encima todo en excel, un caos",
      PROBLEMAS_DE_PRUEBA
    );

    expect(detectados.sort()).toEqual(["conseguir-clientes", "organizar-empresa"]);
  });

  it("devuelve un array vacío cuando el texto no contiene ninguna palabra clave conocida", () => {
    const detectados = detectarProblemasPorTexto(
      "Queremos mejorar la cafetera de la oficina",
      PROBLEMAS_DE_PRUEBA
    );

    expect(detectados).toEqual([]);
  });

  it("devuelve un array vacío para texto vacío o solo espacios, sin lanzar excepciones", () => {
    expect(detectarProblemasPorTexto("", PROBLEMAS_DE_PRUEBA)).toEqual([]);
    expect(detectarProblemasPorTexto("   ", PROBLEMAS_DE_PRUEBA)).toEqual([]);
  });

  it("nunca falla con un problema que todavía no tiene palabrasClave definidas", () => {
    const detectados = detectarProblemasPorTexto(
      "Cualquier texto que no debería coincidir con nada",
      PROBLEMAS_DE_PRUEBA
    );

    expect(detectados).toEqual([]);
  });
});
