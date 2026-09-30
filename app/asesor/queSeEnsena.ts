/**
 * QUÉ SE ENSEÑA EN CADA SITIO DE LA PANTALLA DEL CONSEJO.
 *
 * Función pura, fuera del componente, para poder probarla con los casos
 * reales del motor sin abrir un navegador. La usa `ConsejoDelAsesor` y la
 * prueba `empatadas.test.ts`: si la pantalla y la prueba no leyeran lo mismo,
 * la prueba no demostraría nada.
 *
 * LA REGLA DEL EMPATE (propietaria, 2026-09-30): si Molnip dice que después
 * de aplicar sus criterios quedan 6 herramientas empatadas, las que enseñe
 * debajo tienen que pertenecer necesariamente a esas 6. Antes salían las tres
 * primeras de la búsqueda, por orden alfabético, y en 611 de 819 empates al
 * menos una no estaba entre las empatadas.
 *
 * El orden dentro del empate es el que trae el motor. No se reordena: no hay
 * razón para poner una por delante de otra, y no se inventa una jerarquía.
 */

type ConPiezas = { piezas: { herramientaId: string }[] };

export const idDe = (o: ConPiezas) => o.piezas.map((p) => p.herramientaId).join("+");

export const DE_TRES_EN_TRES = 3;

export type LoQueSeEnsena<O> = {
  /** Sólo con recomendación: la principal y sus dos alternativas. */
  delante: ConPiezas[];
  /** Sin recomendación: las filas bajo la tarjeta. En un empate, sólo empatadas. */
  filas: O[];
  /** Cuántas del mismo grupo quedan detrás de «Ver más». */
  quedanEnElGrupo: number;
  /** Si `filas` es el conjunto real de un empate. */
  esEmpate: boolean;
  /** «Explorar otras opciones»: lo que cubre, sin repetir nada de arriba. */
  restantes: O[];
  /** Lo que cubre sólo una parte, aparte y sin repetir. */
  parciales: O[];
};

export function queSeEnsena<O extends ConPiezas>(
  c: {
    loQueHaria: ConPiezas | null;
    alternativas: O[];
    caminos: { opciones: O[]; masOpciones: O[]; parciales: O[] }[];
    empatadas?: O[];
    loQueNecesitoSaber?: string | null;
    sinConfirmarEnNinguna?: string[];
  },
  verDelGrupo: number = DE_TRES_EN_TRES
): LoQueSeEnsena<O> {
  const principal = c.loQueHaria;
  const empatadas = c.empatadas ?? [];
  // Siempre que el motor traiga un empate, las filas salen de él. También
  // cuando arriba va «Dónde estamos» en vez de la frase del empate: el motor
  // razonó igual sobre ese conjunto, y enseñar otras sería contradecirlo.
  const esEmpate = !principal && empatadas.length > 0;

  const delante = principal ? [principal, ...c.alternativas.slice(0, 2)] : [];
  // Sin recomendación y sin empate no hay un conjunto sobre el que se haya
  // razonado: se sigue enseñando lo de antes.
  const grupo = principal ? [] : esEmpate ? empatadas : c.caminos.flatMap((k) => k.opciones).slice(0, DE_TRES_EN_TRES);
  const filas = grupo.slice(0, verDelGrupo);

  // El grupo entero cuenta como presentado aunque haya filas detrás de «Ver
  // más»: están en su sitio, y «Explorar» no las repite.
  const yaSeVen = new Set([...delante, ...grupo].map(idDe));
  const restantes: O[] = [];
  for (const o of [...c.alternativas.slice(2), ...c.caminos.flatMap((k) => [...k.opciones, ...k.masOpciones])]) {
    const id = idDe(o);
    if (yaSeVen.has(id)) continue;
    yaSeVen.add(id);
    restantes.push(o);
  }
  const parciales: O[] = [];
  for (const o of c.caminos.flatMap((k) => k.parciales)) {
    const id = idDe(o);
    if (yaSeVen.has(id)) continue;
    yaSeVen.add(id);
    parciales.push(o);
  }
  return { delante, filas, quedanEnElGrupo: grupo.length - filas.length, esEmpate, restantes, parciales };
}
