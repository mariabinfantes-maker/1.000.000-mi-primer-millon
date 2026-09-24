import { describe, expect, it } from "vitest";
import { getProblemas, getTodasLasCategorias, getTodasLasHerramientas } from "@/data/repositorio";
import { getCapacidad } from "@/data/vocabulario/repositorio";
import { recomendarHerramientas } from "@/agents/atlas-advisor/motor";
import { NECESIDADES, filaDeNecesidad, todasLasFilas } from "@/agents/atlas-advisor/necesidades";
import { etiquetaDeEvidencia } from "@/agents/atlas-advisor/etiquetaEvidencia";
import { perfilesDePrueba } from "@/agents/atlas-advisor/__tests__/perfiles";
import { getPuertaDeEvidencia, getPuertoDeEvidencia } from "../consulta";
import { getUso } from "../usos";

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
   * El uso que pide una fila (tercera ronda) tiene que existir en la lista
   * cerrada y colgar de una de las capacidades de esa misma fila: si no, la
   * fila pediría un uso que ninguna de sus capacidades puede tener.
   */
  it("el uso de toda fila que lo pide existe y cuelga de una capacidad de la fila", () => {
    let conUso = 0;
    for (const fila of todasLasFilas()) {
      if (!fila.uso) continue;
      conUso++;
      const uso = getUso(fila.uso.id);
      expect(uso, `${fila.id} → ${fila.uso.id}`).toBeDefined();
      expect(fila.capacidades, `${fila.id} → ${fila.uso.id}`).toContain(uso?.capacidadId);
      // Las dos filas de servicios de hoy no son imprescindibles: la regla aprobada las presenta como candidatas.
      expect(fila.uso.imprescindible, fila.id).toBe(false);
      expect(fila.usoSinConfirmar, `${fila.id}: un uso no imprescindible necesita el aviso fijo de respaldo`).toBeDefined();
    }
    expect(conUso).toBe(2);
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

  /**
   * Lo que se comprobó el 2026-09-16 al buscar el criterio de los grupos:
   * toda capacidad demostrada tiene fuente oficial con fecha; el plan se
   * enseña sólo cuando F2 lo demostró; y hoy no hay ningún candidato
   * pendiente, porque las 13 integraciones nombran su tercero. Si eso
   * cambia, esta prueba lo dice.
   */
  it("con los datos reales: toda etiqueta es «confirmada» con fuente y fecha, el plan sólo si está demostrado, y ningún pendiente", () => {
    let pares = 0;
    let conPlan = 0;
    for (const fila of todasLasFilas()) {
      for (const h of catalogo) {
        const etiqueta = etiquetaDeEvidencia(h.id, fila, (a, b) => puerto.estadoDe(a, b));
        if (!etiqueta) continue;
        pares++;
        expect(etiqueta.tipo, `${fila.id} / ${h.id}`).toBe("confirmada");
        if (etiqueta.tipo !== "confirmada") continue;
        expect(etiqueta.fuente?.url, `${fila.id} / ${h.id}`).toMatch(/^https:\/\//);
        expect(etiqueta.fuente?.fecha, `${fila.id} / ${h.id}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        const capacidad = fila.capacidades.find((c) => evidencia.loDemuestra(h.id, c))!;
        const plan = puerto.estadoDe(h.id, capacidad).plan;
        expect(Boolean(etiqueta.plan), `${fila.id} / ${h.id}`).toBe(plan.certeza === "verificado" && Boolean(plan.nombre));
        if (etiqueta.plan) conPlan++;
        if (etiqueta.integraCon) expect(etiqueta.integraCon.trim().length).toBeGreaterThan(0);
      }
    }
    expect(pares).toBeGreaterThan(0);
    expect(conPlan).toBeGreaterThan(0);
    expect(conPlan).toBeLessThan(pares);
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

  // `requierePlanGratuito` no lo pregunta hoy el cuestionario: nadie lo activa.
  // En el motor es una penalización, no una exclusión (decisión anterior a la
  // opción B). La propietaria decidió el 2026-09-16 documentarlo sin cambiar
  // el motor: cuando se pregunte, será exclusión con su propio «no».
  it("si alguien exigiera plan gratuito, el motor de hoy penaliza sin excluir: las gratuitas que reservan van delante", () => {
    const r = recomendarHerramientas({ ...perfil, necesidadElegida: "citas-reserva", requierePlanGratuito: true }, catalogo, { evidencia });
    const gratuitasQueReservan = quienesDemuestran(RESERVA).filter((h) => h.tienePlanGratuito).length;
    const esperadas = Math.min(gratuitasQueReservan, r.top.length);
    expect(esperadas).toBeGreaterThan(0);
    for (const e of r.top.slice(0, esperadas)) expect(e.herramienta.tienePlanGratuito, e.herramienta.id).toBe(true);
    for (const e of r.top) expect(demuestra(e.herramienta.id, RESERVA), e.herramienta.id).toBe(true);
  });

  it("«que reserven un servicio»: las mismas herramientas y el mismo orden que reuniones; sólo cambia lo que se afirma", () => {
    const reuniones = recomendarHerramientas({ ...perfil, necesidadElegida: "citas-reserva" }, catalogo, { evidencia });
    const servicios = recomendarHerramientas({ ...perfil, necesidadElegida: "servicio-reserva" }, catalogo, { evidencia });
    expect(servicios.top.map((e) => e.herramienta.id)).toEqual(reuniones.top.map((e) => e.herramienta.id));
    expect(servicios.todas.map((e) => e.herramienta.id)).toEqual(reuniones.todas.map((e) => e.herramienta.id));
    expect(filaDeNecesidad("ahorrar-tiempo", "servicio-reserva")?.usoSinConfirmar).toBe("servicios-reserva");
  });

  it("«ninguna de éstas» la manda a contarlo con sus palabras, no a un corrector de textos", () => {
    const r = recomendarHerramientas({ ...perfil, necesidadElegida: "ninguna" }, catalogo, { evidencia });
    expect(r.top).toEqual([]);
    expect(r.sinRecomendacion?.tipo).toBe("ninguna_de_estas");
  });

  /**
   * Hasta el 2026-09-23 esta prueba decía «tickets: se dice que no lo
   * cubrimos». Era cierto: ninguna herramienta lo había demostrado, y la fila
   * se dejaba puesta a propósito para decirlo en voz alta.
   *
   * Ese día la propietaria autorizó incorporar las dos pasadas de
   * verificación por casas, y diez herramientas demostraron tickets con cita
   * de su página oficial. No cambió el motor ni la regla: cambió lo que
   * sabemos. La peluquera que preguntaba por tickets ya obtiene respuesta.
   */
  it("tickets: ahora sí lo cubrimos, y sólo con quien lo demuestra", () => {
    const r = recomendarHerramientas(
      { problemaIdsCandidatos: ["atencion-cliente"], necesidadElegida: "tickets", tamanoEmpresa: "1-10" },
      catalogo,
      { evidencia }
    );
    expect(r.top.length).toBeGreaterThan(0);
    expect(r.sinRecomendacion).toBeUndefined();
    for (const e of r.top) {
      // Las capacidades salen de la propia fila, como en las de arriba.
      const suyas = filaDeNecesidad("atencion-cliente", "tickets")!.capacidades;
      expect(demuestra(e.herramienta.id, suyas), e.herramienta.id).toBe(true);
    }
  });

  /**
   * Y el mecanismo de «no lo cubrimos» sigue vivo donde sigue siendo verdad:
   * la factura electrónica obligatoria no la demuestra nadie. Si algún día
   * alguien la demuestra, esta prueba avisará igual que avisó la de tickets.
   */
  it("factura electrónica: se dice que no lo cubrimos, con sus palabras", () => {
    const r = recomendarHerramientas(
      { problemaIdsCandidatos: ["el-dinero"], necesidadElegida: "factura-electronica", tamanoEmpresa: "1-10" },
      catalogo,
      { evidencia }
    );
    expect(r.top).toEqual([]);
    expect(r.sinRecomendacion?.tipo).toBe("necesidad_sin_cobertura");
  });
});

/**
 * Lo que la pregunta NO puede tocar. Las 15 categorías, los 6 subtipos y los
 * 5 objetivos SIN necesidad elegida tienen que dar exactamente lo mismo que
 * antes de la opción B — el comportamiento anterior es la línea base, y
 * cualquier cambio ahí sería un efecto secundario, no una decisión.
 */
describe("la pregunta no cambia nada fuera de su camino", () => {
  it("por categoría y por subtipo, la necesidad elegida se ignora: 2.760 combinaciones idénticas", () => {
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
    // 2.760 desde el 2026-09-24: dos categorías más, porque los sectores
    // pasaron a tener nombre propio. Lo que mide la prueba no cambió.
    expect(combinaciones).toBe(2760);
    expect(distintos).toEqual([]);
  });

  it("por objetivo sin la pregunta, 720 combinaciones idénticas a la línea base", () => {
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
    expect(combinaciones).toBe(720);
    expect(distintos).toEqual([]);
  });

  it("cada fila de cada objetivo, con perfil neutro, o recomienda o dice por qué no; nunca el catálogo entero", () => {
    for (const pregunta of NECESIDADES) {
      for (const fila of pregunta.familias.flatMap((f) => f.filas)) {
        const r = recomendarHerramientas({ problemaIdsCandidatos: [pregunta.objetivoId], necesidadElegida: fila.id }, catalogo, { evidencia });
        if (r.sinRecomendacion) {
          expect(r.sinRecomendacion.tipo, `${pregunta.objetivoId}/${fila.id}`).toBe("necesidad_sin_cobertura");
          // O la fila está marcada sin cobertura, o pide un uso imprescindible que nadie ha demostrado.
          expect(fila.sinCobertura === true || fila.uso?.imprescindible === true, `${pregunta.objetivoId}/${fila.id}`).toBe(true);
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
