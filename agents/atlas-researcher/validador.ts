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

  advertencias.push(...advertenciasProgramaAfiliados(datos.programaAfiliados));

  return {
    datos,
    camposFaltantes,
    fuentes,
    confianza: calcularConfianza(camposFaltantes.length, fuentes.length),
    advertencias,
  };
}

/**
 * Comprobación específica de `programaAfiliados`: es un objeto anidado, así
 * que `camposFaltantes` (que solo mira campos de primer nivel) no detecta
 * si falta, por ejemplo, `tipoComision`. Solo tiene sentido pedir estos
 * subcampos cuando sí existe un programa de afiliados que investigar.
 */
function advertenciasProgramaAfiliados(programaAfiliados: Herramienta["programaAfiliados"] | undefined): string[] {
  if (!programaAfiliados || programaAfiliados.disponible !== true) {
    return [];
  }

  const advertencias: string[] = [];
  const subcamposEsperados: (keyof Herramienta["programaAfiliados"])[] = [
    "enlace",
    "plataformaGestion",
    "tipoInscripcion",
    "tipoComision",
    "confianza",
    "fuente",
  ];

  const faltantes = subcamposEsperados.filter((campo) => campoEstaVacio(programaAfiliados[campo]));
  if (faltantes.length > 0) {
    advertencias.push(
      `El programa de afiliados está incompleto: falta ${faltantes.join(", ")}. Revisar antes de publicar.`
    );
  }

  if (programaAfiliados.confianza === "baja") {
    advertencias.push("La confianza declarada para el programa de afiliados es baja: conviene verificarlo a mano.");
  }

  return advertencias;
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
