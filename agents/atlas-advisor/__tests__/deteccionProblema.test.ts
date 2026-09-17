import { describe, expect, it } from "vitest";
import { detectarProblemasPorTexto } from "../deteccionProblema";
import { getProblemas } from "@/data/repositorio";
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

/**
 * Las palabras de facturación, añadidas el 2026-09-17 a petición de la
 * propietaria. El motivo: «quiero facturar a mis clientes» no llegaba a
 * ningún objetivo, aunque «facturas» ya estuviera en la lista — el verbo no
 * es el sustantivo, y la coincidencia es por subcadena literal.
 *
 * «cuentas» a secas se descartó tras probarla: cazaba «las cuentas de
 * Instagram», «cuentas de usuario» y «cuentas de correo». Es el mismo error
 * de encaminamiento que ya se documentó con «presupuestos» y «no doy
 * abasto», así que se usan formas precisas.
 */
describe("las palabras de facturación llevan a organizar la empresa", () => {
  const problemas = getProblemas();

  it.each([
    "quiero facturar a mis clientes",
    "tengo que facturar y no sé cómo",
    "busco un programa de facturación",
    "llevo la contabilidad en excel y no puedo",
    "necesito llevar las cuentas de mi negocio",
    "no me cuadran las cuentas a fin de mes",
  ])("«%s» llega a organizar-empresa", (frase) => {
    expect(detectarProblemasPorTexto(frase, problemas)).toContain("organizar-empresa");
  });

  it.each([
    "gestiono las cuentas de Instagram de mis clientes",
    "tengo varias cuentas de correo y me lío",
  ])("«%s» NO se va a facturación por decir «cuentas»", (frase) => {
    expect(detectarProblemasPorTexto(frase, problemas)).not.toContain("organizar-empresa");
  });
});

/**
 * «Quiero vender más», el saludo más común que va a recibir Molnip, no
 * llegaba a ninguna puerta: las palabras clave tenían «cerrar ventas» y
 * «embudo de ventas», jerga de quien ya sabe, y ninguna de las formas en que
 * lo dice una persona normal. Quedó anotado en la etapa cero y se cierra el
 * 2026-09-17.
 *
 * Las siete frases de abajo son las entradas reales de los doce casos.
 */
describe("«quiero vender más» llega a conseguir clientes", () => {
  const problemas = getProblemas();

  it.each([
    "quiero vender más",
    "quiero vender mas",
    "necesito aumentar las ventas",
    "somos una asesoría y queremos aumentar las ventas",
    "hago velas artesanas, somos dos, y quiero vender más",
    "quiero más ventas este año",
    "fabricamos componentes y necesitamos aumentar las ventas",
  ])("«%s»", (frase) => {
    expect(detectarProblemasPorTexto(frase, problemas)).toContain("conseguir-clientes");
  });

  it("y no se lleva por delante las otras puertas", () => {
    expect(detectarProblemasPorTexto("necesito hacer facturas", problemas)).toContain("organizar-empresa");
    expect(detectarProblemasPorTexto("quiero automatizar tareas repetitivas", problemas)).toContain("automatizar-tareas");
  });
});
