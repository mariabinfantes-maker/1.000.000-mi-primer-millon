import fs from "node:fs";
import path from "node:path";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { convertirSalida, type SalidaLote } from "./convertir";
import { capacidadIdsDelVocabulario, erroresDeRegistro } from "./repositorio";

/**
 * Convierte la salida cruda de un lote en registros de verificación.
 *
 *     npm run convertir-verificacion -- ruta/al/todo-lote1.json
 *
 * No escribe nada si algún registro no pasa el validador: prefiero quedarme sin
 * archivo a dejar uno que el motor creería en F3.
 */
const DIR = path.join(process.cwd(), "data", "verificacion");

const entrada = process.argv[2];
if (!entrada) {
  console.error("Falta la ruta del archivo de salida del lote.");
  process.exit(1);
}
if (!fs.existsSync(entrada)) {
  console.error(`No encuentro el archivo: ${entrada}`);
  process.exit(1);
}

const salida = JSON.parse(fs.readFileSync(entrada, "utf8")) as SalidaLote;

const urlPrecios: Record<string, string | undefined> = {};
for (const h of getTodasLasHerramientas()) urlPrecios[h.id] = h.urlPrecios;

const { registros, descartes, resumen } = convertirSalida(salida, urlPrecios);

const herramientaIds = getTodasLasHerramientas().map((h) => h.id);
const capacidadIds = capacidadIdsDelVocabulario();
const errores = registros.flatMap((r) => erroresDeRegistro(r, herramientaIds, capacidadIds));

if (errores.length) {
  console.error(`${errores.length} registro(s) no pasan el validador. No se escribe nada:`);
  for (const e of errores.slice(0, 20)) console.error(`  · ${e}`);
  process.exit(1);
}

fs.writeFileSync(path.join(DIR, "registros.json"), `${JSON.stringify(registros, null, 2)}\n`);
fs.writeFileSync(path.join(DIR, "descartes.json"), `${JSON.stringify(descartes, null, 2)}\n`);

const pct = (n: number) => (resumen.paresEsperados ? ` (${Math.round((n / resumen.paresEsperados) * 100)}%)` : "");

console.log(`Herramientas:        ${resumen.herramientas}`);
console.log(`Pares esperados:     ${resumen.paresEsperados}`);
console.log(`Registros escritos:  ${resumen.registros}`);
console.log(`  verificados:       ${resumen.verificados}${pct(resumen.verificados)}`);
console.log(`  no disponibles:    ${resumen.noDisponibles}${pct(resumen.noDisponibles)}`);
console.log(`  desconocidos:      ${resumen.desconocidos}${pct(resumen.desconocidos)}`);
console.log(`Degradados por regla: ${resumen.degradados}`);
console.log(`Sin respuesta:        ${resumen.sinRespuesta}`);
