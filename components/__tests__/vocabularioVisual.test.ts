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

function ficheros(): string[] {
  const salida: string[] = [];
  for (const carpeta of ["components", "app"]) {
    const base = join(RAIZ, carpeta);
    for (const entrada of readdirSync(base, { recursive: true, encoding: "utf-8" })) {
      if (entrada.endsWith(".tsx")) salida.push(join(base, entrada));
    }
  }
  return salida;
}

// --- Radios -----------------------------------------------------------------

const RADIOS_PERMITIDOS = ["xl", "2xl", "3xl", "full"];
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
 * Estas comprobaciones destaparon seis desviaciones que la auditoría de Molnip
 * Visual v1 no había visto: contó los `rounded-lg` pero no el `rounded` a
 * secas, y contó emerald/amber/red/sky pero no rose, lime ni orange.
 *
 * No se tocan aquí. El sprint autorizado eran cuatro correcciones concretas, y
 * cambiar `rose` por `error` o `orange` por `atencion` sí movería el color en
 * pantalla — no es un renombrado neutro como el de los cuatro estados. Quedan
 * escritas para que se vean, con la lista cerrada: quitar una obliga a editar
 * esta lista, y añadir una hace fallar la prueba. Es decir, lo que ya se
 * desvía no crece.
 */
const DESVIACIONES_RADIO_PENDIENTES = [
  // `<code>` en línea dentro de texto legal: 4px en vez de 12px.
  "app/cookies/page.tsx: rounded",
  "components/ui/DocumentoLegal.tsx: rounded",
];

const DESVIACIONES_COLOR_PENDIENTES = [
  // `rose` donde el significado es error; no es el mismo tono que `red`.
  "app/herramienta/[herramientaId]/page.tsx: text-rose-400",
  "app/test-imagen/TestImagenClient.tsx: bg-rose-50, text-rose-700",
  "app/test-investigador/TestInvestigadorClient.tsx: bg-rose-50, text-rose-700",
  "components/TarjetaHerramientaRecomendada.tsx: text-rose-400",
  "components/ui/FormularioSuscripcion.tsx: text-rose-600",
  // Estados del panel de afiliación: `lime` para "aprobada", `orange` para
  // "seguimiento" y para los días estancada.
  "components/admin/PanelAfiliacion.tsx: bg-lime-100, text-lime-800, bg-orange-100, text-orange-700, text-orange-600",
];

// --- Comprobaciones ---------------------------------------------------------

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
    expect(radiosFueraDeVocabulario('className="rounded-2xl rounded-t-3xl rounded-r-xl"')).toEqual([]);
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
