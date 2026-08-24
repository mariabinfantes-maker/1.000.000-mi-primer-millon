import { Star } from "lucide-react";
import type { Reputacion } from "@/data/esquema";
import { elegirMejorFuenteReputacion } from "@/lib/reputacion";

/**
 * Prueba social real: puntuaciones de G2/Capterra ya investigadas por
 * Atlas Researcher (`data/esquema.ts`, tipo `Reputacion`) pero que hasta
 * ahora no se mostraban en ningún sitio del producto. Nunca inventa un
 * dato — si `reputacion` no existe o ninguna de las dos fuentes tiene
 * puntuación, no renderiza nada (ver el comentario de `Reputacion`: no
 * todas las herramientas tienen presencia en estas plataformas, y eso no
 * es un fallo).
 *
 * Muestra como mucho una fuente (ver `elegirMejorFuenteReputacion`): dos
 * insignias compitiendo por espacio en una tarjeta ya cargada de
 * información añaden ruido, no confianza.
 */
export default function InsigniaReputacion({ reputacion }: { reputacion: Reputacion | undefined }) {
  const fuente = elegirMejorFuenteReputacion(reputacion);
  if (!fuente) return null;

  return (
    <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
      <Star className="h-3.5 w-3.5 fill-current text-slate-700" aria-hidden="true" />
      {fuente.puntuacion.toFixed(1)}
      <span className="font-normal text-slate-400">
        · {fuente.nombre}
        {fuente.numeroResenas ? ` (${fuente.numeroResenas})` : ""}
      </span>
    </span>
  );
}
