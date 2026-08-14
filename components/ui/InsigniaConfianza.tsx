import AvatarAgente from "@/components/ui/AvatarAgente";
import { getAgente } from "@/lib/agentes";

const RESEARCHER = getAgente("researcher");

function formatearFecha(fechaISO: string): string {
  return new Date(`${fechaISO}T00:00:00`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * La única forma en que el Researcher se hace visible: no corre en vivo
 * durante la sesión del usuario (investiga fuera de línea, antes de que
 * exista un catálogo que mostrar), así que su presencia se comunica como
 * credencial de confianza, no como animación en directo — a diferencia del
 * Evaluador (P-02) y el Recomendador (P-03).
 *
 * Muestra solo `fechaUltimaRevision`, el único dato de confianza que hoy
 * persiste en el catálogo público. `NivelConfianza` y el nº de fuentes
 * existen en `HerramientaPropuesta` (el borrador de investigación) pero no
 * se guardan en `data/herramientas/*.json` una vez curada la ficha —
 * mostrarlos aquí exigiría antes decidir si se empieza a persistir esa
 * información, y no es una decisión que corresponda tomar en silencio.
 */
export default function InsigniaConfianza({ fechaUltimaRevision }: { fechaUltimaRevision: string }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
      <AvatarAgente id="researcher" tamano="pequeno" />
      <div>
        <p className="text-sm font-semibold text-agente-researcher">{RESEARCHER.nombre}</p>
        <p className="text-xs text-slate-500">Revisado el {formatearFecha(fechaUltimaRevision)}</p>
      </div>
    </div>
  );
}
