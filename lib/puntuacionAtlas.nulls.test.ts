import { describe, expect, it } from "vitest";
import { calcularPuntuacionAtlas } from "./puntuacionAtlas";

/**
 * LA DECISIÓN DE «DONDE NO HAYA PRUEBA, NULL» (propietaria, 2026-09-28).
 *
 * Estas pruebas existen porque la primera tanda de fichas nuevas de reservas
 * llegó con casi todas las notas vacías —que es lo correcto: ningún fabricante
 * publica que su producto es un 7— y la función devolvía «NaN/100», un número
 * roto que además se colaba en los motivos.
 */
describe("puntuación con notas sin demostrar", () => {
  it("no devuelve NaN cuando faltan notas: promedia las que hay", () => {
    const r = calcularPuntuacionAtlas({ puntuaciones: { atencionAlCliente: 6 } } as never);
    expect(r).not.toBeNull();
    expect(Number.isFinite(r!.puntuacion)).toBe(true);
    expect(r!.puntuacion).toBe(60);
  });

  it("devuelve null cuando no hay ninguna señal, en vez de inventar un número", () => {
    expect(calcularPuntuacionAtlas({ puntuaciones: {} } as never)).toBeNull();
  });

  it("`nivelTecnicoRequerido` no entra en la media: va al revés y hundiría a la más sencilla", () => {
    const facil = calcularPuntuacionAtlas({ puntuaciones: { nivelTecnicoRequerido: 1 } } as never);
    expect(facil).toBeNull();
  });

  it("una nota alta y otra vacía dan la alta, no la mitad", () => {
    const r = calcularPuntuacionAtlas({ puntuaciones: { calidad: 9, fiabilidad: undefined } } as never);
    expect(r!.puntuacion).toBe(90);
  });
});
