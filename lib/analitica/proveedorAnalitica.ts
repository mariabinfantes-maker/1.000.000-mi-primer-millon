/**
 * Contrato del seguimiento de clics salientes — mismo patrón que
 * `ProveedorIA` y `ProveedorEmail`: la app solo conoce esta interfaz, nunca
 * un destino concreto, así que conectar un destino real de analítica
 * (PostHog, un almacén propio, lo que se decida) es escribir un adaptador
 * nuevo, no tocar `app/api/clic/route.ts` ni `BotonIrAlProveedor`.
 *
 * Por qué "preparar" y no "implementar analítica completa" (fase 2 del
 * plan de lanzamiento, ver ATLAS.md): hoy no existe ningún destino de
 * analítica decidido, así que el único proveedor real por ahora
 * (`proveedores/consola.ts`) escribe una línea de log estructurada — útil
 * de inmediato (se puede seguir en los logs del entorno de despliegue) y
 * lista para redirigirse a un destino real el día que se decida, sin tocar
 * el resto de la app.
 */

/** El único punto de salida de todo el catálogo es `/herramienta/[id]/ir` (ver ATLAS.md) — de ahí solo dos tipos posibles de enlace. */
export type TipoEnlaceClic = "afiliado" | "oficial";

/** Desde qué pantalla se originó el clic — permite comparar qué ubicación convierte mejor. */
export type OrigenClic = "resultado" | "comparar" | "ficha" | "desconocido";

export type EventoClic = {
  herramientaId: string;
  categoriaId: string;
  tipoEnlace: TipoEnlaceClic;
  origen: OrigenClic;
};

export type ProveedorAnalitica = {
  nombre: string;
  /** Nunca lanza ni bloquea: un fallo al registrar un clic no debe impedir que el usuario llegue al proveedor. */
  registrarClic(evento: EventoClic): Promise<void>;
};
