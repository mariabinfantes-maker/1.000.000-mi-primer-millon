import type { EstrategiaAfiliacion } from "@/data/esquemaInterno";
import { generarIdCuenta } from "../estrategiaAfiliacion";
import type { EntradaLoteEstrategia } from "../lote";

/**
 * A qué cuenta de la herramienta se refiere una fila del archivo.
 *
 * El CLI deriva el identificador de cuenta del nombre de la plataforma
 * cuando no se indica otra cosa. En una orden de terminal eso tiene sentido:
 * quien escribe `--plataforma Impact` está diciendo de qué cuenta habla.
 *
 * En una hoja de cálculo no. Ahí `plataforma` es una columna descriptiva más,
 * y casi siempre viene rellena en todas las filas. Aplicando la regla del CLI,
 * un archivo perfectamente razonable crearía una cuenta paralela nueva en cada
 * herramienta en vez de actualizar la que ya existe: los enlaces acabarían en
 * cuentas recién inventadas y las de siempre se quedarían como estaban.
 *
 * Lo destapó la vista previa al decir «creará» donde debía decir «sin
 * cambios». Es exactamente para lo que sirve mirar antes de aplicar.
 *
 * Regla, en orden:
 *  1. Si la fila nombra la cuenta, esa.
 *  2. Si la herramienta ya tiene una sola cuenta, esa — el caso normal.
 *  3. Si hay varias y la fila trae plataforma, la que corresponda a esa
 *     plataforma; si ninguna corresponde, se deriva de ella (cuenta nueva).
 *  4. En última instancia, "principal".
 */
export function resolverCuentaId(
  entrada: EntradaLoteEstrategia,
  existente: EstrategiaAfiliacion | undefined
): string {
  const nombrada = entrada.cuenta?.trim();
  if (nombrada) return nombrada;

  const cuentas = existente?.cuentas ?? [];
  if (cuentas.length === 1) return cuentas[0].id;

  const plataforma = entrada.plataforma?.trim();
  if (plataforma) {
    const porPlataforma = cuentas.find(
      (c) => c.plataforma?.toLowerCase() === plataforma.toLowerCase()
    );
    if (porPlataforma) return porPlataforma.id;
    return generarIdCuenta(plataforma);
  }

  return "principal";
}

/**
 * Fija la cuenta en cada entrada ANTES de previsualizar y de aplicar.
 *
 * Que las dos cosas la resuelvan por su cuenta sería pedir que se
 * desincronicen: una vista previa que no describe lo que va a pasar es peor
 * que no tenerla, porque invita a confiar.
 */
export function fijarCuentas(
  entradas: EntradaLoteEstrategia[],
  existentes: ReadonlyMap<string, EstrategiaAfiliacion>
): EntradaLoteEstrategia[] {
  return entradas.map((entrada) => ({
    ...entrada,
    cuenta: resolverCuentaId(entrada, existentes.get((entrada.id ?? "").trim())),
  }));
}
