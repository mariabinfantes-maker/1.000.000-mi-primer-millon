import type { Herramienta } from "@/data/esquema";

/**
 * Completitud editorial relativa — Capa 1 de Atlas Curator: determinista,
 * sin IA, sin coste. Solo detecta y explica; nunca investiga ni rellena
 * ningún dato — eso lo sigue haciendo Atlas Researcher, con revisión
 * humana antes de promover.
 *
 * `validarHerramienta()` (`data/repositorio.ts`) trata estos cinco campos
 * como opcionales por diseño, para no romper las fichas históricas que no
 * los tenían investigados — pero eso significa que nada detecta hoy que a
 * una ficha le falten campos que sus vecinas de categoría sí tienen (ver
 * ATLAS.md, sección Atlas Curator). Comparar "contra el resto del
 * catálogo entero" no tendría sentido — una ficha de CRM no debería
 * compararse con una de asistentes de IA — así que la comparación es
 * siempre dentro de la misma categoría.
 */

export type AvisoCompletitud = {
  herramientaId: string;
  campo: string;
  etiqueta: string;
  mensaje: string;
};

type CampoOpcional = {
  clave: string;
  etiqueta: string;
  presente: (herramienta: Herramienta) => boolean;
};

const CAMPOS_OPCIONALES: CampoOpcional[] = [
  {
    clave: "reputacion",
    etiqueta: "reputación investigada (G2/Capterra)",
    presente: (h) => h.reputacion?.g2Puntuacion !== undefined || h.reputacion?.capterraPuntuacion !== undefined,
  },
  {
    clave: "disponibleEnEspanol",
    etiqueta: "disponibilidad en español",
    presente: (h) => typeof h.disponibleEnEspanol === "boolean",
  },
  { clave: "tieneAppMovil", etiqueta: "información de app móvil", presente: (h) => typeof h.tieneAppMovil === "boolean" },
  { clave: "tieneApiPublica", etiqueta: "información de API pública", presente: (h) => typeof h.tieneApiPublica === "boolean" },
  {
    clave: "facilidadImplementacion",
    etiqueta: "puntuación de facilidad de implementación",
    presente: (h) => h.puntuaciones.facilidadImplementacion !== undefined,
  },
];

/** Por debajo de este número de vecinas activas en la misma categoría, no hay base suficiente para comparar — cualquier diferencia sería ruido, no señal. */
export const MINIMO_VECINAS_PARA_COMPARAR = 2;

/** A partir de qué proporción de vecinas con el campo presente, su ausencia en una ficha concreta merece aviso. */
export const PORCENTAJE_VECINAS_POR_DEFECTO = 0.5;

/**
 * Recorre el catálogo activo agrupado por categoría y avisa, ficha a
 * ficha, de los campos opcionales que le faltan y que sí tiene la mayoría
 * de sus vecinas de categoría (`porcentajeVecinas`, por defecto la mitad
 * o más).
 */
export function detectarHuecosEditoriales(
  herramientas: Herramienta[],
  porcentajeVecinas: number = PORCENTAJE_VECINAS_POR_DEFECTO
): AvisoCompletitud[] {
  const avisos: AvisoCompletitud[] = [];
  const activas = herramientas.filter((h) => h.estado === "activo");

  const porCategoria = new Map<string, Herramienta[]>();
  for (const herramienta of activas) {
    const lista = porCategoria.get(herramienta.categoriaId) ?? [];
    lista.push(herramienta);
    porCategoria.set(herramienta.categoriaId, lista);
  }

  for (const herramienta of activas) {
    const vecinas = (porCategoria.get(herramienta.categoriaId) ?? []).filter((v) => v.id !== herramienta.id);
    if (vecinas.length < MINIMO_VECINAS_PARA_COMPARAR) continue;

    for (const campo of CAMPOS_OPCIONALES) {
      if (campo.presente(herramienta)) continue;

      const numeroConCampo = vecinas.filter((v) => campo.presente(v)).length;
      if (numeroConCampo / vecinas.length >= porcentajeVecinas) {
        avisos.push({
          herramientaId: herramienta.id,
          campo: campo.clave,
          etiqueta: campo.etiqueta,
          mensaje: `"${herramienta.nombre}" no tiene ${campo.etiqueta}, pero sí la tienen ${numeroConCampo} de sus ${vecinas.length} vecinas de categoría.`,
        });
      }
    }
  }

  return avisos;
}
