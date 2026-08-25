import { NextResponse } from "next/server";
import { guardarEstrategiaAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";
import { esEstadoAfiliacionValido } from "@/agents/atlas-affiliate-manager/estrategiaAfiliacion";
import type { CuentaAfiliado, EstrategiaAfiliacion } from "@/data/esquemaInterno";
import { verificarPeticionAdmin } from "@/lib/admin/verificarPeticion";

/**
 * Importa un array de `EstrategiaAfiliacion` (mismo formato que exporta
 * `/api/admin/afiliacion/exportar`) — validación estructural mínima mismo
 * espíritu que `lote.ts`: una fila inválida no aborta las demás, se
 * reporta y se sigue con el resto.
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

  if (!Array.isArray(cuerpo)) {
    return NextResponse.json({ error: "El JSON importado debe ser un array de estrategias." }, { status: 400 });
  }

  const resultados: ResultadoFila[] = cuerpo.map((item, indice) => {
    const fila = indice + 1;
    if (!validarEstrategia(item)) {
      const herramientaId = typeof (item as Record<string, unknown>)?.herramientaId === "string"
        ? ((item as Record<string, unknown>).herramientaId as string)
        : undefined;
      return { fila, herramientaId, ok: false, error: "Estructura inválida (herramientaId, cuentas[] con id/plataforma/estado válido/enlaces[]/ultimaRevision)." };
    }
    try {
      guardarEstrategiaAfiliacion(item);
      return { fila, herramientaId: item.herramientaId, ok: true };
    } catch (error) {
      return { fila, herramientaId: item.herramientaId, ok: false, error: error instanceof Error ? error.message : "Error desconocido." };
    }
  });

  const fallidas = resultados.filter((r) => !r.ok).length;
  return NextResponse.json({ ok: fallidas === 0, resultados, total: resultados.length, fallidas });
}
