import fs from "node:fs";
import path from "node:path";
import type { Descarte } from "./convertir";
import { calcularRepesca, paresDeRepesca } from "./repesca";

/**
 * Escribe `tareas.json` a partir de los descartes del último conversión.
 *
 *     npm run repesca-verificacion
 */
const DIR = path.join(process.cwd(), "data", "verificacion");
const rutaDescartes = path.join(DIR, "descartes.json");

if (!fs.existsSync(rutaDescartes)) {
  console.error("No hay descartes.json. Convierte primero la salida del lote.");
  process.exit(1);
}

const descartes = JSON.parse(fs.readFileSync(rutaDescartes, "utf8")) as Descarte[];
const tareas = calcularRepesca(descartes);

fs.writeFileSync(path.join(DIR, "tareas.json"), `${JSON.stringify(tareas, null, 2)}\n`);

const porTipo = (t: string) => tareas.filter((x) => x.tipo === t);
console.log(`Herramientas a repescar: ${new Set(tareas.map((t) => t.herramientaId)).size}`);
console.log(`  capacidades enteras:   ${paresDeRepesca(porTipo("capacidad"))} pares`);
console.log(`  sólo el plan:          ${paresDeRepesca(porTipo("plan"))} pares`);
console.log(`Total:                   ${paresDeRepesca(tareas)} pares (frente a 765 de la primera vuelta)`);
