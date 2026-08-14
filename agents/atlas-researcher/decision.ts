import fs from "node:fs";
import path from "node:path";

/**
 * Registro de la decisión humana sobre un borrador (etapa "aprobación" del
 * flujo investigar → informe → revisión → aprobación → promoción).
 *
 * Vive en `data/borradores/decisiones/{id}.json` — un directorio propio,
 * al mismo nivel que `herramientas/`, `afiliados/` y `metadatos/` dentro de
 * la zona de borradores. `promover.ts` exige que exista una decisión
 * "aprobado" antes de copiar nada al catálogo real: Atlas nunca promueve
 * una herramienta sin que quede constancia de que un humano la revisó y
 * la aprobó explícitamente.
 *
 * Cada llamada a `registrarDecision` sobrescribe la decisión anterior para
 * ese id -- es el estado actual de la decisión, no un historial completo.
 */

export type TipoDecision = "aprobado" | "rechazado";

export type Decision = {
  id: string;
  decision: TipoDecision;
  /** ISO 8601 (YYYY-MM-DD). */
  fecha: string;
  notas: string;
};

const DIR_BORRADORES_POR_DEFECTO = path.join(process.cwd(), "data", "borradores");

function dirDecisiones(dirBase: string): string {
  return path.join(dirBase, "decisiones");
}

/** Registra (o sobrescribe) la decisión humana sobre un borrador. `notas` debe explicar el motivo, nunca queda vacío. */
export function registrarDecision(
  id: string,
  decision: TipoDecision,
  notas: string,
  opciones: { dirBase?: string } = {}
): Decision {
  const dirBase = opciones.dirBase ?? DIR_BORRADORES_POR_DEFECTO;
  const dir = dirDecisiones(dirBase);
  fs.mkdirSync(dir, { recursive: true });

  const registro: Decision = {
    id,
    decision,
    fecha: new Date().toISOString().slice(0, 10),
    notas,
  };

  fs.writeFileSync(path.join(dir, `${id}.json`), `${JSON.stringify(registro, null, 2)}\n`, "utf-8");
  return registro;
}

/** Lee la decisión registrada para un id, o `undefined` si todavía no se ha decidido nada. */
export function leerDecision(id: string, opciones: { dirBase?: string } = {}): Decision | undefined {
  const dirBase = opciones.dirBase ?? DIR_BORRADORES_POR_DEFECTO;
  const ruta = path.join(dirDecisiones(dirBase), `${id}.json`);
  if (!fs.existsSync(ruta)) return undefined;
  return JSON.parse(fs.readFileSync(ruta, "utf-8")) as Decision;
}

/** ¿Este id tiene una decisión "aprobado" registrada? Lo usa `promover.ts` como puerta obligatoria antes de promover. */
export function estaAprobado(id: string, opciones: { dirBase?: string } = {}): boolean {
  return leerDecision(id, opciones)?.decision === "aprobado";
}
