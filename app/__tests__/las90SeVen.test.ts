import { describe, expect, it } from "vitest";
import { getHerramientas, getTodasLasHerramientas, getTodasLasCategorias } from "@/data/repositorio";
import { categoriasDe } from "@/data/taxonomia";
import { generateStaticParams } from "@/app/herramienta/[herramientaId]/page";

/**
 * NINGUNA HERRAMIENTA DEL CATÁLOGO PUEDE QUEDAR ESCONDIDA.
 *
 * El encargo, con las palabras de la propietaria (2026-09-30):
 *
 *   «Las 90 forman parte del producto y ninguna queda escondida por cómo
 *    hemos construido la pantalla o el motor.»
 *
 * Y lo que NO quiere decir, dicho por ella misma: no es enseñar las 90 en
 * cada consulta, ni que todas ganen alguna recomendación. Es que se puedan
 * alcanzar.
 *
 * Esta prueba es el cierre de ese trabajo, y existe porque ya se perdieron
 * herramientas dos veces por topes internos que parecían razonables al
 * escribirlos: un `filter` de idioma que tiraba lo que no constaba, y un tope
 * de 20 al materializar el «ver más». Las dos veces el catálogo estaba bien y
 * la pantalla mentía.
 */
describe("las 90 forman parte del producto", () => {
  const activas = getHerramientas();

  it("no hay ninguna ficha apagada sin querer", () => {
    expect(getTodasLasHerramientas()).toHaveLength(activas.length);
  });

  /** «Ver todas» muestra las 90, con acceso a cada ficha. */
  it("«Ver todas» las lista todas y ninguna se queda sin página", () => {
    const params = generateStaticParams();
    expect(params).toHaveLength(activas.length);
    const conPagina = new Set(params.map((p) => p.herramientaId));
    for (const h of activas) expect(conPagina.has(h.id)).toBe(true);
  });

  /** Cada herramienta aparece en las casas que le corresponden. */
  it("todas están en alguna casa, y la casa existe", () => {
    const casas = new Set(getTodasLasCategorias().map((c) => c.id));
    for (const h of activas) {
      const suyas = categoriasDe(h);
      expect(suyas.length, `${h.id} no está en ninguna casa`).toBeGreaterThan(0);
      for (const c of suyas) expect(casas.has(c), `${h.id} apunta a una casa que no existe: ${c}`).toBe(true);
    }
  });

  /**
   * LA PARTE DEL ASESOR NO SE COMPRUEBA AQUÍ, A PROPÓSITO.
   *
   * El vocabulario está aislado hasta F3 —«no lo lee nadie todavía, a
   * propósito»— y `aislamiento.test.ts` sólo deja entrar a
   * `agents/atlas-advisor/asesor`. Importarlo desde `app/` para escribir una
   * prueba rompería esa decisión por comodidad mía.
   *
   * Así que esa mitad del encargo vive donde le toca:
   * `agents/atlas-advisor/asesor/__tests__/verMas.test.ts`, «las 90 aparecen
   * en algún caso».
   */
});
