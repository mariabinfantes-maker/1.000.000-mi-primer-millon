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
import type { Necesidad } from "../necesidades";

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

describe("lo que sobra y lo que falta no pesan igual", () => {
  const necesidad: Necesidad = {
    id: "nec.prueba", titulo: "Que reserven solos", loQueDice: ["x"],
    puertas: ["puerta.vender"], imprescindibles: ["cap.a"], ayudan: ["cap.b", "cap.c"],
  };

  it("si demuestra lo imprescindible, es recomendable", () => {
    const a = ajusteConLaNecesidad(necesidad, new Set(["cap.a"]), new Set());
    expect(a.comoSePresenta).toBe("recomendable");
    expect(a.resuelve).toEqual(["cap.a"]);
  });

  /**
   * La casa de tres habitaciones. Traer de más nunca puede bajar a una
   * herramienta: se nombra aparte, en `aporta`, para que ella juzgue si le
   * sirve.
   */
  it("traer cosas de más no la baja ni la sube: se nombran", () => {
    const justo = ajusteConLaNecesidad(necesidad, new Set(["cap.a"]), new Set());
    const conExtras = ajusteConLaNecesidad(necesidad, new Set(["cap.a", "cap.b", "cap.c"]), new Set());
    expect(conExtras.comoSePresenta).toBe(justo.comoSePresenta);
    expect(conExtras.aporta).toEqual(["cap.b", "cap.c"]);
    expect(justo.aporta).toEqual([]);
  });

  it("faltarle lo imprescindible la coloca lejos, con su motivo", () => {
    const a = ajusteConLaNecesidad(necesidad, new Set(["cap.b", "cap.c"]), new Set(["cap.a"]));
    expect(a.comoSePresenta).toBe("le_falta_algo");
    expect(a.leFalta).toEqual(["cap.a"]);
  });

  it("la que trae de más y la que carece de lo imprescindible no son lo mismo", () => {
    const traeDeMas = ajusteConLaNecesidad(necesidad, new Set(["cap.a", "cap.b", "cap.c"]), new Set());
    const leFalta = ajusteConLaNecesidad(necesidad, new Set(["cap.b", "cap.c"]), new Set(["cap.a"]));
    expect(traeDeMas.comoSePresenta).toBe("recomendable");
    expect(leFalta.comoSePresenta).toBe("le_falta_algo");
  });
});

describe("mostrar no equivale a recomendar", () => {
  const necesidad: Necesidad = {
    id: "nec.prueba", titulo: "Que reserven solos", loQueDice: ["x"],
    puertas: ["puerta.vender"], imprescindibles: ["cap.a"], ayudan: ["cap.b"],
  };

  /**
   * Antes esto era un booleano `sirve`, y con los datos de hoy —CERO ausencias
   * demostradas en 1.547 comprobaciones— salía `true` para casi todo. Es
   * decir: se habría recomendado sobre «no sabemos nada malo de ella».
   * Recomendar exige haberlo comprobado; enseñar, no.
   */
  it("no haber comprobado nada NO la hace recomendable", () => {
    const a = ajusteConLaNecesidad(necesidad, new Set(), new Set());
    expect(a.comoSePresenta).toBe("sin_comprobar");
    expect(a.comoSePresenta).not.toBe("recomendable");
    expect(a.noSabemosSiLoHace).toEqual(["cap.a"]);
    expect(a.leFalta).toEqual([]);
  });

  it("sólo es recomendable lo que está demostrado", () => {
    expect(ajusteConLaNecesidad(necesidad, new Set(["cap.a"]), new Set()).comoSePresenta).toBe("recomendable");
  });

  /** Ningún valor significa «no aparece»: en el desplegable salen todas. */
  it("ninguno de los tres estados esconde nada", () => {
    for (const [dem, des] of [
      [new Set<string>(["cap.a"]), new Set<string>()],
      [new Set<string>(), new Set<string>(["cap.a"])],
      [new Set<string>(), new Set<string>()],
    ] as const) {
      const a = ajusteConLaNecesidad(necesidad, dem, des);
      expect(["recomendable", "le_falta_algo", "sin_comprobar"]).toContain(a.comoSePresenta);
      expect(a.necesidadId).toBe("nec.prueba");
    }
  });

  /**
   * Una ausencia demostrada es más seria y más rara que un hueco nuestro. Si
   * se mirara antes lo no comprobado, quedaría tapada dentro de la misma
   * necesidad.
   */
  it("una ausencia demostrada no queda tapada por un hueco nuestro", () => {
    const dos: Necesidad = { ...necesidad, imprescindibles: ["cap.a", "cap.x"] };
    const a = ajusteConLaNecesidad(dos, new Set(), new Set(["cap.a"]));
    expect(a.comoSePresenta).toBe("le_falta_algo");
    expect(a.leFalta).toEqual(["cap.a"]);
    expect(a.noSabemosSiLoHace).toEqual(["cap.x"]);
  });
});

describe("«no está pensada para esto» no es «no lo hemos comprobado»", () => {
  const necesidad: Necesidad = {
    id: "nec.citas", titulo: "Que puedan reservar sin llamarme", loQueDice: ["pierdo citas"],
    puertas: ["puerta.vender"], imprescindibles: ["cap.online_self_service_booking"], ayudan: [],
  };

  const noLoHace = describirElAjuste(
    necesidad, ajusteConLaNecesidad(necesidad, new Set(), new Set(["cap.online_self_service_booking"]))
  );
  const noLoSabemos = describirElAjuste(necesidad, ajusteConLaNecesidad(necesidad, new Set(), new Set()));
  const loHace = describirElAjuste(
    necesidad, ajusteConLaNecesidad(necesidad, new Set(["cap.online_self_service_booking"]), new Set())
  );

  it("las tres frases son distintas entre sí", () => {
    expect(new Set([noLoHace, noLoSabemos, loHace]).size).toBe(3);
  });

  /**
   * La que importa. Hoy hay cero ausencias demostradas, así que casi todo
   * caerá en «no lo sabemos». Esa frase NO puede afirmar una ausencia: sería
   * decir «no lo hace» cada vez que queremos decir «no lo sé», que es la regla
   * 3 de F2 al revés.
   */
  it("la de «no lo sabemos» nunca afirma que no lo haga", () => {
    expect(noLoSabemos).toContain("No nos consta");
    expect(noLoSabemos).toContain("podría hacerlo igualmente");
    expect(noLoSabemos).not.toContain("no hace");
    expect(noLoSabemos).not.toContain("No está pensada");
  });

  it("la de «no lo hace» sí dice que se comprobó, y no deja lugar a la duda", () => {
    expect(noLoHace).toContain("Lo hemos comprobado");
    expect(noLoHace).toContain("No está pensada para esto");
    expect(noLoHace).not.toContain("podría");
  });

  /** «Cómo le afecta a su caso»: la frase nombra la necesidad que se cae. */
  it("las dos dicen qué se le queda sin resolver, con sus palabras", () => {
    expect(noLoHace).toContain("que puedan reservar sin llamarme");
    expect(noLoSabemos).toContain("que puedan reservar sin llamarme");
  });

  it("ninguna frase suelta un identificador técnico a la cara", () => {
    for (const frase of [noLoHace, noLoSabemos, loHace]) expect(frase).not.toContain("cap.");
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
  const citas: Necesidad = {
    id: "nec.citas", titulo: "Que reserven solos", loQueDice: ["pierdo citas"],
    puertas: ["puerta.vender"], imprescindibles: ["cap.reserva"], ayudan: ["cap.recordatorio"],
  };
  const factura: Necesidad = {
    id: "nec.factura", titulo: "Emitir factura", loQueDice: ["hago las facturas a mano"],
    puertas: ["puerta.dinero"], imprescindibles: ["cap.factura"], ayudan: [],
  };
  const pidio = [citas, factura];

  /**
   * La que cubre las dos está más cerca que la que cubre una. Eso es todo lo
   * que quiere decir «de más cerca a más lejana», y se calcula sin opinar:
   * ninguna de las dos afirmaciones dice que una empresa sea mejor que otra.
   */
  it("cubrir más de lo que ella pidió es estar más cerca", () => {
    const dos = ajusteConLoQuePidio(pidio, new Set(["cap.reserva", "cap.factura"]), new Set());
    const una = ajusteConLoQuePidio(pidio, new Set(["cap.reserva"]), new Set(["cap.factura"]));
    expect(dos.cubre).toBe(2);
    expect(una.cubre).toBe(1);
    expect(dos.deCuantas).toBe(2);
  });

  /**
   * El denominador viaja siempre al lado. «3 de 4» se puede decir en voz alta;
   * «3» a secas no significa nada y deja a la persona sin poder comprobarnos.
   */
  it("el denominador es lo que ella pidió, no el catálogo", () => {
    const a = ajusteConLoQuePidio(pidio, new Set(["cap.reserva"]), new Set());
    expect(a.deCuantas).toBe(pidio.length);
  });

  /**
   * Lo que trae de más se cuenta aparte y NUNCA baja a nadie. La casa de tres
   * habitaciones: la tercera puede servirle de despacho, y eso lo decide ella.
   */
  it("traer de más suma y se puede contar, pero no cambia lo que cubre", () => {
    const justo = ajusteConLoQuePidio(pidio, new Set(["cap.reserva", "cap.factura"]), new Set());
    const conExtras = ajusteConLoQuePidio(
      pidio, new Set(["cap.reserva", "cap.factura", "cap.tpv", "cap.nominas"]), new Set()
    );
    // Los extras NO mueven la distancia. Es la corrección de la propietaria:
    // tener más funciones no sube automáticamente a una herramienta.
    expect(conExtras.cubre).toBe(justo.cubre);
    expect(conExtras.leFaltan).toBe(justo.leFaltan);
    // Se nombran para que ella juzgue si le sirven. Lista, nunca número.
    expect(conExtras.traeAdemas).toEqual(["cap.nominas", "cap.tpv"]);
    expect(justo.traeAdemas).toEqual([]);
  });

  /**
   * Lo que no sabemos no se reparte ni se calla. Si se callara, la herramienta
   * que más hemos mirado parecería la que más cubre — que es medir nuestro
   * trabajo y venderlo como suyo.
   */
  it("lo no comprobado se cuenta aparte y no se suma a lo que cubre", () => {
    const a = ajusteConLoQuePidio(pidio, new Set(["cap.reserva"]), new Set());
    // Cubre las citas —su imprescindible está demostrada— aunque el
    // recordatorio, que sólo ayuda, siga sin comprobar.
    expect(a.cubre).toBe(1);
    // De la factura no sabemos, y se dice: no se reparte ni se calla.
    expect(a.sinComprobar).toBe(1);
    expect(a.leFaltan).toBe(0);
  });

  /**
   * LA PRUEBA QUE SOSTIENE EL DESPLEGABLE. A la que le falta algo
   * imprescindible se le mide la distancia igual que a las demás: sigue
   * teniendo su ficha, su recuento y su motivo. No hay ninguna salida de este
   * módulo que la borre de la lista, porque en el desplegable salen todas las
   * que hemos verificado y elige ella.
   */
  it("los tres recuentos suman lo que ella pidió, sin huecos", () => {
    for (const [dem, des] of [
      [new Set(["cap.reserva", "cap.factura"]), new Set<string>()],
      [new Set(["cap.reserva"]), new Set(["cap.factura"])],
      [new Set<string>(), new Set<string>()],
      [new Set<string>(), new Set(["cap.reserva", "cap.factura"])],
    ] as const) {
      const a = ajusteConLoQuePidio(pidio, dem, des);
      expect(a.cubre + a.leFaltan + a.sinComprobar).toBe(a.deCuantas);
    }
  });

  it("a la que le falta algo imprescindible se le mide la distancia, no se la tacha", () => {
    const lejos = ajusteConLoQuePidio(pidio, new Set(), new Set(["cap.reserva", "cap.factura"]));
    expect(lejos.porNecesidad).toHaveLength(pidio.length);
    expect(lejos.leFaltan).toBe(2);
    expect(lejos.cubre).toBe(0);
    // El motivo se puede leer en voz alta sin calificar a nadie.
    expect(lejos.porNecesidad[0].leFalta).toEqual(["cap.reserva"]);
  });

  it("estar lejos no la deja fuera: sigue devolviendo una fila por necesidad", () => {
    const cerca = ajusteConLoQuePidio(pidio, new Set(["cap.reserva", "cap.factura"]), new Set());
    const lejos = ajusteConLoQuePidio(pidio, new Set(), new Set(["cap.reserva", "cap.factura"]));
    expect(lejos.porNecesidad.length).toBe(cerca.porNecesidad.length);
  });

  /** Sin necesidades no hay distancia que medir, y no se inventa ninguna. */
  it("si no pidió nada, no se ordena nada", () => {
    const a = ajusteConLoQuePidio([], new Set(["cap.reserva"]), new Set());
    expect(a.deCuantas).toBe(0);
    expect(a.cubre).toBe(0);
    expect(a.porNecesidad).toEqual([]);
    expect(a.traeAdemas).toEqual(["cap.reserva"]);
  });
});
