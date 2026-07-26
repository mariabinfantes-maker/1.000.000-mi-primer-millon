import type { Herramienta } from "@/data/esquema";
import type { AffiliateData } from "@/data/esquemaInterno";
import { calcularPuntuacionAtlas } from "@/lib/puntuacionAtlas";
import { CAMPOS_INVESTIGABLES_OBLIGATORIOS } from "./camposEsquema";
import type { HerramientaPropuesta, NivelConfianza, SolicitudInvestigacion } from "./tipos";

/**
 * Convierte lo que sea que haya devuelto un proveedor de IA en una
 * `HerramientaPropuesta` segura de manejar. Nunca lanza: una respuesta rara
 * (texto plano, JSON con otra forma, campos vacíos...) se convierte en una
 * propuesta con advertencias y confianza baja, no en una excepción — quien
 * llame a `investigarHerramienta` siempre recibe algo con lo que trabajar.
 *
 * Extrae `datos` (público) y `affiliateData` (interno) de dos claves
 * separadas de la respuesta y las mantiene separadas en todo momento — ver
 * el comentario de `HerramientaPropuesta` en tipos.ts.
 *
 * No depende de ningún proveedor concreto ni hace llamadas de red: se
 * puede probar por completo con JSON de ejemplo escrito a mano.
 */
export function validarPropuesta(datosCrudos: unknown, solicitud: SolicitudInvestigacion): HerramientaPropuesta {
  const advertencias: string[] = [];

  const raiz =
    typeof datosCrudos === "object" && datosCrudos !== null ? (datosCrudos as Record<string, unknown>) : null;

  if (!raiz) {
    advertencias.push("El proveedor de IA no devolvió un objeto JSON; se ha descartado la respuesta.");
  }

  const datos: Partial<Herramienta> =
    raiz && typeof raiz.datos === "object" && raiz.datos !== null ? { ...(raiz.datos as Partial<Herramienta>) } : {};

  if (raiz && !raiz.datos) {
    advertencias.push('La respuesta no incluía la clave "datos"; se trata como una propuesta vacía.');
  }

  if (!datos.nombre) {
    datos.nombre = solicitud.nombreHerramienta;
  }

  const datosAfiliados: Partial<AffiliateData> =
    raiz && typeof raiz.affiliateData === "object" && raiz.affiliateData !== null
      ? { ...(raiz.affiliateData as Partial<AffiliateData>) }
      : {};

  // lastAffiliateCheck lo estampa Atlas, no lo investiga la IA (ver el
  // comentario en AffiliateData, data/esquemaInterno.ts) — se sustituye
  // siempre por la fecha real de esta comprobación, nunca por lo que haya
  // podido devolver el proveedor.
  datosAfiliados.lastAffiliateCheck = new Date().toISOString().slice(0, 10);

  const fuentes =
    raiz && Array.isArray(raiz.fuentes) ? raiz.fuentes.filter((f): f is string => typeof f === "string") : [];

  if (fuentes.length === 0) {
    advertencias.push("La propuesta no cita ninguna fuente: revisar los datos manualmente antes de publicarlos.");
  }

  const camposFaltantes = CAMPOS_INVESTIGABLES_OBLIGATORIOS.filter((campo) => campoEstaVacio(datos[campo]));

  advertencias.push(...advertenciasAffiliateData(datosAfiliados));
  advertencias.push(...advertenciasAnalisisAtlas(datos.analisisAtlas));

  // La puntuación Atlas nunca la rellena el proveedor de IA (ver el
  // comentario en `AnalisisAtlas` en data/esquema.ts): se calcula aquí, a
  // partir de los datos ya investigados, y sustituye a lo que el proveedor
  // haya podido devolver en esas dos claves — nunca nos fiamos de un
  // "puntuacion"/"motivosPuntuacion" inventado por la IA.
  const resultadoPuntuacion = calcularPuntuacionAtlas(datos);
  if (resultadoPuntuacion) {
    datos.analisisAtlas = {
      ...datos.analisisAtlas,
      puntuacion: resultadoPuntuacion.puntuacion,
      motivosPuntuacion: resultadoPuntuacion.motivos,
    };
  }

  return {
    datos,
    datosAfiliados,
    camposFaltantes,
    fuentes,
    confianza: calcularConfianza(camposFaltantes.length, fuentes.length),
    advertencias,
  };
}

/**
 * Comprobación específica de `affiliateData`: solo tiene sentido pedir los
 * subcampos de un programa de afiliados cuando sí existe uno que
 * investigar. Vive en el validador (no en `agente.ts`, que solo aplica la
 * regla de aceptar/descartar) para que se pueda probar con JSON de
 * ejemplo, igual que el resto de comprobaciones de esta función.
 */
function advertenciasAffiliateData(datosAfiliados: Partial<AffiliateData>): string[] {
  if (datosAfiliados.hasAffiliateProgram !== true) {
    return [];
  }

  const advertencias: string[] = [];
  const subcamposEsperados: (keyof AffiliateData)[] = [
    "affiliateUrl",
    "affiliatePlatform",
    "commission",
    "approvalRequired",
    "affiliateStatus",
    "confidenceLevel",
    "source",
  ];

  const faltantes = subcamposEsperados.filter((campo) => campoEstaVacio(datosAfiliados[campo]));
  if (faltantes.length > 0) {
    advertencias.push(`AffiliateData está incompleto: falta ${faltantes.join(", ")}. Revisar antes de publicar.`);
  }

  if (datosAfiliados.confidenceLevel === "low") {
    advertencias.push("La confianza declarada para AffiliateData es baja: conviene verificarlo a mano.");
  }

  return advertencias;
}

/**
 * Comprobación específica de `analisisAtlas`: al igual que `affiliateData`,
 * es un objeto anidado que la comprobación genérica de "campos faltantes"
 * de primer nivel no cubre bien — y en este caso, ni siquiera podría:
 * `analisisAtlas` siempre acaba con una `puntuacion` calculada (ver más
 * arriba), así que nunca aparecería "vacío" del todo. Esta función es la
 * que de verdad comprueba si el proveedor de IA investigó su parte
 * (competidores, tipo de negocio ideal, nivel técnico recomendado), no la
 * parte que calcula Atlas.
 */
function advertenciasAnalisisAtlas(analisisAtlas: Herramienta["analisisAtlas"] | undefined): string[] {
  if (!analisisAtlas) return [];

  const subcamposInvestigables: (keyof NonNullable<Herramienta["analisisAtlas"]>)[] = [
    "competidoresDirectos",
    "tipoNegocioIdeal",
    "nivelTecnicoRecomendado",
  ];

  const faltantes = subcamposInvestigables.filter((campo) => campoEstaVacio(analisisAtlas[campo]));
  if (faltantes.length === 0) return [];

  return [`El análisis de Atlas está incompleto: falta ${faltantes.join(", ")}.`];
}

function campoEstaVacio(valor: unknown): boolean {
  if (Array.isArray(valor)) return valor.length === 0;
  if (typeof valor === "string") return valor.trim() === "";
  return valor === undefined || valor === null;
}

function calcularConfianza(numeroCamposFaltantes: number, numeroFuentes: number): NivelConfianza {
  if (numeroFuentes === 0) return "baja";
  if (numeroCamposFaltantes === 0) return "alta";
  if (numeroCamposFaltantes <= 3) return "media";
  return "baja";
}
