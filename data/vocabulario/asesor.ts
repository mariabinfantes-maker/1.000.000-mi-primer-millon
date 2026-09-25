import fs from "node:fs";
import path from "node:path";
import { getNecesidad, getPuertas, necesidadesDePuerta } from "./necesidades";

/**
 * EL ESQUELETO DEL ASESOR — la casa, antes de saber con qué se llena.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  SE ESCRIBE SIN MIRAR EL CATÁLOGO, Y TIENE QUE SEGUIR EN PIE SI EL   │
 * │  CATÁLOGO CAMBIA ENTERO. NADIE LO LEE TODAVÍA.                        │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Nace de una corrección de la propietaria (2026-09-23): *«nunca debemos
 * diseñar nuestra página pensando en las herramientas que tenemos. Nosotros
 * diseñamos nuestra casa, nuestro esqueleto, y ya buscaremos con qué
 * llenarla.»*
 *
 * Y tenía delante la prueba de que se había torcido: el recorrido de prueba
 * del 2026-09-22 nombraba tres herramientas trece veces, tenía cuatro
 * preguntas escritas a mano y **no leía el mapa de necesidades ni una sola
 * vez**. Sus preguntas salían de las diferencias entre esas tres — «¿cuántas
 * citas al mes?» existía porque un plan topaba en cien.
 *
 * El diagnóstico, y por eso existe este archivo: **a la casa le faltaba una
 * planta**. Había necesidades, pero no había capa de preguntas, ni de consejo,
 * ni reglas de presentación como dato. Al no haber de dónde sacarlas, se
 * improvisaron delante de tres herramientas. El hueco del esqueleto es lo que
 * dejó entrar al catálogo.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LA REGLA QUE LO GOBIERNA
 * ─────────────────────────────────────────────────────────────────────────
 *
 * *«No se pregunta algo simplemente porque el negocio lo tenga, sino porque su
 * respuesta cambia el consejo.»* — propietaria, 2026-09-23.
 *
 * Sin esto, evitar las preguntas sobre herramientas se convierte en un
 * formulario interminable sobre la empresa. Por eso cada dimensión declara
 * `queCambia`, es obligatorio y no puede venir vacío: **si no cambia nada,
 * sobra**.
 *
 * LA PRUEBA DECISIVA, y está escrita como prueba de verdad:
 *
 *   Si quitamos ViDay y cambiamos el catálogo entero, las preguntas y el
 *   razonamiento siguen teniendo sentido. Cambiarán las herramientas
 *   ofrecidas y la cobertura; la casa sigue en pie.
 *
 * Las cuatro plantas:
 *
 *   necesidad   → qué le hace falta            (`necesidades.json`)
 *   dimensión   → qué le preguntamos, y qué cambia su respuesta
 *   consejo     → qué decimos, y qué estamos obligados a decir
 *   presentación→ cómo se enseñan las alternativas
 *
 * Y dentro de la dimensión, el orden completo: **necesidad → diagnóstico →
 * solución**. Las dos primeras se escriben sin mirar el catálogo. En la
 * tercera sí se habla de límites, planes y precios, porque ahí ya estamos
 * valorando herramientas. Lo que no se puede es invertirlo.
 */

export type Respuesta = {
  id: string;
  texto: string;
  /** Marca la salida honrada: no saberlo no puede bloquear el asesoramiento. */
  admiteNoLoSe?: boolean;
  /**
   * QUÉ TRAE ESTA RESPUESTA, y con qué peso.
   *
   * Sin esto, las respuestas eran decoración: la pregunta salía en pantalla y
   * contestarla no cambiaba nada, porque nadie sabía qué significaba cada
   * respuesta. Propietaria, 2026-09-25: «al responder, Molnip continúa desde
   * ahí».
   *
   * Sólo se rellena cuando la respuesta trae algo DE VERDAD. Una respuesta que
   * no añade ninguna necesidad no escribe aquí una lista vacía para quedar
   * simétrica: es que no trae nada, y deducir lo contrario sería inventar.
   */
  traeNecesidades?: { id: string; importancia: "imprescindible" | "deseable" }[];
  /** La respuesta es «te lo cuento yo»: no trae nada y abre la conversación. */
  loCuentaElla?: boolean;
};

export type Dimension = {
  id: string;
  /** En su idioma, y sin nombrar ninguna herramienta ni ningún plan. */
  pregunta: string;
  /** Lo que ve la persona: por qué se lo preguntamos. */
  porQuePreguntamos: string;
  /**
   * QUÉ CAMBIA EN EL DIAGNÓSTICO. Obligatorio y no vacío.
   *
   * Es el campo que separa una pregunta útil de un formulario: si al
   * escribirlo no sale nada, la pregunta sobra. Se escribe **sin mirar el
   * catálogo** — aquí no caben planes, topes ni precios, porque todavía no
   * estamos valorando herramientas sino entendiendo a la persona.
   */
  queCambiaEnElDiagnostico: string[];
  /**
   * QUÉ SE COMPRUEBA DESPUÉS, ya con herramientas delante.
   *
   * Aquí los límites SÍ caben, y es lo correcto: en esta fase estamos
   * valorando. Precisión de la propietaria (2026-09-23): *«hablar de límites
   * en esa segunda parte es correcto; ahí ya estamos valorando herramientas.
   * No hace falta eliminar toda referencia al catálogo, sino mantener el
   * orden.»*
   *
   * La primera versión de este módulo prohibía la palabra «tope» en cualquier
   * sitio, y eso era pasarse de frenada: tiraba información buena por evitar
   * un error de orden. El orden se arregla separando las dos fases, no
   * purgando la segunda.
   */
  queComprobamosDespues: string[];
  respuestas: Respuesta[];
  /** Las necesidades cuyo consejo cambia con esto. */
  afectaA: string[];
  /** Qué se hace cuando contesta que no lo sabe. Obligatorio si alguna respuesta lo admite. */
  siNoSabe?: string;
};

export type FormaDeConsejo = {
  id: string;
  cuando: string;
  loQueSeDice: string;
  /** Lo que no se puede omitir al decirlo. Vacío nunca. */
  obligatorio: string[];
};

export type ReglaDePresentacion = { id: string; regla: string; porQue: string };

export type Esqueleto = {
  version: string;
  fecha: string;
  nota: string;
  laReglaQueLoGobierna: { regla: string; deQuienEs: string; porQue: string; laPruebaDecisiva: string };
  dimensiones: Dimension[];
  formasDeConsejo: FormaDeConsejo[];
  reglasDePresentacion: ReglaDePresentacion[];
};

const RUTA = path.join(process.cwd(), "data", "vocabulario", "asesor.json");
let cache: Esqueleto | null = null;

export function getEsqueleto(): Esqueleto {
  cache ??= JSON.parse(fs.readFileSync(RUTA, "utf8")) as Esqueleto;
  return cache;
}

export function getDimensiones(): Dimension[] {
  return getEsqueleto().dimensiones;
}

/** Las dimensiones cuya respuesta cambia el consejo de esta necesidad. */
export function dimensionesDeNecesidad(necesidadId: string): Dimension[] {
  return getDimensiones().filter((d) => d.afectaA.includes(necesidadId));
}

/**
 * Lo que hay que preguntar para aconsejar sobre una puerta, sin repetir.
 *
 * Se calcula desde las necesidades de la puerta, no desde una lista escrita a
 * mano: así, añadir una necesidad trae sus preguntas solo, y quitarla se las
 * lleva. Una dimensión que sirve a varias necesidades se pregunta una vez.
 */
export function preguntasDePuerta(puertaId: string): Dimension[] {
  const suyas = new Set(necesidadesDePuerta(puertaId).map((n) => n.id));
  return getDimensiones().filter((d) => d.afectaA.some((n) => suyas.has(n)));
}

/** Cuántas necesidades de cada puerta tienen ya sus preguntas escritas. */
export function coberturaDelEsqueleto(): { puertaId: string; titulo: string; con: number; de: number }[] {
  return getPuertas().map((p) => {
    const necesidades = necesidadesDePuerta(p.id);
    return {
      puertaId: p.id,
      titulo: p.titulo,
      con: necesidades.filter((n) => dimensionesDeNecesidad(n.id).length > 0).length,
      de: necesidades.length,
    };
  });
}

/**
 * Todo lo que puede estar mal en el esqueleto. Devuelve frases, no lanza.
 *
 * `nombresDeHerramientas` lo pone quien llama —el esqueleto no puede leer el
 * catálogo, y no debe—, y sirve para la prueba decisiva: ninguna pregunta,
 * ningún motivo y ningún `queCambia` puede nombrar un producto.
 */
export function erroresDelEsqueleto(nombresDeHerramientas: readonly string[] = []): string[] {
  const e: string[] = [];
  const esqueleto = getEsqueleto();
  const vistos = new Set<string>();

  for (const d of esqueleto.dimensiones) {
    const donde = d.id;
    if (vistos.has(d.id)) e.push(`${donde}: dimensión repetida`);
    vistos.add(d.id);

    // La regla que lo gobierna, comprobada: si no cambia nada, sobra.
    if (d.queCambiaEnElDiagnostico.length === 0) {
      e.push(`${donde}: no declara qué cambia en el diagnóstico, así que sobra`);
    }
    for (const q of d.queCambiaEnElDiagnostico) {
      if (q.length < 25) e.push(`${donde}: «${q}» no dice qué cambia, sólo lo nombra`);
    }

    if (!d.pregunta.includes("?")) e.push(`${donde}: la pregunta no está escrita como pregunta`);
    if (d.respuestas.length < 2) e.push(`${donde}: una pregunta con menos de dos respuestas no es una pregunta`);
    if (d.afectaA.length === 0) e.push(`${donde}: no afecta a ninguna necesidad`);
    for (const n of d.afectaA) if (!getNecesidad(n)) e.push(`${donde}: apunta a una necesidad que no existe: ${n}`);

    const admite = d.respuestas.some((r) => r.admiteNoLoSe);
    if (admite && !d.siNoSabe) e.push(`${donde}: admite «no lo sé» y no dice qué se hace entonces`);
    if (!admite && d.siNoSabe) e.push(`${donde}: dice qué hacer si no lo sabe, pero ninguna respuesta lo admite`);

    // LA PRUEBA DECISIVA. Si para preguntar hace falta nombrar un producto,
    // la pregunta nació del catálogo.
    // Sólo se revisa la parte del DIAGNÓSTICO: lo que se comprueba después
    // habla de herramientas por definición, y debe poder nombrarlas.
    const texto = `${d.pregunta} ${d.porQuePreguntamos} ${d.queCambiaEnElDiagnostico.join(" ")}`.toLowerCase();
    for (const h of nombresDeHerramientas) {
      const nombre = h.toLowerCase();
      if (nombre.length > 3 && texto.includes(nombre)) e.push(`${donde}: nombra una herramienta («${h}»)`);
    }
  }

  for (const c of esqueleto.formasDeConsejo) {
    if (c.obligatorio.length === 0) e.push(`${c.id}: una forma de consejo sin nada obligatorio no obliga a nada`);
    if (!c.cuando || !c.loQueSeDice) e.push(`${c.id}: le falta cuándo se usa o qué se dice`);
  }

  for (const r of esqueleto.reglasDePresentacion) {
    if (!r.porQue) e.push(`${r.id}: una regla sin su motivo se borra en cuanto estorbe`);
  }

  return e;
}
