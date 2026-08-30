import { crearProveedorPostgres } from "./proveedores/postgres";
import type { ProveedorAnalitica } from "./proveedorAnalitica";

/**
 * Único punto de decisión de qué `ProveedorAnalitica` usa la app. Hoy
 * siempre el proveedor de consola (ver su comentario) — esta función
 * existe igualmente, en vez de importar `crearProveedorPostgres` a mano
 * desde la ruta, para que el día que se decida un destino real de
 * analítica el cambio sea aquí y en ningún otro sitio.
 */
export function obtenerProveedorAnalitica(): ProveedorAnalitica {
  return crearProveedorPostgres();
}
