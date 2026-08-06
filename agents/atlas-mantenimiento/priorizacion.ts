import type { Herramienta } from "@/data/esquema";
import { calcularPuntuacionAtlas } from "@/lib/puntuacionAtlas";
import type { AvisoFrescura } from "./frescura";

/**
 * Prioriza los avisos de frescura por Puntuación Atlas — mismo criterio y
 * mismo motivo que `agents/atlas-affiliate-manager/priorizador.ts`: es una
 * señal real ya calculada, y revisar primero las herramientas mejor
 * valoradas (las que más se recomiendan) es más rentable que revisarlas en
 * un orden arbitrario. No inventa ninguna cifra nueva.
 */

export type AvisoFrescuraPriorizado = AvisoFrescura & {
  nombreHerramienta: string;
  puntuacionAtlas: number | null;
};

export function priorizarAvisosFrescura(avisos: AvisoFrescura[], herramientas: Herramienta[]): AvisoFrescuraPriorizado[] {
  const porId = new Map(herramientas.map((h) => [h.id, h]));

  return avisos
    .map((aviso) => {
      const herramienta = porId.get(aviso.herramientaId);
      return {
        ...aviso,
        nombreHerramienta: herramienta?.nombre ?? aviso.herramientaId,
        puntuacionAtlas: herramienta ? (calcularPuntuacionAtlas(herramienta)?.puntuacion ?? null) : null,
      };
    })
    .sort((a, b) => (b.puntuacionAtlas ?? -1) - (a.puntuacionAtlas ?? -1));
}
