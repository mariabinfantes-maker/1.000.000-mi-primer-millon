/**
 * La única puerta del asesor.
 *
 * Existe para que la ruta de la API no tenga que leer el vocabulario por su
 * cuenta: lo hace esta carpeta, que es la autorizada, y fuera sólo se ven
 * funciones. Es la misma forma que ya tenía `app/api/recomendaciones`, que
 * recibe la evidencia por parámetro en vez de importarla.
 */
export { entender, leerComprension, construirPromptDeComprension } from "./entender";
export type { Comprension, LectorDeTexto } from "./entender";
export { aclarar } from "./aclarar";
export type { PreguntaUtil } from "./aclarar";
export { aconsejar } from "./aconsejar";
export type { Consejo, Pieza } from "./aconsejar";
export { buscar } from "./buscar";
export type { Busqueda, Solucion, Cobertura } from "./buscar";
export { necesidadesDeLaLista, necesidadesQueSePuedenElegir } from "./caso";
export { getOficios, getOficio, loQueTraeUnOficio, erroresDeOficios } from "./oficios";
export type { Oficio } from "./oficios";
export type { CasoDeUnaPersona } from "./caso";
