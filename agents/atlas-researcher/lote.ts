import { investigarHerramienta } from "./agente";
import { escribirBorrador, type BorradorEscrito } from "./borrador";
import { generarId, idYaExiste } from "./id";
import { prechequearAfiliados } from "./prechequeoAfiliados";
import type { ProveedorIA } from "./proveedorIA";
import type { SolicitudInvestigacion } from "./tipos";

/**
 * Orquestador por lotes (recorre las etapas 1-5 del pipeline: cola →
 * deduplicación → prechequeo → investigación completa → borrador).
 *
 * `investigarHerramienta` (etapa 4) no se toca: este módulo solo decide
 * CUÁNDO llamarla y qué hacer con el resultado, igual que ya hacía `cli.ts`
 * para una única herramienta.
 */

/** La cola de candidatos: mismo tipo que ya usa `investigarHerramienta`, visto desde el lado de "qué hay que investigar". */
export type CandidatoLote = SolicitudInvestigacion;

export type ResultadoCandidatoLote =
  | { estado: "duplicado"; nombreHerramienta: string; id: string }
  | { estado: "descartado_prechequeo"; nombreHerramienta: string; id: string; motivo: string }
  | { estado: "descartado_investigacion"; nombreHerramienta: string; id: string; motivo: string }
  | { estado: "fallido"; nombreHerramienta: string; id: string; error: string }
  | { estado: "aceptado"; nombreHerramienta: string; id: string; borrador: BorradorEscrito };

export type ResumenLote = {
  resultados: ResultadoCandidatoLote[];
  totales: {
    total: number;
    aceptados: number;
    duplicados: number;
    descartados: number;
    fallidos: number;
  };
};

export type OpcionesLote = {
  /** Cuántos candidatos se procesan en paralelo (prechequeo + investigación). Por defecto 3: control de ritmo, no solo de coste. */
  concurrencia?: number;
  /** Reintentos adicionales ante un fallo del proveedor (no ante un descarte legítimo por la regla de negocio). Por defecto 1. */
  reintentos?: number;
  /** Base del backoff exponencial entre reintentos, en ms. Por defecto 500. Los tests la ponen a 0 para no esperar de verdad. */
  esperaBaseReintentoMs?: number;
  /** Se reenvía a `escribirBorrador`; solo para pruebas, en producción siempre usa `data/borradores`. */
  dirBaseBorradores?: string;
};

const CONCURRENCIA_POR_DEFECTO = 3;
const REINTENTOS_POR_DEFECTO = 1;
const ESPERA_BASE_REINTENTO_MS_POR_DEFECTO = 500;

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Reintenta `ejecutar` (con backoff exponencial) mientras el resultado
 * cuente como un fallo transitorio según `esFalloTransitorio` — nunca ante
 * un descarte legítimo (sin programa de afiliados fiable, por ejemplo), que
 * no cambiaría al repetir la llamada.
 */
async function conReintentos<T>(
  ejecutar: () => Promise<T>,
  esFalloTransitorio: (resultado: T) => boolean,
  reintentos: number,
  esperaBaseMs: number
): Promise<T> {
  let resultado = await ejecutar();
  for (let intento = 0; intento < reintentos && esFalloTransitorio(resultado); intento += 1) {
    await esperar(esperaBaseMs * 2 ** intento);
    resultado = await ejecutar();
  }
  return resultado;
}

/** Reparte `items` entre `limite` "trabajadores" concurrentes, preservando el orden original en el array devuelto. */
async function procesarConConcurrencia<T, R>(items: T[], limite: number, tarea: (item: T) => Promise<R>): Promise<R[]> {
  const resultados: R[] = new Array(items.length);
  let siguiente = 0;

  async function trabajador() {
    while (siguiente < items.length) {
      const indice = siguiente;
      siguiente += 1;
      resultados[indice] = await tarea(items[indice]);
    }
  }

  const trabajadores = Array.from({ length: Math.min(limite, items.length) }, () => trabajador());
  await Promise.all(trabajadores);
  return resultados;
}

/**
 * Ejecuta el pipeline completo sobre una lista de candidatos.
 *
 * `idsExistentes` es el catálogo (real + borradores ya escritos) frente al
 * que deduplicar — lo aporta quien llama (`cli-lote.ts`), leyéndolo de
 * `data/repositorio.ts` y `borrador.ts`, para que este módulo siga sin
 * tocar el sistema de archivos salvo al escribir el propio borrador.
 */
export async function ejecutarLote(
  candidatos: CandidatoLote[],
  idsExistentes: Iterable<string>,
  proveedor: ProveedorIA,
  opciones: OpcionesLote = {}
): Promise<ResumenLote> {
  const concurrencia = opciones.concurrencia ?? CONCURRENCIA_POR_DEFECTO;
  const reintentos = opciones.reintentos ?? REINTENTOS_POR_DEFECTO;
  const esperaBaseMs = opciones.esperaBaseReintentoMs ?? ESPERA_BASE_REINTENTO_MS_POR_DEFECTO;

  // Etapa 2 (deduplicación): síncrona y sin llamadas al proveedor, para que
  // dos candidatos que generan el mismo id nunca acaben investigándose los
  // dos en paralelo — el primero "reserva" el id, el resto se marca
  // duplicado antes de que empiece ningún trabajo asíncrono.
  const idsReservados = new Set(idsExistentes);
  const pendientes: { candidato: CandidatoLote; id: string }[] = [];
  const resultados: (ResultadoCandidatoLote | null)[] = candidatos.map((candidato) => {
    const id = generarId(candidato.nombreHerramienta);
    if (idYaExiste(id, idsReservados)) {
      return { estado: "duplicado", nombreHerramienta: candidato.nombreHerramienta, id };
    }
    idsReservados.add(id);
    pendientes.push({ candidato, id });
    return null;
  });

  const resultadosPendientes = await procesarConConcurrencia(pendientes, concurrencia, async ({ candidato, id }) =>
    procesarCandidato(candidato, id, proveedor, { reintentos, esperaBaseMs, dirBaseBorradores: opciones.dirBaseBorradores })
  );

  let cursor = 0;
  const resultadosFinales = resultados.map((resultado) => resultado ?? resultadosPendientes[cursor++]);

  return {
    resultados: resultadosFinales,
    totales: {
      total: resultadosFinales.length,
      aceptados: resultadosFinales.filter((r) => r.estado === "aceptado").length,
      duplicados: resultadosFinales.filter((r) => r.estado === "duplicado").length,
      descartados: resultadosFinales.filter(
        (r) => r.estado === "descartado_prechequeo" || r.estado === "descartado_investigacion"
      ).length,
      fallidos: resultadosFinales.filter((r) => r.estado === "fallido").length,
    },
  };
}

async function procesarCandidato(
  candidato: CandidatoLote,
  id: string,
  proveedor: ProveedorIA,
  opciones: { reintentos: number; esperaBaseMs: number; dirBaseBorradores?: string }
): Promise<ResultadoCandidatoLote> {
  const { reintentos, esperaBaseMs } = opciones;

  const prechequeo = await conReintentos(
    () => prechequearAfiliados(candidato.nombreHerramienta, proveedor),
    (r) => !r.tieneProgramaFiable && !r.motivo.includes("no supera el prechequeo"),
    reintentos,
    esperaBaseMs
  );

  if (!prechequeo.tieneProgramaFiable) {
    if (prechequeo.motivo.includes("no supera el prechequeo")) {
      return { estado: "descartado_prechequeo", nombreHerramienta: candidato.nombreHerramienta, id, motivo: prechequeo.motivo };
    }
    return { estado: "fallido", nombreHerramienta: candidato.nombreHerramienta, id, error: prechequeo.motivo };
  }

  const resultado = await conReintentos(
    () => investigarHerramienta(candidato, proveedor),
    (r) => !r.ok && !r.error.startsWith("Descartada"),
    reintentos,
    esperaBaseMs
  );

  if (!resultado.ok) {
    if (resultado.error.startsWith("Descartada")) {
      return {
        estado: "descartado_investigacion",
        nombreHerramienta: candidato.nombreHerramienta,
        id,
        motivo: resultado.error,
      };
    }
    return { estado: "fallido", nombreHerramienta: candidato.nombreHerramienta, id, error: resultado.error };
  }

  const borrador = escribirBorrador(id, resultado.propuesta, { dirBase: opciones.dirBaseBorradores });
  return { estado: "aceptado", nombreHerramienta: candidato.nombreHerramienta, id, borrador };
}
