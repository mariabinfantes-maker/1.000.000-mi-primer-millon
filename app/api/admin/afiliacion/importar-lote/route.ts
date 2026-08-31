import { NextResponse } from "next/server";
import { getTodasLasHerramientas } from "@/data/repositorio";
import {
  getEstrategiaAfiliacion,
  getTodasLasEstrategiasAfiliacion,
  guardarEstrategiaAfiliacion,
} from "@/data/repositorioEstrategiaAfiliacion";
import { aplicarLoteEstrategia, type EntradaLoteEstrategia } from "@/agents/atlas-affiliate-manager/lote";
import { previsualizarLote, filasAAplicar } from "@/agents/atlas-affiliate-manager/importacion/previsualizar";
import { fijarCuentas } from "@/agents/atlas-affiliate-manager/importacion/resolverCuenta";
import { verificarPeticionAdmin } from "@/lib/admin/verificarPeticion";

/**
 * Importación en bloque, en dos tiempos.
 *
 * `previsualizar` no escribe absolutamente nada: dice qué pasaría. `aplicar`
 * escribe solo las filas que la vista previa dio por buenas, y las
 * activaciones únicamente si vienen confirmadas aparte — activar cambia lo
 * que hace la web pública y no debe ir dentro del mismo botón que el resto.
 *
 * Siempre fusiona. El reemplazo completo vive en `/importar`, separado a
 * propósito y con su propia confirmación destructiva.
 */

const MAXIMO_FILAS = 500;

type Cuerpo = {
  entradas?: unknown;
  modo?: unknown;
  incluirActivaciones?: unknown;
};

export async function POST(request: Request) {
  const verificacion = verificarPeticionAdmin(request);
  if (!verificacion.ok) return NextResponse.json({ error: verificacion.motivo }, { status: 401 });

  let cuerpo: Cuerpo;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la petición inválido." }, { status: 400 });
  }

  if (!Array.isArray(cuerpo.entradas)) {
    return NextResponse.json({ error: "Falta la lista de entradas." }, { status: 400 });
  }
  if (cuerpo.entradas.length === 0) {
    return NextResponse.json({ error: "El archivo no tiene ninguna fila." }, { status: 400 });
  }
  if (cuerpo.entradas.length > MAXIMO_FILAS) {
    return NextResponse.json(
      { error: `El archivo tiene ${cuerpo.entradas.length} filas y el máximo son ${MAXIMO_FILAS}. Pártelo en varios.` },
      { status: 400 }
    );
  }

  const modo = cuerpo.modo === "aplicar" ? "aplicar" : "previsualizar";
  const incluirActivaciones = cuerpo.incluirActivaciones === true;

  const nombres: Record<string, string> = {};
  const idsValidos = new Set<string>();
  for (const herramienta of getTodasLasHerramientas()) {
    idsValidos.add(herramienta.id);
    nombres[herramienta.id] = herramienta.nombre;
  }

  const existentes = new Map((await getTodasLasEstrategiasAfiliacion()).map((e) => [e.herramientaId, e]));

  // La cuenta se fija aquí, una sola vez, para que previsualizar y aplicar
  // hablen exactamente de la misma cuenta.
  const entradas = fijarCuentas(cuerpo.entradas as EntradaLoteEstrategia[], existentes);

  const resumen = previsualizarLote(entradas, {
    idsValidos,
    nombres,
    existentes,
  });

  if (modo === "previsualizar") {
    return NextResponse.json({ ok: true, resumen });
  }

  if (resumen.bloqueo) {
    return NextResponse.json({ error: resumen.bloqueo }, { status: 400 });
  }

  const aAplicar = new Set(filasAAplicar(resumen, incluirActivaciones));
  if (aAplicar.size === 0) {
    return NextResponse.json({ error: "No hay ninguna fila que aplicar." }, { status: 400 });
  }

  const seleccionadas = entradas.filter((_, indice) => aAplicar.has(indice + 1));
  const hoy = new Date().toISOString().slice(0, 10);

  const resultados = await aplicarLoteEstrategia(
    seleccionadas,
    (id) => getEstrategiaAfiliacion(id),
    (estrategia) =>
      guardarEstrategiaAfiliacion(estrategia, {
        usuario: verificacion.usuario,
        motivo: incluirActivaciones ? "Importación en bloque (con activaciones)" : "Importación en bloque",
      }),
    hoy
  );

  const fallidas = resultados.filter((r) => !r.ok).length;
  return NextResponse.json({
    ok: fallidas === 0,
    aplicadas: resultados.length - fallidas,
    fallidas,
    resultados,
    activacionesAplicadas: incluirActivaciones ? resumen.activaciones : 0,
    activacionesPendientes: incluirActivaciones ? 0 : resumen.activaciones,
  });
}
