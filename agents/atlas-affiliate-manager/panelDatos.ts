import type { Herramienta } from "@/data/esquema";
import type { AffiliateData, CuentaAfiliado, EstrategiaAfiliacion } from "@/data/esquemaInterno";
import { calcularPuntuacionAtlas } from "@/lib/puntuacionAtlas";
import { calcularEstadoPanel, calcularProximaAccion, type EstadoPanel } from "./proximaAccion";
import { DIAS_ESTANCAMIENTO_POR_DEFECTO } from "./consistencia";
import { diasEntre } from "@/agents/compartido/fechas";

/**
 * Ensambla una fila por panel a partir de todo lo que ya existe — no
 * duplica ninguna función, solo combina: el catálogo público (nombre,
 * Puntuación Atlas), `AffiliateData` (lo que investigó Researcher, para
 * herramientas que aún no tienen ninguna cuenta), y `EstrategiaAfiliacion`
 * (estado real, requisitos, borrador, enlace).
 *
 * Una herramienta sin ninguna cuenta todavía aparece igualmente, con
 * `cuentaId: null` — es la misma detección de `cobertura.ts`, aquí
 * expandida a fila completa en vez de solo un id+nombre, para que el panel
 * no tenga que combinar dos fuentes por su cuenta.
 */

export type FilaPanelAfiliacion = {
  herramientaId: string;
  nombreHerramienta: string;
  cuentaId: string | null;
  plataforma: string | null;
  programaEncontrado: string | null;
  prioridad: number | null;
  comision?: string;
  duracionCookie?: string;
  requisitosPrograma?: string;
  estadoPanel: EstadoPanel;
  proximaAccion: string;
  borradorSolicitud?: string;
  enlace?: string;
  enlaceUltimaComprobacion?: string;
  enlaceComprobacionOk?: boolean;
  verificacionPendiente: boolean;
  ultimaRevision: string | null;
  diasEstancada: number | null;
};

function filaDesdeCuenta(
  herramienta: Herramienta | undefined,
  herramientaId: string,
  cuenta: CuentaAfiliado,
  hoy: string
): FilaPanelAfiliacion {
  const estadoPanel = calcularEstadoPanel(cuenta, hoy);
  const dias = diasEntre(hoy, cuenta.ultimaRevision);

  return {
    herramientaId,
    nombreHerramienta: herramienta?.nombre ?? herramientaId,
    cuentaId: cuenta.id,
    plataforma: cuenta.plataforma,
    programaEncontrado: cuenta.nombrePrograma ?? cuenta.plataforma,
    prioridad: herramienta ? (calcularPuntuacionAtlas(herramienta)?.puntuacion ?? null) : null,
    comision: cuenta.comision,
    duracionCookie: cuenta.duracionCookie,
    requisitosPrograma: cuenta.requisitosPrograma,
    estadoPanel,
    proximaAccion: calcularProximaAccion(cuenta, hoy),
    borradorSolicitud: cuenta.borradorSolicitud,
    enlace: cuenta.enlaces.find((e) => e.segmento === "global")?.url ?? cuenta.enlaces[0]?.url,
    enlaceUltimaComprobacion: cuenta.enlaceUltimaComprobacion,
    enlaceComprobacionOk: cuenta.enlaceComprobacionOk,
    verificacionPendiente: cuenta.verificacionPendiente === true,
    ultimaRevision: cuenta.ultimaRevision,
    diasEstancada: estadoPanel === "seguimiento" ? dias : null,
  };
}

function filaSinCuenta(herramienta: Herramienta, datosAfiliados: AffiliateData | undefined): FilaPanelAfiliacion {
  return {
    herramientaId: herramienta.id,
    nombreHerramienta: herramienta.nombre,
    cuentaId: null,
    plataforma: datosAfiliados?.affiliatePlatform ?? null,
    programaEncontrado: datosAfiliados?.affiliateProgramName ?? datosAfiliados?.affiliatePlatform ?? null,
    prioridad: calcularPuntuacionAtlas(herramienta)?.puntuacion ?? null,
    comision: datosAfiliados?.commission,
    duracionCookie: datosAfiliados?.cookieDuration,
    requisitosPrograma: undefined,
    estadoPanel: "pendiente",
    proximaAccion: "Investigar los requisitos del programa",
    borradorSolicitud: undefined,
    enlace: undefined,
    verificacionPendiente: false,
    ultimaRevision: null,
    diasEstancada: null,
  };
}

export function construirFilasPanel(
  herramientas: Herramienta[],
  estrategias: EstrategiaAfiliacion[],
  datosAfiliados: AffiliateData[],
  hoy: string
): FilaPanelAfiliacion[] {
  const estrategiasPorId = new Map(estrategias.map((e) => [e.herramientaId, e]));
  const datosAfiliadosPorId = new Map(datosAfiliados.map((d) => [d.herramientaId, d]));

  const filas: FilaPanelAfiliacion[] = [];

  for (const herramienta of herramientas) {
    const estrategia = estrategiasPorId.get(herramienta.id);

    if (!estrategia || estrategia.cuentas.length === 0) {
      filas.push(filaSinCuenta(herramienta, datosAfiliadosPorId.get(herramienta.id)));
      continue;
    }

    for (const cuenta of estrategia.cuentas) {
      filas.push(filaDesdeCuenta(herramienta, herramienta.id, cuenta, hoy));
    }
  }

  return filas.sort((a, b) => (b.prioridad ?? -1) - (a.prioridad ?? -1));
}

export const UMBRAL_ESTANCAMIENTO_DIAS = DIAS_ESTANCAMIENTO_POR_DEFECTO;
