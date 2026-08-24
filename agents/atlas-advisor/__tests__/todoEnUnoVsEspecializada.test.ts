import { describe, expect, it } from "vitest";
import { compararTodoEnUnoVsEspecializada } from "../todoEnUnoVsEspecializada";
import type { RespuestasUsuario } from "../tipos";

describe("compararTodoEnUnoVsEspecializada", () => {
  it("recomienda todo_en_uno cuando el usuario elige explícitamente esa categoría", () => {
    const resultado = compararTodoEnUnoVsEspecializada({ categoriaId: "plataformas-todo-en-uno" });

    expect(resultado.recomendacion).toBe("todo_en_uno");
    expect(resultado.puntuacion).toBeGreaterThan(0);
    expect(resultado.motivos.length).toBeGreaterThan(0);
  });

  it("recomienda especializada cuando el usuario elige explícitamente otra categoría, sin mirar el resto de señales", () => {
    const respuestas: RespuestasUsuario = {
      categoriaId: "crm",
      // Señales que, sin categoriaId, apuntarían a todo_en_uno — deben ignorarse: la elección explícita manda.
      tamanoEmpresa: "1-10",
      presupuesto: "ajustado",
      nivelTecnicoEquipo: "ninguno",
    };

    const resultado = compararTodoEnUnoVsEspecializada(respuestas);

    expect(resultado.recomendacion).toBe("especializada");
    expect(resultado.puntuacion).toBeLessThan(0);
  });

  it("recomienda todo_en_uno por señales indirectas: equipo pequeño, presupuesto ajustado y poca capacidad técnica", () => {
    const resultado = compararTodoEnUnoVsEspecializada({
      tamanoEmpresa: "1-10",
      presupuesto: "ajustado",
      nivelTecnicoEquipo: "ninguno",
    });

    expect(resultado.recomendacion).toBe("todo_en_uno");
    expect(resultado.puntuacion).toBeGreaterThan(0);
  });

  it("recomienda especializada por señales indirectas: empresa grande, presupuesto alto y equipo técnico avanzado", () => {
    const resultado = compararTodoEnUnoVsEspecializada({
      tamanoEmpresa: "200+",
      presupuesto: "alto",
      nivelTecnicoEquipo: "avanzado",
    });

    expect(resultado.recomendacion).toBe("especializada");
    expect(resultado.puntuacion).toBeLessThan(0);
  });

  it("detecta varios problemas candidatos como señal de necesidad amplia (todo_en_uno)", () => {
    const resultado = compararTodoEnUnoVsEspecializada({
      problemaIdsCandidatos: ["conseguir-clientes", "organizar-empresa"],
    });

    expect(resultado.recomendacion).toBe("todo_en_uno");
    expect(resultado.motivos.some((m) => m.includes("varias necesidades"))).toBe(true);
  });

  it('lee "quiero consolidar" en notasAdicionales como señal de todo_en_uno', () => {
    const resultado = compararTodoEnUnoVsEspecializada({
      notasAdicionales: "Estamos usando demasiadas herramientas distintas y quiero simplificar.",
    });

    expect(resultado.recomendacion).toBe("todo_en_uno");
  });

  it('lee "quiero lo mejor en X" en notasAdicionales como señal de especializada', () => {
    const resultado = compararTodoEnUnoVsEspecializada({
      notasAdicionales: "Quiero lo mejor en gestión de proyectos, aunque tenga que pagar por separado.",
    });

    expect(resultado.recomendacion).toBe("especializada");
  });

  it("devuelve sin_senal_clara cuando no hay categoría explícita ni señales suficientes", () => {
    const resultado = compararTodoEnUnoVsEspecializada({});

    expect(resultado.recomendacion).toBe("sin_senal_clara");
    expect(resultado.motivos).toEqual([]);
  });

  it("devuelve sin_senal_clara cuando las señales indirectas se cancelan entre sí", () => {
    // Equipo pequeño (+2) pero presupuesto alto (-1) y sin más señales: |1| < UMBRAL_SENAL_CLARA (3).
    const resultado = compararTodoEnUnoVsEspecializada({
      tamanoEmpresa: "1-10",
      presupuesto: "alto",
    });

    expect(resultado.recomendacion).toBe("sin_senal_clara");
  });

  it("nunca penaliza por falta de información: respuestas vacías no dan motivos negativos", () => {
    const resultado = compararTodoEnUnoVsEspecializada({ notasAdicionales: "" });

    expect(resultado.motivos).toEqual([]);
    expect(resultado.recomendacion).toBe("sin_senal_clara");
  });

  it('respeta preferenciaSuite "todo_en_uno" cuando no hay categoriaId', () => {
    const resultado = compararTodoEnUnoVsEspecializada({ preferenciaSuite: "todo_en_uno" });

    expect(resultado.recomendacion).toBe("todo_en_uno");
    expect(resultado.puntuacion).toBeGreaterThan(0);
  });

  it('respeta preferenciaSuite "especializada" cuando no hay categoriaId, ignorando señales indirectas contrarias', () => {
    const resultado = compararTodoEnUnoVsEspecializada({
      preferenciaSuite: "especializada",
      // Señales que, por sí solas, apuntarían a todo_en_uno — deben ignorarse: la preferencia explícita manda.
      tamanoEmpresa: "1-10",
      presupuesto: "ajustado",
      nivelTecnicoEquipo: "ninguno",
    });

    expect(resultado.recomendacion).toBe("especializada");
    expect(resultado.puntuacion).toBeLessThan(0);
  });

  it("categoriaId explícito manda incluso sobre preferenciaSuite si llegan los dos a la vez", () => {
    const resultado = compararTodoEnUnoVsEspecializada({
      categoriaId: "crm",
      preferenciaSuite: "todo_en_uno",
    });

    expect(resultado.recomendacion).toBe("especializada");
  });
});
