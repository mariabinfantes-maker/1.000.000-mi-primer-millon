import { borradorYaExiste } from "./borrador";
import { registrarDecision, type TipoDecision } from "./decision";

/**
 * `npm run aprobar-borrador -- id --decision aprobado|rechazado --notas "..."`
 *
 * Registra tu decisión sobre un borrador ya revisado (normalmente a partir
 * del informe generado con `npm run generar-informe`). Es el paso que hace
 * la aprobación explícita y auditable, en vez de un simple "lo promuevo y
 * ya" -- `promover.ts` exige que este registro exista y diga "aprobado"
 * antes de copiar nada al catálogo real.
 */

function leerFlag(args: string[], nombre: string): string | undefined {
  const indice = args.indexOf(`--${nombre}`);
  if (indice === -1 || indice + 1 >= args.length) return undefined;
  return args[indice + 1];
}

function main() {
  const args = process.argv.slice(2);
  const id = args[0];
  const decision = leerFlag(args, "decision");
  const notas = leerFlag(args, "notas");

  if (!id || id.startsWith("--")) {
    console.error('Uso: npm run aprobar-borrador -- id --decision aprobado|rechazado --notas "motivo"');
    process.exitCode = 1;
    return;
  }

  if (decision !== "aprobado" && decision !== "rechazado") {
    console.error('Falta o es inválido --decision: debe ser exactamente "aprobado" o "rechazado".');
    process.exitCode = 1;
    return;
  }

  if (!notas || !notas.trim()) {
    console.error("Falta --notas: explica brevemente el motivo de la decisión (para que quede auditable).");
    process.exitCode = 1;
    return;
  }

  if (!borradorYaExiste(id)) {
    console.error(`No existe ningún borrador con id "${id}" en data/borradores/herramientas/.`);
    process.exitCode = 1;
    return;
  }

  const registro = registrarDecision(id, decision as TipoDecision, notas.trim());

  console.log(`✓ Decisión registrada para "${id}": ${registro.decision} (${registro.fecha}).`);
  console.log(`  Notas: ${registro.notas}`);
  if (registro.decision === "aprobado") {
    console.log(`  Siguiente paso: npm run promover-borrador -- ${id}`);
  }
}

main();
