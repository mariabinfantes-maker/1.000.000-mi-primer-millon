import { describe, expect, it } from "vitest";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { ajusteConLoQuePidio, describirElAjuste, getNecesidad } from "@/data/vocabulario/necesidades";
import type { EstadoDeLaCapacidad, NecesidadDelCaso } from "@/data/vocabulario/necesidades";
import { estadoDelPar } from "../cobertura";
import { evidenciaDeUso } from "../evidencia";
import { getRegistros } from "../repositorio";
import { USOS } from "../usos";

/**
 * UN CASO ENTERO, CON DATOS REALES, TAL COMO LO LEERÍA ELLA.
 *
 * Lo pidió la propietaria: «ya toca comprobar cómo se traduce todo esto en una
 * ayuda útil», antes de construir otro módulo aislado. No añade maquinaria:
 * junta la que hay. Vive aquí porque es el único sitio autorizado a leer los
 * dos lados —vocabulario y verificación—.
 *
 * ── LO QUE CORRIGIÓ LA SEGUNDA VUELTA ──────────────────────────────────
 *
 * La primera versión decía «estas cuatro resuelven las dos necesidades». Era
 * falso, y el propio proyecto tenía el dato que lo desmiente:
 *
 *   uso.reserva_de_servicio — «La persona elige un servicio concreto (un corte
 *   de pelo, una sesión) con duración y precio propios y coge hora sola.»
 *   noEs: «No es reservar una reunión o una llamada con alguien del equipo.»
 *
 * `cap.online_self_service_booking` NO distingue las dos cosas. Reclaim.ai
 * agenda reuniones; Pipedrive, llamadas de venta. Demostrar la capacidad no
 * demuestra que sirva para dar cita a un servicio, y **de los 1.547 registros, CERO
 * tienen un uso comprobado**. Así que no son cuatro que resuelven: son cuatro
 * CANDIDATAS, y el límite se dice.
 *
 * Lo cazó la propietaria: «"reserva online" no confirma que gestione citas de
 * peluquería. Ya encontramos esa diferencia con las reuniones y las llamadas.»
 */

const HERRAMIENTAS = getTodasLasHerramientas().filter((h) => h.estado === "activo");
const REGISTROS = getRegistros();

const CITAS = getNecesidad("nec.que-reserven-solos")!;
const FACTURA = getNecesidad("nec.emitir-una-factura-legal")!;
const AGENDA = getNecesidad("nec.mi-agenda")!;

/** El uso que de verdad contesta si esa reserva sirve para un corte de pelo. */
const RESERVA_DE_SERVICIO = "uso.reserva_de_servicio";

function registroDe(herramientaId: string, capacidadId: string) {
  return REGISTROS.find((r) => r.herramientaId === herramientaId && r.capacidadId === capacidadId);
}

function loQueSabemosDe(herramientaId: string): (capacidadId: string) => EstadoDeLaCapacidad {
  return (capacidadId) => estadoDelPar(herramientaId, capacidadId, registroDe(herramientaId, capacidadId));
}

/** Lo que se puede afirmar del USO, que es otra pregunta que la capacidad. */
function usoDe(herramientaId: string, usoId: string) {
  const uso = USOS.find((u) => u.id === usoId)!;
  return evidenciaDeUso(herramientaId, usoId, registroDe(herramientaId, uso.capacidadId));
}

/**
 * LO QUE ELLA CUENTA, y lo que Molnip pregunta después.
 *
 * La pregunta antigua era una sola y mezclaba dos cosas: «¿sois varias o sólo
 * tú? Si sois varias te ayudaría que cada una tenga la suya». Un «sí» a eso no
 * se puede interpretar, porque no se sabe a cuál de las dos contestó. Ahora
 * son dos, y en el orden que manda: primero el HECHO de su negocio, y sólo
 * después la necesidad, cuyo peso lo decide ella.
 *
 * Y de ahí sale la corrección que más importa: **según cómo trabajen, eso
 * puede ser imprescindible, no deseable**. La importancia no la ponemos
 * nosotros a ojo — sale de lo que contesta.
 */
const PREGUNTAS = [
  { pregunta: "¿Cuántas personas atendéis a clientes?", respuesta: "Tres" },
  {
    pregunta:
      "Siendo tres, ¿necesitáis que cada una tenga su propia agenda y que el cliente elija con quién, " +
      "o os vale una agenda común?",
    respuesta: "Cada una la suya, y el cliente elige con quién",
  },
];

/** Tres personas y el cliente elige con quién: eso lo hace imprescindible. */
const IMPORTANCIA_DE_LA_AGENDA = "imprescindible" as const;

const EL_CASO: NecesidadDelCaso[] = [
  { necesidad: CITAS, importancia: "imprescindible" },
  { necesidad: FACTURA, importancia: "imprescindible" },
  { necesidad: AGENDA, importancia: IMPORTANCIA_DE_LA_AGENDA, salioDeUnaPregunta: true },
];

const SOLO_LO_QUE_DIJO: NecesidadDelCaso[] = EL_CASO.slice(0, 2);

/**
 * El nombre de este caso era «el caso de la peluquera» y se cambia el
 * 2026-09-30 por orden de la propietaria, que ya había desactivado ese ejemplo
 * en `AGENTS.md` y se lo seguía encontrando aquí. Lo que se prueba no ha
 * cambiado ni una línea: son las mismas tres necesidades —reservas, factura y
 * agenda— con los mismos datos.
 *
 * La cita suya de arriba SÍ se deja tal cual: son sus palabras, y las palabras
 * de alguien no se reescriben para que encajen con una decisión posterior.
 */
describe("reservas, factura y agenda, con los datos de hoy", () => {
  const candidatas = HERRAMIENTAS.filter((h) => {
    const a = ajusteConLoQuePidio(SOLO_LO_QUE_DIJO, loQueSabemosDe(h.id));
    return a.resuelveImprescindibles === a.deImprescindibles;
  });

  /**
   * 11 desde el 2026-09-30, y antes eran 4 —Agiled, HoneyBook, Keap y
   * Nutshell, las cuatro estadounidenses—. Entran siete españolas de clínica y
   * salón al preguntarle por fin a catorce herramientas si FACTURAN: nadie se
   * lo había preguntado, porque los encargos anteriores pedían ocho
   * capacidades y las ocho eran de reservas.
   *
   * Esta lista no se escribe a mano: si crece, es que el catálogo o la
   * evidencia han crecido, y hay que mirar que sea por eso.
   */
  it("las candidatas salen de los datos, no de una lista escrita a mano", () => {
    expect(candidatas.map((h) => h.nombre).sort()).toEqual([
      "Agiled", "Archivex", "Bookitit", "DriCloud", "HoneyBook",
      "Keap", "Koibox", "Nubimed", "Nutshell", "Pabau", "ViDay",
    ]);
  });

  /**
   * LA PRUEBA QUE IMPIDE LA PROMESA DE MÁS. Mientras ninguna demuestre el uso,
   * ninguna puede presentarse como que resuelve dar cita a un servicio.
   */
  it("ninguna candidata tiene comprobado que la reserva sirva para un servicio", () => {
    for (const h of candidatas) {
      expect(usoDe(h.id, RESERVA_DE_SERVICIO).estado).not.toBe("demostrada");
    }
  });

  /**
   * El 2026-09-22 se miró: se leyeron las páginas oficiales de las ocho que
   * demuestran reserva online y las ocho salieron `no_consta`.
   *
   * Y AQUÍ NO SE PUEDE APRETAR MÁS LA CONCLUSIÓN. `no_consta` dice que en las
   * páginas que leímos no encontramos la demostración. NO dice que ninguna lo
   * haga, ni que el catálogo tenga un hueco confirmado. La primera redacción
   * de este bloque decía «el hueco deja de ser nuestro y pasa a ser del
   * catálogo», y era la regla 3 de F2 rota por quien acababa de guardar bien
   * el dato.
   *
   * Lo demostró el propio trabajo el mismo día: Booksy salió `no_consta`
   * leyendo sus páginas de cliente y `demostrado` en cuatro de cinco pasos al
   * leer `biz.booksy.com`. No cambió la herramienta — cambió lo que habíamos
   * mirado.
   */
  it("se comprobó en las ocho y en ninguna quedó demostrado, que no es lo mismo que no lo haga", () => {
    const conUso = HERRAMIENTAS.filter((h) => usoDe(h.id, RESERVA_DE_SERVICIO).estado === "demostrada");
    expect(conUso).toEqual([]);

    const preguntadas = REGISTROS.filter((r) =>
      (r.usos ?? []).some((u) => u.usoId === RESERVA_DE_SERVICIO)
    );
    expect(preguntadas.length).toBe(8);
    for (const r of preguntadas) {
      const u = (r.usos ?? []).find((x) => x.usoId === RESERVA_DE_SERVICIO)!;
      expect(u.estado).toBe("no_consta");
      expect(u.nota).toBeTruthy();
    }
  });

  /** El uso declarado dice justo lo que separa un corte de pelo de una reunión. */
  it("el uso está definido para distinguir el corte de pelo de la reunión", () => {
    const uso = USOS.find((u) => u.id === RESERVA_DE_SERVICIO)!;
    expect(uso.capacidadId).toBe(CITAS.imprescindibles[0]);
    expect(uso.definicion).toContain("corte de pelo");
    expect(uso.noEs).toContain("reunión");
  });

  /**
   * La pregunta se parte en dos: el hecho primero, la necesidad después. Un
   * «sí» a una pregunta que mezcla las dos no se puede interpretar.
   */
  it("la pregunta del hecho no sugiere ninguna ventaja", () => {
    expect(PREGUNTAS[0].pregunta).not.toContain("ayudaría");
    expect(PREGUNTAS[0].pregunta).not.toContain("agenda");
  });

  it("lo que contesta decide el peso: aquí es imprescindible, no deseable", () => {
    const a = ajusteConLoQuePidio(EL_CASO, loQueSabemosDe("honeybook"));
    expect(IMPORTANCIA_DE_LA_AGENDA).toBe("imprescindible");
    expect(a.deImprescindibles).toBe(3);
    expect(a.deDeseables).toBe(0);
  });

  /**
   * Y esto es lo que cuesta la corrección, dicho sin suavizar: al subir la
   * agenda a imprescindible, NINGUNA de las cuatro la resuelve — «agenda por
   * profesional» tiene 65 de 65 sin preguntar. El resultado honrado pasa de
   * «cuatro que valen» a «cuatro por comprobar y una cosa que no sabemos de
   * nadie». Eso es asesorar; lo otro era rellenar.
   */
  /**
   * ESTO ES LO QUE CAMBIÓ, Y ES EL MOTIVO DE TODO EL TRABAJO.
   *
   * Hasta el 2026-09-30 esta prueba decía «con la agenda dentro, NINGUNA llega
   * a resolverlo todo», y era verdad: las cuatro candidatas eran genéricas
   * estadounidenses y a las cuatro les faltaba la agenda por profesional. Por
   * eso una clínica dental recibía Agiled, HoneyBook y Keap —ésta a 299 $/mes—
   * con un «sin confirmar: agenda» en las tres tarjetas.
   *
   * Hoy SEIS lo resuelven entero y las seis son españolas: Koibox (con plan
   * gratuito), Bookitit, Nubimed, DriCloud, Archivex y ViDay. Las cinco que
   * siguen a 2 de 3 son las de antes, que no tienen la agenda.
   *
   * Lo que se comprueba aquí ya no es «ninguna puede», sino que cada una diga
   * la verdad de lo suyo: la que resuelve las tres no deja nada sin comprobar,
   * y la que resuelve dos lo dice en vez de callarlo. Y NINGUNA tiene un
   * `leFaltan`: seguimos sin afirmar de nadie que no haga algo.
   */
  it("cada candidata dice exactamente lo que resuelve y lo que no", () => {
    const completas: string[] = [];
    for (const h of candidatas) {
      const a = ajusteConLoQuePidio(EL_CASO, loQueSabemosDe(h.id));
      if (a.resuelveImprescindibles === a.deImprescindibles) {
        completas.push(h.nombre);
        expect(a.sinComprobar, `${h.nombre} lo resuelve todo y aun así deja algo sin comprobar`).toBe(0);
      } else {
        expect(a.sinComprobar, `${h.nombre} no lo resuelve todo y no lo dice`).toBeGreaterThan(0);
      }
      // «No consta» nunca se convierte en «no lo tiene», resuelva lo que resuelva.
      expect(a.leFaltan).toBe(0);
    }
    expect(completas.sort()).toEqual(["Archivex", "Bookitit", "DriCloud", "Koibox", "Nubimed", "ViDay"]);
  });

  /** El esfuerzo cuelga de la necesidad, no de la marca: vale para cualquiera. */
  it("cada necesidad del caso dice lo que le va a costar a ella", () => {
    for (const n of EL_CASO) {
      expect(n.necesidad.loQueTeCuesta).toBeTruthy();
      expect(n.necesidad.loQueTeCuesta).not.toContain("cap.");
    }
  });

  it("las 65 conservan su fila: el desplegable las lleva todas", () => {
    const todas = HERRAMIENTAS.map((h) => ajusteConLoQuePidio(EL_CASO, loQueSabemosDe(h.id)));
    // 69 desde el 2026-09-29: BEWE, Bookitit, AgendaPro, Cliniko, Archivex y Schedulista.
    expect(todas).toHaveLength(90);
    for (const a of todas) expect(a.porNecesidad).toHaveLength(EL_CASO.length);
  });

  /** Las dos clases de «no sabemos» siguen diciendo cosas distintas. */
  it("«todavía no lo hemos comprobado» y «lo hemos buscado» no se confunden", () => {
    const frases = HERRAMIENTAS.flatMap((h) => {
      const a = ajusteConLoQuePidio(EL_CASO, loQueSabemosDe(h.id));
      return EL_CASO.map((n, i) => describirElAjuste(n.necesidad, a.porNecesidad[i]));
    });
    expect(frases.some((f) => f.includes("Todavía no hemos comprobado"))).toBe(true);
    expect(frases.some((f) => f.includes("Hemos buscado"))).toBe(true);
    for (const f of frases) expect(f).not.toContain("cap.");
  });
});
