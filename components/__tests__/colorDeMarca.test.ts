import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PALETA_MOLNIP, COLOR_PRINCIPAL } from "@/lib/marca/paleta";

/**
 * EL COLOR PRINCIPAL DE MOLNIP ESTÁ CONGELADO.
 *
 * Lo fijó la propietaria el 2026-09-01 y no se cambia sin su aprobación
 * explícita. Ver `brand-guidelines.md`.
 *
 * Esta prueba existe porque ya se perdió una vez, y nadie se dio cuenta
 * durante semanas. La portada escribió el índigo a mano como #4f46e5 —el
 * ancla anterior, retirada el 2026-08-17— en vez de usar el token. Cuando la
 * paleta cambió a #6e5fe4, a esa línea no le llegó, y la mancha del hero se
 * quedó con el violeta viejo, más frío y más saturado. Ninguna prueba lo vio
 * porque ninguna miraba el valor del color, solo su nombre.
 *
 * Ahora sí lo mira. Si alguien cambia este valor, aquí se para.
 */

const RAIZ = join(__dirname, "..", "..");
const css = readFileSync(join(RAIZ, "app", "globals.css"), "utf-8");
/** El CSS sin comentarios: lo que se aplica, no lo que se explica. */
const cssEfectivo = css.replace(/\/\*[\s\S]*?\*\//g, "");

/** El valor aprobado, escrito una sola vez y a propósito. */
const APROBADO = "#6e5fe4";

function tokenCss(nombre: string): string | undefined {
  const m = cssEfectivo.match(new RegExp(`--color-${nombre}:\\s*(#[0-9a-f]{6})`));
  return m ? m[1].toLowerCase() : undefined;
}

describe("el color principal de Molnip está congelado", () => {
  it(`el token --color-brand-600 vale exactamente ${APROBADO}`, () => {
    expect(
      tokenCss("brand-600"),
      "El color principal de Molnip no se cambia sin aprobación de la propietaria. Ver brand-guidelines.md.",
    ).toBe(APROBADO);
  });

  it("el módulo de paleta expone el mismo color principal", () => {
    expect(COLOR_PRINCIPAL.toLowerCase()).toBe(APROBADO);
    expect(PALETA_MOLNIP.brand[600].toLowerCase()).toBe(APROBADO);
  });

  it("`brand-guidelines.md` registra ese mismo valor", () => {
    const guia = readFileSync(join(RAIZ, "brand-guidelines.md"), "utf-8").toLowerCase();
    expect(guia, "la guía de marca debe nombrar el color aprobado").toContain(APROBADO);
  });

  it("el índigo retirado no puede volver por ninguna vía", () => {
    // #4f46e5 era el ancla hasta el 2026-08-17. Los comentarios pueden
    // nombrarlo para contar la historia; el CSS que se aplica, no.
    expect(cssEfectivo.toLowerCase()).not.toContain("#4f46e5");
    expect(JSON.stringify(PALETA_MOLNIP).toLowerCase()).not.toContain("#4f46e5");
  });
});

describe("la paleta vive en un solo sitio", () => {
  it("cada tono del módulo coincide con su token de globals.css", () => {
    const discrepancias: string[] = [];
    for (const familia of ["brand", "gold", "slate"] as const) {
      for (const [tono, valor] of Object.entries(PALETA_MOLNIP[familia])) {
        const enCss = tokenCss(`${familia}-${tono}`);
        if (enCss !== String(valor).toLowerCase()) {
          discrepancias.push(`${familia}-${tono}: módulo ${valor} · globals.css ${enCss ?? "(no existe)"}`);
        }
      }
    }
    expect(discrepancias).toEqual([]);
  });

  it("el fondo cálido de la portada también coincide", () => {
    expect(PALETA_MOLNIP.fondoCalido.toLowerCase()).toBe(tokenCss("fondo-calido"));
  });

  it("el módulo cubre la escala completa de marca, sin huecos", () => {
    const tonos = Object.keys(PALETA_MOLNIP.brand).map(Number).sort((a, b) => a - b);
    expect(tonos).toEqual([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]);
  });
});
