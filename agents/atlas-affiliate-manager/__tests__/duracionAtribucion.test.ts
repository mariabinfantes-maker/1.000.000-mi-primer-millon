import { describe, it, expect } from "vitest";
import { esAtribucionPermanente, ATRIBUCION_PERMANENTE, SUGERENCIAS_ATRIBUCION } from "../duracionAtribucion";

describe("esAtribucionPermanente", () => {
  it("reconoce la redacción canónica", () => {
    expect(esAtribucionPermanente(ATRIBUCION_PERMANENTE)).toBe(true);
  });

  it("reconoce las formas en que se dice lo mismo, con y sin tildes", () => {
    for (const valor of [
      "Permanente",
      "permanente",
      "Sin caducidad",
      "No caduca",
      "sin expiración",
      "sin expiracion",
      "De por vida",
      "Comisión vitalicia",
      "comision vitalicia",
      "Atribución indefinida",
      "Lifetime attribution",
      "para siempre",
    ]) {
      expect(esAtribucionPermanente(valor), valor).toBe(true);
    }
  });

  it("NO confunde una duración normal con permanencia", () => {
    for (const valor of ["30 días", "90 días", "365 días", "120 dias", "Mientras el cliente siga activo", "", undefined]) {
      expect(esAtribucionPermanente(valor), String(valor)).toBe(false);
    }
  });

  it("una negación delante lo invierte", () => {
    expect(esAtribucionPermanente("No permanente, 90 días")).toBe(false);
    expect(esAtribucionPermanente("no es vitalicia")).toBe(false);
  });

  it("la permanencia encabeza las sugerencias: es la que hoy no se podía escribir", () => {
    expect(SUGERENCIAS_ATRIBUCION[0]).toBe(ATRIBUCION_PERMANENTE);
  });
});
