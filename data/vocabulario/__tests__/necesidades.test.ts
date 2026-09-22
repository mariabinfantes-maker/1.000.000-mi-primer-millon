import { describe, expect, it } from "vitest";
import {
  ajusteConLaNecesidad,
  erroresDelMapa,
  getMapaDeNecesidades,
  getNecesidad,
  getNecesidades,
  getPuertas,
  necesidadesDePuerta,
  ajusteConLoQuePidio,
  describirElAjuste,
} from "../necesidades";
import type { EstadoDeLaCapacidad, Necesidad, NecesidadDelCaso } from "../necesidades";

/**
 * El mapa de necesidades: que diga la verdad sobre sí mismo, y que la regla de
 * la asimetría no se pueda romper sin que una prueba lo diga.
 */

const MAPA = getMapaDeNecesidades();

describe("el mapa es coherente", () => {
  it("no tiene ni un error", () => {
    expect(erroresDelMapa()).toEqual([]);
  });

  /**
   * La comprobación que de verdad protege algo. Una capacidad sin necesidad es
   * trabajo verificado que nadie puede llegar a pedir: se quedaría muerta y
   * nadie se enteraría. Hoy están las 151 colocadas.
   */
  it("ninguna capacidad se queda sin necesidad que la pida", () => {
    const usadas = new Set(getNecesidades().flatMap((n) => [...n.imprescindibles, ...n.ayudan]));
    expect(usadas.size).toBe(151);
  });

  it("todas las puertas tienen algo detrás", () => {
    for (const p of getPuertas()) expect(necesidadesDePuerta(p.id).length).toBeGreaterThan(0);
  });

  /**
   * `imprescindibles` es lo único que excluye herramientas, así que se mantiene
   * corto a propósito. Si alguien empieza a apilar imprescindibles, el mapa
   * deja de asesorar y empieza a filtrar por criterios nuestros.
   */
  it("ninguna necesidad exige más de dos cosas imprescindibles", () => {
    const pasadas = getNecesidades().filter((n) => n.imprescindibles.length > 2);
    expect(pasadas.map((n) => n.id)).toEqual([]);
  });

  it("una necesidad puede colgar de dos puertas, y alguna lo hace", () => {
    expect(getNecesidades().some((n) => n.puertas.length > 1)).toBe(true);
  });

  /**
   * El nombre técnico sobrevive como entrada, no como título. Si mañana una
   * puerta se llama «CRM», esto no lo detecta — pero que cada puerta conserve
   * sus entradas es lo que permite que quien llega sabiendo el nombre no tenga
   * que empezar de cero.
   */
  it("cada puerta conserva los nombres técnicos que traen a ella", () => {
    for (const p of getPuertas()) expect(p.entradas.length).toBeGreaterThan(0);
  });
});

/** Un estado a medida, para no depender de los datos reales en estas pruebas. */
function saber(mapa: Record<string, EstadoDeLaCapacidad>) {
  return (cap: string): EstadoDeLaCapacidad => mapa[cap] ?? "sinPreguntar";
}

const NECESIDAD: Necesidad = {
  id: "nec.prueba", titulo: "Que reserven solos", loQueDice: ["x"],
  puertas: ["puerta.vender"], imprescindibles: ["cap.a"], ayudan: ["cap.b", "cap.c"],
};

describe("lo que sobra y lo que falta no pesan igual", () => {
  it("si demuestra lo imprescindible, es recomendable", () => {
    const a = ajusteConLaNecesidad(NECESIDAD, saber({ "cap.a": "demostrada" }));
    expect(a.comoSePresenta).toBe("recomendable");
    expect(a.resuelve).toEqual(["cap.a"]);
  });

  /** La casa de tres habitaciones: traer de más se nombra, no puntúa. */
  it("traer cosas de más no la baja ni la sube: se nombran", () => {
    const justo = ajusteConLaNecesidad(NECESIDAD, saber({ "cap.a": "demostrada" }));
    const conExtras = ajusteConLaNecesidad(
      NECESIDAD, saber({ "cap.a": "demostrada", "cap.b": "demostrada", "cap.c": "demostrada" })
    );
    expect(conExtras.comoSePresenta).toBe(justo.comoSePresenta);
    expect(conExtras.aporta).toEqual(["cap.b", "cap.c"]);
    expect(justo.aporta).toEqual([]);
  });

  it("faltarle lo imprescindible la coloca lejos, con su motivo", () => {
    const a = ajusteConLaNecesidad(NECESIDAD, saber({ "cap.a": "descartada" }));
    expect(a.comoSePresenta).toBe("le_falta_algo");
    expect(a.leFalta).toEqual(["cap.a"]);
  });

  it("la que trae de más y la que carece de lo imprescindible no son lo mismo", () => {
    const traeDeMas = ajusteConLaNecesidad(
      NECESIDAD, saber({ "cap.a": "demostrada", "cap.b": "demostrada", "cap.c": "demostrada" })
    );
    const leFalta = ajusteConLaNecesidad(
      NECESIDAD, saber({ "cap.a": "descartada", "cap.b": "demostrada", "cap.c": "demostrada" })
    );
    expect(traeDeMas.comoSePresenta).toBe("recomendable");
    expect(leFalta.comoSePresenta).toBe("le_falta_algo");
  });
});

describe("mostrar no equivale a recomendar", () => {
  /**
   * Antes esto era un booleano `sirve` y, con CERO ausencias demostradas en
   * 1.547 comprobaciones, salía `true` para casi todo: se habría recomendado
   * sobre «no sabemos nada malo de ella».
   */
  it("no haber comprobado nada NO la hace recomendable", () => {
    const a = ajusteConLaNecesidad(NECESIDAD, saber({}));
    expect(a.comoSePresenta).toBe("sin_comprobar");
    expect(a.sinPreguntar).toEqual(["cap.a"]);
    expect(a.leFalta).toEqual([]);
  });

  it("sólo es recomendable lo que está demostrado", () => {
    expect(ajusteConLaNecesidad(NECESIDAD, saber({ "cap.a": "demostrada" })).comoSePresenta).toBe("recomendable");
  });

  /** Ningún valor significa «no aparece»: en el desplegable salen todas. */
  it("ninguno de los estados esconde nada", () => {
    for (const estado of ["demostrada", "descartada", "desconocida", "sinPreguntar"] as const) {
      const a = ajusteConLaNecesidad(NECESIDAD, saber({ "cap.a": estado }));
      expect(["recomendable", "le_falta_algo", "sin_comprobar"]).toContain(a.comoSePresenta);
      expect(a.necesidadId).toBe("nec.prueba");
    }
  });

  it("una ausencia demostrada no queda tapada por un hueco nuestro", () => {
    const dos: Necesidad = { ...NECESIDAD, imprescindibles: ["cap.a", "cap.x"] };
    const a = ajusteConLaNecesidad(dos, saber({ "cap.a": "descartada" }));
    expect(a.comoSePresenta).toBe("le_falta_algo");
    expect(a.leFalta).toEqual(["cap.a"]);
    expect(a.sinPreguntar).toEqual(["cap.x"]);
  });
});

describe("los dos desconocidos: distinta frase, ninguna penalización", () => {
  const citas = getNecesidad("nec.que-reserven-solos")!;
  const imp = citas.imprescindibles[0];

  const jamas = ajusteConLaNecesidad(citas, saber({}));
  const buscada = ajusteConLaNecesidad(citas, saber({ [imp]: "desconocida" }));
  const noLoHace = ajusteConLaNecesidad(citas, saber({ [imp]: "descartada" }));

  /**
   * La corrección de la propietaria: «"sin comprobar" no siempre permite decir
   * "lo hemos buscado en su página". Si nunca se investigó, debe decir
   * "todavía no lo hemos comprobado".» Con los datos de hoy eso era falso en
   * el 84 % de los pares: 8.268 de 9.815 no se preguntaron nunca.
   */
  it("nunca preguntado no dice que lo hayamos buscado", () => {
    const frase = describirElAjuste(citas, jamas);
    expect(frase).toContain("Todavía no hemos comprobado");
    expect(frase).not.toContain("Hemos buscado");
  });

  it("buscado sin encontrar sí lo dice, y no afirma la ausencia", () => {
    const frase = describirElAjuste(citas, buscada);
    expect(frase).toContain("Hemos buscado");
    expect(frase).toContain("podría hacerlo igualmente");
    expect(frase).not.toContain("Todavía no hemos comprobado");
  });

  it("las tres frases son distintas entre sí", () => {
    const frases = [jamas, buscada, noLoHace].map((a) => describirElAjuste(citas, a));
    expect(new Set(frases).size).toBe(3);
  });

  /**
   * «Esa diferencia entre desconocidos no debería convertirse en una
   * penalización.» Comparten estado a propósito: que la hayamos mirado y no
   * saliera insinúa un poco la ausencia; que no la hayamos mirado no dice
   * nada. Ordenar por eso sería convertir una sospecha en un dato.
   */
  it("los dos desconocidos comparten estado, así que no pueden ordenar", () => {
    expect(jamas.comoSePresenta).toBe("sin_comprobar");
    expect(buscada.comoSePresenta).toBe("sin_comprobar");
  });

  it("la de «no lo hace» no deja lugar a la duda", () => {
    const frase = describirElAjuste(citas, noLoHace);
    expect(frase).toContain("Lo hemos comprobado");
    expect(frase).toContain("No está pensada para esto");
    expect(frase).not.toContain("podría");
  });

  it("las frases dicen qué se le queda sin resolver, con sus palabras", () => {
    for (const a of [jamas, buscada, noLoHace]) {
      expect(describirElAjuste(citas, a)).toContain("que puedan reservar sin llamarme");
    }
  });

  it("ninguna frase suelta un identificador técnico a la cara", () => {
    for (const a of [jamas, buscada, noLoHace]) expect(describirElAjuste(citas, a)).not.toContain("cap.");
  });
});

describe("una deseable nunca relega a quien resuelve lo imprescindible", () => {
  const citas = getNecesidad("nec.que-reserven-solos")!;
  const agenda = getNecesidad("nec.mi-agenda")!;
  const soloLoSuyo: NecesidadDelCaso[] = [{ necesidad: citas, importancia: "imprescindible" }];
  const conLaPregunta: NecesidadDelCaso[] = [
    ...soloLoSuyo,
    { necesidad: agenda, importancia: "deseable", salioDeUnaPregunta: true },
  ];
  const resuelveCitas = saber({ [citas.imprescindibles[0]]: "demostrada" });

  /**
   * «"Sí, me ayudaría" no significa "es imprescindible". Convertirla
   * automáticamente en requisito podría relegar una herramienta que resuelve
   * perfectamente el problema principal.»
   */
  it("añadir la deseable no toca el recuento de imprescindibles", () => {
    const antes = ajusteConLoQuePidio(soloLoSuyo, resuelveCitas);
    const despues = ajusteConLoQuePidio(conLaPregunta, resuelveCitas);
    expect(despues.resuelveImprescindibles).toBe(antes.resuelveImprescindibles);
    expect(despues.deImprescindibles).toBe(antes.deImprescindibles);
    expect(despues.deDeseables).toBe(1);
    expect(despues.resuelveDeseables).toBe(0);
  });

  it("los dos niveles se cuentan por separado y se pueden decir en voz alta", () => {
    const a = ajusteConLoQuePidio(
      conLaPregunta, saber({ [citas.imprescindibles[0]]: "demostrada", [agenda.imprescindibles[0]]: "demostrada" })
    );
    expect(`${a.resuelveImprescindibles} de ${a.deImprescindibles}`).toBe("1 de 1");
    expect(`${a.resuelveDeseables} de ${a.deDeseables}`).toBe("1 de 1");
  });

  it("queda registrado que salió de una pregunta, para poder enseñarlo y quitarlo", () => {
    expect(conLaPregunta[1].salioDeUnaPregunta).toBe(true);
    expect(soloLoSuyo[0].salioDeUnaPregunta).toBeUndefined();
  });

  it("si no trajo nada, no hay distancia que medir", () => {
    const a = ajusteConLoQuePidio([], saber({}));
    expect(a.deImprescindibles).toBe(0);
    expect(a.deDeseables).toBe(0);
    expect(a.porNecesidad).toEqual([]);
  });
});

describe("el mapa no decide nada todavía", () => {
  /**
   * Mismo contrato que el vocabulario: esto es dato, no comportamiento.
   * Conectarlo es una decisión de la propietaria, y hasta entonces la nota
   * tiene que seguir diciéndolo.
   */
  it("sigue marcado como borrador que nadie lee", () => {
    expect(MAPA.nota).toContain("Nadie lo lee todavía");
  });

  it("las seis puertas están en voz de persona, no de software", () => {
    expect(getPuertas().map((p) => p.titulo)).toEqual([
      "Vender más",
      "Controlar el dinero",
      "Que no se me pierda nada",
      "Cuidar al cliente que ya tengo",
      "Crear y publicar contenido",
      "Ganar tiempo",
    ]);
  });

  it("«CRM» es una entrada, nunca el nombre de una puerta", () => {
    const titulos = getPuertas().map((p) => p.titulo.toLowerCase());
    expect(titulos.some((t) => t.includes("crm"))).toBe(false);
    expect(getPuertas().some((p) => p.entradas.includes("CRM"))).toBe(true);
  });

  it("la necesidad que abrió toda la visión está en el mapa", () => {
    // «soy peluquera y pierdo citas», de AGENTS.md.
    const n = getNecesidad("nec.que-reserven-solos");
    expect(n?.imprescindibles).toEqual(["cap.online_self_service_booking"]);
    expect(n?.puertas).toEqual(["puerta.vender", "puerta.orden"]);
  });
});

describe("de más cerca a más lejana, y todas en el desplegable", () => {
  const citas = getNecesidad("nec.que-reserven-solos")!;
  const factura = getNecesidad("nec.emitir-una-factura-legal")!;
  const trajo: NecesidadDelCaso[] = [
    { necesidad: citas, importancia: "imprescindible" },
    { necesidad: factura, importancia: "imprescindible" },
  ];
  const [cita, fact] = [citas.imprescindibles[0], factura.imprescindibles[0]];

  it("cubrir más de lo que ella trajo es estar más cerca", () => {
    const dos = ajusteConLoQuePidio(trajo, saber({ [cita]: "demostrada", [fact]: "demostrada" }));
    const una = ajusteConLoQuePidio(trajo, saber({ [cita]: "demostrada", [fact]: "descartada" }));
    expect(dos.resuelveImprescindibles).toBe(2);
    expect(una.resuelveImprescindibles).toBe(1);
    expect(dos.deImprescindibles).toBe(2);
  });

  /** «3 de 4» se puede decir en voz alta; «3» a secas no significa nada. */
  it("el denominador es lo que ella trajo, no el catálogo", () => {
    const a = ajusteConLoQuePidio(trajo, saber({ [cita]: "demostrada" }));
    expect(a.deImprescindibles).toBe(trajo.length);
  });

  it("los tres recuentos de sus imprescindibles suman, sin huecos", () => {
    for (const mapa of [
      { [cita]: "demostrada", [fact]: "demostrada" },
      { [cita]: "demostrada", [fact]: "descartada" },
      {},
      { [cita]: "descartada", [fact]: "desconocida" },
    ] as Record<string, EstadoDeLaCapacidad>[]) {
      const a = ajusteConLoQuePidio(trajo, saber(mapa));
      expect(a.resuelveImprescindibles + a.leFaltan + a.sinComprobar).toBe(a.deImprescindibles);
    }
  });

  /**
   * LA PRUEBA QUE SOSTIENE EL DESPLEGABLE. A la que le falta algo
   * imprescindible se le mide la distancia igual que a las demás: conserva su
   * fila, su recuento y su motivo. Ninguna salida de este módulo la borra.
   */
  it("a la que le falta algo se le mide la distancia, no se la tacha", () => {
    const lejos = ajusteConLoQuePidio(trajo, saber({ [cita]: "descartada", [fact]: "descartada" }));
    expect(lejos.porNecesidad).toHaveLength(trajo.length);
    expect(lejos.leFaltan).toBe(2);
    expect(lejos.resuelveImprescindibles).toBe(0);
    expect(lejos.porNecesidad[0].leFalta).toEqual([cita]);
  });

  it("estar lejos no la deja fuera: sigue habiendo una fila por necesidad", () => {
    const cerca = ajusteConLoQuePidio(trajo, saber({ [cita]: "demostrada", [fact]: "demostrada" }));
    const lejos = ajusteConLoQuePidio(trajo, saber({ [cita]: "descartada", [fact]: "descartada" }));
    expect(lejos.porNecesidad.length).toBe(cerca.porNecesidad.length);
  });

  /** Los extras se nombran; sumarlos ordenaría, y eso es lo que no puede pasar. */
  it("traer de más no mueve la distancia, y se puede enseñar", () => {
    const justo = ajusteConLoQuePidio(trajo, saber({ [cita]: "demostrada", [fact]: "demostrada" }));
    const conExtras = ajusteConLoQuePidio(
      trajo,
      saber({
        [cita]: "demostrada", [fact]: "demostrada",
        "cap.customer_appointment_reminders": "demostrada",
        "cap.regulated_einvoicing": "demostrada",
      })
    );
    expect(conExtras.resuelveImprescindibles).toBe(justo.resuelveImprescindibles);
    expect(conExtras.traeAdemas).toEqual(["cap.customer_appointment_reminders", "cap.regulated_einvoicing"]);
    expect(justo.traeAdemas).toEqual([]);
  });
});