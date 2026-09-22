import { describe, expect, it } from "vitest";
import { getTodasLasHerramientas } from "@/data/repositorio";
import {
  ajusteConLaNecesidad,
  ajusteConLoQuePidio,
  describirElAjuste,
  getNecesidad,
} from "@/data/vocabulario/necesidades";
import type { EstadoDeLaCapacidad, NecesidadDelCaso } from "@/data/vocabulario/necesidades";
import { estadoDelPar } from "../cobertura";
import { getRegistros } from "../repositorio";

/**
 * UN CASO ENTERO, CON DATOS REALES, DE PRINCIPIO A FIN.
 *
 * Lo pidió la propietaria: «ya toca comprobar cómo se traduce todo esto en una
 * ayuda útil», antes de construir otro módulo aislado. Así que esto no añade
 * maquinaria: junta la que hay —el mapa de necesidades y la verificación— y
 * comprueba que lo que sale se le puede enseñar a una persona.
 *
 * Vive en `data/verificacion/__tests__` porque es el único sitio autorizado a
 * leer los dos lados: la guarda del vocabulario lo permite desde aquí, y la de
 * la verificación ignora su propio directorio.
 *
 * EL CASO. Una peluquera que dice: «pierdo citas porque estoy con las manos
 * ocupadas y no cojo el teléfono, y las facturas las hago a mano en una
 * libreta.» De ahí salen DOS necesidades, y las dos son suyas — no se deducen
 * del sector, que es una regla escrita («la necesidad debe salir del
 * diagnóstico, no del sector por defecto»).
 *
 * Y UNA PREGUNTA ADICIONAL, que es lo que se está probando aquí. No sale de
 * los extras de ninguna herramienta —eso dejaría que la suite con más
 * funciones marcase la conversación—: sale de SU caso. «Ausencias y
 * depósitos» ayuda a la necesidad que ella misma trajo, así que se le puede
 * preguntar sin inventar nada.
 */

const HERRAMIENTAS = getTodasLasHerramientas().filter((h) => h.estado === "activo");
const REGISTROS = getRegistros();

/** El puente entre los dos lados: los cuatro estados, tal cual, sin aplanarlos. */
function loQueSabemosDe(herramientaId: string): (capacidadId: string) => EstadoDeLaCapacidad {
  return (capacidadId) =>
    estadoDelPar(
      herramientaId,
      capacidadId,
      REGISTROS.find((r) => r.herramientaId === herramientaId && r.capacidadId === capacidadId)
    );
}

const CITAS = getNecesidad("nec.que-reserven-solos")!;
const FACTURA = getNecesidad("nec.emitir-una-factura-legal")!;

/**
 * Lo que ella trajo. Las dos imprescindibles: las dijo ella y las dos duelen.
 */
const LO_QUE_DIJO: NecesidadDelCaso[] = [
  { necesidad: CITAS, importancia: "imprescindible" },
  { necesidad: FACTURA, importancia: "imprescindible" },
];

/**
 * Y lo mismo después de que conteste «sí, me ayudaría» a la pregunta.
 *
 * Entra como DESEABLE, nunca como requisito. Es la corrección de la
 * propietaria: convertir un «me ayudaría» en imprescindible relegaría a una
 * herramienta que resuelve perfectamente el problema principal.
 */
const TRAS_LA_PREGUNTA: NecesidadDelCaso[] = [
  ...LO_QUE_DIJO,
  { necesidad: getNecesidad("nec.mi-agenda")!, importancia: "deseable", salioDeUnaPregunta: true },
];

describe("el caso de la peluquera, con los datos de hoy", () => {
  it("las que resuelven lo imprescindible salen de los datos, no de una lista escrita a mano", () => {
    const resuelven = HERRAMIENTAS.filter((h) => {
      const a = ajusteConLoQuePidio(LO_QUE_DIJO, loQueSabemosDe(h.id));
      return a.resuelveImprescindibles === a.deImprescindibles;
    });
    // Reserva online la demuestran 8; de ésas, las que además demuestran
    // facturas son cuatro. Si el catálogo o la verificación cambian, cambia.
    expect(resuelven.map((h) => h.nombre).sort()).toEqual(["Agiled", "HoneyBook", "Keap", "Nutshell"]);
  });

  /**
   * LA PRUEBA QUE SOSTIENE LA CORRECCIÓN. Añadir una deseable no puede mover a
   * quien ya resolvía lo imprescindible: se cuenta aparte.
   */
  it("decir que sí a la pregunta no relega a quien resuelve el problema principal", () => {
    for (const h of HERRAMIENTAS) {
      const antes = ajusteConLoQuePidio(LO_QUE_DIJO, loQueSabemosDe(h.id));
      const despues = ajusteConLoQuePidio(TRAS_LA_PREGUNTA, loQueSabemosDe(h.id));
      expect(despues.resuelveImprescindibles).toBe(antes.resuelveImprescindibles);
      expect(despues.deImprescindibles).toBe(antes.deImprescindibles);
    }
  });

  it("la deseable se cuenta aparte y se ve que salió de una pregunta", () => {
    const a = ajusteConLoQuePidio(TRAS_LA_PREGUNTA, loQueSabemosDe("honeybook"));
    expect(a.deImprescindibles).toBe(2);
    expect(a.deDeseables).toBe(1);
    expect(TRAS_LA_PREGUNTA[2].salioDeUnaPregunta).toBe(true);
  });

  /**
   * «Todavía no lo hemos comprobado» frente a «lo hemos buscado y no salió».
   * Con los datos de hoy las dos aparecen de verdad en este mismo caso, que es
   * justo lo que hacía falta para que la corrección no fuese teórica.
   */
  it("las dos clases de «no sabemos» aparecen en este caso, y no dicen lo mismo", () => {
    // Reserva online se le preguntó a 62 de 65: aquí hubo búsqueda.
    const buscada = ajusteConLaNecesidad(CITAS, loQueSabemosDe("zoho-crm"));
    // La agenda por profesional no se le preguntó a nadie: el hueco es nuestro.
    const jamas = ajusteConLaNecesidad(getNecesidad("nec.mi-agenda")!, loQueSabemosDe("zoho-crm"));

    expect(buscada.buscadasSinEncontrar.length).toBeGreaterThan(0);
    expect(buscada.sinPreguntar).toEqual([]);
    expect(jamas.sinPreguntar.length).toBeGreaterThan(0);
    expect(jamas.buscadasSinEncontrar).toEqual([]);

    const frase1 = describirElAjuste(CITAS, buscada);
    const frase2 = describirElAjuste(getNecesidad("nec.mi-agenda")!, jamas);
    expect(frase1).toContain("Hemos buscado");
    expect(frase1).not.toContain("Todavía no hemos comprobado");
    expect(frase2).toContain("Todavía no hemos comprobado");
    expect(frase2).not.toContain("Hemos buscado");
  });

  /**
   * Ni una ni otra pueden penalizar. Comparten estado a propósito: «esa
   * diferencia entre desconocidos no debería convertirse en una penalización».
   */
  it("da igual cuál de los dos desconocidos sea: ninguno ordena", () => {
    const buscada = ajusteConLaNecesidad(CITAS, loQueSabemosDe("zoho-crm"));
    const jamas = ajusteConLaNecesidad(getNecesidad("nec.mi-agenda")!, loQueSabemosDe("zoho-crm"));
    expect(buscada.comoSePresenta).toBe("sin_comprobar");
    expect(jamas.comoSePresenta).toBe("sin_comprobar");
  });

  /** Nadie desaparece: el desplegable las lleva todas. */
  it("las 65 siguen teniendo su fila, resuelvan o no", () => {
    const todas = HERRAMIENTAS.map((h) => ajusteConLoQuePidio(LO_QUE_DIJO, loQueSabemosDe(h.id)));
    expect(todas).toHaveLength(65);
    for (const a of todas) expect(a.porNecesidad).toHaveLength(LO_QUE_DIJO.length);
  });
});
