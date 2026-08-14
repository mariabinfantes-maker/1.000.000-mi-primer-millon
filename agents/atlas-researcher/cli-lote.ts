import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { listarIdsBorradores } from "./borrador";
import { generarId, idYaExiste } from "./id";
import { ejecutarLote, type CandidatoLote, type ResultadoCandidatoLote } from "./lote";
import { crearProveedorGemini } from "@/agents/compartido/proveedores/gemini";

/**
 * Límite de peticiones por minuto del proveedor. El nivel gratuito de
 * Gemini (gemini-3.6-flash) admite 5 peticiones/minuto y devuelve "Quota
 * exceeded" por encima de eso — descubierto al ejecutar el primer lote
 * real. Configurable con GEMINI_RATE_LIMIT_POR_MINUTO si se pasa a un
 * nivel de pago con más margen.
 */
const LIMITE_PETICIONES_POR_MINUTO_POR_DEFECTO = 5;

/**
 * `npm run investigar-lote -- lista.json`
 *
 * `lista.json` es un array de candidatos: cada elemento es o bien un string
 * (solo el nombre) o un objeto `{ nombreHerramienta, categoriaId?, contextoAdicional? }`.
 *
 * Antes de llamar a Gemini ni una sola vez, imprime cuántos candidatos son
 * realmente nuevos (tras deduplicar contra el catálogo real y los
 * borradores ya existentes) y cuántas llamadas al proveedor supone como
 * máximo, y espera confirmación explícita por teclado. Sin confirmación, no
 * se ejecuta ningún lote — ver Sheet 05 del documento de arquitectura
 * aprobado ("ningún lote se ejecuta sin que tú lo dispares a propósito").
 */

function leerCandidatos(rutaArchivo: string): CandidatoLote[] {
  const contenido = fs.readFileSync(rutaArchivo, "utf-8");
  const crudo = JSON.parse(contenido);

  if (!Array.isArray(crudo)) {
    throw new Error(`"${rutaArchivo}" debe contener un array de candidatos.`);
  }

  return crudo.map((elemento, indice) => {
    if (typeof elemento === "string") {
      return { nombreHerramienta: elemento };
    }
    if (typeof elemento === "object" && elemento !== null && typeof elemento.nombreHerramienta === "string") {
      return elemento as CandidatoLote;
    }
    throw new Error(`Candidato inválido en la posición ${indice}: debe ser un string o { nombreHerramienta, ... }.`);
  });
}

function obtenerIdsExistentes(): Set<string> {
  const idsCatalogoReal = getTodasLasHerramientas().map((h) => h.id);
  const idsBorradores = listarIdsBorradores();
  return new Set([...idsCatalogoReal, ...idsBorradores]);
}

async function pedirConfirmacion(pregunta: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const respuesta = await rl.question(pregunta);
    return respuesta.trim().toLowerCase() === "si";
  } finally {
    rl.close();
  }
}

function imprimirResumen(resultados: ResultadoCandidatoLote[]) {
  const porEstado = {
    aceptado: resultados.filter((r) => r.estado === "aceptado"),
    duplicado: resultados.filter((r) => r.estado === "duplicado"),
    descartado_prechequeo: resultados.filter((r) => r.estado === "descartado_prechequeo"),
    descartado_investigacion: resultados.filter((r) => r.estado === "descartado_investigacion"),
    fallido: resultados.filter((r) => r.estado === "fallido"),
  };

  if (porEstado.aceptado.length > 0) {
    console.log(`\n✓ Aceptadas (${porEstado.aceptado.length}) — borrador escrito, pendiente de promover:`);
    for (const r of porEstado.aceptado) {
      if (r.estado === "aceptado") console.log(`  - ${r.nombreHerramienta} (${r.id}): ${r.borrador.rutaHerramienta}`);
    }
  }

  if (porEstado.duplicado.length > 0) {
    console.log(`\n⏭ Ya existentes, saltadas (${porEstado.duplicado.length}):`);
    for (const r of porEstado.duplicado) console.log(`  - ${r.nombreHerramienta} (${r.id})`);
  }

  const descartadas = [...porEstado.descartado_prechequeo, ...porEstado.descartado_investigacion];
  if (descartadas.length > 0) {
    console.log(`\n✗ Descartadas por la regla de afiliados (${descartadas.length}):`);
    for (const r of descartadas) {
      if (r.estado === "descartado_prechequeo" || r.estado === "descartado_investigacion") {
        console.log(`  - ${r.nombreHerramienta}: ${r.motivo}`);
      }
    }
  }

  if (porEstado.fallido.length > 0) {
    console.log(`\n⚠ Fallidas tras los reintentos (${porEstado.fallido.length}):`);
    for (const r of porEstado.fallido) {
      if (r.estado === "fallido") console.log(`  - ${r.nombreHerramienta}: ${r.error}`);
    }
  }
}

async function main() {
  const rutaArgumento = process.argv[2];
  if (!rutaArgumento) {
    console.error('Uso: npm run investigar-lote -- ruta/a/lista.json');
    process.exitCode = 1;
    return;
  }

  const rutaArchivo = path.resolve(process.cwd(), rutaArgumento);
  const candidatos = leerCandidatos(rutaArchivo);
  const idsExistentes = obtenerIdsExistentes();

  const nuevos = candidatos.filter((candidato) => !idYaExiste(generarId(candidato.nombreHerramienta), idsExistentes));
  const yaExistentes = candidatos.length - nuevos.length;

  console.log(`Candidatos en la lista: ${candidatos.length}`);
  console.log(`Ya existentes (catálogo real o borrador), se saltarán sin coste: ${yaExistentes}`);
  console.log(`Candidatos nuevos a procesar: ${nuevos.length}`);
  const limitePorMinuto = Number(process.env.GEMINI_RATE_LIMIT_POR_MINUTO) || LIMITE_PETICIONES_POR_MINUTO_POR_DEFECTO;
  console.log(
    `Llamadas al proveedor estimadas: entre ${nuevos.length} (si el prechequeo descarta todas) y ${nuevos.length * 2} ` +
      "(si todas pasan el prechequeo y necesitan la investigación completa)."
  );
  console.log(
    `Ritmo: máximo ${limitePorMinuto} peticiones/minuto (nivel gratuito de Gemini) — con muchos candidatos puede tardar varios minutos, no es un fallo.`
  );

  if (nuevos.length === 0) {
    console.log("\nNada que investigar: todos los candidatos ya existen.");
    return;
  }

  const confirmado = await pedirConfirmacion('\n¿Ejecutar el lote contra la API real de Gemini? Escribe "si" para confirmar: ');
  if (!confirmado) {
    console.log("Cancelado: no se ha realizado ninguna llamada al proveedor.");
    return;
  }

  const resumen = await ejecutarLote(candidatos, idsExistentes, crearProveedorGemini(), {
    maxPeticionesPorMinuto: limitePorMinuto,
    reintentos: 3,
    esperaBaseReintentoMs: 2000,
  });

  console.log(
    `\nTotales: ${resumen.totales.aceptados} aceptadas, ${resumen.totales.duplicados} duplicadas, ` +
      `${resumen.totales.descartados} descartadas, ${resumen.totales.fallidos} fallidas (de ${resumen.totales.total}).`
  );
  imprimirResumen(resumen.resultados);
}

main();
