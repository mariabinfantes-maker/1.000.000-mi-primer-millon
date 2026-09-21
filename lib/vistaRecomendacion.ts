import { PUNTOS_IDIOMA_CONFIRMADO } from "@/agents/atlas-advisor";
import type { EtiquetaEvidencia, HerramientaEvaluada } from "@/agents/atlas-advisor";
import type { Herramienta } from "@/data/esquema";
import { calcularPuntuacionAtlas } from "@/lib/puntuacionAtlas";
import { PRECIO_SIN_COMPROBAR, loQueOfreceSuPaquete, loQueTeCuesta, textoDeComprobacion } from "@/lib/catalogoCompleto";
import type { TarjetaHerramientaRecomendadaProps } from "@/components/TarjetaHerramientaRecomendada";

/** Campos comunes a las dos vistas (con y sin cuestionario) que no dependen de `HerramientaEvaluada` — evita repetirlos en las dos funciones de abajo. */
function camposComunes(herramienta: Herramienta) {
  /**
   * Lo que va a la tarjeta de «lo que te va a costar», ya redactado aquí: el
   * componente no decide cómo se dicen las cosas, y el catálogo, la ficha y
   * la tarjeta tienen que decir lo mismo del mismo dato.
   *
   * Cuando nadie ha comprobado ese precio se dice, en vez de callarlo. En una
   * lista de sesenta y cinco la ausencia de fecha ya se nota; en una tarjeta
   * sola, callarlo daría a entender que está tan comprobado como el de al
   * lado.
   */
  const comprobacion = textoDeComprobacion(herramienta);
  const ofrece = loQueOfreceSuPaquete(herramienta);

  return {
    reputacion: herramienta.reputacion,
    disponibleEnEspanol: herramienta.disponibleEnEspanol ?? false,
    tieneAppMovil: herramienta.tieneAppMovil ?? false,
    tieneApiPublica: herramienta.tieneApiPublica ?? false,
    comprobacionDelPrecio: comprobacion ?? PRECIO_SIN_COMPROBAR,
    precioComprobado: comprobacion !== null,
    ...(ofrece ? { ofreceSuPaquete: ofrece } : {}),
    ...(herramienta.urlPrecios ? { urlPrecios: herramienta.urlPrecios } : {}),

  };
}

/**
 * Único punto de contacto entre el motor de recomendación y la interfaz.
 *
 * Traduce la salida rica del motor (`HerramientaEvaluada`, con su desglose
 * de criterios y puntuación interna) a las props planas que espera
 * `TarjetaHerramientaRecomendada`. Si el algoritmo cambia — nuevos
 * criterios, pesos distintos, otra forma de calcular la puntuación — este
 * es el único archivo que debería tocarse; el componente visual no sabe
 * nada de cómo se llegó a estos datos.
 */
export function aVistaDeTarjeta(
  evaluada: HerramientaEvaluada,
  posicion: number,
  evidencia?: EtiquetaEvidencia,
  usoSinConfirmar?: string,
  confirmadoPara?: string
): TarjetaHerramientaRecomendadaProps {
  const { herramienta } = evaluada;

  // La "Puntuación Atlas" (0-100) mostrada al usuario es la misma que
  // calcula `lib/puntuacionAtlas.ts` para el resto del producto — nunca la
  // puntuación interna de encaje (esa solo sirve para ordenar el ranking,
  // no tiene una escala fija pensada para mostrarse — ver el comentario en
  // `HerramientaEvaluada.puntuacionTotal`).
  const puntuacionAtlas = calcularPuntuacionAtlas(herramienta);

  // Idioma: lo que no consta se dice. El criterio ya redactó la frase («No
  // hemos confirmado que esté disponible en español»); aquí sólo se decide si
  // hay algo que confesar. Si nadie dijo qué idioma hace falta, el criterio es
  // neutro, no hay frase y no se avisa de nada: no hay nada que avisar.
  /**
   * La respuesta a «¿esto, a mí, cuánto me cuesta?». Aquí SÍ se puede
   * contestar de verdad, porque la evidencia dice en qué plan vive la función
   * que pidió y la ficha dice lo que vale ese plan.
   */
  const cuesta = loQueTeCuesta(
    herramienta,
    evidencia?.tipo === "confirmada" ? evidencia.plan : undefined,
    herramienta.planesComprobados?.planes
  );

  const detalleIdioma = evaluada.detalles.find((detalle) => detalle.criterio === "idioma");
  const idiomaSinConfirmar =
    detalleIdioma && detalleIdioma.explicacion !== "" && detalleIdioma.puntos < PUNTOS_IDIOMA_CONFIRMADO
      ? detalleIdioma.explicacion
      : undefined;

  return {
    posicion,
    id: herramienta.id,
    nombre: herramienta.nombre,
    puntuacionAtlas: puntuacionAtlas?.puntuacion ?? null,
    motivosPuntuacion: puntuacionAtlas?.motivos ?? [],
    tienePlanGratuito: herramienta.tienePlanGratuito,
    cuantoCuesta: cuesta.cuanto,
    ...(cuesta.detalle ? { detalleDelCoste: cuesta.detalle } : {}),
    ventajas: herramienta.ventajas,
    inconvenientes: herramienta.inconvenientes,
    explicacionPersonalizada: evaluada.explicacion,
    integracionPrincipal: herramienta.integracionesPrincipales[0] ?? null,
    tieneAdvertencia: evaluada.tieneAdvertencia,
    casoDeUso: herramienta.casosDeUso[0] ?? null,
    casosNoRecomendados: herramienta.casosNoRecomendados,
    ...(evidencia ? { evidencia } : {}),
    ...(usoSinConfirmar ? { usoSinConfirmar } : {}),
    ...(confirmadoPara ? { confirmadoPara } : {}),
    ...(idiomaSinConfirmar ? { idiomaSinConfirmar } : {}),
    ...camposComunes(herramienta),
  };
}

/**
 * Misma tarjeta, sin cuestionario de por medio (páginas de aterrizaje de
 * categoría/problema, Atlas Generador de Contenido): no hay
 * `RespuestasUsuario` con las que personalizar nada, así que
 * `explicacionPersonalizada` usa `idealPara` — un dato real ya escrito
 * sobre la herramienta, nunca un texto que finja estar hablándole a un
 * usuario concreto — y no hay advertencia posible sin un perfil que
 * pueda chocar con `casosNoRecomendados`.
 */
export function aVistaDeTarjetaGenerica(herramienta: Herramienta, posicion: number): TarjetaHerramientaRecomendadaProps {
  const puntuacionAtlas = calcularPuntuacionAtlas(herramienta);

  return {
    posicion,
    id: herramienta.id,
    nombre: herramienta.nombre,
    puntuacionAtlas: puntuacionAtlas?.puntuacion ?? null,
    motivosPuntuacion: puntuacionAtlas?.motivos ?? [],
    tienePlanGratuito: herramienta.tienePlanGratuito,
    // Sin cuestionario no sabemos qué función busca, así que no sabemos qué
    // plan le toca: se dice desde cuánto empieza y no se finge una respuesta.
    ...(() => {
      const c = loQueTeCuesta(herramienta, undefined, herramienta.planesComprobados?.planes);
      return { cuantoCuesta: c.cuanto, ...(c.detalle ? { detalleDelCoste: c.detalle } : {}) };
    })(),
    ventajas: herramienta.ventajas,
    inconvenientes: herramienta.inconvenientes,
    explicacionPersonalizada: herramienta.idealPara,
    integracionPrincipal: herramienta.integracionesPrincipales[0] ?? null,
    tieneAdvertencia: false,
    casoDeUso: herramienta.casosDeUso[0] ?? null,
    casosNoRecomendados: herramienta.casosNoRecomendados,
    ...camposComunes(herramienta),
  };
}

/** Ordena herramientas por Puntuación Atlas descendente — el mismo criterio objetivo que ya se muestra en cada ficha, reutilizado para el orden por defecto de una landing sin cuestionario. Sin puntuación calculable, va al final. */
export function ordenarPorPuntuacionAtlas(herramientas: Herramienta[]): Herramienta[] {
  return [...herramientas].sort(
    (a, b) => (calcularPuntuacionAtlas(b)?.puntuacion ?? -1) - (calcularPuntuacionAtlas(a)?.puntuacion ?? -1)
  );
}
