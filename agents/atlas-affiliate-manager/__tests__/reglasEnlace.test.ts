import { describe, it, expect } from "vitest";
import { enlaceEsUsable, puedeActivarse } from "../reglasEnlace";

describe("enlaceEsUsable", () => {
  it("acepta un enlace de afiliada real, con parámetros y fragmento", () => {
    expect(enlaceEsUsable("https://ejemplo.test/go?sa=D_193928417_1234&ref=molnip#planes")).toBe(true);
    expect(enlaceEsUsable("https://systeme.io/tr/2f161/14644721748/39837047/abcdef0123")).toBe(true);
  });

  it("rechaza el enlace pegado a medias que se vio en producción", () => {
    // El caso real: al pegar una URL larga se quedaron fuera las tres
    // primeras letras. Se guardaba sin dar ningún error.
    expect(enlaceEsUsable("ps://systeme.io/tr/2f161/14644721748")).toBe(false);
    expect(enlaceEsUsable("tps://systeme.io/tr/2f161")).toBe(false);
    expect(enlaceEsUsable("//systeme.io/tr/2f161")).toBe(false);
  });

  it("rechaza lo que no es una dirección", () => {
    expect(enlaceEsUsable("")).toBe(false);
    expect(enlaceEsUsable("   ")).toBe(false);
    expect(enlaceEsUsable("systeme.io/tr/2f161")).toBe(false);
    expect(enlaceEsUsable("mi enlace de afiliada")).toBe(false);
    expect(enlaceEsUsable("https://")).toBe(false);
    expect(enlaceEsUsable("https://localhost")).toBe(false);
  });

  it("no se deja engañar por espacios alrededor", () => {
    expect(enlaceEsUsable("  https://ejemplo.test/go  ")).toBe(true);
    // Un espacio en medio sí parte la URL: casi siempre es media dirección.
    expect(enlaceEsUsable("https://ejemplo.test/go otra cosa")).toBe(false);
  });
});

describe("puedeActivarse", () => {
  it("no se puede activar sin enlace: activa sin enlace no cobra", () => {
    expect(puedeActivarse("")).toBe(false);
  });

  it("tampoco con un enlace que no serviría", () => {
    expect(puedeActivarse("ps://systeme.io/tr/2f161")).toBe(false);
  });

  it("con un enlace utilizable, sí", () => {
    expect(puedeActivarse("https://systeme.io/tr/2f161/14644721748")).toBe(true);
  });
});
