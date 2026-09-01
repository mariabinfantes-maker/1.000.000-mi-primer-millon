import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Molnip Visual v1 fija dos vocabularios cerrados: los radios de las esquinas
 * y los colores. Las dos reglas se cumplían ya en producción salvo por cuatro
 * detalles, y las cuatro desviaciones se corrigieron en este mismo sprint.
 *
 * Estas comprobaciones existen porque esa clase de desviación no la detecta
 * nadie mirando: un `rounded-lg` entre setenta y nueve `rounded-xl`, o un
 * `ring-black/[0.03]` entre veinticinco `[0.02]`, se copian y se multiplican
 * sin que ninguna pantalla se vea mal. Cuando por fin se notan, ya hay que
 * tocar treinta ficheros.
 *
 * La del color no lleva una lista de colores prohibidos, sino que lee los que
 * `globals.css` declara. Así traduce literalmente la decisión de la
 * propietaria —«no se añadirán nuevos estados o colores sin incorporarlos
 * primero al sistema»—: para usar un color nuevo hay que empezar por
 * definirlo, que es justo el paso que obliga a pensar qué significa.
 */

const RAIZ = join(__dirname, "..", "..");

function ficheros(extensiones = [".tsx"]): string[] {
  const salida: string[] = [];
  for (const carpeta of ["components", "app"]) {
    const base = join(RAIZ, carpeta);
    for (const entrada of readdirSync(base, { recursive: true, encoding: "utf-8" })) {
      // Las propias pruebas quedan fuera: sus controles negativos escriben
      // a propósito lo que estas comprobaciones persiguen.
      if (entrada.includes("__tests__")) continue;
      if (extensiones.some((e) => entrada.endsWith(e))) salida.push(join(base, entrada));
    }
  }
  return salida;
}

// --- Radios -----------------------------------------------------------------

const RADIOS_PERMITIDOS = ["xl", "2xl", "3xl", "full", "codigo"];
const LADOS = ["", "t", "r", "b", "l", "s", "e", "tl", "tr", "br", "bl", "ss", "se", "es", "ee"];

const VOCABULARIO_RADIOS = new Set(
  LADOS.flatMap((lado) =>
    RADIOS_PERMITIDOS.map((radio) => (lado ? `rounded-${lado}-${radio}` : `rounded-${radio}`)),
  ),
);

/** Devuelve los radios del texto que no pertenecen al vocabulario. */
export function radiosFueraDeVocabulario(texto: string): string[] {
  const encontrados = texto.match(/\brounded(?:-[a-z0-9]+)*\b/g) ?? [];
  return [...new Set(encontrados.filter((clase) => !VOCABULARIO_RADIOS.has(clase)))];
}

// --- Colores ----------------------------------------------------------------

/**
 * Utilidades de Tailwind cuyo último tramo es un color. `shadow` queda fuera a
 * propósito: `shadow-premium` es una sombra, no un color, y `shadow-slate-200`
 * no se usa en el proyecto.
 */
const UTILIDADES_DE_COLOR = new Set([
  "bg", "text", "border", "ring", "inset-ring", "outline", "divide",
  "from", "via", "to", "fill", "stroke", "accent", "caret", "placeholder",
  "decoration",
]);

/** Colores que no llevan escala y siempre son válidos. */
const PALABRAS_SUELTAS = new Set(["white", "black", "transparent", "current", "inherit"]);

/** Lee de `globals.css` los tonos que el sistema declara: "brand-600", "exito-50"... */
export function tonosDeclarados(css: string): Set<string> {
  const tonos = new Set<string>();
  for (const [, familia, tono] of css.matchAll(/--color-([a-z][a-z0-9-]*?)-(\d{2,3})\s*:/g)) {
    tonos.add(`${familia}-${tono}`);
  }
  return tonos;
}

/** Todos los nombres de color declarados, con o sin escala numérica. */
export function nombresDeclarados(css: string): Set<string> {
  const nombres = new Set<string>();
  for (const [, nombre] of css.matchAll(/--color-([a-z][a-z0-9-]*)\s*:/g)) nombres.add(nombre);
  return nombres;
}

/**
 * Los tokens de estado del proceso (`estado-aprobada-fondo`…) que un texto usa
 * y el sistema no declara. Van aparte de la comprobación numérica porque no
 * llevan escala: su forma es `<utilidad>-estado-<nombre>-<papel>`.
 */
export function estadosNoDeclarados(texto: string, declarados: Set<string>): string[] {
  const fuera: string[] = [];
  for (const [entero, prefijo, resto] of texto.matchAll(
    /\b([a-z]+(?:-[trblxyse]{1,2})?)-(estado-[a-z-]+)\b/g,
  )) {
    const utilidad = prefijo.replace(/-[trblxyse]{1,2}$/, "");
    if (!UTILIDADES_DE_COLOR.has(utilidad) && !UTILIDADES_DE_COLOR.has(prefijo)) continue;
    if (!declarados.has(resto)) fuera.push(entero);
  }
  return [...new Set(fuera)];
}

/**
 * Cada token del sistema lleva escrito de qué tono sale (`/* = amber-700 *\/`).
 * Devuelve los que ya no coinciden con ese tono. Es lo que sostiene la promesa
 * de que renombrar no cambió ningún color: si alguien edita un valor y deja el
 * comentario, esto lo caza.
 */
export function equivalenciasRotas(css: string, temaTailwind: string): string[] {
  const valorDe = (fuente: string, nombre: string): string | undefined => {
    const m = fuente.match(new RegExp(`--color-${nombre}\\s*:\\s*([^;]+);`));
    return m ? m[1].trim() : undefined;
  };
  const rotas: string[] = [];
  for (const [, token, valor, origen] of css.matchAll(
    /--color-([a-z0-9-]+)\s*:\s*([^;]+);\s*\/\* = ([a-z0-9-]+) \*\//g,
  )) {
    const esperado = valorDe(css, origen) ?? valorDe(temaTailwind, origen);
    if (esperado === undefined) rotas.push(`${token}: dice salir de "${origen}", que no existe`);
    else if (esperado !== valor.trim()) {
      rotas.push(`${token}: vale "${valor.trim()}" pero ${origen} vale "${esperado}"`);
    }
  }
  return rotas;
}

/**
 * Devuelve los colores del texto que el sistema no declara. Solo mira
 * utilidades con escala numérica (`bg-amber-100`), que es la forma en la que
 * reaparecen los colores de Tailwind sin significado asignado.
 */
export function coloresNoDeclarados(texto: string, declarados: Set<string>): string[] {
  const fuera: string[] = [];
  for (const [entero, prefijo, familia, tono] of texto.matchAll(
    /\b([a-z]+(?:-[trblxyse]{1,2})?)-([a-z][a-z0-9-]*)-(\d{2,3})\b/g,
  )) {
    const utilidad = prefijo.replace(/-[trblxyse]{1,2}$/, "");
    if (!UTILIDADES_DE_COLOR.has(utilidad) && !UTILIDADES_DE_COLOR.has(prefijo)) continue;
    if (PALABRAS_SUELTAS.has(familia)) continue;
    if (!declarados.has(`${familia}-${tono}`)) fuera.push(entero);
  }
  return [...new Set(fuera)];
}

// --- Desviaciones conocidas -------------------------------------------------

/**
 * Estas comprobaciones destaparon desviaciones que la auditoría de Molnip
 * Visual v1 no había visto: contó los `rounded-lg` pero no el `rounded` a
 * secas, y contó emerald/amber/red/sky pero no rose, lime ni orange.
 *
 * **Están todas resueltas**, cada una por su significado y ninguna en bloque:
 *
 * - `lime` y `orange` eran estados del proceso de afiliación («aprobada»,
 *   «seguimiento»): tienen token propio con nombre funcional y el mismo valor
 *   de siempre.
 * - Los dos `rounded` a secas eran `<code>` en línea: ahora son
 *   `rounded-codigo`, dentro del vocabulario y con el mismo aspecto exacto.
 * - Tres de los cinco `rose` eran mensajes de error de verdad: pasan a
 *   `error`.
 * - Los otros dos eran la «X» decorativa de la lista «Desventajas», el par
 *   del `Check` verde de «Ventajas». Pasa a `error-400`: mantiene su función,
 *   su tamaño y su sitio, y solo cambia el tono.
 *
 * Las dos listas quedan vacías, y así deben seguir. Ya no son una lista de
 * excepciones toleradas: son la afirmación de que no hay ninguna. Cualquier
 * radio o color fuera del sistema hace fallar la prueba, sin sitio donde
 * apuntarlo para que pase.
 */
const DESVIACIONES_RADIO_PENDIENTES: string[] = [];

const DESVIACIONES_COLOR_PENDIENTES: string[] = [];

// --- Comprobaciones ---------------------------------------------------------

describe("la lista de desviaciones está cerrada", () => {
  /**
   * Las dos listas de arriba nacieron como una tregua: dejaban pasar lo que
   * ya se desviaba mientras se decidía qué hacer con cada caso. Esa tregua se
   * acabó — no queda ninguna.
   *
   * Esta comprobación existe para que no se reabra por comodidad. Sin ella,
   * la salida fácil ante un fallo de las pruebas de abajo sería añadir la
   * clase nueva a la lista y seguir; con ella, esa salida también falla, y no
   * queda más remedio que arreglar el color o el radio, o pedir permiso para
   * cambiar el sistema.
   */
  it("no queda ninguna desviación tolerada, ni de radio ni de color", () => {
    expect(DESVIACIONES_RADIO_PENDIENTES).toEqual([]);
    expect(DESVIACIONES_COLOR_PENDIENTES).toEqual([]);
  });
});

describe("vocabulario de radios (Molnip Visual v1)", () => {
  it("no aparecen radios fuera de xl / 2xl / 3xl / full", () => {
    const culpables: string[] = [];
    for (const ruta of ficheros()) {
      const sueltos = radiosFueraDeVocabulario(readFileSync(ruta, "utf-8"));
      if (sueltos.length > 0) culpables.push(`${relative(RAIZ, ruta)}: ${sueltos.join(", ")}`);
    }
    expect(culpables.sort()).toEqual([...DESVIACIONES_RADIO_PENDIENTES].sort());
  });

  it("detecta un radio suelto (control negativo)", () => {
    expect(radiosFueraDeVocabulario('className="rounded-lg px-3"')).toEqual(["rounded-lg"]);
    expect(radiosFueraDeVocabulario('className="rounded-md"')).toEqual(["rounded-md"]);
    expect(radiosFueraDeVocabulario('className="rounded border"')).toEqual(["rounded"]);
    expect(radiosFueraDeVocabulario('className="rounded-2xl rounded-t-3xl rounded-r-xl rounded-codigo"')).toEqual([]);
  });
});

describe("vocabulario de colores (Molnip Visual v1)", () => {
  const css = readFileSync(join(RAIZ, "app", "globals.css"), "utf-8");
  const declarados = tonosDeclarados(css);

  it("globals.css declara los cuatro estados con su significado", () => {
    for (const estado of ["exito", "atencion", "error", "info"]) {
      expect(declarados.has(`${estado}-50`), `falta ${estado}-50`).toBe(true);
      expect(declarados.has(`${estado}-900`), `falta ${estado}-900`).toBe(true);
    }
  });

  it("no aparecen colores que el sistema no declare", () => {
    const culpables: string[] = [];
    for (const ruta of ficheros()) {
      const fuera = coloresNoDeclarados(readFileSync(ruta, "utf-8"), declarados);
      if (fuera.length > 0) culpables.push(`${relative(RAIZ, ruta)}: ${fuera.join(", ")}`);
    }
    expect(culpables.sort()).toEqual([...DESVIACIONES_COLOR_PENDIENTES].sort());
  });

  it("ninguno de los cuatro estados sigue escrito a pelo", () => {
    const familias = ["emerald", "amber", "red", "sky"];
    const culpables: string[] = [];
    for (const ruta of ficheros()) {
      const fuera = coloresNoDeclarados(readFileSync(ruta, "utf-8"), declarados).filter((clase) =>
        familias.some((familia) => clase.includes(`-${familia}-`)),
      );
      if (fuera.length > 0) culpables.push(`${relative(RAIZ, ruta)}: ${fuera.join(", ")}`);
    }
    expect(culpables).toEqual([]);
  });

  it("cada token vale exactamente lo que dice el tono del que sale", () => {
    const tema = readFileSync(join(RAIZ, "node_modules", "tailwindcss", "theme.css"), "utf-8");
    expect(equivalenciasRotas(css, tema)).toEqual([]);
  });

  it("detecta un valor que ya no coincide con su origen (control negativo)", () => {
    const falso = "--color-exito-50: oklch(50% 0 0); /* = emerald-50 */";
    const tema = readFileSync(join(RAIZ, "node_modules", "tailwindcss", "theme.css"), "utf-8");
    expect(equivalenciasRotas(falso, tema)).toHaveLength(1);
    expect(equivalenciasRotas("--color-x: #fff; /* = inventado-99 */", tema)[0]).toContain("no existe");
  });

  it("detecta un color de estado sin nombre (control negativo)", () => {
    // Los cuatro que había escritos a pelo antes de este sprint.
    expect(coloresNoDeclarados('className="bg-emerald-50 text-red-700"', declarados)).toEqual([
      "bg-emerald-50",
      "text-red-700",
    ]);
    // Un quinto color sin significado definido.
    expect(coloresNoDeclarados('className="border-teal-300"', declarados)).toEqual(["border-teal-300"]);
    // Un tono que no existe dentro de una familia que sí existe.
    expect(coloresNoDeclarados('className="bg-exito-450"', declarados)).toEqual(["bg-exito-450"]);
    // Lo que sí es legítimo no se señala.
    expect(
      coloresNoDeclarados(
        'className="bg-brand-600 text-white ring-contorno grid-cols-12 duration-200 bg-exito-50"',
        declarados,
      ),
    ).toEqual([]);
  });
});

describe("estados del proceso de afiliación (Molnip Visual v1)", () => {
  const css = readFileSync(join(RAIZ, "app", "globals.css"), "utf-8");
  const declarados = nombresDeclarados(css);
  const MODULO = "components/admin/estadosAfiliacion.ts";

  const ESTADOS = [
    "pendiente", "preparada", "enviada", "aprobada", "activa", "rechazada", "seguimiento",
  ];

  it("cada estado tiene su par de tokens declarado", () => {
    const faltan: string[] = [];
    for (const estado of ESTADOS) {
      for (const papel of ["fondo", "texto"]) {
        if (!declarados.has(`estado-${estado}-${papel}`)) faltan.push(`estado-${estado}-${papel}`);
      }
    }
    // "Seguimiento" lleva un tercer tono: también se escribe suelto sobre blanco.
    if (!declarados.has("estado-seguimiento-nota")) faltan.push("estado-seguimiento-nota");
    expect(faltan).toEqual([]);
  });

  it("los siete estados están en el módulo central, ninguno de menos ni de más", () => {
    const modulo = readFileSync(join(RAIZ, MODULO), "utf-8");
    const mapa = modulo.slice(modulo.indexOf("export const COLOR_ESTADO"));
    const enElMapa = [...mapa.matchAll(/^  ([a-z]+):/gm)].map((m) => m[1]);
    expect(enElMapa.sort()).toEqual([...ESTADOS].sort());
  });

  it("los tokens de estado solo se escriben en el módulo central", () => {
    const culpables: string[] = [];
    for (const ruta of ficheros([".tsx", ".ts"])) {
      if (relative(RAIZ, ruta) === MODULO) continue;
      if (/-estado-[a-z]/.test(readFileSync(ruta, "utf-8"))) culpables.push(relative(RAIZ, ruta));
    }
    expect(culpables).toEqual([]);
    // Control negativo: el módulo central sí los tiene, así que la búsqueda funciona.
    expect(/-estado-[a-z]/.test(readFileSync(join(RAIZ, MODULO), "utf-8"))).toBe(true);
  });

  it("ningún componente usa un token de estado que no exista", () => {
    const culpables: string[] = [];
    for (const ruta of ficheros([".tsx", ".ts"])) {
      const fuera = estadosNoDeclarados(readFileSync(ruta, "utf-8"), declarados);
      if (fuera.length > 0) culpables.push(`${relative(RAIZ, ruta)}: ${fuera.join(", ")}`);
    }
    expect(culpables).toEqual([]);
  });

  it("detecta un token de estado inventado (control negativo)", () => {
    expect(estadosNoDeclarados('className="bg-estado-cancelada-fondo"', declarados)).toEqual([
      "bg-estado-cancelada-fondo",
    ]);
    expect(estadosNoDeclarados('className="bg-estado-activa-fondo"', declarados)).toEqual([]);
  });
});

describe("ningún color literal en la web que ve el navegador", () => {
  const css = readFileSync(join(RAIZ, "app", "globals.css"), "utf-8");
  /** El CSS sin comentarios: lo que de verdad se aplica, sin lo que solo se explica. */
  const cssEfectivo = css.replace(/\/\*[\s\S]*?\*\//g, "");
  /** Todos los valores hexadecimales que el sistema declara. */
  const valoresDelSistema = new Set(
    [...cssEfectivo.matchAll(/--color-[a-z0-9-]+:\s*(#[0-9a-f]{6})/g)].map((m) => m[1].toLowerCase()),
  );

  const literales = (texto: string): string[] =>
    [...new Set([...texto.matchAll(/#[0-9a-fA-F]{6}\b/g)].map((m) => m[0].toLowerCase()))];

  /** El blanco y el negro puros no son colores de marca y no pueden virar. */
  const NEUTROS = new Set(["#ffffff", "#000000"]);

  /**
   * Ficheros que NO pueden usar variables CSS, por cómo se dibujan:
   * las imágenes de OpenGraph y los iconos los pinta Satori a un PNG en el
   * servidor; `themeColor` de `layout.tsx` acaba en una etiqueta `<meta>`; y
   * `global-error.tsx` tiene que poder pintarse aunque la hoja de estilos no
   * haya cargado — es justo la pantalla que se ve cuando eso falla.
   * En esos sí hay literales, y se comprueban con otra regla más abajo.
   */
  const SIN_VARIABLES_CSS =
    /(opengraph-image|twitter-image|apple-icon|icon)\.tsx$|icon-512\/route\.tsx$|global-error\.tsx$|app\/layout\.tsx$/;

  /**
   * Esta es la prueba que existe por la portada.
   *
   * El degradado del hero llevaba tres colores escritos a mano, y el del
   * medio —#4f46e5— era el ancla de marca RETIRADA: el índigo por defecto de
   * Tailwind que Molnip dejó de usar el 2026-08-17. Como estaba escrito como
   * texto y no como token, el cambio de paleta nunca le llegó, y la portada
   * siguió mostrando el violeta viejo —más frío, más saturado y más oscuro—
   * durante semanas sin que ninguna prueba lo notara.
   *
   * Mientras esto esté aquí no puede repetirse: un color nuevo hay que
   * declararlo antes en `globals.css`, y entonces la siguiente revisión de la
   * paleta sí le llega sola.
   */
  it("las páginas y componentes del navegador no escriben ningún color a mano", () => {
    const culpables: string[] = [];
    for (const ruta of ficheros([".tsx"])) {
      if (SIN_VARIABLES_CSS.test(ruta)) continue;
      const fuera = literales(readFileSync(ruta, "utf-8")).filter((h) => !NEUTROS.has(h));
      if (fuera.length > 0) culpables.push(`${relative(RAIZ, ruta)}: ${fuera.join(", ")}`);
    }
    expect(culpables).toEqual([]);
  });

  it("el degradado del hero se construye solo con la rampa de marca", () => {
    const bloque = cssEfectivo.slice(
      cssEfectivo.indexOf(".degradado-hero"),
      cssEfectivo.indexOf("}", cssEfectivo.indexOf(".degradado-hero")),
    );
    expect(bloque, "falta la clase .degradado-hero en globals.css").toContain("linear-gradient");
    expect(literales(bloque), "el degradado tiene colores escritos a mano").toEqual([]);
    const referencias = [...bloque.matchAll(/var\(--color-([a-z0-9-]+)\)/g)].map((m) => m[1]);
    expect(referencias.length).toBeGreaterThan(0);
    for (const ref of referencias) {
      expect(ref, `el degradado usa --color-${ref}, que no es de la rampa de marca`).toMatch(/^brand-\d+$/);
    }
  });

  it("la parada que domina la mancha es el ancla de marca vigente", () => {
    const bloque = cssEfectivo.slice(
      cssEfectivo.indexOf(".degradado-hero"),
      cssEfectivo.indexOf("}", cssEfectivo.indexOf(".degradado-hero")),
    );
    expect(bloque).toMatch(/var\(--color-brand-600\)\s*46%/);
    expect(valoresDelSistema.has("#6e5fe4"), "el ancla de marca ya no vale #6e5fe4").toBe(true);
    // El índigo retirado no puede volver por ninguna vía (los comentarios sí
    // pueden nombrarlo: para eso se mira el CSS sin comentarios).
    expect(cssEfectivo.toLowerCase()).not.toContain("#4f46e5");
  });

  it("los ficheros que no pueden usar variables solo usan colores de la paleta", () => {
    // Un único caso conocido, en la imagen que se comparte en redes sociales.
    // Pendiente de decisión de la propietaria: no se toca sin permiso, pero
    // queda escrito para que se vea.
    const PENDIENTE = ["app/resultado/[token]/opengraph-image.tsx: #f4c15c"];
    const culpables: string[] = [];
    for (const ruta of ficheros([".tsx"])) {
      if (!SIN_VARIABLES_CSS.test(ruta)) continue;
      const fuera = literales(readFileSync(ruta, "utf-8"))
        .filter((h) => !valoresDelSistema.has(h) && !NEUTROS.has(h));
      if (fuera.length > 0) culpables.push(`${relative(RAIZ, ruta)}: ${fuera.join(", ")}`);
    }
    expect(culpables.sort()).toEqual([...PENDIENTE].sort());
  });
});
