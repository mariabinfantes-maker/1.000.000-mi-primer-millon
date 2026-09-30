import { describe, expect, it } from "vitest";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { getCapacidades, getVocabulario } from "@/data/vocabulario/repositorio";
import {
  coberturaDeCapacidad,
  coberturaDeDominio,
  estadoDelPar,
  huecosPorInvestigar,
  mapaDeCobertura,
} from "../cobertura";
import { getRegistros } from "../repositorio";
import type { RegistroVerificacion } from "../esquema";

/**
 * EL INFORME TIENE QUE DISTINGUIR UN CERO DE OTRO.
 *
 * El 2026-09-22 se presentaron a la propietaria cinco capacidades «a cero»
 * —TPV, contabilidad, impuestos, publicar en redes, firma electrónica— como si
 * fueran huecos del catálogo. Las cinco estaban a cero demostradas, cero
 * desconocidas y 65 de 65 SIN PREGUNTAR. No sabíamos que no las hacía nadie:
 * sabíamos que no lo habíamos preguntado. Lo cazó ella.
 *
 * Estas pruebas existen para que esa diferencia deje de depender de quién mire
 * la tabla. Y para sostener la única otra cosa que puede romper el informe: que
 * cuente como «lo hace» un registro que demuestra lo contrario.
 */

const HERRAMIENTAS = getTodasLasHerramientas().map((h) => h.id);
const REGISTROS = getRegistros();

const FUENTE = [{ tipo: "pagina_oficial" as const, url: "https://ejemplo.test/p", fechaConsulta: "2026-09-10", cita: "x" }];

function registro(parcial: Partial<RegistroVerificacion>): RegistroVerificacion {
  return {
    herramientaId: "h1",
    capacidadId: "cap.inventada",
    estado: "verificado",
    profundidad: "completa",
    fuentes: FUENTE,
    confianza: "alta",
    proximaRevision: "2027-09-10",
    ...parcial,
  } as RegistroVerificacion;
}

describe("los cuatro estados, y por qué no son dos", () => {
  it("sin registro es «sin preguntar», no «no lo hace»", () => {
    expect(estadoDelPar("h1", "cap.inventada", undefined)).toBe("sinPreguntar");
  });

  it("preguntado sin demostrar es «desconocida», que no es lo mismo", () => {
    const r = registro({ estado: "desconocido", profundidad: undefined });
    expect(estadoDelPar("h1", "cap.inventada", r)).toBe("desconocida");
  });

  it("verificado y disponible es «demostrada»", () => {
    expect(estadoDelPar("h1", "cap.inventada", registro({}))).toBe("demostrada");
  });

  /**
   * El bloqueante del 2026-09-10, en versión informe. `estado: "verificado"`
   * con `profundidad: "no_disponible"` es evidencia de que NO lo hace. Contarlo
   * como demostrado inflaría la cobertura con lo contrario de lo que dice el
   * dato, y mandaría a investigar lo que ya está contestado.
   */
  it("verificado con «no_disponible» es «descartada», nunca «demostrada»", () => {
    const r = registro({ profundidad: "no_disponible" });
    expect(estadoDelPar("h1", "cap.inventada", r)).toBe("descartada");
  });
});

describe("una capacidad que nadie demuestra", () => {
  it("cuenta las 65 sin preguntar en vez de enseñar un hueco vacío", () => {
    const c = coberturaDeCapacidad("cap.inventada", HERRAMIENTAS, []);
    expect(c.demuestran).toEqual([]);
    expect(c.desconocidas).toEqual([]);
    expect(c.sinPreguntar).toBe(HERRAMIENTAS.length);
  });

  /**
   * La distinción que da todo el valor: los dos casos enseñan «0 la demuestran»
   * y significan cosas opuestas. En el primero falta trabajo nuestro; en el
   * segundo el trabajo está hecho y la respuesta fue que no.
   */
  it("distingue «no lo hemos preguntado» de «lo preguntamos y no está»", () => {
    const nadieLaHace = coberturaDeCapacidad("cap.inventada", ["h1", "h2"], [
      registro({ herramientaId: "h1", profundidad: "no_disponible" }),
      registro({ herramientaId: "h2", profundidad: "no_disponible" }),
    ]);
    const nadieLaMiro = coberturaDeCapacidad("cap.inventada", ["h1", "h2"], []);

    expect(nadieLaHace.demuestran.length).toBe(nadieLaMiro.demuestran.length);
    expect(nadieLaHace.descartan).toEqual(["h1", "h2"]);
    expect(nadieLaHace.sinPreguntar).toBe(0);
    expect(nadieLaMiro.sinPreguntar).toBe(2);
  });

  it("no cuenta como preguntada a una herramienta fuera del universo medido", () => {
    const c = coberturaDeCapacidad("cap.inventada", ["h1"], [registro({ herramientaId: "otra" })]);
    expect(c.demuestran).toEqual([]);
    expect(c.sinPreguntar).toBe(1);
  });
});

describe("el dominio", () => {
  it("separa «nadie la demuestra» de «a nadie se le preguntó»", () => {
    const dominioId = getVocabulario().dominios[0].id;
    const d = coberturaDeDominio(dominioId, HERRAMIENTAS, []);
    expect(d.capacidades.length).toBeGreaterThan(0);
    expect(d.sinNingunaHerramienta).toBe(d.capacidades.length);
    expect(d.jamasPreguntadas).toBe(d.capacidades.length);
  });
});

describe("el mapa sobre los datos reales", () => {
  const mapa = mapaDeCobertura(HERRAMIENTAS);

  it("no pierde ninguna capacidad activa por el camino", () => {
    const enElMapa = mapa.areas.flatMap((a) => a.dominios).flatMap((d) => d.capacidades).length;
    expect(enElMapa).toBe(mapa.totalCapacidades);
    expect(mapa.totalCapacidades).toBe(getCapacidades().filter((c) => c.estado === "activa").length);
  });

  it("las cuatro cuentas suman los pares posibles", () => {
    const capacidades = mapa.areas.flatMap((a) => a.dominios).flatMap((d) => d.capacidades);
    const suma = capacidades.reduce(
      (t, c) => t + c.demuestran.length + c.descartan.length + c.desconocidas.length + c.sinPreguntar,
      0
    );
    expect(suma).toBe(mapa.paresPosibles);
    expect(mapa.paresPreguntados + mapa.paresJamasPreguntados).toBe(mapa.paresPosibles);
  });

  /**
   * El titular del informe. Mientras esto se cumpla, ningún recuento de «cuántas
   * cubre» puede leerse como una medida de la herramienta: mide cuánto hemos
   * mirado nosotros. Si algún día deja de fallar, será porque el pasillo está
   * andado, no porque la regla haya cambiado.
   */
  it("hoy la mayor parte de la matriz sigue sin preguntarse", () => {
    expect(mapa.paresJamasPreguntados).toBeGreaterThan(mapa.paresPreguntados);
  });

  it("el recuento de demostrados no se saca por su cuenta del fichero", () => {
    const verificadosEnBruto = REGISTROS.filter((r) => r.estado === "verificado").length;
    expect(mapa.paresDemostrados).toBeLessThanOrEqual(verificadosEnBruto);
  });
});

describe("los huecos por investigar", () => {
  const huecos = huecosPorInvestigar(HERRAMIENTAS);

  it("sólo lista lo que nadie demuestra", () => {
    expect(huecos.every((h) => h.demuestran.length === 0)).toBe(true);
  });

  it("pone delante lo que más barato sale cerrar: lo que ni se preguntó", () => {
    const orden = huecos.map((h) => h.sinPreguntar);
    expect([...orden].sort((a, b) => b - a)).toEqual(orden);
  });
});
