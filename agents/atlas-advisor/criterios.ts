import type { Herramienta } from "@/data/esquema";
import { criterioNivelTecnicoRecomendado, criterioTipoNegocioIdeal } from "./criteriosAnalisisAtlas";
import type { Criterio, NivelTecnicoEquipo, PresupuestoMensual } from "./tipos";
import {
  contarPalabrasComunes,
  contieneTexto,
  estimarPrecioMensualEUR,
  nivelCurva,
  nivelTecnicoEnEscala,
  normalizar,
  techoPresupuestoEnEuros,
} from "./utilidades";

/**
 * Cada criterio es una función pura `(herramienta, respuestas) => DetalleCriterio`.
 * Ninguno conoce el id de ninguna herramienta en concreto: solo leen campos
 * del esquema y de las respuestas. Por eso el motor escala a cientos o
 * miles de herramientas sin tocar esta lógica — una herramienta nueva es
 * solo una fila más de datos para las mismas funciones.
 *
 * Convención compartida: si la respuesta necesaria no viene informada, el
 * criterio debe devolver `puntos: 0` y `explicacion: ""` (neutro), nunca
 * penalizar por falta de información del usuario.
 */

const criterioTamanoEmpresa: Criterio = (herramienta, { tamanoEmpresa }) => {
  if (!tamanoEmpresa) {
    return { criterio: "tamanoEmpresa", etiqueta: "Tamaño de empresa", puntos: 0, explicacion: "" };
  }

  const encaja = herramienta.segmentosIdeales.includes(tamanoEmpresa);
  return {
    criterio: "tamanoEmpresa",
    etiqueta: "Tamaño de empresa",
    puntos: encaja ? 12 : -6,
    explicacion: encaja
      ? `Pensada para empresas de tu tamaño (${tamanoEmpresa} empleados).`
      : `No es el tamaño de empresa para el que está pensada principalmente (tu rango: ${tamanoEmpresa} empleados).`,
  };
};

const criterioIndustria: Criterio = (herramienta, { industria }) => {
  if (!industria || industria.trim() === "") {
    return { criterio: "industria", etiqueta: "Sector", puntos: 0, explicacion: "" };
  }

  const coincidenciaDirecta = herramienta.industriasIdeales.some((sector) => contieneTexto(sector, industria));
  if (coincidenciaDirecta) {
    return {
      criterio: "industria",
      etiqueta: "Sector",
      puntos: 8,
      explicacion: `Tiene experiencia con empresas de tu sector (${industria}).`,
    };
  }

  const esGeneralista = herramienta.industriasIdeales.some((sector) => contieneTexto(sector, "generalista"));
  if (esGeneralista) {
    return {
      criterio: "industria",
      etiqueta: "Sector",
      puntos: 3,
      explicacion: "Es una herramienta generalista, válida para cualquier sector.",
    };
  }

  return { criterio: "industria", etiqueta: "Sector", puntos: 0, explicacion: "" };
};

const TECHO_PRESUPUESTO_SIN_DATO = 150;

const criterioPresupuestoYPlanGratuito: Criterio = (herramienta, { presupuesto, requierePlanGratuito }) => {
  let puntos = 0;
  const motivos: string[] = [];

  if (requierePlanGratuito) {
    if (herramienta.tienePlanGratuito) {
      puntos += 10;
      motivos.push("Tiene plan gratuito, tal y como necesitas.");
    } else {
      puntos -= 20;
      motivos.push("No ofrece plan gratuito, y lo marcaste como imprescindible.");
    }
  }

  if (presupuesto) {
    const techo = techoPresupuestoEnEuros(presupuesto);
    const precioEstimado = estimarPrecioMensualEUR(herramienta.precioInicial);

    if (techo === 0 && herramienta.tienePlanGratuito) {
      puntos += 6;
      motivos.push("Puedes empezar sin gastar nada, como buscas.");
    } else if (precioEstimado !== null && techo !== null) {
      if (precioEstimado <= techo) {
        puntos += 8;
        motivos.push(`Su precio de entrada (~${precioEstimado}€/mes) encaja en tu presupuesto.`);
      } else {
        puntos -= 10;
        motivos.push(`Su precio de entrada (~${precioEstimado}€/mes) probablemente supera tu presupuesto.`);
      }
    }
  } else if (!requierePlanGratuito) {
    // Sin presupuesto declarado ni exigencia de gratuidad: usamos un techo
    // razonable solo como señal débil, para no dejar el criterio del todo
    // ciego al precio en el perfil "no he contestado nada".
    const precioEstimado = estimarPrecioMensualEUR(herramienta.precioInicial);
    if (precioEstimado !== null && precioEstimado > TECHO_PRESUPUESTO_SIN_DATO) {
      puntos -= 2;
    }
  }

  return {
    criterio: "presupuesto",
    etiqueta: "Presupuesto",
    puntos,
    explicacion: motivos.join(" "),
  };
};

const PESO_PRIORIDAD_FACILIDAD: Record<"baja" | "media" | "alta", number> = {
  baja: 0.4,
  media: 1,
  alta: 1.8,
};

const criterioFacilidadDeUso: Criterio = (herramienta, { prioridadFacilidadDeUso }) => {
  const peso = PESO_PRIORIDAD_FACILIDAD[prioridadFacilidadDeUso ?? "media"];
  const distanciaDelCentro = herramienta.puntuaciones.facilidadDeUso - 5.5;
  const puntos = Math.round(distanciaDelCentro * peso * 2);

  let explicacion = "";
  if (puntos >= 4) {
    explicacion = `Interfaz muy fácil de usar (${herramienta.puntuaciones.facilidadDeUso}/10).`;
  } else if (puntos <= -4) {
    explicacion = `Interfaz más compleja de lo habitual (${herramienta.puntuaciones.facilidadDeUso}/10).`;
  }

  return { criterio: "facilidadDeUso", etiqueta: "Facilidad de uso", puntos, explicacion };
};

const criterioNivelTecnico: Criterio = (herramienta, { nivelTecnicoEquipo }) => {
  if (!nivelTecnicoEquipo) {
    return { criterio: "nivelTecnico", etiqueta: "Nivel técnico requerido", puntos: 0, explicacion: "" };
  }

  const capacidadEquipo = nivelTecnicoEnEscala(nivelTecnicoEquipo);
  const exigido = herramienta.puntuaciones.nivelTecnicoRequerido;
  const brecha = exigido - capacidadEquipo;

  if (brecha >= 4) {
    return {
      criterio: "nivelTecnico",
      etiqueta: "Nivel técnico requerido",
      puntos: -12,
      explicacion: `Requiere más conocimiento técnico (${exigido}/10) del que tiene tu equipo.`,
    };
  }
  if (brecha >= 1) {
    return {
      criterio: "nivelTecnico",
      etiqueta: "Nivel técnico requerido",
      puntos: -5,
      explicacion: `Puede exigir algo más de conocimiento técnico (${exigido}/10) del que tiene tu equipo hoy.`,
    };
  }
  return {
    criterio: "nivelTecnico",
    etiqueta: "Nivel técnico requerido",
    puntos: 4,
    explicacion: "Tu equipo ya tiene la capacidad técnica necesaria para sacarle partido.",
  };
};

const criterioCurvaDeAprendizaje: Criterio = (herramienta, { toleranciaCurvaAprendizaje }) => {
  if (!toleranciaCurvaAprendizaje) {
    return { criterio: "curvaDeAprendizaje", etiqueta: "Curva de aprendizaje", puntos: 0, explicacion: "" };
  }

  const diferencia = nivelCurva(herramienta.curvaDeAprendizaje) - nivelCurva(toleranciaCurvaAprendizaje);

  if (diferencia <= 0) {
    return {
      criterio: "curvaDeAprendizaje",
      etiqueta: "Curva de aprendizaje",
      puntos: 6,
      explicacion: "Su curva de aprendizaje inicial está dentro de lo que buscas.",
    };
  }
  if (diferencia === 1) {
    return {
      criterio: "curvaDeAprendizaje",
      etiqueta: "Curva de aprendizaje",
      puntos: -6,
      explicacion: "Su curva de aprendizaje inicial es algo más exigente de lo que buscas.",
    };
  }
  return {
    criterio: "curvaDeAprendizaje",
    etiqueta: "Curva de aprendizaje",
    puntos: -14,
    explicacion: "Su curva de aprendizaje inicial es mucho más exigente de lo que buscas.",
  };
};

const PUNTOS_POR_INTEGRACION = 6;
const TOPE_PUNTOS_INTEGRACIONES = 18;

const criterioIntegraciones: Criterio = (herramienta, { integracionesNecesarias }) => {
  if (!integracionesNecesarias || integracionesNecesarias.length === 0) {
    return { criterio: "integraciones", etiqueta: "Integraciones", puntos: 0, explicacion: "" };
  }

  const disponibles = [...herramienta.integraciones, ...herramienta.integracionesPrincipales];
  const encontradas = integracionesNecesarias.filter((necesaria) =>
    disponibles.some((disponible) => contieneTexto(disponible, necesaria) || contieneTexto(necesaria, disponible))
  );

  if (encontradas.length === 0) {
    return {
      criterio: "integraciones",
      etiqueta: "Integraciones",
      puntos: -4,
      explicacion: `No hemos confirmado que se integre con lo que necesitas (${integracionesNecesarias.join(", ")}).`,
    };
  }

  return {
    criterio: "integraciones",
    etiqueta: "Integraciones",
    puntos: Math.min(encontradas.length * PUNTOS_POR_INTEGRACION, TOPE_PUNTOS_INTEGRACIONES),
    explicacion: `Se integra con lo que necesitas: ${encontradas.join(", ")}.`,
  };
};

const criterioIdioma: Criterio = (herramienta, { idiomaNecesario }) => {
  if (!idiomaNecesario || idiomaNecesario.trim() === "") {
    return { criterio: "idioma", etiqueta: "Idioma", puntos: 0, explicacion: "" };
  }

  const textoIdiomas = herramienta.idiomasDisponibles.join(", ");
  if (herramienta.idiomasDisponibles.some((idioma) => contieneTexto(idioma, idiomaNecesario))) {
    return {
      criterio: "idioma",
      etiqueta: "Idioma",
      puntos: 5,
      explicacion: `Disponible en ${idiomaNecesario}.`,
    };
  }

  if (/m[aá]s de \d+ idiomas/.test(normalizar(textoIdiomas))) {
    return {
      criterio: "idioma",
      etiqueta: "Idioma",
      puntos: 2,
      explicacion: `Probablemente disponible en ${idiomaNecesario}, aunque no aparece listado explícitamente.`,
    };
  }

  return {
    criterio: "idioma",
    etiqueta: "Idioma",
    puntos: -5,
    explicacion: `No hemos confirmado que esté disponible en ${idiomaNecesario}.`,
  };
};

/**
 * Palabras clave que, si aparecen en un `casoNoRecomendado`, indican que ese
 * caso describe el perfil estructurado indicado. Es una heurística por
 * palabras clave (no NLP): funciona igual para la herramienta número 5 que
 * para la 5.000, porque compara contra el texto de cada herramienta, no
 * contra su identidad.
 */
const PALABRAS_CLAVE_TAMANO_PEQUENO = ["equipo pequeñ", "equipos pequeñ", "muy pequeñ", "1-2 persona", "freelancer", "autonomo"];
const PALABRAS_CLAVE_TAMANO_GRANDE = ["equipo grande", "equipos grande", "empresa grande", "gran empresa"];
const PALABRAS_CLAVE_SIN_RECURSOS_TECNICOS = [
  "sin recursos tecnicos",
  "sin conocimientos tecnicos",
  "sin equipo tecnico",
  "recursos tecnicos propios",
];
const PALABRAS_CLAVE_PRESUPUESTO_AJUSTADO = ["presupuesto ajustado", "presupuesto limitado", "presupuesto muy ajustado"];

const PUNTOS_POR_CASO_ESTRUCTURADO = -25;
const PUNTOS_POR_CASO_TEXTO_LIBRE = -12;
const TOPE_PENALIZACION_CASOS = -50;
const MINIMO_PALABRAS_COMUNES_TEXTO_LIBRE = 2;

function casoCoincideConPerfilEstructurado(
  casoNormalizado: string,
  tamanoEmpresa: Herramienta["segmentosIdeales"][number] | undefined,
  nivelTecnicoEquipo: NivelTecnicoEquipo | undefined,
  presupuesto: PresupuestoMensual | undefined
): boolean {
  if (
    (tamanoEmpresa === "1-10" || tamanoEmpresa === "11-50") &&
    PALABRAS_CLAVE_TAMANO_PEQUENO.some((palabra) => casoNormalizado.includes(palabra))
  ) {
    return true;
  }
  if (
    (tamanoEmpresa === "51-200" || tamanoEmpresa === "200+") &&
    PALABRAS_CLAVE_TAMANO_GRANDE.some((palabra) => casoNormalizado.includes(palabra))
  ) {
    return true;
  }
  if (
    (nivelTecnicoEquipo === "ninguno" || nivelTecnicoEquipo === "basico") &&
    PALABRAS_CLAVE_SIN_RECURSOS_TECNICOS.some((palabra) => casoNormalizado.includes(palabra))
  ) {
    return true;
  }
  if (
    (presupuesto === "sin_presupuesto" || presupuesto === "ajustado") &&
    PALABRAS_CLAVE_PRESUPUESTO_AJUSTADO.some((palabra) => casoNormalizado.includes(palabra))
  ) {
    return true;
  }
  return false;
}

const criterioCasosNoRecomendados: Criterio = (
  herramienta,
  { tamanoEmpresa, nivelTecnicoEquipo, presupuesto, notasAdicionales }
) => {
  let puntos = 0;
  const motivos: string[] = [];

  for (const caso of herramienta.casosNoRecomendados) {
    const casoNormalizado = normalizar(caso);

    if (casoCoincideConPerfilEstructurado(casoNormalizado, tamanoEmpresa, nivelTecnicoEquipo, presupuesto)) {
      puntos += PUNTOS_POR_CASO_ESTRUCTURADO;
      motivos.push(`Puede no encajar contigo: ${caso}`);
      continue;
    }

    if (
      notasAdicionales &&
      contarPalabrasComunes(caso, notasAdicionales) >= MINIMO_PALABRAS_COMUNES_TEXTO_LIBRE
    ) {
      puntos += PUNTOS_POR_CASO_TEXTO_LIBRE;
      motivos.push(`Puede no encajar con lo que nos has contado: ${caso}`);
    }
  }

  puntos = Math.max(puntos, TOPE_PENALIZACION_CASOS);

  return {
    criterio: "casosNoRecomendados",
    etiqueta: "Casos no recomendados",
    puntos,
    explicacion: motivos.join(" "),
  };
};

const FRASES_METODOLOGIA_NO_CONTRASTADA = ["pendiente de contrastar", "sin contrastar", "sin validar con datos de uso"];

/**
 * No puntúa el catálogo actual de forma distinta (las 5 fichas de hoy
 * comparten metodología), pero deja preparado el criterio para cuando
 * existan herramientas con `metodologiaValoracion` basada en datos de uso
 * reales: esas deben pesar más que una valoración editorial sin contrastar.
 */
const criterioMetodologia: Criterio = (herramienta) => {
  const texto = normalizar(herramienta.metodologiaValoracion);
  const noContrastada = FRASES_METODOLOGIA_NO_CONTRASTADA.some((frase) => texto.includes(frase));

  if (noContrastada) {
    return {
      criterio: "metodologia",
      etiqueta: "Metodología de valoración",
      puntos: -1,
      explicacion: "",
    };
  }

  return {
    criterio: "metodologia",
    etiqueta: "Metodología de valoración",
    puntos: 2,
    explicacion: "Sus puntuaciones están contrastadas con datos de uso reales, no solo con valoración editorial.",
  };
};

/**
 * Lista completa de criterios que evalúa el motor. Añadir un criterio nuevo
 * es escribir la función y añadirla aquí — no requiere tocar el resto del
 * motor ni la forma de los datos.
 */
export const CRITERIOS: Criterio[] = [
  criterioTamanoEmpresa,
  criterioIndustria,
  criterioPresupuestoYPlanGratuito,
  criterioFacilidadDeUso,
  criterioNivelTecnico,
  criterioCurvaDeAprendizaje,
  criterioIntegraciones,
  criterioIdioma,
  criterioCasosNoRecomendados,
  criterioMetodologia,
  criterioNivelTecnicoRecomendado,
  criterioTipoNegocioIdeal,
];
