import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { construirComparativa } from "@/lib/comparador";
import { calcularPuntuacionAtlas } from "@/lib/puntuacionAtlas";
import type { HerramientaEvaluada } from "@/agents/atlas-advisor";
import AnilloPuntuacion from "@/components/ui/AnilloPuntuacion";
import Boton from "@/components/ui/Boton";

/**
 * Cabecera + filas de la comparativa lado a lado — extraído de
 * `PantallaComparador.tsx` (P-05) para que también lo reutilice la página
 * estática de comparación par a par (Atlas Generador de Contenido) sin
 * duplicar el JSX. Puramente presentacional: recibe `HerramientaEvaluada[]`
 * ya calculadas por Evaluador, nunca vuelve a puntuar nada — igual que
 * `construirComparativa`, del que es la vista.
 */
export default function TablaComparativa({ evaluadas }: { evaluadas: HerramientaEvaluada[] }) {
  const filas = construirComparativa(evaluadas);
  // La comparativa por sí sola ya distingue una mejor encajada (fila a fila,
  // "gana X"); el CTA principal sigue el mismo criterio a nivel de conjunto
  // — sin esto, comparar era el único paso del recorrido sin salida directa
  // al proveedor, un callejón entre la recomendación y la conversión.
  const mejorPuntuacion = Math.max(...evaluadas.map((e) => e.puntuacionTotal));

  return (
    <>
      <div className="comparador-grid gap-4" style={{ "--comparador-columnas": evaluadas.length } as CSSProperties}>
        {evaluadas.map((evaluada) => {
          const puntuacion = calcularPuntuacionAtlas(evaluada.herramienta);
          const esMejorEncaje = evaluadas.length > 1 && evaluada.puntuacionTotal === mejorPuntuacion;
          return (
            <div
              key={evaluada.herramienta.id}
              className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.02]"
            >
              {puntuacion && <AnilloPuntuacion puntuacion={puntuacion.puntuacion} />}
              <span className="font-display text-sm font-bold text-slate-900">{evaluada.herramienta.nombre}</span>
              <Boton
                href={`/herramienta/${evaluada.herramienta.id}/ir`}
                variante={esMejorEncaje ? "primario" : "secundario"}
                className="mt-1 w-full"
              >
                Ir al proveedor
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Boton>
            </div>
          );
        })}
      </div>

      {filas.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-slate-200/80 bg-white p-6 text-sm leading-relaxed text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.02]">
          Estas opciones están muy igualadas: no hay diferencias claras entre ellas en los criterios que
          evaluamos.
        </p>
      ) : (
        <div className="mt-10 space-y-5">
          {filas.map((fila) => (
            <div
              key={fila.criterio}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.02]"
            >
              <h3 className="text-sm font-semibold text-slate-900">{fila.etiqueta}</h3>
              <p className="mt-0.5 text-xs text-slate-500">{fila.explicacionCriterio}</p>

              <div className="comparador-grid mt-4 gap-3" style={{ "--comparador-columnas": fila.celdas.length } as CSSProperties}>
                {fila.celdas.map((celda) => (
                  <div
                    key={celda.herramientaId}
                    className={`rounded-xl border p-3 text-sm leading-relaxed transition-colors ${
                      celda.gana
                        ? "border-agente-evaluador bg-agente-evaluador-soft text-slate-800"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-500">{celda.nombre}</p>
                    <p className="mt-1">{celda.explicacion || "Sin diferencia destacable aquí."}</p>
                  </div>
                ))}
              </div>

              {fila.hayGanadorUnico && (
                <p className="mt-3 text-xs font-semibold text-agente-evaluador">
                  En {fila.etiqueta.toLowerCase()}, gana {fila.celdas.find((c) => c.gana)?.nombre}.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
