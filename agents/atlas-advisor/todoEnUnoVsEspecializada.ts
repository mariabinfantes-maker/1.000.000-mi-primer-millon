import type { RespuestasUsuario } from "./tipos";
import { contieneTexto } from "./utilidades";

/**
 * Modelo de comparación: ¿le conviene más a este usuario una plataforma
 * todo en uno (categoriaId "plataformas-todo-en-uno") o una herramienta
 * especializada de una categoría concreta?
 *
 * ACTIVADO — pedido explícitamente por el CEO (2026-08-21) tras revisar la
 * propuesta inicial: se añade una primera pregunta al cuestionario
 * ("¿todo en uno o herramientas especializadas?", ver `Cuestionario.tsx`)
 * cuando la puerta de entrada no fija ya una categoría. Este módulo tiene
 * dos usos, en `motor.ts` y en `criterios.ts` respectivamente:
 *  - Elección EXPLÍCITA (`categoriaId` o `preferenciaSuite`, en ese orden
 *    de prioridad): `seleccionarCandidatas` filtra el catálogo antes de
 *    puntuar, igual que ya hacía con `categoriaId` — es una elección real
 *    del usuario, no una suposición.
 *  - Sin elección explícita ("no tengo preferencia clara" o pregunta no
 *    mostrada): `criterioTipoSuite` usa las señales indirectas de este
 *    módulo como un criterio de PUNTUACIÓN más, nunca como filtro — mismo
 *    principio que el resto del motor ("filtrar solo por elección
 *    explícita, puntuar el resto por señales").
 *
 * El razonamiento, en una frase: una suite todo en uno gana en
 * CONVENIENCIA (una sola suscripción, un solo login, menos integraciones
 * que mantener) a costa de PROFUNDIDAD (cada módulo individual suele
 * quedarse por detrás de un especialista dedicado a esa única función). El
 * modelo no intenta adivinar la mejor herramienta — ya lo hace `motor.ts` —
 * sino decidir qué TIPO de herramienta conviene priorizar.
 */

export type RecomendacionTipoSuite = "todo_en_uno" | "especializada" | "sin_senal_clara";

export type ResultadoComparacionSuite = {
  recomendacion: RecomendacionTipoSuite;
  /** Suma de las señales: positivo favorece todo_en_uno, negativo favorece especializada. Sin rango fijo, solo para ordenar/depurar. */
  puntuacion: number;
  /** Motivos no neutros que explican la puntuación, en el mismo formato que `HerramientaEvaluada.razones` del motor principal. */
  motivos: string[];
};

/** Umbral mínimo (en valor absoluto) para no devolver "sin_senal_clara" cuando las señales indirectas son débiles o se cancelan entre sí. */
const UMBRAL_SENAL_CLARA = 3;

/** Frases sueltas que delatan la intención de consolidar herramientas, buscadas en `notasAdicionales` (texto libre del usuario, puerta "Cuéntanoslo"). */
const FRASES_QUIERE_CONSOLIDAR = [
  "todo en un sitio",
  "todo en una",
  "todo en uno",
  "una sola herramienta",
  "un solo sitio",
  "demasiadas herramientas",
  "muchas suscripciones",
  "muchas herramientas distintas",
  "no quiero varias herramientas",
];

/** Frases que delatan lo contrario: buscar la mejor herramienta posible para UNA función concreta, no un paquete. */
const FRASES_QUIERE_ESPECIALIZADA = [
  "lo mejor en",
  "el mejor",
  "la mejor",
  "especializad",
  "muy completo en",
  "a fondo",
];

function evaluarCategoriaExplicita(categoriaId: string | undefined): ResultadoComparacionSuite | null {
  if (!categoriaId) return null;

  if (categoriaId === "plataformas-todo-en-uno") {
    return {
      recomendacion: "todo_en_uno",
      puntuacion: 100,
      motivos: ["Elegiste explícitamente una plataforma todo en uno."],
    };
  }

  return {
    recomendacion: "especializada",
    puntuacion: -100,
    motivos: ["Elegiste explícitamente una categoría especializada, no una plataforma todo en uno."],
  };
}

/** Segundo nivel de prioridad: la respuesta a la pregunta del cuestionario, cuando no hay `categoriaId` que ya la haga innecesaria. */
function evaluarPreferenciaExplicita(
  preferenciaSuite: "todo_en_uno" | "especializada" | undefined
): ResultadoComparacionSuite | null {
  if (!preferenciaSuite) return null;

  if (preferenciaSuite === "todo_en_uno") {
    return {
      recomendacion: "todo_en_uno",
      puntuacion: 100,
      motivos: ["Nos dijiste que prefieres una plataforma todo en uno."],
    };
  }

  return {
    recomendacion: "especializada",
    puntuacion: -100,
    motivos: ["Nos dijiste que prefieres herramientas especializadas."],
  };
}

/**
 * Señales indirectas cuando el usuario NO eligió categoría de forma
 * explícita (entró por objetivo o por texto libre). Ninguna señal por sí
 * sola es determinante — se suman, igual que en `criterios.ts` — porque
 * ningún dato aislado del cuestionario basta para decidir esto con certeza.
 */
function evaluarSenalesIndirectas(respuestas: RespuestasUsuario): ResultadoComparacionSuite {
  const motivosPositivos: string[] = [];
  const motivosNegativos: string[] = [];
  let puntuacion = 0;

  if (respuestas.tamanoEmpresa === "1-10" || respuestas.tamanoEmpresa === "11-50") {
    puntuacion += 2;
    motivosPositivos.push("Los equipos pequeños suelen salir ganando al consolidar en una única suscripción.");
  } else if (respuestas.tamanoEmpresa === "200+") {
    puntuacion -= 2;
    motivosNegativos.push("Las empresas grandes suelen necesitar la profundidad de una herramienta especializada por área.");
  }

  if (respuestas.presupuesto === "sin_presupuesto" || respuestas.presupuesto === "ajustado") {
    puntuacion += 2;
    motivosPositivos.push("Con presupuesto ajustado, una suite sale más barata que pagar varias herramientas por separado.");
  } else if (respuestas.presupuesto === "alto" || respuestas.presupuesto === "sin_limite") {
    puntuacion -= 1;
    motivosNegativos.push("Con presupuesto holgado, puedes permitirte la mejor herramienta de cada categoría por separado.");
  }

  if (respuestas.nivelTecnicoEquipo === "ninguno" || respuestas.nivelTecnicoEquipo === "basico") {
    puntuacion += 2;
    motivosPositivos.push("Con poca capacidad técnica en el equipo, mantener menos herramientas conectadas entre sí es una ventaja real.");
  } else if (respuestas.nivelTecnicoEquipo === "avanzado") {
    puntuacion -= 1;
    motivosNegativos.push("Con un equipo técnico capaz, integrar varias herramientas especializadas no supone una fricción real.");
  }

  if (respuestas.problemaIdsCandidatos && respuestas.problemaIdsCandidatos.length >= 2) {
    puntuacion += 3;
    motivosPositivos.push("Tu situación apunta a varias necesidades distintas a la vez, justo lo que una suite cubre mejor.");
  }

  if (respuestas.notasAdicionales) {
    if (FRASES_QUIERE_CONSOLIDAR.some((frase) => contieneTexto(respuestas.notasAdicionales!, frase))) {
      puntuacion += 3;
      motivosPositivos.push("Mencionaste explícitamente que prefieres consolidar en un único sitio.");
    }
    if (FRASES_QUIERE_ESPECIALIZADA.some((frase) => contieneTexto(respuestas.notasAdicionales!, frase))) {
      puntuacion -= 3;
      motivosNegativos.push("Mencionaste que buscas la mejor herramienta posible en algo concreto, no un paquete general.");
    }
  }

  const motivos = [...motivosPositivos, ...motivosNegativos];

  if (Math.abs(puntuacion) < UMBRAL_SENAL_CLARA) {
    return { recomendacion: "sin_senal_clara", puntuacion, motivos };
  }

  return { recomendacion: puntuacion > 0 ? "todo_en_uno" : "especializada", puntuacion, motivos };
}

/**
 * Punto de entrada del modelo. Tres niveles de prioridad, de más a menos
 * explícito: `categoriaId` (misma jerarquía que `seleccionarCandidatas` en
 * motor.ts) > `preferenciaSuite` (respuesta directa a la pregunta del
 * cuestionario) > señales indirectas del perfil. En cuanto un nivel más
 * explícito responde, los siguientes ni se evalúan — no hace falta adivinar
 * lo que el usuario ya ha dicho.
 */
export function compararTodoEnUnoVsEspecializada(respuestas: RespuestasUsuario): ResultadoComparacionSuite {
  return (
    evaluarCategoriaExplicita(respuestas.categoriaId) ??
    evaluarPreferenciaExplicita(respuestas.preferenciaSuite) ??
    evaluarSenalesIndirectas(respuestas)
  );
}
