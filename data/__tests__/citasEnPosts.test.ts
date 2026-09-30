import { describe, expect, it } from "vitest";
import { getPosts, validarPost } from "../repositorio";

/**
 * El bloque de cita existe para una cosa: que una frase de la Agencia
 * Tributaria o del BOE se distinga de una frase de Molnip. Si una cita
 * pudiera publicarse sin su fuente y sin la fecha en que se leyó, sería una
 * afirmación disfrazada — exactamente lo que este proyecto no hace.
 *
 * Estas pruebas están para que eso no se cuele nunca, ni por descuido ni por
 * prisa.
 */

const base = {
  id: "prueba",
  titulo: "Título de prueba",
  resumen: "Resumen de prueba.",
  fechaPublicacion: "2026-09-17",
};

const validar = (cuerpo: unknown[]) => () => validarPost({ ...base, cuerpo }, "prueba.json");

describe("una cita no se publica sin su fuente", () => {
  it("acepta una cita con dirección https y fecha", () => {
    expect(
      validar([{ tipo: "cita", texto: "Frase copiada.", fuente: "https://www.boe.es/algo", fecha: "2026-09-17" }])
    ).not.toThrow();
  });

  it("rechaza una cita sin fuente", () => {
    expect(validar([{ tipo: "cita", texto: "Frase copiada.", fecha: "2026-09-17" }])).toThrow(/fuente/);
  });

  it("rechaza una cita sin fecha de lectura", () => {
    expect(validar([{ tipo: "cita", texto: "Frase copiada.", fuente: "https://www.boe.es/algo" }])).toThrow(/fecha/);
  });

  it("rechaza una fuente que no sea una dirección https", () => {
    expect(
      validar([{ tipo: "cita", texto: "Frase copiada.", fuente: "lo dice la AEAT", fecha: "2026-09-17" }])
    ).toThrow(/fuente/);
  });

  it("rechaza una fecha que no tenga forma de fecha", () => {
    expect(
      validar([{ tipo: "cita", texto: "Frase copiada.", fuente: "https://www.boe.es/algo", fecha: "septiembre" }])
    ).toThrow(/fecha/);
  });

  it("rechaza una cita sin texto", () => {
    expect(validar([{ tipo: "cita", fuente: "https://www.boe.es/algo", fecha: "2026-09-17" }])).toThrow(/texto/);
  });
});

describe("los posts publicados cumplen la regla", () => {
  it("toda cita de todo post tiene fuente enlazable y fecha", () => {
    for (const post of getPosts()) {
      for (const bloque of post.cuerpo) {
        if (bloque.tipo !== "cita") continue;
        expect(bloque.fuente, `${post.id}: cita sin fuente`).toMatch(/^https:\/\//);
        expect(bloque.fecha, `${post.id}: cita sin fecha`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(bloque.texto.trim().length, `${post.id}: cita vacía`).toBeGreaterThan(0);
      }
    }
  });

  /**
   * Una página cuyo valor es la norma no puede envejecer en silencio: si
   * alguien la retoca sin volver a mirar la fuente, la fecha de revisión lo
   * delata. No comprueba que esté al día —eso no lo puede saber una prueba—
   * pero sí que exista.
   */
  it("todo post con citas declara cuándo se revisó por última vez", () => {
    for (const post of getPosts()) {
      if (!post.cuerpo.some((bloque) => bloque.tipo === "cita")) continue;
      expect(post.fechaUltimaRevision, `${post.id}: post con citas sin fechaUltimaRevision`).toMatch(
        /^\d{4}-\d{2}-\d{2}$/
      );
    }
  });
});
