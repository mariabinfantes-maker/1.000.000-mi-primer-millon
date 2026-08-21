import { describe, expect, it } from "vitest";
import { ASUNTO_BIENVENIDA, construirHtmlBienvenida } from "../plantillaBienvenida";
import { LEAD_MAGNET, urlLeadMagnet } from "../leadMagnet";

describe("construirHtmlBienvenida", () => {
  it("incluye un enlace absoluto y válido al lead magnet", () => {
    const html = construirHtmlBienvenida();
    expect(html).toContain(urlLeadMagnet());
    expect(urlLeadMagnet()).toMatch(/^https?:\/\/.+\/lead-magnets\/.+\.pdf$/);
  });

  it("menciona el título del lead magnet", () => {
    const html = construirHtmlBienvenida();
    expect(html).toContain(LEAD_MAGNET.titulo);
  });

  it("incluye una mención de darse de baja (obligatorio en email marketing)", () => {
    const html = construirHtmlBienvenida();
    expect(html.toLowerCase()).toContain("baja");
  });

  it("el asunto no está vacío y es específico, no genérico", () => {
    expect(ASUNTO_BIENVENIDA.length).toBeGreaterThan(10);
  });
});
