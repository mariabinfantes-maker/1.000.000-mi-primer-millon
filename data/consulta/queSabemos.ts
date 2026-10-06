import fs from "node:fs";
import path from "node:path";

/**
 * «¿QUÉ SABEMOS DE X?» — todo lo que Molnip ya tiene de una herramienta, en
 * un solo sitio. SÓLO LEE: no escribe, no corrige y no decide qué fuente gana.
 *
 * Nace el 2026-10-05. Se dijo que de DriCloud «no tenemos guardado si ofrece
 * una prueba gratuita», mirando sólo su ficha. Estaba guardado: la entrega de
 * investigación del 30 de septiembre decía «La demostración gratuita no es un
 * plan», y al pasar a la ficha se copió el «no» pero no el porqué. Propietaria:
 * «la información tiene que quedar totalmente clara para que nosotros en todo
 * momento podamos consultarla de manera fácil». Esto es esa consulta.
 *
 * Reúne las capas que existen hoy, cada una con su ruta para poder abrirla:
 *
 *  - la ficha (`data/herramientas/<id>.json`) y su borrador, si lo hay;
 *  - las capacidades verificadas (`data/verificacion/registros.json`);
 *  - las entregas de investigación (`data/investigacion/**`), enlazadas por
 *    `id`, `herramientaId` o el nombre del archivo, y los documentos `.md` que
 *    la nombran.
 *
 * Una entrega de investigación es evidencia tal cual se guardó: puede
 * contradecir a la ficha, y aquí no se resuelve cuál vale. Se enseña.
 */

export type ObjetoEncontrado = {
  /** Dónde está dentro del archivo, para poder ir a mirarlo. */
  camino: string;
  /**
   * Cómo se enlazó con la herramienta. `texto`: es la respuesta que venía
   * escrita como texto dentro de un objeto suyo (las respuestas en bruto
   * guardan así lo que contestó el modelo), y es de quien es ese objeto.
   */
  enlace: "id" | "herramientaId" | "nombre" | "archivo" | "texto";
  campos: Record<string, unknown>;
};

export type Entrega = {
  ruta: string;
  /** La fecha que lleva la carpeta o el archivo. Sin fecha, `null`: no se inventa. */
  fecha: string | null;
  objetos: ObjetoEncontrado[];
  /** Archivos enlazados sólo por el nombre que no traen objetos con campos (volcados de páginas). */
  soloPorNombre: boolean;
};

export type Documento = { ruta: string; fecha: string | null; lineas: string[] };

export type LoQueSabemos = {
  id: string;
  nombre: string;
  ficha: Record<string, unknown> | null;
  borrador: Record<string, unknown> | null;
  capacidades: { verificadas: number; desconocidas: number; registros: Record<string, unknown>[] };
  entregas: Entrega[];
  documentos: Documento[];
};

const CLAVES_DE_ENLACE = ["id", "herramientaId", "herramienta", "idHerramienta"] as const;

function fechaDe(ruta: string): string | null {
  return ruta.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
}

function archivos(dir: string, extensiones: string[]): string[] {
  if (!fs.existsSync(dir)) return [];
  const salida: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) salida.push(...archivos(p, extensiones));
    else if (extensiones.some((x) => e.name.endsWith(x))) salida.push(p);
  }
  return salida.sort();
}

/**
 * Un texto que es JSON guardado dentro de otro JSON (las entregas de modelos lo
 * hacen). Casi todas las respuestas en bruto (`crudo/`) llegan además envueltas
 * en un bloque de código («```json … ```»), y hay que quitárselo para leerlas.
 *
 * Hasta el 2026-10-06 no se quitaba, y la consulta no veía nada de lo que
 * venía así: entre otras cosas, la nota de facilidad de uso que se leyó en
 * Capterra y G2 de 48 herramientas el 29 y el 30 de septiembre.
 */
function comoJson(v: string): unknown {
  let t = v.trim();
  const bloque = t.match(/^```[a-zA-Z]*\s*([\s\S]*?)\s*```$/);
  if (bloque) t = bloque[1].trim();
  if (!(t.startsWith("{") || t.startsWith("["))) return undefined;
  try {
    return JSON.parse(t);
  } catch {
    return undefined;
  }
}

type Herramienta = { id: string; nombre: string };

/**
 * Recorre un archivo de investigación y devuelve, por herramienta, los
 * objetos que hablan de ella. Un objeto habla de una herramienta si su `id`,
 * `herramientaId`, `herramienta` o `idHerramienta` es el suyo, o si su
 * `nombre` es exactamente el suyo. Y la respuesta escrita como texto dentro de
 * un objeto suyo también es suya (enlace `texto`).
 */
function objetosPorHerramienta(datos: unknown, herramientas: Herramienta[]): Map<string, ObjetoEncontrado[]> {
  const porId = new Map(herramientas.map((h) => [h.id, h]));
  const porNombre = new Map(herramientas.map((h) => [h.nombre.toLowerCase(), h]));
  const salida = new Map<string, ObjetoEncontrado[]>();
  const anotar = (id: string, o: ObjetoEncontrado) => {
    const lista = salida.get(id) ?? [];
    lista.push(o);
    salida.set(id, lista);
  };
  // `dueno`: la herramienta del objeto donde estaba escrito este texto. Una
  // respuesta en bruto contesta por la herramienta que la lleva, aunque por
  // dentro no repita su id.
  const recorrer = (x: unknown, camino: string, dueno?: string) => {
    if (typeof x === "string") {
      const dentro = comoJson(x);
      if (dentro === undefined) return;
      const c = `${camino}(texto)`;
      if (dueno && dentro && typeof dentro === "object" && !Array.isArray(dentro)) {
        const o = dentro as Record<string, unknown>;
        const propio = CLAVES_DE_ENLACE.some((k) => typeof o[k] === "string" && porId.has(o[k] as string));
        if (!propio) anotar(dueno, { camino: c, enlace: "texto", campos: o });
      }
      recorrer(dentro, c);
      return;
    }
    if (Array.isArray(x)) {
      x.forEach((v, i) => recorrer(v, `${camino}[${i}]`));
      return;
    }
    if (!x || typeof x !== "object") return;
    const o = x as Record<string, unknown>;
    let enlazado = false;
    let suyo: string | undefined;
    for (const clave of CLAVES_DE_ENLACE) {
      const v = o[clave];
      if (typeof v === "string" && porId.has(v)) {
        anotar(v, { camino: camino || "(raíz)", enlace: clave === "id" ? "id" : "herramientaId", campos: o });
        enlazado = true;
        suyo = v;
        break;
      }
    }
    if (!enlazado && typeof o.nombre === "string" && porNombre.has(o.nombre.toLowerCase())) {
      suyo = porNombre.get(o.nombre.toLowerCase())!.id;
      anotar(suyo, { camino: camino || "(raíz)", enlace: "nombre", campos: o });
    }
    for (const [k, v] of Object.entries(o)) recorrer(v, camino ? `${camino}.${k}` : k, typeof v === "string" ? suyo : undefined);
  };
  recorrer(datos, "");
  return salida;
}

/** El nombre del archivo dice de quién es: `koibox.json`, `p4-booksy-0.json`, `agiled__crm.json`. */
function archivoEsDe(ruta: string, id: string): boolean {
  const base = path.basename(ruta).replace(/\.json$/, "");
  return new RegExp(`(^|[-_])${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([-_.]|$)`).test(base);
}

export type IndiceDeInvestigacion = { entregas: Map<string, Entrega[]>; documentos: Map<string, Documento[]> };

/**
 * Lee TODA la carpeta de investigación una vez y la reparte por herramienta.
 * Lo usan la consulta de una herramienta y el diagnóstico de las 90: así las
 * dos leen exactamente lo mismo.
 */
export function indiceDeInvestigacion(herramientas: Herramienta[], raiz = process.cwd()): IndiceDeInvestigacion {
  const dir = path.join(raiz, "data", "investigacion");
  const entregas = new Map<string, Entrega[]>();
  for (const ruta of archivos(dir, [".json"])) {
    let datos: unknown;
    try {
      datos = JSON.parse(fs.readFileSync(ruta, "utf-8"));
    } catch {
      continue;
    }
    const rel = path.relative(raiz, ruta);
    const porHerramienta = objetosPorHerramienta(datos, herramientas);
    for (const h of herramientas) {
      const objetos = porHerramienta.get(h.id) ?? [];
      const porNombre = archivoEsDe(ruta, h.id);
      if (objetos.length === 0 && !porNombre) continue;
      const lista = entregas.get(h.id) ?? [];
      lista.push({ ruta: rel, fecha: fechaDe(rel), objetos, soloPorNombre: objetos.length === 0 });
      entregas.set(h.id, lista);
    }
  }
  const documentos = new Map<string, Documento[]>();
  for (const ruta of archivos(dir, [".md"])) {
    const texto = fs.readFileSync(ruta, "utf-8").split("\n");
    const rel = path.relative(raiz, ruta);
    for (const h of herramientas) {
      const patron = new RegExp(`\\b${h.nombre.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      const lineas = texto.filter((l) => patron.test(l)).map((l) => l.trim()).slice(0, 12);
      if (!lineas.length) continue;
      const lista = documentos.get(h.id) ?? [];
      lista.push({ ruta: rel, fecha: fechaDe(rel), lineas });
      documentos.set(h.id, lista);
    }
  }
  return { entregas, documentos };
}

function leerJson(ruta: string): Record<string, unknown> | null {
  return fs.existsSync(ruta) ? (JSON.parse(fs.readFileSync(ruta, "utf-8")) as Record<string, unknown>) : null;
}

export function herramientasDelCatalogo(raiz = process.cwd()): Herramienta[] {
  const dir = path.join(raiz, "data", "herramientas");
  return fs
    .readdirSync(dir)
    .filter((a) => a.endsWith(".json"))
    .map((a) => leerJson(path.join(dir, a)) as Herramienta)
    .map((h) => ({ id: h.id, nombre: h.nombre }));
}

export function registrosDeVerificacion(raiz = process.cwd()): Record<string, unknown>[] {
  return (leerJson(path.join(raiz, "data", "verificacion", "registros.json")) as unknown as Record<string, unknown>[]) ?? [];
}

/** Todo lo que sabemos de una herramienta. `indice` permite reutilizar una lectura ya hecha. */
export function queSabemosDe(id: string, raiz = process.cwd(), indice?: IndiceDeInvestigacion, registros?: Record<string, unknown>[]): LoQueSabemos | null {
  const ficha = leerJson(path.join(raiz, "data", "herramientas", `${id}.json`));
  if (!ficha) return null;
  const herramientas = herramientasDelCatalogo(raiz);
  const idx = indice ?? indiceDeInvestigacion(herramientas, raiz);
  const suyos = (registros ?? registrosDeVerificacion(raiz)).filter((r) => r.herramientaId === id);
  return {
    id,
    nombre: String(ficha.nombre),
    ficha,
    borrador: leerJson(path.join(raiz, "data", "borradores", "herramientas", `${id}.json`)),
    capacidades: {
      verificadas: suyos.filter((r) => r.estado === "verificado").length,
      desconocidas: suyos.filter((r) => r.estado !== "verificado").length,
      registros: suyos,
    },
    entregas: idx.entregas.get(id) ?? [],
    documentos: idx.documentos.get(id) ?? [],
  };
}
