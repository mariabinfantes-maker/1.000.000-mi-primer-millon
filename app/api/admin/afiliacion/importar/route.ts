import { NextResponse } from "next/server";
import { guardarEstrategiaAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";
import { esEstadoAfiliacionValido } from "@/agents/atlas-affiliate-manager/estrategiaAfiliacion";
import type { CuentaAfiliado, EstrategiaAfiliacion } from "@/data/esquemaInterno";
import { verificarPeticionAdmin } from "@/lib/admin/verificarPeticion";

/**
 * REEMPLAZO COMPLETO desde el JSON de exportación.
 *
 * Esta ruta no fusiona: sustituye la estrategia entera de cada herramienta
 * por la del archivo. Un archivo parcial, o uno al que le falte una cuenta,
 * borra lo que no venga en él — cuentas, enlaces y todo. Con la importación
 * en bloque ya construida, esto pasa a ser la excepción y no el camino
 * normal, así que exige una marca explícita: sin `reemplazar: true` en el
 * cuerpo, se rechaza.
 *
 * No es una precaución teórica. El botón que llamaba aquí estaba junto a
 * «Exportar JSON» en el panel, sin ninguna advertencia, y bastaba con
 * escoger el archivo equivocado para perder enlaces sin un solo aviso.
 *
 * Para añadir o corregir datos, `/importar-lote`, que fusiona campo a campo
 * y enseña antes lo que va a hacer.
 */

type ResultadoFila = { fila: number; herramientaId?: string; ok: boolean; error?: string };

function validarCuenta(cuenta: unknown): cuenta is CuentaAfiliado {
  if (typeof cuenta !== "object" || cuenta === null) return false;
  const c = cuenta as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    typeof c.plataforma === "string" &&
    typeof c.estado === "string" &&
    esEstadoAfiliacionValido(c.estado) &&
    Array.isArray(c.enlaces) &&
    typeof c.ultimaRevision === "string"
  );
}

function validarEstrategia(item: unknown): item is EstrategiaAfiliacion {
  if (typeof item !== "object" || item === null) return false;
  const e = item as Record<string, unknown>;
  return typeof e.herramientaId === "string" && Array.isArray(e.cuentas) && e.cuentas.every(validarCuenta);
}

export async function POST(request: Request) {
  const verificacion = verificarPeticionAdmin(request);
  if (!verificacion.ok) return NextResponse.json({ error: verificacion.motivo }, { status: 401 });

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "El archivo no es JSON válido." }, { status: 400 });
  }

  // Se admiten las dos formas: el array pelado de siempre, o un objeto que
  // lo envuelve junto a la confirmación. La confirmación es obligatoria.
  const envoltorio = !Array.isArray(cuerpo) && typeof cuerpo === "object" && cuerpo !== null
    ? (cuerpo as { estrategias?: unknown; reemplazar?: unknown })
    : undefined;
  const estrategias = envoltorio ? envoltorio.estrategias : cuerpo;
  const confirmado = envoltorio?.reemplazar === true;

  if (!Array.isArray(estrategias)) {
    return NextResponse.json({ error: "El JSON importado debe ser un array de estrategias." }, { status: 400 });
  }

  if (!confirmado) {
    return NextResponse.json(
      {
        error:
          "Esta importación REEMPLAZA la estrategia completa de cada herramienta y borra lo que no venga en el archivo. " +
          "Si es lo que quieres, confírmalo marcando la casilla de reemplazo. Para añadir o corregir datos sin perder nada, usa la importación en bloque.",
        requiereConfirmacion: true,
      },
      { status: 400 }
    );
  }

  const resultados: ResultadoFila[] = [];
  for (const [indice, item] of estrategias.entries()) {
    const fila = indice + 1;
    if (!validarEstrategia(item)) {
      const herramientaId = typeof (item as Record<string, unknown>)?.herramientaId === "string"
        ? ((item as Record<string, unknown>).herramientaId as string)
        : undefined;
      resultados.push({
        fila,
        herramientaId,
        ok: false,
        error: "Estructura inválida (herramientaId, cuentas[] con id/plataforma/estado válido/enlaces[]/ultimaRevision).",
      });
      continue;
    }
    try {
      await guardarEstrategiaAfiliacion(item, {
        usuario: verificacion.usuario,
        motivo: "Reemplazo completo desde JSON",
      });
      resultados.push({ fila, herramientaId: item.herramientaId, ok: true });
    } catch (error) {
      resultados.push({
        fila,
        herramientaId: item.herramientaId,
        ok: false,
        error: error instanceof Error ? error.message : "Error desconocido.",
      });
    }
  }

  const fallidas = resultados.filter((r) => !r.ok).length;
  return NextResponse.json({ ok: fallidas === 0, resultados, total: resultados.length, fallidas });
}
