import { describe, expect, it } from "vitest";
import { POST } from "../route";

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
