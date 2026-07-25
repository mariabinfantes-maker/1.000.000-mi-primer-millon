import type { Herramienta } from "@/data/esquema";
import { CAMPOS_INVESTIGABLES_OBLIGATORIOS } from "./camposEsquema";
import type { HerramientaPropuesta, NivelConfianza, SolicitudInvestigacion } from "./tipos";

/**
 * Convierte lo que sea que haya devuelto un proveedor de IA en una
 * `HerramientaPropuesta` segura de manejar. Nunca lanza: una respuesta rara
 * (texto plano, JSON con otra forma, campos vacíos...) se convierte en una
 * propuesta con advertencias y confianza baja, no en una excepción — quien
 * llame a `investigarHerramienta` siempre recibe algo con lo que trabajar.
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

  const fuentes =
    raiz && Array.isArray(raiz.fuentes) ? raiz.fuentes.filter((f): f is string => typeof f === "string") : [];

  if (fuentes.length === 0) {
    advertencias.push("La propuesta no cita ninguna fuente: revisar los datos manualmente antes de publicarlos.");
  }

  const camposFaltantes = CAMPOS_INVESTIGABLES_OBLIGATORIOS.filter((campo) => campoEstaVacio(datos[campo]));

  return {
    datos,
    camposFaltantes,
    fuentes,
    confianza: calcularConfianza(camposFaltantes.length, fuentes.length),
    advertencias,
  };
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
