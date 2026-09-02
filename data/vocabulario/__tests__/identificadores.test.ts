import { describe, expect, it } from "vitest";
import {
  FORMA_CAPACIDAD,
  FORMA_RESTRICCION,
  LARGO_MAXIMO,
  PALABRAS_AMBIGUAS_SOLAS,
  PREFIJOS_VAGOS,
  getCapacidades,
  getRestricciones,
  getVocabulario,
  palabrasDe,
  paresCasiColisionantes,
} from "../repositorio";
import IDENTIFICADORES_EMITIDOS from "./identificadoresEmitidos.json";

/**
 * Las seis reglas de identificador, ejecutadas sobre el vocabulario real.
 *
 * Un identificador es la única parte del vocabulario que no se puede
 * rectificar: las etiquetas cambian, los dominios cambian, las definiciones se
 * afinan, pero el identificador entra en las fichas y en las relaciones y ya
 * no sale. Por eso las reglas se comprueban aquí y no se confían a la buena
 * intención de quien añade la siguiente capacidad.
 *
 * Ninguno lleva el dominio dentro, a propósito. Un prefijo de dominio es una
 * jerarquía metida en un nombre permanente, y antes o después miente: ya pasó
 * con `hr.training_lms`, que nació en «Personas y equipo» y hoy vive en
 * «Formación y alumnado».
 */
describe("los identificadores del vocabulario", () => {
  const capacidades = getCapacidades();
  const restricciones = getRestricciones();
  const ids = capacidades.map((c) => c.id);

  it("regla 1 · ninguno se repite", () => {
    const repetidos = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(repetidos).toEqual([]);
  });

  it("regla 1 · ninguna restricción choca con otra", () => {
    const r = restricciones.map((x) => x.id);
    expect(r.filter((id, i) => r.indexOf(id) !== i)).toEqual([]);
  });

  it.each(ids)("regla 2 · «%s» se sostiene sin su dominio", (id) => {
    const palabras = palabrasDe(id);
    if (palabras.length > 1) return;
    expect(
      PALABRAS_AMBIGUAS_SOLAS,
      `"${id}" es una palabra suelta que no dice sobre qué actúa. ` +
        "Nombra el objeto: cap.customer_appointment_reminders, no cap.reminders."
    ).not.toContain(palabras[0]);
  });

  it.each(ids)("regla 3 · «%s» tiene la forma correcta", (id) => {
    expect(id).toMatch(FORMA_CAPACIDAD);
    expect(id.length, `"${id}" pasa de ${LARGO_MAXIMO} caracteres`).toBeLessThanOrEqual(LARGO_MAXIMO);
  });

  it.each(restricciones.map((r) => r.id))("regla 3 · la restricción «%s» tiene la forma correcta", (id) => {
    expect(id).toMatch(FORMA_RESTRICCION);
    expect(id.length).toBeLessThanOrEqual(LARGO_MAXIMO);
  });

  it("regla 4 · ninguno es un cajón de sastre", () => {
    const vagos = ids.filter((id) => PREFIJOS_VAGOS.some((p) => id.startsWith(`cap.${p}`)));
    expect(
      vagos,
      "Un nombre vago acaba siendo un cajón donde cabe todo y no discrimina nada. " +
        "Le pasó a ops.field_service, que hubo que escindir en tres."
    ).toEqual([]);
  });

  it("regla 5 · todo par que se parece demasiado tiene su diferencia escrita", () => {
    const { justificacionesDeParecido } = getVocabulario();
    const explicados = new Set(justificacionesDeParecido.map((j) => j.par.slice().sort().join("|")));
    const sinExplicar = paresCasiColisionantes(ids).filter(
      ([a, b]) => !explicados.has([a, b].sort().join("|"))
    );
    expect(
      sinExplicar,
      "Estos identificadores comparten dos o más palabras. Si de verdad son cosas " +
        "distintas, escribe la diferencia en `justificacionesDeParecido`. Si no lo son, fusiónalos."
    ).toEqual([]);
  });

  it("regla 5 · no sobra ninguna justificación", () => {
    const { justificacionesDeParecido } = getVocabulario();
    const reales = new Set(paresCasiColisionantes(ids).map((p) => p.slice().sort().join("|")));
    const sobrantes = justificacionesDeParecido
      .map((j) => j.par.slice().sort().join("|"))
      .filter((p) => !reales.has(p));
    expect(sobrantes, "Justifica parecidos que ya no existen: bórralos.").toEqual([]);
  });

  it("regla 6 · el conjunto de identificadores emitidos sólo crece", () => {
    const actuales = new Set(ids);
    const desaparecidos = (IDENTIFICADORES_EMITIDOS as string[]).filter((id) => !actuales.has(id));
    expect(
      desaparecidos,
      "Un identificador no se borra nunca: cambia de estado (fusionada, escindida, " +
        "obsoleta, reclasificada) y se anota en migraciones.json. Si desaparece, " +
        "cualquier ficha que lo citara apunta al vacío en silencio."
    ).toEqual([]);
  });
});
