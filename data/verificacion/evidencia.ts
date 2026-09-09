import type { RegistroVerificacion } from "./esquema";
import type { CertezaDelPlan, EvidenciaDeCapacidad, EvidenciaDePlan } from "./puerto";

/**
 * Las reglas de lectura de la verificación — F3, bloque 2.
 *
 * Funciones puras: reciben un registro y devuelven qué se puede afirmar con
 * él. No leen archivos, no importan el vocabulario y no saben que existe un
 * motor. Se pueden ejercitar con casos inventados y con los 1.544 reales sin
 * cambiar una línea.
 *
 * Tres reglas mandan sobre todo lo demás, y las tres vienen escritas de F2:
 *
 *  1. Sólo lo verificado se afirma. Lo demás es «no nos consta».
 *  2. El plan NUNCA decide. Una capacidad verificada con el plan sin demostrar
 *     sigue siendo verificada, y su nombre de plan no se escribe.
 *  3. «No consta» no se puede convertir en «no lo tiene». F2 hizo 1.544
 *     comprobaciones y obtuvo CERO ausencias demostradas: el dato que
 *     sostendría esa frase no existe.
 */

/** Sólo puede nombrarse el plan que se demostró. Ver la regla 2. */
function planDe(registro: RegistroVerificacion): EvidenciaDePlan {
  const certeza: CertezaDelPlan = registro.planEstado ?? "no_procede";
  if (certeza !== "verificado") return { certeza };
  const nombre = registro.planMinimo?.trim();
  return nombre ? { certeza, nombre } : { certeza };
}

/**
 * Qué se puede afirmar de un par, a partir de su registro.
 *
 * `undefined` no es un error ni un hueco que rellenar: es uno de los 7.508
 * pares que nunca se preguntaron, y pesa exactamente igual que un
 * `desconocido` — con la diferencia de que resolverlo cuesta una comprobación
 * que aún no se ha hecho, y por eso el origen se conserva.
 */
export function evidenciaDeRegistro(
  herramientaId: string,
  capacidadId: string,
  registro: RegistroVerificacion | undefined
): EvidenciaDeCapacidad {
  const base = { herramientaId, capacidadId };

  if (!registro) {
    return { ...base, estado: "no_consta", origen: "sin_registro", plan: { certeza: "no_procede" } };
  }

  if (registro.estado !== "verificado") {
    // Incluye `descartado`: el validador lo tiró por incumplir una regla, así
    // que su contenido no se puede afirmar. Tampoco se puede negar.
    return { ...base, estado: "no_consta", origen: "desconocido", plan: { certeza: "no_procede" } };
  }

  return {
    ...base,
    estado: "verificado",
    origen: "verificado",
    plan: planDe(registro),
    ...(registro.profundidad ? { profundidad: registro.profundidad } : {}),
    ...(registro.integraCon ? { integraCon: registro.integraCon } : {}),
    ...(registro.confianza ? { confianza: registro.confianza } : {}),
    ...(registro.nota ? { nota: registro.nota } : {}),
  };
}

/**
 * ¿Sirve esta herramienta para lo que se le pide?
 *
 * Mira `estado` y nada más. Que el plan sea desconocido NO la descalifica: son
 * dos certezas distintas y juntarlas fue el error que costó el lote 1 entero
 * —de 241 planes afirmados, sólo 23 tenían una cita que nombrara el plan, y
 * tratar eso como «no sabemos si lo hace» era falso—.
 */
export function esElegible(evidencia: EvidenciaDeCapacidad): boolean {
  return evidencia.estado === "verificado";
}

/**
 * Texto comparable: sin mayúsculas, sin tildes y sin separadores.
 *
 * Mismo criterio que `compactar()` en el vocabulario, y por el mismo motivo
 * que allí: un doble espacio o un salto de línea se producen tecleando, y sin
 * esto apagarían la comprobación de abajo sin que nadie se entere.
 */
function compactar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * Formas de afirmar que una herramienta NO hace algo.
 *
 * Ninguna se puede escribir a partir de los datos de F2, porque no hay un solo
 * registro que lo demuestre. Están aquí para que una prueba pueda comprobarlo
 * sobre cualquier texto que el sistema genere, hoy y en los bloques siguientes.
 */
const AFIRMACIONES_DE_AUSENCIA = [
  "no tiene",
  "no lo tiene",
  "no la tiene",
  "no dispone",
  "no ofrece",
  "no incluye",
  "no permite",
  "no soporta",
  "no cuenta con",
  "no lo hace",
  "no existe",
  "no esta disponible",
  "no disponible",
  "carece de",
  "sin soporte para",
];

/** ¿Este texto afirma una ausencia que nadie ha demostrado? */
export function afirmaAusencia(texto: string): boolean {
  const t = compactar(texto);
  return AFIRMACIONES_DE_AUSENCIA.some((frase) => t.includes(compactar(frase)));
}

/**
 * La ÚNICA forma autorizada de poner en palabras lo que sabemos de un par.
 *
 * Que sea la única es lo que hace comprobable la regla 3: hay una prueba que
 * pasa los 1.544 registros reales por aquí y exige que ni una sola frase
 * afirme una ausencia. Si mañana alguien redacta esto en otro sitio, esa
 * prueba deja de proteger nada.
 */
export function describir(evidencia: EvidenciaDeCapacidad, etiqueta?: string): string {
  const que = etiqueta?.trim() || evidencia.capacidadId;

  if (evidencia.estado !== "verificado") {
    return evidencia.origen === "desconocido"
      ? `${que}: no nos consta. Lo hemos buscado en su página oficial y no ha quedado demostrado; podría hacerlo igualmente.`
      : `${que}: no nos consta. Todavía está sin comprobar.`;
  }

  const plan =
    evidencia.plan.certeza === "verificado" && evidencia.plan.nombre
      ? ` Entra a partir del plan ${evidencia.plan.nombre}.`
      : " En qué plan entra, está sin demostrar.";

  return `${que}: comprobado en su página oficial.${plan}`;
}
