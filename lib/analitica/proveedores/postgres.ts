import { registrarClicSaliente } from "@/agents/atlas-revenue/repositorio";
import type { EventoClic, ProveedorAnalitica } from "../proveedorAnalitica";

/**
 * Destino real de la medición: la tabla `clics_salientes` de Atlas Revenue.
 *
 * Sustituye al proveedor de consola, que escribía una línea de log y perdía
 * el dato. Mantiene su contrato palabra por palabra: **nunca lanza**. Cuando
 * este proveedor se ejecuta, la persona ya va camino del proveedor externo, y
 * perder la medición de un clic es infinitamente preferible a romperle el
 * recorrido o a devolverle un error que ni siquiera va a leer — `sendBeacon`
 * no espera respuesta.
 */
export function crearProveedorPostgres(): ProveedorAnalitica {
  return {
    nombre: "postgres",
    async registrarClic(evento: EventoClic): Promise<void> {
      // `registrarClicSaliente` ya absorbe sus propios fallos y devuelve
      // false; el await no puede rechazar. El try es el cinturón por si
      // algún día esa garantía cambiara.
      try {
        await registrarClicSaliente(evento);
      } catch {
        // Silencio deliberado: ver el comentario de arriba.
      }
    },
  };
}
