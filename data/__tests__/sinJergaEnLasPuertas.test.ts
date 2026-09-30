import { describe, expect, it } from "vitest";
import { getProblemas, getTodasLasCategorias } from "@/data/repositorio";
import { TEXTOS_NECESIDADES } from "@/agents/atlas-advisor/necesidades.textos.es";

/**
 * «Sin lenguaje técnico. Si la explicación sólo la entiende quien ya sabía, no
 * ha servido.» Es una de las cuatro reglas que no se negocian.
 *
 * Se incumplía en las cinco puertas a la vez, y no por una palabra suelta: las
 * cinco preguntaban lo mismo —«¿ya usas un [nombre de categoría]?»— que exige
 * saber en qué cajón cae tu problema antes de poder contestar. Eso es
 * exactamente lo que la propietaria señaló: Molnip obligaba al cliente a saber
 * qué necesita.
 *
 * ── La distinción que sostiene esta prueba ──────────────────────────────
 *
 * La jerga sale de lo que Molnip DICE y se queda en lo que Molnip ENTIENDE.
 * `palabrasClave` no se comprueba aquí a propósito: si alguien escribe «no
 * hago seguimiento de mis leads», Molnip tiene que entenderle. Lo que no
 * puede es hablarle así.
 *
 * Entender en muchos idiomas, responder en uno solo.
 */

/**
 * Palabras que sólo entiende quien ya sabía. No es una lista de estilo: cada
 * una estuvo escrita en una pantalla que ve un autónomo.
 */
const JERGA = [
  "lead",
  "leads",
  "crm",
  "pipeline",
  "embudo",
  "prospección",
  "conversión",
  "onboarding",
  "workflow",
  "saas",
  "roi",
  "kpi",
  "dashboard",
  "stack",
  "automatización",
  "productividad",
  "centraliza",
  "optimiza",
  "gestión documental",
];

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Busca la palabra entera, para que «venta» no salte con «ventana». */
function jergaEn(texto: string): string[] {
  const limpio = normalizar(texto);
  return JERGA.filter((palabra) => new RegExp(`\\b${normalizar(palabra)}\\b`).test(limpio));
}

describe("las puertas hablan como habla la gente", () => {
  it("ningún título, descripción ni pregunta usa jerga", () => {
    const problemas = getProblemas();
    const fallos = problemas.flatMap((p) =>
      [
        ["titulo", p.titulo],
        ["descripcion", p.descripcion],
        ["preguntaHerramienta", p.preguntaHerramienta],
      ].flatMap(([campo, texto]) => {
        const encontrada = jergaEn(texto ?? "");
        return encontrada.length ? [`${p.id}.${campo}: «${encontrada.join(", ")}» en "${texto}"`] : [];
      })
    );
    expect(fallos).toEqual([]);
  });

  /**
   * La forma, no sólo las palabras.
   *
   * Preguntar «¿ya usas algún CRM?» o «¿alguna herramienta de gestión de
   * proyectos?» obliga a saber en qué cajón del catálogo cae tu problema antes
   * de poder contestar. Preguntar «¿llevas el trabajo en algún programa, o en
   * hojas de cálculo?» no: eso lo contesta cualquiera.
   *
   * La diferencia no está en decir «programa» o «herramienta» —son palabras
   * normales— sino en NOMBRAR UNA CATEGORÍA. Por eso se comprueba contra los
   * nombres reales de las categorías del catálogo y no contra una lista de
   * sospechosas inventada: si mañana nace una categoría nueva, esta prueba la
   * vigila sola.
   */
  it("ninguna pregunta nombra una categoría del catálogo", () => {
    const categorias = getTodasLasCategorias().map((c) => c.nombre);
    const fallos = getProblemas().flatMap((p) => {
      const pregunta = normalizar(p.preguntaHerramienta ?? "");
      const nombradas = categorias.filter((nombre) => pregunta.includes(normalizar(nombre)));
      return nombradas.length ? [`${p.id}: «${nombradas.join(", ")}» en "${p.preguntaHerramienta}"`] : [];
    });
    expect(
      fallos,
      "Pregunta por lo que la persona hace, no por la categoría de software en la que cae su problema."
    ).toEqual([]);
  });

  it("los textos de las necesidades tampoco usan jerga", () => {
    const fallos = Object.entries(TEXTOS_NECESIDADES.filas).flatMap(([id, texto]) => {
      const encontrada = [...jergaEn(texto.etiqueta), ...jergaEn(texto.descripcion)];
      return encontrada.length ? [`${id}: «${encontrada.join(", ")}»`] : [];
    });
    expect(fallos).toEqual([]);
  });

  /**
   * El control negativo: si la lista dejara de detectar nada, esta prueba
   * pasaría por vacía y no protegería nada.
   */
  it("la lista de jerga funciona", () => {
    expect(jergaEn("Atrae y convierte más leads en ventas")).toContain("leads");
    expect(jergaEn("¿Ya utilizas algún CRM?")).toContain("crm");
    // Y no salta con palabras que la contienen por casualidad.
    expect(jergaEn("una ventana pequeña")).toEqual([]);
  });
});
