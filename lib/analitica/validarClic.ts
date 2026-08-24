import type { EventoClic, OrigenClic, TipoEnlaceClic } from "./proveedorAnalitica";

const TIPOS_ENLACE_VALIDOS: TipoEnlaceClic[] = ["afiliado", "oficial"];
const ORIGENES_VALIDOS: OrigenClic[] = ["resultado", "comparar", "ficha", "desconocido"];

export type CuerpoClic = {
  herramientaId?: unknown;
  categoriaId?: unknown;
  tipoEnlace?: unknown;
  origen?: unknown;
};

export type ResultadoValidacionClic = { ok: true; evento: EventoClic } | { ok: false; error: string };

/**
 * Validación pura del cuerpo de `POST /api/clic`, separada de la ruta en
 * sí — mismo patrón que `validarSuscripcion.ts`. `origen` cae a
 * "desconocido" en vez de rechazar la petición si llega vacío o con un
 * valor fuera del vocabulario fijo: perder la etiqueta de origen no debe
 * impedir registrar que el clic ocurrió.
 */
export function validarClic(cuerpo: CuerpoClic): ResultadoValidacionClic {
  if (typeof cuerpo.herramientaId !== "string" || cuerpo.herramientaId.trim() === "") {
    return { ok: false, error: "Falta herramientaId." };
  }

  if (typeof cuerpo.categoriaId !== "string" || cuerpo.categoriaId.trim() === "") {
    return { ok: false, error: "Falta categoriaId." };
  }

  if (typeof cuerpo.tipoEnlace !== "string" || !TIPOS_ENLACE_VALIDOS.includes(cuerpo.tipoEnlace as TipoEnlaceClic)) {
    return { ok: false, error: "tipoEnlace debe ser 'afiliado' u 'oficial'." };
  }

  const origen =
    typeof cuerpo.origen === "string" && ORIGENES_VALIDOS.includes(cuerpo.origen as OrigenClic)
      ? (cuerpo.origen as OrigenClic)
      : "desconocido";

  return {
    ok: true,
    evento: {
      herramientaId: cuerpo.herramientaId,
      categoriaId: cuerpo.categoriaId,
      tipoEnlace: cuerpo.tipoEnlace as TipoEnlaceClic,
      origen,
    },
  };
}
