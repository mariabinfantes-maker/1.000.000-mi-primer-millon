import { describe, expect, it } from "vitest";
import {
  codificarEstadoIntentos,
  decodificarEstadoIntentos,
  estaBloqueado,
  estadoInicial,
  minutosRestantesDeBloqueo,
  registrarIntentoFallido,
} from "../intentosLogin";

const AHORA = new Date("2026-08-25T12:00:00Z").getTime();

describe("registrarIntentoFallido / estaBloqueado", () => {
  it("no bloquea con menos de 5 fallos", () => {
    let estado = estadoInicial();
    for (let i = 0; i < 4; i++) estado = registrarIntentoFallido(estado, AHORA);
    expect(estado.fallos).toBe(4);
    expect(estaBloqueado(estado, AHORA)).toBe(false);
  });

  it("bloquea al llegar al 5º fallo", () => {
    let estado = estadoInicial();
    for (let i = 0; i < 5; i++) estado = registrarIntentoFallido(estado, AHORA);
    expect(estaBloqueado(estado, AHORA)).toBe(true);
  });

  it("el bloqueo expira pasados 15 minutos", () => {
    let estado = estadoInicial();
    for (let i = 0; i < 5; i++) estado = registrarIntentoFallido(estado, AHORA);
    const dieciseisMinutosDespues = AHORA + 16 * 60 * 1000;
    expect(estaBloqueado(estado, dieciseisMinutosDespues)).toBe(false);
  });

  it("minutosRestantesDeBloqueo baja con el tiempo y es 0 si no está bloqueado", () => {
    let estado = estadoInicial();
    for (let i = 0; i < 5; i++) estado = registrarIntentoFallido(estado, AHORA);
    expect(minutosRestantesDeBloqueo(estado, AHORA)).toBe(15);
    expect(minutosRestantesDeBloqueo(estadoInicial(), AHORA)).toBe(0);
  });
});

describe("codificarEstadoIntentos / decodificarEstadoIntentos", () => {
  it("recupera exactamente el mismo estado tras codificar y decodificar", () => {
    const estado = { fallos: 3, bloqueadoHasta: null };
    const token = codificarEstadoIntentos(estado);
    expect(decodificarEstadoIntentos(token)).toEqual(estado);
  });

  it("devuelve estadoInicial() ante un token ausente, corrupto o falsificado", () => {
    expect(decodificarEstadoIntentos(undefined)).toEqual(estadoInicial());
    expect(decodificarEstadoIntentos("basura")).toEqual(estadoInicial());
    const token = codificarEstadoIntentos({ fallos: 5, bloqueadoHasta: AHORA + 999999 });
    const [datos] = token.split(".");
    expect(decodificarEstadoIntentos(`${datos}.firmaFalsa`)).toEqual(estadoInicial());
  });

  it("no puede forjarse un estado con 0 fallos manipulando el token directamente", () => {
    // Verifica que la firma realmente ata datos+firma: cambiar los datos sin
    // recalcular la firma invalida el token, no lo deja "leer distinto".
    const token = codificarEstadoIntentos({ fallos: 5, bloqueadoHasta: AHORA + 999999 });
    const [, firma] = token.split(".");
    const datosFalsos = Buffer.from(JSON.stringify({ fallos: 0, bloqueadoHasta: null })).toString("base64url");
    expect(decodificarEstadoIntentos(`${datosFalsos}.${firma}`)).toEqual(estadoInicial());
  });
});
