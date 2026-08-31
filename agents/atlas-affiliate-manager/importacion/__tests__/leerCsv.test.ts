import { describe, it, expect } from "vitest";
import { leerCsv, detectarDelimitador, normalizarEncabezado } from "../leerCsv";

describe("detectarDelimitador", () => {
  it("reconoce la coma y el punto y coma", () => {
    expect(detectarDelimitador("id,enlace\nx,y")).toBe(",");
    expect(detectarDelimitador("id;enlace\nx;y")).toBe(";");
  });

  it("no se deja engañar por comas dentro de comillas", () => {
    // El caso que rompe las heurísticas ingenuas: archivo separado por punto
    // y coma cuya primera celda entrecomillada lleva comas dentro.
    const texto = '"Herramienta, con coma";enlace;comision\nx;y;z';
    expect(detectarDelimitador(texto)).toBe(";");
  });
});

describe("normalizarEncabezado", () => {
  it("iguala tildes, mayúsculas, espacios y guiones", () => {
    const esperado = "duraciondelacookie";
    for (const variante of [
      "Duración de la cookie",
      "duracion de la cookie",
      "DURACION_DE_LA_COOKIE",
      "Duración-De-La-Cookie",
    ]) {
      expect(normalizarEncabezado(variante), variante).toBe(esperado);
    }
  });
});

describe("leerCsv", () => {
  it("lee un archivo normal", () => {
    const { filas, encabezados, delimitador } = leerCsv("id,enlace\nsysteme-io,https://a.test\nnotion,https://b.test");
    expect(delimitador).toBe(",");
    expect(encabezados).toEqual(["id", "enlace"]);
    expect(filas).toEqual([
      { id: "systeme-io", enlace: "https://a.test" },
      { id: "notion", enlace: "https://b.test" },
    ]);
  });

  it("quita el BOM que escribe Excel", () => {
    const { filas } = leerCsv("﻿id,enlace\nsysteme-io,https://a.test");
    // Sin quitarlo, la clave sería "﻿id" y la columna id no existiría.
    expect(filas[0].id).toBe("systeme-io");
  });

  it("respeta comillas con delimitadores y saltos de línea dentro", () => {
    const texto = 'id,notas\nsysteme-io,"Primero, luego\notra línea"';
    const { filas } = leerCsv(texto);
    expect(filas).toHaveLength(1);
    expect(filas[0].notas).toBe("Primero, luego\notra línea");
  });

  it("entiende la comilla doblada como comilla literal", () => {
    const { filas } = leerCsv('id,notas\nx,"dijo ""hola"""');
    expect(filas[0].notas).toBe('dijo "hola"');
  });

  it("aguanta finales de línea de Windows", () => {
    const { filas } = leerCsv("id,enlace\r\nsysteme-io,https://a.test\r\n");
    expect(filas).toEqual([{ id: "systeme-io", enlace: "https://a.test" }]);
  });

  it("descarta la fila vacía del final en vez de tratarla como dato", () => {
    const { filas } = leerCsv("id,enlace\nx,https://a.test\n\n");
    expect(filas).toHaveLength(1);
  });

  it("OMITE la fila descuadrada y lo dice, en vez de desplazar valores", () => {
    // Con una comilla sin cerrar, rellenar o recortar escribiría el enlace de
    // una herramienta en el campo de otra sin dar ningún error.
    const { filas, avisos } = leerCsv("id,enlace,comision\nx,https://a.test\ny,https://b.test,30%");
    expect(filas).toEqual([{ id: "y", enlace: "https://b.test", comision: "30%" }]);
    expect(avisos.join(" ")).toContain("Fila 2");
    expect(avisos.join(" ")).toMatch(/se ha omitido/i);
  });

  it("avisa de columnas repetidas", () => {
    const { avisos } = leerCsv("id,Enlace,enlace\nx,a,b");
    expect(avisos.join(" ")).toMatch(/aparece más de una vez/i);
  });

  it("un archivo vacío no revienta", () => {
    expect(leerCsv("").filas).toEqual([]);
    expect(leerCsv("   \n  ").filas).toEqual([]);
  });

  it("recorta los espacios de cada celda", () => {
    const { filas } = leerCsv("id , enlace\n  systeme-io ,  https://a.test  ");
    expect(filas[0]).toEqual({ id: "systeme-io", enlace: "https://a.test" });
  });
});
