import fs from "node:fs";
import path from "node:path";
import { examinarParaEntrar } from "@/agents/atlas-researcher/examenDeEntrada";
import { contarCapacidadesVerificadas } from "@/agents/atlas-researcher/capacidadesVerificadas";
import { getTodasLasHerramientas } from "@/data/repositorio";

/**
 * EL EXAMEN DE ENTRADA, PASADO A LAS QUE YA ESTÁN DENTRO.
 *
 * `npm run examen-catalogo`
 *
 * Pedido por la propietaria el 2026-09-29, al darse cuenta de que el examen
 * nuevo guarda la puerta pero no mira a quien ya entró: seis de las 65 no lo
 * pasarían hoy.
 *
 * NO ECHA A NADIE Y NO TOCA NINGUNA FICHA. Sólo mide y escribe una lista de
 * qué le falta a cada una, para saber en qué gastar la siguiente
 * investigación. Es una lista de tareas, no un juicio: lo que falta es un dato
 * que no fuimos a buscar, no un defecto de la herramienta.
 *
 * APARTADAS existe para las herramientas que no se miden por una decisión
 * escrita, no por un descuido: salen aparte y marcadas, para que nadie las
 * «arregle» sin querer.
 *
 * Está vacío desde el 2026-09-29. Lo estrenó Teachable, que quedaba fuera de
 * la verificación entera mientras siguiera pendiente la profundidad de
 * `teachable/cap.payment_collection` —si cobra por sí misma o hace falta traer
 * un Stripe propio—. Se resolvió ese día: `nativa`, con la palabra del
 * fabricante, «Teachable Payments is Teachable's native gateway». El rastro
 * está en `data/investigacion/teachable-profundidad-2026-09-29/` y el cierre
 * del bloqueo en `data/verificacion/_registros-aprobados-sin-ficha.json`.
 */
const APARTADAS = new Map<string, string>([]);

function main() {
  const herramientas = getTodasLasHerramientas();
  const pasan: string[] = [];
  const fallan: { id: string; nombre: string; falta: string[] }[] = [];
  const apartadas: { id: string; motivo: string }[] = [];

  for (const h of herramientas) {
    const motivo = APARTADAS.get(h.id);
    if (motivo) {
      apartadas.push({ id: h.id, motivo });
      continue;
    }
    const r = examinarParaEntrar(h, { capacidadesVerificadas: contarCapacidadesVerificadas(h.id) });
    if (r.ok) pasan.push(h.id);
    else fallan.push({ id: h.id, nombre: h.nombre, falta: r.errores });
  }

  console.log(`Catálogo: ${herramientas.length} herramientas`);
  console.log(`  pasan el examen de entrada: ${pasan.length}`);
  console.log(`  les falta algo: ${fallan.length}`);
  console.log(`  apartadas por decisión: ${apartadas.length}`);

  if (fallan.length > 0) {
    console.log("\nQUÉ LE FALTA A CADA UNA (no es un defecto suyo: es un dato que no fuimos a buscar)");
    for (const f of fallan) {
      console.log(`\n  ${f.nombre} (${f.id})`);
      f.falta.forEach((e) => console.log(`    · ${e}`));
    }
  }

  for (const a of apartadas) console.log(`\nAPARTADA — ${a.id}: ${a.motivo}`);

  const salida = path.join(process.cwd(), "data", "informes-curador", "examen-catalogo.json");
  fs.mkdirSync(path.dirname(salida), { recursive: true });
  fs.writeFileSync(
    salida,
    JSON.stringify(
      {
        fecha: new Date().toISOString().slice(0, 10),
        aviso: "Medida, no sentencia. Nadie sale del catálogo por esto: lo que falta es un dato que no fuimos a buscar.",
        total: herramientas.length,
        pasan,
        fallan,
        apartadas,
      },
      null,
      1
    ),
    "utf8"
  );
  console.log(`\nEscrito en ${path.relative(process.cwd(), salida)}`);
}

main();
