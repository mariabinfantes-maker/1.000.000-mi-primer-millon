import { describe, expect, it } from "vitest";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { calcularPuntuacionAtlas } from "@/lib/puntuacionAtlas";

/**
 * `analisisAtlas.puntuacion` es un valor DERIVADO: lo calcula
 * `lib/puntuacionAtlas.ts` a partir del resto de la ficha, y el esquema lo
 * documenta como "calculado, no investigado". Guardarlo en el JSON es una
 * comodidad —para informes, paneles y cualquier consumidor que no quiera
 * recalcular—, no una fuente de verdad paralela.
 *
 * El 2026-09-02 se descubrió que las seis fichas incorporadas ese día
 * (HeyGen, Todoist, Beautiful.ai, Canva, Taskade y ClickUp Brain) tenían
 * `puntuacion: 0` y `motivosPuntuacion: []` guardados. El borrador se
 * escribió con esos campos a cero esperando que la promoción los
 * recalculara, y `promover.ts` no lo hace: calcula la puntuación para
 * decidir si supera el umbral de calidad, pero copia la ficha tal cual.
 *
 * No llegó a verse desde fuera —la tarjeta recalcula al vuelo, así que la
 * usuaria veía 98— ni afectó al orden de las recomendaciones: el motor solo
 * lee `nivelTecnicoRecomendado` y `tipoNegocioIdeal` de `analisisAtlas`,
 * nunca la puntuación. Pero un dato guardado que contradice al que se
 * muestra es una trampa esperando a que alguien confíe en él.
 *
 * Esta prueba cierra esa puerta para siempre, y lo hace sobre TODO el
 * catálogo, no solo sobre las seis: si mañana entra una ficha con la
 * puntuación sin recalcular, falla aquí antes de llegar a producción.
 */
describe("la puntuación guardada en cada ficha", () => {
  const herramientas = getTodasLasHerramientas();
  // `analisisAtlas` es opcional en el esquema, y cinco fichas antiguas no lo
  // traen (ver la última prueba). Estas comprobaciones son sobre las que SÍ
  // guardan una puntuación: el fallo era guardarla mal, no no guardarla.
  const conAnalisis = herramientas.filter((h) => h.analisisAtlas);

  it("hay catálogo que comprobar", () => {
    expect(conAnalisis.length).toBeGreaterThan(0);
  });

  it.each(conAnalisis.map((h) => [h.id, h] as const))(
    "%s: la guardada coincide con la recalculada",
    (id, herramienta) => {
      const calculada = calcularPuntuacionAtlas(herramienta);
      expect(calculada, `no se puede calcular la puntuación de "${id}"`).not.toBeNull();
      expect(
        herramienta.analisisAtlas!.puntuacion,
        `"${id}" tiene guardado ${herramienta.analisisAtlas!.puntuacion} y le corresponde ${calculada!.puntuacion}. ` +
          "Es un valor derivado: recalcúlalo en vez de escribirlo a mano."
      ).toBe(calculada!.puntuacion);
    }
  );

  it("ninguna ficha activa guarda una puntuación de cero", () => {
    // El síntoma concreto del fallo: un borrador que deja el campo a cero y
    // se promueve tal cual. Cero no es una puntuación baja legítima —
    // `criteriosCalidad.ts` bloquea la promoción por debajo de 80.
    const aCero = conAnalisis.filter((h) => h.estado === "activo" && h.analisisAtlas!.puntuacion === 0);
    expect(aCero.map((h) => h.id)).toEqual([]);
  });

  it("ninguna ficha activa se queda sin motivos que expliquen su puntuación", () => {
    // `motivosPuntuacion` es lo que la tarjeta enseña al desplegar "ver más
    // detalles". Una puntuación sin motivos es un número sin respaldo.
    const sinMotivos = conAnalisis.filter(
      (h) => h.estado === "activo" && (h.analisisAtlas!.motivosPuntuacion ?? []).length === 0
    );
    expect(sinMotivos.map((h) => h.id)).toEqual([]);
  });

  /**
   * Hueco distinto y anterior, encontrado al escribir estas pruebas: cinco
   * fichas no traen `analisisAtlas` en absoluto. Son las cinco que entraron
   * al catálogo sin pasar por un borrador de Researcher, así que nunca se
   * les generó el análisis.
   *
   * No es un fallo visible —la tarjeta recalcula la puntuación al vuelo y se
   * ven correctamente— pero sí tiene una consecuencia real: los dos
   * criterios de `criteriosAnalisisAtlas.ts` (nivel técnico recomendado y
   * tipo de negocio ideal) no les dan puntos, porque no tienen ese dato.
   *
   * Queda FUERA del alcance de esta corrección, que era otra cosa. Se fija
   * aquí la lista exacta para que no crezca en silencio: si mañana entra una
   * sexta ficha sin análisis, esta prueba falla y obliga a decidir.
   */
  it("las fichas sin analisisAtlas siguen siendo exactamente estas cinco", () => {
    const sinAnalisis = herramientas.filter((h) => !h.analisisAtlas).map((h) => h.id).sort();
    expect(sinAnalisis).toEqual(["bitrix24", "gohighlevel", "hubspot", "odoo", "zoho-one"]);
  });
});
