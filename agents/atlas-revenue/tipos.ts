/**
 * Tipos y constantes de Atlas Revenue, **sin dependencias de servidor**.
 *
 * Existe por una razón concreta: el formulario del panel es un componente de
 * cliente y necesita la lista de estados. Si la importara de `repositorio.ts`,
 * arrastraría `pg` —y con él `dns`, `net`, `tls`— al paquete del navegador, y
 * el build falla. Separar el vocabulario de la conexión es lo que permite que
 * los dos lados compartan una única definición sin compartir dependencias.
 */

export const ESTADOS_INGRESO = ["pendiente", "confirmado", "revertido"] as const;
export type EstadoIngreso = (typeof ESTADOS_INGRESO)[number];

export type AsientoIngreso = {
  herramientaId: string;
  /** Mes al que corresponde, "YYYY-MM". */
  periodo: string;
  conversiones: number;
  /** En céntimos enteros: el dinero no se guarda en coma flotante. */
  importeCentimos: number;
  moneda: string;
  estado: EstadoIngreso;
  fuente?: string;
  nota?: string;
};

export type ClicsPorHerramienta = {
  herramientaId: string;
  total: number;
  porAfiliado: number;
  porOficial: number;
};

export type ClicsPorRuta = { rutaOrigen: string; total: number };
export type ClicsPorPantalla = { origen: string; total: number };

export type IngresosPorHerramienta = {
  herramientaId: string;
  conversiones: number;
  importeCentimos: number;
  moneda: string;
};
