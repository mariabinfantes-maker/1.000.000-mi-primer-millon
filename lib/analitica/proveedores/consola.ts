import type { EventoClic, ProveedorAnalitica } from "../proveedorAnalitica";

const NOMBRE = "consola";

/**
 * Único proveedor real por ahora: escribe cada clic como una línea de log
 * estructurada (JSON, un evento por línea — fácil de filtrar y de
 * canalizar hacia cualquier destino real más adelante) en el log del
 * servidor. No es un placeholder que "finge" éxito como
 * `email/proveedores/simulado.ts`: es una decisión real, documentada en
 * ATLAS.md, mientras no exista un destino de analítica decidido.
 */
export function crearProveedorConsola(): ProveedorAnalitica {
  return {
    nombre: NOMBRE,
    async registrarClic(evento: EventoClic): Promise<void> {
      console.log(
        JSON.stringify({
          tipo: "clic_afiliado",
          fecha: new Date().toISOString(),
          ...evento,
        })
      );
    },
  };
}
