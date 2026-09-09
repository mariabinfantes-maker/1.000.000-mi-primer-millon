import type { NivelConfianza, Profundidad } from "./esquema";

/**
 * El contrato por el que el motor leerá lo que F2 verificó — F3, bloque 1.
 *
 * Aquí no hay lógica ni datos: sólo la forma de la pregunta y la de la
 * respuesta. Existe separado del índice (`consulta.ts`) y de las reglas
 * (`evidencia.ts`) para que quien consuma la evidencia dependa de un tipo y
 * nunca de un archivo de 988 KB. El día que el motor se conecte —bloque 5—
 * recibirá un `PuertoDeEvidencia` por parámetro, igual que hoy recibe el
 * catálogo, y sus pruebas podrán seguir usando puertos de mentira.
 *
 * NADIE LO LEE TODAVÍA. Los bloques 1 y 2 construyen la pieza; conectarla es
 * el bloque 5 y exige que la propietaria apruebe antes la tabla ruta→capacidad.
 */

/**
 * Lo único que el motor puede preguntar sobre una capacidad.
 *
 * Son DOS estados, no tres, y esa reducción es la decisión importante: F2 no
 * obtuvo ni una sola ausencia demostrada en 1.544 comprobaciones, así que
 * «lo hace» y «no nos consta» agotan lo que sabemos. No existe «no lo hace»
 * porque no existe el dato que lo sostendría.
 */
export type EstadoDeEvidencia = "verificado" | "no_consta";

/**
 * De dónde sale un «no consta». No cambia la decisión —los dos casos pesan
 * igual— pero sí cambia qué habría que hacer para resolverlo, y por eso se
 * conserva:
 *  - `desconocido`   → se preguntó y la página no lo demostró (885 pares);
 *  - `sin_registro`  → nunca se preguntó (7.508 de los 9.052 posibles).
 */
export type OrigenDelEstado = "verificado" | "desconocido" | "sin_registro";

/**
 * Qué sabemos del plan. Es una certeza SEPARADA de la de la capacidad y no
 * puede tocar la elegibilidad: una capacidad verificada con el plan sin
 * demostrar sigue verificada. Mezclarlas ya costó el lote 1 entero.
 *
 * `no_procede` es el caso de la capacidad que no consta: sin capacidad no hay
 * plan del que hablar.
 */
export type CertezaDelPlan = "verificado" | "desconocido" | "no_procede";

/** Lo que sabemos del plan mínimo, con su nombre sólo cuando está demostrado. */
export type EvidenciaDePlan = {
  certeza: CertezaDelPlan;
  /**
   * SÓLO viene cuando `certeza` es `verificado`. Nombrar un plan que no se ha
   * demostrado es afirmarlo, y es exactamente el bloqueante que la revisión
   * global encontró en doce registros el 2026-09-09.
   */
  nombre?: string;
};

/** La respuesta completa a «¿qué sabemos de esta herramienta y esta capacidad?». */
export type EvidenciaDeCapacidad = {
  herramientaId: string;
  capacidadId: string;
  estado: EstadoDeEvidencia;
  origen: OrigenDelEstado;
  plan: EvidenciaDePlan;
  /** Nativa, módulo o integración. Sólo cuando está verificada. */
  profundidad?: Profundidad;
  /** Con qué se integra, cuando la profundidad es `integracion`. */
  integraCon?: string;
  /** Alta sólo con fuente de primera mano. Sólo cuando está verificada. */
  confianza?: NivelConfianza;
  /** Límites que cambian la decisión: «sólo en escritorio», «máximo 3 usuarios». */
  nota?: string;
};

/**
 * La única puerta de lectura de la verificación.
 *
 * Todos sus métodos son síncronos y deterministas: la misma pregunta devuelve
 * siempre la misma respuesta, sin red y sin reloj.
 */
export type PuertoDeEvidencia = {
  /** Nunca devuelve `undefined`: un par que no existe es un `no_consta` con origen `sin_registro`. */
  estadoDe(herramientaId: string, capacidadId: string): EvidenciaDeCapacidad;
  /** Qué sabe hacer esta herramienta, demostrado. Ordenado y estable. */
  capacidadesVerificadasDe(herramientaId: string): string[];
  /**
   * Qué herramientas demuestran esta capacidad. Vacío significa «ninguna lo
   * demuestra», NUNCA «ninguna lo hace»: quien lo use tiene que redactarlo así.
   */
  herramientasQueDemuestran(capacidadId: string): string[];
};
