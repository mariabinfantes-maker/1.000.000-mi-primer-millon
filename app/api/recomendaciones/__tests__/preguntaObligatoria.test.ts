import { describe, expect, it } from "vitest";
import { POST } from "../route";
import { leerTokenResultado } from "@/lib/resultadoToken";

/**
 * La pregunta de aclaración es obligatoria en la entrada por objetivo —
 * opción B, 2026-09-16. El cuestionario ya no deja avanzar sin contestarla,
 * pero eso vive en el navegador: aquí se comprueba que la ruta tampoco lo
 * permite, porque en la revisión previa a fusionar se confirmó que una
 * petición «objetivo» sin necesidad elegida devolvía un enlace con las
 * recomendaciones genéricas por etiqueta, que es lo que la pregunta existe
 * para impedir.
 */

function peticion(cuerpo: unknown): Request {
  return new Request("http://localhost/api/recomendaciones", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
}

const perfil = { problemaIdsCandidatos: ["ahorrar-tiempo"], tamanoEmpresa: "1-10", presupuesto: "ajustado" };

describe("la entrada por objetivo no puede saltarse la pregunta", () => {
  it("sin necesidad elegida se rechaza, sin token y sin recomendaciones genéricas", async () => {
    const respuesta = await POST(peticion({ origenTipo: "objetivo", origenId: "ahorrar-tiempo", respuestas: perfil }));
    expect(respuesta.status).toBe(400);
    const cuerpo = await respuesta.json();
    expect(cuerpo.token).toBeUndefined();
    expect(cuerpo.error).toMatch(/necesidad elegida/);
  });

  it("una necesidad de otro objetivo tampoco vale", async () => {
    const respuesta = await POST(
      peticion({ origenTipo: "objetivo", origenId: "ahorrar-tiempo", respuestas: { ...perfil, necesidadElegida: "tickets" } })
    );
    expect(respuesta.status).toBe(400);
    expect((await respuesta.json()).token).toBeUndefined();
  });

  it("con una necesidad del objetivo, devuelve un enlace que la lleva escrita", async () => {
    const respuesta = await POST(
      peticion({ origenTipo: "objetivo", origenId: "ahorrar-tiempo", respuestas: { ...perfil, necesidadElegida: "citas-reserva" } })
    );
    expect(respuesta.status).toBe(200);
    const cuerpo = await respuesta.json();
    expect(typeof cuerpo.token).toBe("string");
    expect(cuerpo.totalEvaluadas).toBeGreaterThan(0);

    // El enlace lleva la necesidad y, por herramienta, la evidencia con su
    // fuente: es lo que la tarjeta enseña y enlaza. Y sigue cabiendo en una URL.
    const payload = leerTokenResultado(cuerpo.token)!;
    expect(payload.necesidad).toBe("citas-reserva");
    for (const item of payload.items) {
      expect(item.evidencia?.tipo, item.id).toBe("confirmada");
      if (item.evidencia?.tipo === "confirmada") expect(item.evidencia.fuente?.url).toMatch(/^https:\/\//);
    }
    expect(cuerpo.token.length).toBeLessThan(2000);
  });

  it("una necesidad con uso sin confirmar lo lleva en el enlace; una sin él, no", async () => {
    const con = await POST(
      peticion({ origenTipo: "objetivo", origenId: "ahorrar-tiempo", respuestas: { ...perfil, necesidadElegida: "servicio-reserva" } })
    );
    const payloadCon = leerTokenResultado((await con.json()).token)!;
    expect(payloadCon.necesidad).toBe("servicio-reserva");
    expect(payloadCon.usoSinConfirmar).toBe("servicios-reserva");

    const sin = await POST(
      peticion({ origenTipo: "objetivo", origenId: "ahorrar-tiempo", respuestas: { ...perfil, necesidadElegida: "citas-reserva" } })
    );
    const payloadSin = leerTokenResultado((await sin.json()).token)!;
    expect(payloadSin.usoSinConfirmar).toBeUndefined();
    // Mismas herramientas en los dos enlaces: la regla no cambia el filtro.
    expect(payloadCon.items.map((i) => i.id)).toEqual(payloadSin.items.map((i) => i.id));
  });

  it("«ninguna de éstas» no es un salto: devuelve el motivo, no un enlace", async () => {
    const respuesta = await POST(
      peticion({ origenTipo: "objetivo", origenId: "ahorrar-tiempo", respuestas: { ...perfil, necesidadElegida: "ninguna" } })
    );
    expect(respuesta.status).toBe(200);
    const cuerpo = await respuesta.json();
    expect(cuerpo.token).toBeUndefined();
    expect(cuerpo.sinRecomendacion?.tipo).toBe("ninguna_de_estas");
  });

  it("por categoría no hay pregunta y nada cambia", async () => {
    const respuesta = await POST(
      peticion({ origenTipo: "categoria", origenId: "crm", respuestas: { categoriaId: "crm", tamanoEmpresa: "1-10" } })
    );
    expect(respuesta.status).toBe(200);
    expect(typeof (await respuesta.json()).token).toBe("string");
  });
});

/**
 * Entrada libre (decisión del 2026-09-16): primero se interpreta el texto;
 * si sólo da un objetivo amplio, se pide aclarar la necesidad; y sólo
 * después se recomienda. Si no se entiende, no salen herramientas genéricas.
 */
describe("la entrada libre llega al mismo filtro", () => {
  const TEXTO_QUE_DA_OBJETIVO = "Pierdo mucho tiempo en tareas repetitivas";
  const TEXTO_SIN_OBJETIVO = "Soy peluquera y pierdo citas";

  it("un texto que da un objetivo pide aclaración y no devuelve enlace", async () => {
    const respuesta = await POST(
      peticion({ origenTipo: "libre", origenId: "libre", respuestas: { notasAdicionales: TEXTO_QUE_DA_OBJETIVO, tamanoEmpresa: "1-10" } })
    );
    expect(respuesta.status).toBe(200);
    const cuerpo = await respuesta.json();
    expect(cuerpo.token).toBeUndefined();
    expect(cuerpo.aclaracion.objetivos.map((o: { id: string }) => o.id)).toEqual(["automatizar-tareas"]);
    expect(cuerpo.aclaracion.objetivos[0].titulo).toEqual(expect.any(String));
  });

  it("con el objetivo aclarado y la necesidad elegida, recomienda por evidencia", async () => {
    const respuesta = await POST(
      peticion({
        origenTipo: "libre",
        origenId: "libre",
        respuestas: {
          notasAdicionales: TEXTO_QUE_DA_OBJETIVO,
          tamanoEmpresa: "1-10",
          problemaIdsCandidatos: ["automatizar-tareas"],
          necesidadElegida: "encadenar-acciones",
        },
      })
    );
    expect(respuesta.status).toBe(200);
    expect(typeof (await respuesta.json()).token).toBe("string");
  });

  it("con el objetivo aclarado pero sin necesidad, se rechaza: nunca las genéricas", async () => {
    const respuesta = await POST(
      peticion({
        origenTipo: "libre",
        origenId: "libre",
        respuestas: { notasAdicionales: TEXTO_QUE_DA_OBJETIVO, tamanoEmpresa: "1-10", problemaIdsCandidatos: ["automatizar-tareas"] },
      })
    );
    expect(respuesta.status).toBe(400);
    expect((await respuesta.json()).token).toBeUndefined();
  });

  it("un texto que no da objetivo acaba en «no lo he entendido», sin enlace", async () => {
    const respuesta = await POST(
      peticion({ origenTipo: "libre", origenId: "libre", respuestas: { notasAdicionales: TEXTO_SIN_OBJETIVO, tamanoEmpresa: "1-10" } })
    );
    expect(respuesta.status).toBe(200);
    const cuerpo = await respuesta.json();
    expect(cuerpo.token).toBeUndefined();
    expect(cuerpo.aclaracion).toBeUndefined();
    expect(cuerpo.sinRecomendacion?.tipo).toBe("necesidad_no_entendida");
  });
});
