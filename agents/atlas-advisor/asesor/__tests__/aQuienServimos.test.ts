import { describe, it, expect } from "vitest";
import { aQuienServimos } from "..";

/**
 * A quién podemos servir, calculado del dato vivo.
 *
 * Existe porque la propietaria señaló el 2026-09-24 que las investigaciones
 * se quedaban encerradas en documentos y no llegaban a la inteligencia de
 * Molnip. Cada pasada de verificación cuesta dinero real; si el resultado no
 * se puede consultar desde el código, ese dinero no cambia nada.
 *
 * Esta prueba imprime el estado actual, así que también es el informe: se lee
 * ejecutándola, no abriendo un markdown que alguien tuvo que actualizar a mano.
 */
describe("a quién podemos servir", () => {
  it("se calcula de la evidencia de ahora", () => {
    const todos = aQuienServimos();
    const servidos = todos.filter((e) => e.servido);
    console.log(`\n  SERVIMOS A ${servidos.length} DE ${todos.length} OFICIOS\n`);
    for (const e of servidos) console.log("  SÍ  " + e.oficio.nombre);
    console.log("\n  Y a éstos todavía no, por lo que les falta del núcleo:");
    for (const e of todos.filter((x) => !x.servido)) {
      console.log("      " + e.oficio.nombre.padEnd(42) + e.leFalta.join(" · "));
    }
    expect(todos.length).toBeGreaterThan(0);
    // Todo oficio no servido tiene que decir QUÉ le falta: sin eso no es un
    // dato, es una opinión.
    for (const e of todos) {
      if (!e.servido) expect(e.leFalta.length, e.oficio.nombre).toBeGreaterThan(0);
      else expect(e.leFalta, e.oficio.nombre).toEqual([]);
    }
  });
});
