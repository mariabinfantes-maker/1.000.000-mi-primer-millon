import { describe, expect, it } from "vitest";
import { generarTokenResultado, leerTokenResultado } from "./resultadoToken";

const PAYLOAD_BASE = {
  origenTipo: "objetivo" as const,
  origenId: "gestionar-clientes",
  items: [
    { id: "crm-facil", puntuacion: 42, explicacion: "Encaja por tamaño de empresa.", advertencia: false },
    { id: "crm-avanzado", puntuacion: 30, explicacion: "Buena opción si creces rápido.", advertencia: true },
  ],
  generadoEn: "2026-08-18T10:00:00.000Z",
};

describe("generarTokenResultado / leerTokenResultado", () => {
  it("recupera exactamente el mismo payload que se firmó", () => {
    const token = generarTokenResultado(PAYLOAD_BASE);
    const leido = leerTokenResultado(token);

    expect(leido).toEqual({ v: 1, ...PAYLOAD_BASE });
  });

  it("produce un token distinto para un resultado distinto (no es un id fijo por origen)", () => {
    const tokenA = generarTokenResultado(PAYLOAD_BASE);
    const tokenB = generarTokenResultado({ ...PAYLOAD_BASE, items: [PAYLOAD_BASE.items[0]] });

    expect(tokenA).not.toBe(tokenB);
  });

  it("rechaza un token con la firma alterada (evita recomendaciones falsificadas)", () => {
    const token = generarTokenResultado(PAYLOAD_BASE);
    const [datos, firma] = token.split(".");
    const firmaAlterada = firma.slice(0, -1) + (firma.at(-1) === "A" ? "B" : "A");

    expect(leerTokenResultado(`${datos}.${firmaAlterada}`)).toBeNull();
  });

  it("rechaza un token con el payload alterado tras la firma", () => {
    const token = generarTokenResultado(PAYLOAD_BASE);
    const [datos, firma] = token.split(".");
    const datosAlterados = datos.slice(0, -1) + (datos.at(-1) === "A" ? "B" : "A");

    expect(leerTokenResultado(`${datosAlterados}.${firma}`)).toBeNull();
  });

  it("rechaza entradas que no tienen la forma de un token", () => {
    expect(leerTokenResultado("")).toBeNull();
    expect(leerTokenResultado("sin-punto")).toBeNull();
    expect(leerTokenResultado("demasiadas.partes.aqui")).toBeNull();
    expect(leerTokenResultado("!!!.###")).toBeNull();
  });
});

/**
 * El aviso de «no lo he podido confirmar» viaja en el enlace — F3, bloque 6.
 *
 * Si no viajara, un enlace abierto mañana enseñaría las mismas herramientas
 * como si respondieran a lo que la persona pidió: el aviso se habría perdido
 * por el camino y el resultado sería justo la afirmación que no podemos hacer.
 */
describe("la necesidad sin confirmar en el token", () => {
  const base = {
    origenTipo: "categoria" as const,
    origenId: "gestion-proyectos",
    items: [{ id: "asana", puntuacion: 12, explicacion: "x", advertencia: false }],
    generadoEn: "2026-09-10T10:00:00.000Z",
  };

  it("va y vuelve intacta", () => {
    const necesidad = "planificar el trabajo del equipo: proyectos, tareas o fechas";
    const token = generarTokenResultado({ ...base, sinConfirmar: { necesidad } });
    expect(leerTokenResultado(token)?.sinConfirmar).toEqual({ necesidad });
  });

  it("cuando no la hay, no aparece", () => {
    expect(leerTokenResultado(generarTokenResultado(base))?.sinConfirmar).toBeUndefined();
  });

  /**
   * Los enlaces generados antes de F3 no llevan el campo. Subir la versión los
   * habría invalidado todos —y son enlaces que la gente guarda— para añadir
   * algo que la mayoría no necesita.
   */
  it("un enlace antiguo, sin el campo, sigue siendo válido", () => {
    const antiguo = generarTokenResultado(base);
    const leido = leerTokenResultado(antiguo);
    expect(leido?.v).toBe(1);
    expect(leido?.items.map((i) => i.id)).toEqual(["asana"]);
    expect(leido?.sinConfirmar).toBeUndefined();
  });

  /**
   * Ojo con cómo se manipula: añadir un carácter al final del base64url cae en
   * el relleno que se descarta al decodificar, así que los bytes son los
   * mismos, la firma cuadra y la prueba pasaría sin comprobar nada. Hay que
   * cambiar un byte de verdad.
   */
  it("y sigue firmado: tocar el aviso invalida el enlace", () => {
    const token = generarTokenResultado({ ...base, sinConfirmar: { necesidad: "redactar textos" } });
    const [datos, firma] = token.split(".");
    const alterado = datos.slice(0, -1) + (datos.at(-1) === "A" ? "B" : "A");
    expect(alterado).not.toBe(datos);
    expect(leerTokenResultado(`${alterado}.${firma}`)).toBeNull();
  });
});
