import { describe, expect, it } from "vitest";
import { getProblemas, getTodasLasCategorias, getTodasLasHerramientas } from "@/data/repositorio";
import { getCapacidad } from "@/data/vocabulario/repositorio";
import { recomendarHerramientas } from "@/agents/atlas-advisor/motor";
import { NECESIDADES, filaDeNecesidad, todasLasFilas } from "@/agents/atlas-advisor/necesidades";
import { etiquetaDeEvidencia } from "@/agents/atlas-advisor/etiquetaEvidencia";
import { perfilesDePrueba } from "@/agents/atlas-advisor/__tests__/perfiles";
import { getPuertaDeEvidencia, getPuertoDeEvidencia } from "../consulta";

/**
 * La opción B con los datos de verdad: las 62 fichas, los 1.544 registros y
 * el vocabulario. Vive aquí, y no en el Advisor, porque es el único sitio
 * desde el que se puede leer la verificación y el vocabulario a la vez.
 */
const catalogo = getTodasLasHerramientas();
const evidencia = getPuertaDeEvidencia();
const puerto = getPuertoDeEvidencia();

describe("lo que la tabla afirma sobre los datos, contrastado", () => {
  it("toda capacidad de toda fila existe en el vocabulario y está activa", () => {
    for (const fila of todasLasFilas()) {
      for (const id of fila.capacidades) {
        const capacidad = getCapacidad(id);
        expect(capacidad, `${fila.id} → ${id}`).toBeDefined();
        expect(capacidad?.estado, `${fila.id} → ${id}`).toBe("activa");
      }
    }
  });

  /**
   * `sinCobertura` no es un dato que el motor use: es una afirmación. Si
   * mañana alguna herramienta demuestra tickets, esta prueba lo dice y la
   * marca se quita. Y al revés: una fila sin la marca tiene que tener
   * alguien detrás, o la pregunta ofrecería algo que siempre acaba en «no».
   */
  it("las filas marcadas sin cobertura no tienen a nadie, y las demás tienen a alguien", () => {
    for (const fila of todasLasFilas()) {
      const quienes = catalogo.filter((h) => fila.capacidades.some((c) => evidencia.loDemuestra(h.id, c)));
      if (fila.sinCobertura) expect(quienes, `${fila.id} ya tiene cobertura: quita la marca`).toEqual([]);
      else expect(quienes.length, `${fila.id} no tiene a nadie: márcala o retírala`).toBeGreaterThan(0);
    }
  });

  it("toda herramienta que pasa una fila lleva etiqueta de evidencia", () => {
    for (const fila of todasLasFilas()) {
      for (const h of catalogo) {
        const pasa = fila.capacidades.some((c) => evidencia.loDemuestra(h.id, c));
        const etiqueta = etiquetaDeEvidencia(h.id, fila, (a, b) => puerto.estadoDe(a, b));
        expect(Boolean(etiqueta), `${fila.id} / ${h.id}`).toBe(pasa);
      }
    }
  });
});

/**
 * La peluquera del 2026-09-02, ahora con la pregunta. Perfil real: sola o con
 * una empleada, presupuesto ajustado, pierde citas.
 *
 * Estas pruebas no nombran herramientas: comprueban que lo recomendado cumple
 * la necesidad, no que aparezca una marca concreta. Si mañana otra ficha
 * demuestra la reserva de citas y encaja mejor, la prueba tiene que seguir
 * pasando — el catálogo está vivo y la prueba no es quien decide el orden.
 */
describe("la peluquera que perdía citas", () => {
  const perfil = { problemaIdsCandidatos: ["ahorrar-tiempo"], tamanoEmpresa: "1-10" as const, presupuesto: "ajustado" as const };
  // Las capacidades salen de la propia fila, no se copian aquí: si la fila
  // cambia, la prueba sigue comprobando lo que la pregunta promete.
  const capacidadesDe = (filaId: string) => filaDeNecesidad("ahorrar-tiempo", filaId)!.capacidades;
  const RESERVA = capacidadesDe("citas-reserva");
  const RECORDATORIO = capacidadesDe("recordatorios-citas");
  const demuestra = (id: string, capacidades: string[]) => capacidades.some((c) => evidencia.loDemuestra(id, c));
  const quienesDemuestran = (capacidades: string[]) => catalogo.filter((h) => demuestra(h.id, capacidades));

  it("hoy, sin pregunta, le salen herramientas que no han demostrado reservar citas (y por eso hace falta la pregunta)", () => {
    const r = recomendarHerramientas(perfil, catalogo, { evidencia });
    expect(r.top.length).toBeGreaterThan(0);
    expect(r.top.some((e) => !demuestra(e.herramienta.id, RESERVA))).toBe(true);
  });

  it("«que cojan cita ellos mismos»: sólo quien lo ha demostrado, todas las que lo han demostrado, y nada más", () => {
    const r = recomendarHerramientas({ ...perfil, necesidadElegida: "citas-reserva" }, catalogo, { evidencia });
    expect(r.sinRecomendacion).toBeUndefined();
    expect(r.top.length).toBeGreaterThan(0);
    expect(r.todas.map((e) => e.herramienta.id).sort()).toEqual(quienesDemuestran(RESERVA).map((h) => h.id).sort());
    for (const e of r.top) expect(demuestra(e.herramienta.id, RESERVA), e.herramienta.id).toBe(true);
  });

  it("«recordar las citas sin llamar»: las que lo demuestran, ordenadas por encaje con su perfil", () => {
    const r = recomendarHerramientas({ ...perfil, necesidadElegida: "recordatorios-citas" }, catalogo, { evidencia });
    expect(r.todas.map((e) => e.herramienta.id).sort()).toEqual(quienesDemuestran(RECORDATORIO).map((h) => h.id).sort());
    const puntuaciones = r.top.map((e) => e.puntuacionTotal);
    expect(puntuaciones).toEqual([...puntuaciones].sort((a, b) => b - a));
  });

  it("con plan gratuito obligatorio, entre las que reservan citas suben las que lo tienen", () => {
    const r = recomendarHerramientas({ ...perfil, necesidadElegida: "citas-reserva", requierePlanGratuito: true }, catalogo, { evidencia });
    const gratuitasQueReservan = quienesDemuestran(RESERVA).filter((h) => h.tienePlanGratuito).length;
    const esperadas = Math.min(gratuitasQueReservan, r.top.length);
    expect(esperadas).toBeGreaterThan(0);
    for (const e of r.top.slice(0, esperadas)) expect(e.herramienta.tienePlanGratuito, e.herramienta.id).toBe(true);
    for (const e of r.top) expect(demuestra(e.herramienta.id, RESERVA), e.herramienta.id).toBe(true);
  });

  it("«ninguna de éstas» la manda a contarlo con sus palabras, no a un corrector de textos", () => {
    const r = recomendarHerramientas({ ...perfil, necesidadElegida: "ninguna" }, catalogo, { evidencia });
    expect(r.top).toEqual([]);
    expect(r.sinRecomendacion?.tipo).toBe("ninguna_de_estas");
  });

  it("tickets: se dice que no lo cubrimos, con sus palabras", () => {
    const r = recomendarHerramientas(
      { problemaIdsCandidatos: ["atencion-cliente"], necesidadElegida: "tickets", tamanoEmpresa: "1-10" },
      catalogo,
      { evidencia }
    );
    expect(r.top).toEqual([]);
    expect(r.sinRecomendacion).toMatchObject({ tipo: "necesidad_sin_cobertura", necesidad: "Convertir cada petición en un ticket con estado" });
  });
});

/**
 * Lo que la pregunta NO puede tocar. Las 15 categorías, los 6 subtipos y los
 * 5 objetivos SIN necesidad elegida tienen que dar exactamente lo mismo que
 * antes de la opción B — el comportamiento anterior es la línea base, y
 * cualquier cambio ahí sería un efecto secundario, no una decisión.
 */
describe("la pregunta no cambia nada fuera de su camino", () => {
  it("por categoría y por subtipo, la necesidad elegida se ignora: 2.520 combinaciones idénticas", () => {
    const categorias = getTodasLasCategorias().map((c) => c.id).sort();
    const subtipos = [...new Set(catalogo.filter((h) => h.subtipoId).map((h) => `${h.categoriaId}/${h.subtipoId}`))].sort();
    const ambitos = [
      ...categorias.map((categoriaId) => ({ categoriaId })),
      ...subtipos.map((s) => ({ categoriaId: s.split("/")[0], subtipoId: s.split("/")[1] })),
    ];
    let combinaciones = 0;
    const distintos: string[] = [];
    for (const ambito of ambitos) {
      for (const perfil of perfilesDePrueba(ambito)) {
        combinaciones++;
        const sin = recomendarHerramientas(perfil, catalogo, { evidencia }).top.map((e) => e.herramienta.id).join(">");
        const con = recomendarHerramientas({ ...perfil, necesidadElegida: "citas-reserva" }, catalogo, { evidencia }).top.map((e) => e.herramienta.id).join(">");
        if (sin !== con) distintos.push(`${JSON.stringify(ambito)}: ${sin} → ${con}`);
      }
    }
    expect(combinaciones).toBe(2520);
    expect(distintos).toEqual([]);
  });

  it("por objetivo sin la pregunta, 600 combinaciones idénticas a la línea base", () => {
    // La línea base es el motor de antes: aquí se comprueba que sin
    // `necesidadElegida` el camino por objetivo no ha cambiado, comparando
    // con y sin puerta, que era la propiedad que ya garantizaba conexion.test.
    let combinaciones = 0;
    const distintos: string[] = [];
    for (const objetivo of getProblemas().map((p) => p.id)) {
      for (const perfil of perfilesDePrueba({ problemaIdsCandidatos: [objetivo] })) {
        combinaciones++;
        const sin = recomendarHerramientas(perfil, catalogo).top.map((e) => e.herramienta.id).join(">");
        const con = recomendarHerramientas(perfil, catalogo, { evidencia }).top.map((e) => e.herramienta.id).join(">");
        if (sin !== con) distintos.push(`${objetivo}: ${sin} → ${con}`);
      }
    }
    expect(combinaciones).toBe(600);
    expect(distintos).toEqual([]);
  });

  it("cada fila de cada objetivo, con perfil neutro, o recomienda o dice por qué no; nunca el catálogo entero", () => {
    for (const pregunta of NECESIDADES) {
      for (const fila of pregunta.familias.flatMap((f) => f.filas)) {
        const r = recomendarHerramientas({ problemaIdsCandidatos: [pregunta.objetivoId], necesidadElegida: fila.id }, catalogo, { evidencia });
        if (r.sinRecomendacion) {
          expect(r.sinRecomendacion.tipo, `${pregunta.objetivoId}/${fila.id}`).toBe("necesidad_sin_cobertura");
          expect(fila.sinCobertura, `${pregunta.objetivoId}/${fila.id}`).toBe(true);
        } else {
          expect(r.todas.length, `${pregunta.objetivoId}/${fila.id}`).toBeLessThan(catalogo.length);
          for (const e of r.todas) {
            expect(fila.capacidades.some((c) => evidencia.loDemuestra(e.herramienta.id, c)), `${fila.id} / ${e.herramienta.id}`).toBe(true);
          }
        }
      }
    }
  });
});
