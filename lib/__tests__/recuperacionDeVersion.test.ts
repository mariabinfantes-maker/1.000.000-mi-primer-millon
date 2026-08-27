import { describe, expect, it } from "vitest";
import { decidirRecuperacion, esFalloDeVersion, evaluarEvento } from "../recuperacionDeVersion";

/**
 * La red de seguridad ante una versión desactualizada en el navegador.
 *
 * Lo que más importa aquí NO es que recargue cuando debe, sino que NO
 * recargue cuando no debe: una recarga automática mal disparada convierte
 * un error normal en una web que se reinicia sola, y un bucle de recargas
 * es peor que el problema original.
 */

const conMemoriaYSinUsar = { yaSeRecargo: false, sePuedeRecordar: true };

describe("detecta un fallo de versión de verdad", () => {
  it("un <script> de la aplicación que no carga", () => {
    expect(
      esFalloDeVersion({ objetivo: { tagName: "SCRIPT", src: "https://molnip.com/_next/static/chunks/abc123.js" } })
    ).toBe(true);
  });

  it("una hoja de estilos de la aplicación que no carga", () => {
    expect(
      esFalloDeVersion({ objetivo: { tagName: "LINK", href: "https://molnip.com/_next/static/css/abc.css" } })
    ).toBe(true);
  });

  it("un ChunkLoadError por su nombre", () => {
    expect(esFalloDeVersion({ nombreDelError: "ChunkLoadError", mensaje: "Loading chunk 42 failed." })).toBe(true);
  });

  it("los tres navegadores lo dicen distinto y hay que entenderlos a los tres", () => {
    const mensajes = [
      "Loading chunk 12 failed.", // Chrome
      "Failed to fetch dynamically imported module: https://molnip.com/_next/static/x.js", // Chrome/Edge
      "error loading dynamically imported module", // Firefox
      "Importing a module script failed.", // Safari
      "Expected a JavaScript module script but the server responded with a MIME type of \"text/html\". 'text/html' is not a valid JavaScript MIME type.",
    ];
    for (const mensaje of mensajes) {
      expect(esFalloDeVersion({ mensaje }), mensaje).toBe(true);
    }
  });
});

describe("NO confunde otros errores con un fallo de versión", () => {
  it("un error de la API", () => {
    expect(esFalloDeVersion({ mensaje: "Request failed with status code 500" })).toBe(false);
  });

  it("un error de validación", () => {
    expect(esFalloDeVersion({ mensaje: "El correo electrónico no es válido" })).toBe(false);
  });

  it("un corte de red", () => {
    expect(esFalloDeVersion({ mensaje: "Failed to fetch", nombreDelError: "TypeError" })).toBe(false);
  });

  it("un error del propio código", () => {
    expect(esFalloDeVersion({ mensaje: "Cannot read properties of undefined (reading 'nombre')", nombreDelError: "TypeError" })).toBe(false);
  });

  it("una imagen que no carga", () => {
    expect(esFalloDeVersion({ objetivo: { tagName: "IMG", src: "https://molnip.com/imagenes/marca/hero.png" } })).toBe(false);
  });

  it("un script de OTRO dominio que no carga (analítica, publicidad...)", () => {
    // No es nuestra versión la que está desactualizada: recargar no
    // arreglaría nada y molestaría a la persona.
    expect(esFalloDeVersion({ objetivo: { tagName: "SCRIPT", src: "https://otro-dominio.example/tag.js" } })).toBe(false);
  });

  it("un evento sin ninguna información", () => {
    expect(esFalloDeVersion({})).toBe(false);
    expect(esFalloDeVersion({ mensaje: "" })).toBe(false);
    expect(esFalloDeVersion({ objetivo: null })).toBe(false);
  });
});

describe("una sola recarga, nunca un bucle", () => {
  it("la primera vez en la sesión, recarga", () => {
    expect(decidirRecuperacion(conMemoriaYSinUsar)).toBe("recargar");
  });

  it("la segunda vez NO recarga: avisa", () => {
    expect(decidirRecuperacion({ yaSeRecargo: true, sePuedeRecordar: true })).toBe("avisar");
  });

  it("si no se puede recordar que ya se recargó, NO recarga", () => {
    // Sin memoria, recargar sería apostar a ciegas contra un bucle infinito.
    expect(decidirRecuperacion({ yaSeRecargo: false, sePuedeRecordar: false })).toBe("avisar");
  });

  it("sin memoria nunca devuelve 'recargar', pase lo que pase", () => {
    for (const yaSeRecargo of [true, false]) {
      expect(decidirRecuperacion({ yaSeRecargo, sePuedeRecordar: false })).toBe("avisar");
    }
  });
});

describe("evaluarEvento: la decisión completa", () => {
  it("fallo de versión + recarga disponible → recargar", () => {
    expect(evaluarEvento({ nombreDelError: "ChunkLoadError" }, conMemoriaYSinUsar)).toBe("recargar");
  });

  it("fallo de versión + recarga ya gastada → avisar", () => {
    expect(evaluarEvento({ nombreDelError: "ChunkLoadError" }, { yaSeRecargo: true, sePuedeRecordar: true })).toBe(
      "avisar"
    );
  });

  it("cualquier otro error → ignorar, aunque quede recarga disponible", () => {
    for (const mensaje of ["Request failed with status code 500", "Cannot read properties of undefined", "Failed to fetch"]) {
      expect(evaluarEvento({ mensaje }, conMemoriaYSinUsar), mensaje).toBe("ignorar");
    }
  });

  it("un error normal NUNCA provoca una recarga, ni siquiera sin memoria", () => {
    expect(evaluarEvento({ mensaje: "El campo es obligatorio" }, { yaSeRecargo: false, sePuedeRecordar: false })).toBe(
      "ignorar"
    );
  });
});
