import { describe, expect, it } from "vitest";
import { crearPuertoDeEvidencia, getPuertoDeEvidencia } from "../consulta";
import { getRegistros } from "../repositorio";
import type { RegistroVerificacion } from "../esquema";

/**
 * El índice de la verificación — F3, bloque 1.
 *
 * Casi todo se ejercita con seis registros inventados: el puerto se construye
 * sobre lo que se le dé, así que probarlo no obliga a cargar los 988 KB del
 * archivo real. Al final hay un grupo aparte que sí los carga, porque un
 * índice que funciona con seis registros y se rompe con 1.544 no sirve.
 */

function registro(
  herramientaId: string,
  capacidadId: string,
  cambios: Partial<RegistroVerificacion> = {}
): RegistroVerificacion {
  return {
    herramientaId,
    capacidadId,
    estado: "verificado",
    profundidad: "nativa",
    planEstado: "desconocido",
    fuentes: [{ tipo: "pagina_oficial", url: "https://ejemplo.test/p", fechaConsulta: "2026-09-03", cita: "x" }],
    confianza: "alta",
    proximaRevision: "2027-02-01",
    ...cambios,
  };
}

const MUESTRA: RegistroVerificacion[] = [
  registro("pipedrive", "cap.sales_pipeline"),
  registro("pipedrive", "cap.app_integrations"),
  registro("pipedrive", "cap.audit_log", { estado: "desconocido", profundidad: undefined, planEstado: undefined }),
  registro("keap", "cap.sales_pipeline"),
  registro("keap", "cap.online_self_service_booking"),
  registro("grammarly", "cap.text_generation", { estado: "desconocido", profundidad: undefined, planEstado: undefined }),
];

describe("el índice de la verificación", () => {
  const puerto = crearPuertoDeEvidencia(MUESTRA);

  it("responde a un par que existe", () => {
    expect(puerto.estadoDe("pipedrive", "cap.sales_pipeline").estado).toBe("demostrada");
  });

  /**
   * No devolver `undefined` es lo que impide que quien llame tenga que
   * inventarse qué significa un hueco. Un par que nadie investigó tiene una
   * respuesta y es «no nos consta».
   */
  it("un par que nadie investigó tiene respuesta, no un hueco", () => {
    const e = puerto.estadoDe("pipedrive", "cap.jamas_preguntada");
    expect(e).toMatchObject({ estado: "no_consta", origen: "sin_registro" });
  });

  it("una herramienta que no está en la verificación tampoco rompe nada", () => {
    expect(puerto.estadoDe("herramienta-inventada", "cap.sales_pipeline").origen).toBe("sin_registro");
    expect(puerto.capacidadesVerificadasDe("herramienta-inventada")).toEqual([]);
  });

  it("dice qué sabe hacer cada herramienta, sólo lo demostrado", () => {
    expect(puerto.capacidadesVerificadasDe("pipedrive")).toEqual(["cap.app_integrations", "cap.sales_pipeline"]);
    expect(puerto.capacidadesVerificadasDe("grammarly")).toEqual([]);
  });

  it("dice quién demuestra cada capacidad, en orden estable", () => {
    expect(puerto.herramientasQueDemuestran("cap.sales_pipeline")).toEqual(["keap", "pipedrive"]);
  });

  /**
   * Vacío significa «ninguna lo demuestra», nunca «ninguna lo hace». El tipo no
   * puede impedir esa lectura; esta prueba deja escrito cuál es la correcta.
   */
  it("una capacidad que nadie demuestra devuelve vacío, no una negación", () => {
    expect(puerto.herramientasQueDemuestran("cap.appointment_scheduling")).toEqual([]);
    expect(puerto.herramientasQueDemuestran("cap.audit_log")).toEqual([]);
  });

  it("el orden no depende de cómo estuviera escrito el archivo", () => {
    const alReves = crearPuertoDeEvidencia([...MUESTRA].reverse());
    expect(alReves.herramientasQueDemuestran("cap.sales_pipeline")).toEqual(
      puerto.herramientasQueDemuestran("cap.sales_pipeline")
    );
    expect(alReves.capacidadesVerificadasDe("pipedrive")).toEqual(puerto.capacidadesVerificadasDe("pipedrive"));
  });

  it("quien recibe una lista no puede alterar el índice modificándola", () => {
    const suyas = puerto.capacidadesVerificadasDe("pipedrive");
    suyas.push("cap.inventada");
    expect(puerto.capacidadesVerificadasDe("pipedrive")).not.toContain("cap.inventada");
  });

  /**
   * Dos registros del mismo par pueden decir cosas distintas. Quedarse con uno
   * en silencio sería afirmar algo que nadie decidió, así que se para.
   */
  it("un par repetido hace fallar la construcción en vez de elegir en silencio", () => {
    expect(() =>
      crearPuertoDeEvidencia([registro("pipedrive", "cap.sales_pipeline"), registro("pipedrive", "cap.sales_pipeline")])
    ).toThrow(/dos registros para pipedrive/);
  });

  it("un puerto vacío responde a todo «no consta»", () => {
    expect(crearPuertoDeEvidencia([]).estadoDe("a", "cap.b").estado).toBe("no_consta");
  });
});

describe("sobre los 1.544 registros reales", () => {
  const registros = getRegistros();
  const puerto = getPuertoDeEvidencia();

  it("se construye una sola vez por proceso", () => {
    expect(getPuertoDeEvidencia()).toBe(puerto);
  });

  /**
   * Los TRES estados, no dos.
   *
   * Este mapeo decía antes «verificado → demostrada, lo demás → no consta», que
   * es exactamente la lectura que causó el bloqueante del 2026-09-10. Pasaba
   * porque hoy no hay ni un `no_disponible`, y habría fallado en cuanto entrara
   * el primero —señalando como discrepancia el comportamiento correcto—. Una
   * prueba que le pone una trampa a quien traiga el primer «no» es peor que no
   * tenerla.
   */
  const esperado = (r: RegistroVerificacion) =>
    r.estado !== "verificado" ? "no_consta" : r.profundidad === "no_disponible" ? "ausencia_demostrada" : "demostrada";

  it("responde lo mismo que dice cada registro, uno a uno", () => {
    const discrepan = registros.filter(
      (r) => puerto.estadoDe(r.herramientaId, r.capacidadId).estado !== esperado(r)
    );
    expect(discrepan.map((r) => `${r.herramientaId}/${r.capacidadId}`)).toEqual([]);
  });

  it("y el mapeo contempla el estado que hoy no tiene ningún registro", () => {
    const ausente = registro("beautiful-ai", "cap.project_planning", { profundidad: "no_disponible" });
    expect(esperado(ausente)).toBe("ausencia_demostrada");
    expect(crearPuertoDeEvidencia([ausente]).estadoDe("beautiful-ai", "cap.project_planning").estado).toBe(
      esperado(ausente)
    );
    // Y los otros dos siguen donde estaban.
    expect(esperado(registro("a", "cap.b"))).toBe("demostrada");
    expect(esperado(registro("a", "cap.b", { estado: "desconocido", profundidad: undefined }))).toBe("no_consta");
  });

  it("las cuentas cuadran con lo que cerró F2", () => {
    expect(registros.length).toBe(1544);
    const verificados = registros.filter((r) => puerto.estadoDe(r.herramientaId, r.capacidadId).estado === "demostrada");
    expect(verificados.length).toBe(659);
  });

  it("las 62 herramientas tienen al menos una capacidad demostrada", () => {
    const herramientas = [...new Set(registros.map((r) => r.herramientaId))];
    expect(herramientas.length).toBe(62);
    expect(herramientas.filter((id) => puerto.capacidadesVerificadasDe(id).length === 0)).toEqual([]);
  });

  /**
   * El separador de la clave no puede aparecer dentro de un identificador: si
   * apareciera, dos pares distintos podrían compartir clave y uno taparía al
   * otro sin que nada fallara.
   */
  it("ningún identificador contiene el separador de la clave", () => {
    expect(registros.filter((r) => r.herramientaId.includes("|") || r.capacidadId.includes("|"))).toEqual([]);
  });

  it("ningún plan se nombra sin estar demostrado", () => {
    const colados = registros
      .map((r) => puerto.estadoDe(r.herramientaId, r.capacidadId))
      .filter((e) => e.plan.nombre !== undefined && e.plan.certeza !== "verificado");
    expect(colados).toEqual([]);
  });
});
