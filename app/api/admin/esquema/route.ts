import { NextResponse } from "next/server";
import { obtenerPoolSinPooling } from "@/data/db/cliente";
import { SENTENCIAS_ESQUEMA } from "@/data/db/esquema";
import { verificarEsquema } from "@/data/db/verificarEsquema";
import { verificarPeticionAdmin } from "@/lib/admin/verificarPeticion";

/**
 * Aprovisionar el esquema desde el propio panel.
 *
 * Existe porque quien administra Molnip no tiene por qué abrir un terminal
 * ni conocer la cadena de conexión de Neon para crear unas tablas que la
 * aplicación ya sabe describir. El script de línea de órdenes sigue estando
 * y hace exactamente lo mismo: los dos ejecutan `SENTENCIAS_ESQUEMA`, que es
 * la única fuente del esquema.
 *
 * GET  solo mira: devuelve qué falta, sin tocar nada.
 * POST aplica, dentro de una transacción, y vuelve a verificar después.
 *
 * Es aditivo por construcción: todas las tablas e índices son
 * IF NOT EXISTS y las funciones OR REPLACE. No hay ninguna sentencia que
 * borre, vacíe ni reescriba datos. Lo único que se elimina son dos
 * triggers, para volver a crearlos acto seguido — y por eso va en una
 * transacción: un corte a mitad dejaría una tabla de producción sin su
 * protección de solo-inserción.
 */

export async function GET(request: Request) {
  const verificacion = verificarPeticionAdmin(request);
  if (!verificacion.ok) return NextResponse.json({ error: verificacion.motivo }, { status: 401 });

  try {
    const problemas = await verificarEsquema(obtenerPoolSinPooling());
    return NextResponse.json({ ok: true, completo: problemas.length === 0, problemas });
  } catch (error) {
    return NextResponse.json(
      { error: `No se ha podido consultar la base de datos: ${mensaje(error)}` },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  const verificacion = verificarPeticionAdmin(request);
  if (!verificacion.ok) return NextResponse.json({ error: verificacion.motivo }, { status: 401 });

  const pool = obtenerPoolSinPooling();

  let antes: string[];
  try {
    antes = await verificarEsquema(pool);
  } catch (error) {
    return NextResponse.json(
      { error: `No se ha podido consultar la base de datos: ${mensaje(error)}` },
      { status: 503 }
    );
  }

  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");
    for (const sentencia of SENTENCIAS_ESQUEMA) await cliente.query(sentencia);
    await cliente.query("COMMIT");
  } catch (error) {
    await cliente.query("ROLLBACK").catch(() => {});
    return NextResponse.json(
      { error: `Aprovisionamiento deshecho, la base de datos queda como estaba: ${mensaje(error)}` },
      { status: 500 }
    );
  } finally {
    cliente.release();
  }

  // Comprobación independiente: no basta con que las sentencias no hayan
  // dado error, hay que ir a mirar qué hay.
  const despues = await verificarEsquema(pool);
  const { rows } = await pool.query(
    `SELECT table_name,
            (SELECT count(*)::int FROM information_schema.columns c
              WHERE c.table_schema = 'public' AND c.table_name = t.table_name) AS columnas
       FROM information_schema.tables t
      WHERE table_schema = 'public' ORDER BY table_name`
  );

  return NextResponse.json({
    ok: despues.length === 0,
    antes,
    problemas: despues,
    tablas: rows,
    sentencias: SENTENCIAS_ESQUEMA.length,
  });
}

function mensaje(error: unknown): string {
  return error instanceof Error ? error.message : "error desconocido";
}
