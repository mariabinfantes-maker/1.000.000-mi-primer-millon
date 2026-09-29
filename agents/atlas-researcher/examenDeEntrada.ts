import type { Herramienta } from "@/data/esquema";

/**
 * EL EXAMEN DE ENTRADA AL CATÁLOGO.
 *
 * Sustituye al umbral de 80/100 de `criteriosCalidad.ts` (propietaria,
 * 2026-09-28). Aquélla no se borra: se deja de llamar y ahí sigue, con su
 * porqué.
 *
 * QUÉ FALLABA. El 80 se calculaba con dos cosas: la nota de G2 y Capterra, y
 * las siete valoraciones de 1 a 10 que nos poníamos nosotros. Medido sobre las
 * 65 del catálogo:
 *
 *   llegan a 80 hoy ............................ 60 de 65
 *   llegarían SÓLO con la reputación ........... 60
 *   llegarían SÓLO con las siete notas ......... 54
 *   nota media de G2 guardada .................. 4,53/5  → 91/100
 *   media de la nota «calidad» que nos pusimos . 8,37/10 → 84/100
 *
 * Las dos mitades entraban solas por encima del listón. No separaba nada: lo
 * aprobaba el 92 % del catálogo y lo habría aprobado igual con la mitad de los
 * datos. Un trámite, no un filtro.
 *
 * Y tenía un sesgo que iba justo contra la visión: **sólo lo pueden aprobar
 * las herramientas grandes e internacionales**. G2 y Capterra son del mercado
 * en inglés, y una herramienta pequeña y española muchas veces ni tiene ficha
 * ahí. Se vio con las primeras cinco candidatas españolas de reservas
 * —Nubimed, Archivex, ViDay, BEWE y Bookitit—: ninguna llegaba a 80, no por
 * ser peores, sino porque el examen preguntaba algo que ellas no podían
 * contestar.
 *
 * QUÉ PREGUNTA AHORA. No «qué nota tiene» sino **qué sabemos de ella y
 * podemos demostrar**. Cinco cosas, todas comprobables desde la web del
 * fabricante, y por tanto al alcance de una herramienta pequeña igual que de
 * una grande.
 *
 * La reputación de G2 y Capterra no desaparece: deja de ser la puerta. Se
 * sigue enseñando en la tarjeta —`InsigniaReputacion`—, que es donde le toca:
 * información para quien mira, no un juicio que decide quién existe.
 */

/** Cuántas capacidades verificadas hacen falta. Por debajo no sabemos qué hace. */
export const CAPACIDADES_MINIMAS = 3;

export type ResultadoExamen =
  | { ok: true; comprobado: string[] }
  | { ok: false; errores: string[]; comprobado: string[] };

export type DatosDelExamen = {
  /** Cuántas capacidades suyas están verificadas con cita en `data/verificacion`. */
  capacidadesVerificadas: number;
};

export function examinarParaEntrar(herramienta: Herramienta, datos: DatosDelExamen): ResultadoExamen {
  const errores: string[] = [];
  const comprobado: string[] = [];

  // 1. QUÉ HACE. Sin capacidades verificadas no podemos decirle a nadie que le
  //    sirve: el motor filtra por ellas antes que por nada.
  if (datos.capacidadesVerificadas >= CAPACIDADES_MINIMAS) {
    comprobado.push(`Sabemos qué hace: ${datos.capacidadesVerificadas} capacidades verificadas con cita.`);
  } else {
    errores.push(
      `Sólo ${datos.capacidadesVerificadas} capacidades verificadas; hacen falta ${CAPACIDADES_MINIMAS}. Sin esto no sabemos qué hace.`
    );
  }

  /**
   * 2. CUÁNTO CUESTA, con la página que se abrió y el día que se abrió. Un
   *    precio sin fuente envejece sin que nos enteremos.
   *
   * Vale cualquiera de los dos campos, y no da igual cuál se mire: la primera
   * versión de este examen sólo miraba `preciosComprobados` y suspendió a
   * Notion AI, Odoo y Zoho CRM, que llevaban el precio demostrado desde el
   * 2026-09-21 en `planesComprobados` —el mismo recibo, y además con la cita
   * de cada plan—. Fallo del examen, no de las fichas.
   */
  const fuenteDelPrecio =
    (herramienta.preciosComprobados?.url && herramienta.preciosComprobados?.fecha
      ? herramienta.preciosComprobados
      : undefined) ??
    (herramienta.planesComprobados?.url && herramienta.planesComprobados?.fecha
      ? herramienta.planesComprobados
      : undefined);

  if (fuenteDelPrecio) {
    comprobado.push(`Sabemos cuánto cuesta: comprobado el ${fuenteDelPrecio.fecha}.`);
  } else {
    errores.push("El precio no tiene fuente guardada (página y fecha).");
  }

  // 3. EN QUÉ IDIOMA TRABAJA. Servimos a seis países hispanohablantes; esto no
  //    es un adorno.
  if ((herramienta.idiomasDisponibles ?? []).length > 0) {
    comprobado.push(`Sabemos en qué idiomas trabaja: ${herramienta.idiomasDisponibles.join(", ")}.`);
  } else {
    errores.push("No consta en qué idiomas trabaja.");
  }

  // 4. PARA QUIÉN ESTÁ PENSADA. Sector y tamaño, para poder decir a quién le
  //    sirve sin adivinarlo.
  const tieneSector = (herramienta.industriasIdeales ?? []).length > 0;
  const tieneTamano = (herramienta.segmentosIdeales ?? []).length > 0;
  if (tieneSector && tieneTamano) {
    comprobado.push("Sabemos para quién está pensada: sector y tamaño.");
  } else {
    errores.push(
      `Falta para quién está pensada: ${[!tieneSector && "sector", !tieneTamano && "tamaño"].filter(Boolean).join(" y ")}.`
    );
  }

  /**
   * 5. QUÉ LÍMITE TIENE.
   *
   * Aquí la propietaria corrigió el campo el 2026-09-28: `casosNoRecomendados`
   * **no es una lista de sectores excluidos**. Eso ya sale por descarte de
   * saber para quién está pensada, y leído así el campo se queda vacío —pasó
   * con Nubimed y ViDay, que contestaron «no encontré una exclusión expresa de
   * otros sectores»—.
   *
   * Es **qué topa aunque seas su cliente**. Lo que llenaron las que sí lo
   * entendieron: «cada centro necesita su propia licencia» (Archivex), «Starter
   * no está pensado para equipos que necesitan varias agendas» (BEWE), «no
   * encaja para quien necesita VeriFactu ya disponible» (Bookitit). Ninguna de
   * las tres sale por descarte, y las tres le pasan justo a quien sí es su
   * cliente.
   */
  if ((herramienta.casosNoRecomendados ?? []).length > 0) {
    comprobado.push("Sabemos qué límite tiene, incluso para quien sí es su cliente.");
  } else {
    errores.push("No consta ningún límite: qué topa aunque seas su cliente (licencia por centro, tope de plan, función que aún no está).");
  }

  return errores.length > 0 ? { ok: false, errores, comprobado } : { ok: true, comprobado };
}
