import fs from "node:fs";
import path from "node:path";
import type { Herramienta, TipoProducto } from "@/data/esquema";
import { CATEGORIA_TODO_EN_UNO } from "@/data/taxonomia";

/**
 * `npm run migrar-taxonomia`
 *
 * Migración única: separa en cada ficha del catálogo los dos ejes que
 * antes compartían el campo `categoriaId` — qué HACE la herramienta y qué
 * TIPO de producto es (ver `data/taxonomia.ts`).
 *
 * Idempotente: ejecutarlo dos veces no cambia nada la segunda vez. No
 * borra, no renombra ids y no toca ningún otro campo — solo añade
 * `tipoProducto` y, en las dos reclasificaciones justificadas, cambia
 * `categoriaId` y añade `categoriasSecundarias`.
 *
 * Imprime el recuento antes y después para que la migración sea
 * comprobable, no una promesa.
 */

const DIR_HERRAMIENTAS = path.join(process.cwd(), "data", "herramientas");

/**
 * Reclasificaciones puntuales, cada una justificada con los datos que ya
 * están en la propia ficha — nunca por intuición. La justificación se
 * imprime al ejecutar para que quede en el registro de la migración.
 */
const RECLASIFICACIONES: Record<
  string,
  { categoriaId: string; tipoProducto: TipoProducto; categoriasSecundarias?: string[]; motivo: string }
> = {
  pipedrive: {
    categoriaId: "crm",
    tipoProducto: "especializada",
    motivo:
      'su propia descripción la define como "plataforma CRM enfocada en la gestión visual del embudo de ventas"; ' +
      "las 5 funcionesPrincipales son todas comerciales (embudo, automatización comercial, rastreo de correo, " +
      "informes de ventas, IA de ventas) y declara un único problemasIds: conseguir-clientes. No es una plataforma " +
      "todo en uno: es un CRM especializado que estaba archivado como suite.",
  },
  "monday-com": {
    categoriaId: "gestion-proyectos",
    tipoProducto: "suite",
    categoriasSecundarias: [CATEGORIA_TODO_EN_UNO, "crm"],
    motivo:
      'se describe como "Work OS para crear, ejecutar y automatizar procesos y proyectos"; sus funciones centrales ' +
      "son tableros, Kanban/Gantt/calendario, automatizaciones y documentos — gestión de proyectos — mientras que CRM " +
      "y dev son módulos aparte que se integran. Su amplitud real (6 módulos) sí la hace suite, pero su función " +
      "principal es la gestión de proyectos, que es donde la busca quien la busca. Conserva plataformas-todo-en-uno " +
      "y crm como categorías secundarias, así sigue apareciendo donde compite de verdad.",
  },
};

function tipoProductoQueLeCorresponde(herramienta: Herramienta): TipoProducto {
  const reclasificacion = RECLASIFICACIONES[herramienta.id];
  if (reclasificacion) return reclasificacion.tipoProducto;
  return herramienta.categoriaId === CATEGORIA_TODO_EN_UNO ? "suite" : "especializada";
}

function main(): void {
  const archivos = fs.readdirSync(DIR_HERRAMIENTAS).filter((f) => f.endsWith(".json"));
  const antes = archivos.map((f) => JSON.parse(fs.readFileSync(path.join(DIR_HERRAMIENTAS, f), "utf-8")) as Herramienta);

  const conteo = (fichas: Herramienta[], categoriaId: string) =>
    fichas.filter((h) => h.categoriaId === categoriaId).length;

  console.log("ANTES");
  console.log(`  fichas: ${antes.length}`);
  console.log(`  con tipoProducto declarado: ${antes.filter((h) => h.tipoProducto !== undefined).length}`);
  console.log(`  en ${CATEGORIA_TODO_EN_UNO}: ${conteo(antes, CATEGORIA_TODO_EN_UNO)}`);

  let modificadas = 0;
  for (const archivo of archivos) {
    const ruta = path.join(DIR_HERRAMIENTAS, archivo);
    const ficha = JSON.parse(fs.readFileSync(ruta, "utf-8")) as Herramienta;
    const original = JSON.stringify(ficha);

    ficha.tipoProducto = tipoProductoQueLeCorresponde(ficha);

    const reclasificacion = RECLASIFICACIONES[ficha.id];
    if (reclasificacion) {
      ficha.categoriaId = reclasificacion.categoriaId;
      if (reclasificacion.categoriasSecundarias) {
        ficha.categoriasSecundarias = reclasificacion.categoriasSecundarias;
      }
    }

    if (JSON.stringify(ficha) === original) continue;
    fs.writeFileSync(ruta, `${JSON.stringify(ficha, null, 2)}\n`, "utf-8");
    modificadas++;
  }

  const despues = archivos.map(
    (f) => JSON.parse(fs.readFileSync(path.join(DIR_HERRAMIENTAS, f), "utf-8")) as Herramienta
  );

  console.log("\nDESPUÉS");
  console.log(`  fichas: ${despues.length}`);
  console.log(`  con tipoProducto declarado: ${despues.filter((h) => h.tipoProducto !== undefined).length}`);
  console.log(`  suites: ${despues.filter((h) => h.tipoProducto === "suite").length}`);
  console.log(`  especializadas: ${despues.filter((h) => h.tipoProducto === "especializada").length}`);
  console.log(`  en ${CATEGORIA_TODO_EN_UNO}: ${conteo(despues, CATEGORIA_TODO_EN_UNO)}`);

  const idsAntes = new Set(antes.map((h) => h.id));
  const idsDespues = new Set(despues.map((h) => h.id));
  const perdidos = [...idsAntes].filter((id) => !idsDespues.has(id));
  console.log(`\n  fichas modificadas: ${modificadas}`);
  console.log(`  identificadores perdidos: ${perdidos.length === 0 ? "ninguno" : perdidos.join(", ")}`);

  console.log("\nRECLASIFICACIONES JUSTIFICADAS");
  for (const [id, r] of Object.entries(RECLASIFICACIONES)) {
    console.log(`\n  ${id} → categoriaId "${r.categoriaId}", tipoProducto "${r.tipoProducto}"`);
    if (r.categoriasSecundarias) console.log(`    secundarias: ${r.categoriasSecundarias.join(", ")}`);
    console.log(`    motivo: ${r.motivo}`);
  }

  if (perdidos.length > 0) {
    console.error("\n✗ La migración habría perdido fichas. Revisa antes de continuar.");
    process.exit(1);
  }
  console.log("\n✓ Migración completada sin pérdidas.");
}

main();
