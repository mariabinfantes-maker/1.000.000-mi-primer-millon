import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { construirFilas, resumir, proporcionDeClicsPerdidos, formatearImporte } from "../informe";

/**
 * La frontera de Atlas Revenue.
 *
 * La arquitectura lo dice sin matices: *"Revenue solo lee estos datos, nunca
 * los modifica ni decide sobre ellos"*. Y la promesa de la portada —"nunca
 * cambia lo que te recomendamos"— dejaría de ser cierta el día que una cifra
 * de ingresos pudiera empujar a una herramienta hacia arriba.
 *
 * Estas pruebas convierten esas dos frases en algo que se rompe solo si
 * alguien cruza la línea.
 */

const CARPETA = path.join(process.cwd(), "agents/atlas-revenue");

/**
 * Se quitan los comentarios antes de mirar. La regla es sobre lo que el
 * código HACE, no sobre las palabras que aparecen explicándolo: el
 * repositorio menciona "las comisiones se revierten por reembolsos" en una
 * nota, y eso no es leer una comisión. Un comprobador que no distinga las
 * dos cosas obliga a escribir peor los comentarios para que pasen las
 * pruebas, que es exactamente al revés de lo que interesa.
 */
function sinComentarios(codigo: string): string {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/.*$/gm, " ");
}

function fuentesDelAgente(): { archivo: string; codigo: string }[] {
  return readdirSync(CARPETA)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => ({ archivo: f, codigo: sinComentarios(readFileSync(path.join(CARPETA, f), "utf8")) }));
}

describe("Revenue es exclusivamente analítico", () => {
  it("no importa NADA de Advisor: no puede tocar el ranking", () => {
    for (const { archivo, codigo } of fuentesDelAgente())
      expect(codigo.includes("atlas-advisor"), `${archivo} importa Advisor`).toBe(false);
  });

  it("no importa NADA de Affiliate Manager: no puede gestionar el programa", () => {
    for (const { archivo, codigo } of fuentesDelAgente())
      expect(codigo.includes("atlas-affiliate-manager"), `${archivo} importa Affiliate Manager`).toBe(false);
  });

  it("no escribe en las tablas de afiliación", () => {
    for (const { archivo, codigo } of fuentesDelAgente()) {
      for (const prohibido of ["INSERT INTO estrategias_afiliacion", "UPDATE estrategias_afiliacion", "DELETE FROM estrategias_afiliacion"])
        expect(codigo.includes(prohibido), `${archivo} escribe en afiliación`).toBe(false);
    }
  });

  it("no lee comisiones ni las mezcla con puntuaciones", () => {
    for (const { archivo, codigo } of fuentesDelAgente()) {
      for (const prohibido of ["puntuacionAtlas", "calcularPuntuacionAtlas", "duracionCookie", "comision"])
        expect(codigo.includes(prohibido), `${archivo} menciona "${prohibido}"`).toBe(false);
    }
  });
});

describe("el informe no inventa cifras", () => {
  it("una herramienta sin clics de afiliado no tiene tasa de conversión", () => {
    const [fila] = construirFilas(
      [{ herramientaId: "a", total: 10, porAfiliado: 0, porOficial: 10 }],
      []
    );
    // Dividir entre los clics totales daría una tasa del 0% que suena a
    // "convierte fatal", cuando la verdad es "ninguno de esos clics podía
    // convertir porque no había enlace propio".
    expect(fila.tasaConversion).toBeUndefined();
    expect(fila.clicsPerdidos).toBe(10);
  });

  it("la tasa se calcula solo sobre los clics que podían cobrar", () => {
    const [fila] = construirFilas(
      [{ herramientaId: "a", total: 100, porAfiliado: 20, porOficial: 80 }],
      [{ herramientaId: "a", conversiones: 4, importeCentimos: 10000, moneda: "EUR" }]
    );
    expect(fila.tasaConversion).toBeCloseTo(0.2);
  });

  it("sin ningún clic no hay proporción que dar", () => {
    expect(proporcionDeClicsPerdidos(resumir([]))).toBeUndefined();
  });

  it("cuenta cuánto tráfico se está perdiendo por no tener alta", () => {
    const filas = construirFilas(
      [
        { herramientaId: "a", total: 10, porAfiliado: 10, porOficial: 0 },
        { herramientaId: "b", total: 30, porAfiliado: 0, porOficial: 30 },
      ],
      []
    );
    expect(proporcionDeClicsPerdidos(resumir(filas))).toBeCloseTo(0.75);
  });

  it("el dinero se formatea desde céntimos enteros, sin coma flotante", () => {
    expect(formatearImporte(4700)).toBe("47,00 EUR");
    expect(formatearImporte(5)).toBe("0,05 EUR");
    expect(formatearImporte(-2350)).toBe("-23,50 EUR");
  });
});
