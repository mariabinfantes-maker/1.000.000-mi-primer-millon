import fs from "node:fs";
import path from "node:path";

/**
 * Cuántas capacidades de una herramienta están verificadas con cita.
 *
 * Lo necesita el examen de entrada: la primera de sus cinco preguntas es «¿qué
 * hace?», y eso no se responde con lo que diga su web comercial, sino con lo
 * que quedó verificado en `data/verificacion/registros.json` — cada registro
 * con su frase literal, su dirección y su fecha.
 *
 * Lee el fichero cada vez a propósito: la promoción ocurre una vez por
 * herramienta y el fichero cambia cuando entra una pasada de verificación.
 * Cachearlo daría un número viejo justo en el momento en que más importa.
 */
export function contarCapacidadesVerificadas(herramientaId: string, dirDatos?: string): number {
  const ruta = path.join(dirDatos ?? path.join(process.cwd(), "data"), "verificacion", "registros.json");
  if (!fs.existsSync(ruta)) return 0;

  let crudo: unknown;
  try {
    crudo = JSON.parse(fs.readFileSync(ruta, "utf8"));
  } catch {
    return 0;
  }

  const registros = Array.isArray(crudo)
    ? crudo
    : ((crudo as { registros?: unknown[] })?.registros ?? []);

  return registros.filter((r) => {
    const reg = r as { herramientaId?: string; estado?: string };
    return reg.herramientaId === herramientaId && reg.estado === "verificado";
  }).length;
}
