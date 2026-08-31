import type { ClicsPorHerramienta, ClicsPorRuta, IngresosPorHerramienta } from "./tipos";

/**
 * Atlas Revenue — lectura agregada.
 *
 * Cálculo puro, sin base de datos ni React: recibe lo que devuelve el
 * repositorio y produce las cifras que ve la propietaria. Así se puede probar
 * de verdad y reutilizar desde el panel o desde un CLI.
 *
 * **Deliberadamente NO cruza comisión con puntuación.** Ni siquiera lee la
 * puntuación: una herramienta que paga mucho y se recomienda poco tiene que
 * verse tal cual, no convertirse en una cifra combinada que empuje a
 * recomendarla más. Ese cortafuegos es el mismo que ya respeta
 * `priorizador.ts` en Affiliate Manager.
 */

export type FilaRevenue = {
  herramientaId: string;
  clics: number;
  clicsPorAfiliado: number;
  /** Clics que fueron a la URL oficial por no haber enlace propio: dinero que se está dejando encima de la mesa. */
  clicsPerdidos: number;
  conversiones: number;
  importeCentimos: number;
  moneda: string;
  /** Conversiones entre clics de afiliado, en tanto por uno. `undefined` si todavía no hubo clics de afiliado. */
  tasaConversion?: number;
};

export function construirFilas(
  clics: ClicsPorHerramienta[],
  ingresos: IngresosPorHerramienta[]
): FilaRevenue[] {
  const porHerramienta = new Map<string, FilaRevenue>();

  for (const c of clics) {
    porHerramienta.set(c.herramientaId, {
      herramientaId: c.herramientaId,
      clics: c.total,
      clicsPorAfiliado: c.porAfiliado,
      clicsPerdidos: c.porOficial,
      conversiones: 0,
      importeCentimos: 0,
      moneda: "EUR",
    });
  }

  for (const i of ingresos) {
    const fila = porHerramienta.get(i.herramientaId) ?? {
      herramientaId: i.herramientaId,
      clics: 0,
      clicsPorAfiliado: 0,
      clicsPerdidos: 0,
      conversiones: 0,
      importeCentimos: 0,
      moneda: i.moneda,
    };
    fila.conversiones += i.conversiones;
    fila.importeCentimos += i.importeCentimos;
    fila.moneda = i.moneda;
    porHerramienta.set(i.herramientaId, fila);
  }

  for (const fila of porHerramienta.values()) {
    // Solo tiene sentido sobre los clics que de verdad podían convertir: un
    // clic a la URL oficial nunca iba a generar comisión, así que meterlo en
    // el denominador inventaría una tasa peor de la real.
    if (fila.clicsPorAfiliado > 0) fila.tasaConversion = fila.conversiones / fila.clicsPorAfiliado;
  }

  return [...porHerramienta.values()].sort(
    (a, b) => b.importeCentimos - a.importeCentimos || b.clics - a.clics || a.herramientaId.localeCompare(b.herramientaId)
  );
}

export type ResumenRevenue = {
  clicsTotales: number;
  clicsPorAfiliado: number;
  clicsPerdidos: number;
  conversiones: number;
  importeCentimos: number;
  herramientasConClics: number;
};

export function resumir(filas: FilaRevenue[]): ResumenRevenue {
  return filas.reduce<ResumenRevenue>(
    (acc, f) => ({
      clicsTotales: acc.clicsTotales + f.clics,
      clicsPorAfiliado: acc.clicsPorAfiliado + f.clicsPorAfiliado,
      clicsPerdidos: acc.clicsPerdidos + f.clicsPerdidos,
      conversiones: acc.conversiones + f.conversiones,
      importeCentimos: acc.importeCentimos + f.importeCentimos,
      herramientasConClics: acc.herramientasConClics + (f.clics > 0 ? 1 : 0),
    }),
    { clicsTotales: 0, clicsPorAfiliado: 0, clicsPerdidos: 0, conversiones: 0, importeCentimos: 0, herramientasConClics: 0 }
  );
}

/**
 * Cuánto tráfico se está yendo por la URL oficial en vez de por un enlace
 * propio. Es la cifra más accionable del informe cuando aún faltan altas: no
 * dice qué ganamos, dice qué estamos dejando de ganar.
 */
export function proporcionDeClicsPerdidos(resumen: ResumenRevenue): number | undefined {
  if (resumen.clicsTotales === 0) return undefined;
  return resumen.clicsPerdidos / resumen.clicsTotales;
}

/** Céntimos a texto legible, sin coma flotante por el camino. */
export function formatearImporte(centimos: number, moneda = "EUR"): string {
  const signo = centimos < 0 ? "-" : "";
  const abs = Math.abs(centimos);
  return `${signo}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, "0")} ${moneda}`;
}

export function ordenarRutas(rutas: ClicsPorRuta[]): ClicsPorRuta[] {
  return [...rutas].sort((a, b) => b.total - a.total || a.rutaOrigen.localeCompare(b.rutaOrigen));
}
