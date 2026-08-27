import type { Herramienta } from "@/data/esquema";

/**
 * Validez de los datos — Capa 2 de Atlas Curator: determinista, sin IA,
 * sin coste. Solo detecta y explica; nunca corrige ni rellena un dato.
 *
 * `completitud.ts` responde a "¿está el campo?". Este módulo responde a
 * "¿lo que hay dentro sirve para algo?", que es una pregunta distinta y la
 * que de verdad protege al usuario. Un precio que pone "Consultar", una
 * lista de integraciones con un único elemento vacío o un idioma escrito
 * como cadena en blanco pasan todas las validaciones de presencia y aun
 * así no le dicen nada a quien lee la ficha.
 *
 * Dos niveles, deliberadamente separados:
 *  - "invalido": hay un valor y es incorrecto o inservible. Es un error de
 *    datos y alguien debe arreglarlo.
 *  - "pendiente": no hay valor y el campo es opcional en el esquema. No es
 *    un error, es investigación que falta. Se marca como pendiente en vez
 *    de inventarse — la diferencia entre no saber algo y fingir saberlo.
 *
 * La VIGENCIA de los datos no se comprueba aquí: es responsabilidad de
 * Atlas Mantenimiento (`agents/atlas-mantenimiento/frescura.ts`, umbral de
 * 180 días). Curator mira si el dato sirve; Mantenimiento mira si el dato
 * sigue siendo cierto. Duplicarlo sería tener dos umbrales que se
 * contradicen el día que uno cambie.
 */

export type GravedadAviso = "invalido" | "pendiente";

export type AvisoValidez = {
  herramientaId: string;
  campo: string;
  gravedad: GravedadAviso;
  mensaje: string;
};

/** Mínimo de funciones para que "qué hace esta herramienta" tenga una respuesta útil. Con una sola función la ficha no distingue la herramienta de ninguna otra de su categoría. */
export const MINIMO_FUNCIONES = 3;

/** Un precio tiene que llevar una cifra o declararse gratuito. "Consultar" o "Precio bajo demanda" no le sirven a quien compara presupuestos. */
const PRECIO_CON_CIFRA = /\d/;
const PRECIO_DECLARADO_GRATUITO = /\bgratis\b|\bgratuit/i;

function textoUtil(valor: unknown): boolean {
  return typeof valor === "string" && valor.trim().length > 0;
}

/** Un array sirve si tiene elementos Y ninguno es una cadena vacía disfrazada. */
function listaUtil(valor: unknown, minimo = 1): boolean {
  return Array.isArray(valor) && valor.length >= minimo && valor.every(textoUtil);
}

/**
 * Revisa UNA ficha y devuelve todo lo que no sirve o falta por investigar.
 * No lanza: una ficha con datos flojos sigue siendo una ficha válida para
 * el esquema; lo que hace Curator es decir en voz alta qué le pasa.
 */
export function detectarProblemasDeValidez(herramienta: Herramienta): AvisoValidez[] {
  const avisos: AvisoValidez[] = [];
  const invalido = (campo: string, mensaje: string) =>
    avisos.push({ herramientaId: herramienta.id, campo, gravedad: "invalido", mensaje });
  const pendiente = (campo: string, mensaje: string) =>
    avisos.push({ herramientaId: herramienta.id, campo, gravedad: "pendiente", mensaje });

  // — Precio —
  if (!textoUtil(herramienta.precioInicial)) {
    invalido("precioInicial", "No hay precio de entrada.");
  } else if (!PRECIO_CON_CIFRA.test(herramienta.precioInicial) && !PRECIO_DECLARADO_GRATUITO.test(herramienta.precioInicial)) {
    invalido(
      "precioInicial",
      `El precio "${herramienta.precioInicial}" no lleva ninguna cifra ni declara ser gratuito — no sirve para comparar presupuestos.`
    );
  }
  if (!listaUtil(herramienta.modeloDePrecio)) {
    invalido("modeloDePrecio", "No declara ningún modelo de precio.");
  }

  // — Funciones —
  if (!listaUtil(herramienta.funcionesPrincipales, MINIMO_FUNCIONES)) {
    invalido(
      "funcionesPrincipales",
      `Menos de ${MINIMO_FUNCIONES} funciones útiles declaradas: la ficha no distingue esta herramienta de sus vecinas.`
    );
  }

  // — Integraciones —
  if (!listaUtil(herramienta.integraciones)) {
    invalido("integraciones", "No declara ninguna integración utilizable.");
  }

  // — Idioma —
  if (!listaUtil(herramienta.idiomasDisponibles)) {
    invalido("idiomasDisponibles", "No declara ningún idioma.");
  }
  if (typeof herramienta.disponibleEnEspanol !== "boolean") {
    pendiente(
      "disponibleEnEspanol",
      "Sin confirmar si está en español — el dato más consultado por una pyme española."
    );
  }

  // — Disponibilidad geográfica —
  if (herramienta.disponibilidadGeografica === undefined) {
    pendiente(
      "disponibilidadGeografica",
      "Sin investigar dónde se puede contratar de verdad (facturación en la UE, RGPD, medios de pago desde España)."
    );
  } else if (!listaUtil(herramienta.disponibilidadGeografica)) {
    invalido("disponibilidadGeografica", "La lista de territorios está vacía o tiene entradas en blanco.");
  }

  // — Facilidad de implementación —
  const facilidad = herramienta.puntuaciones.facilidadImplementacion;
  if (facilidad === undefined) {
    pendiente("puntuaciones.facilidadImplementacion", "Sin puntuar lo que cuesta poner la herramienta en marcha.");
  } else if (facilidad < 1 || facilidad > 10) {
    invalido("puntuaciones.facilidadImplementacion", `Valor fuera de la escala 1-10: ${facilidad}.`);
  }

  // — Metodología —
  if (!textoUtil(herramienta.metodologiaValoracion)) {
    invalido(
      "metodologiaValoracion",
      "Sin metodología declarada: las puntuaciones de esta ficha no tienen respaldo visible."
    );
  }

  // — Tipo de producto —
  if (herramienta.tipoProducto === undefined) {
    pendiente(
      "tipoProducto",
      "Sin declarar si es suite o especializada: hoy se deduce de la categoría histórica, que es justo lo que la nueva taxonomía viene a separar."
    );
  }

  return avisos;
}

/** Recorre el catálogo activo. Las fichas retiradas no se revisan: nadie las ve. */
export function detectarProblemasDeValidezEnCatalogo(herramientas: Herramienta[]): AvisoValidez[] {
  return herramientas.filter((h) => h.estado === "activo").flatMap(detectarProblemasDeValidez);
}
