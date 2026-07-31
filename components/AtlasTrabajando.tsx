import { Check } from "lucide-react";
import AvatarAgente from "@/components/ui/AvatarAgente";

/**
 * P-02 ("Atlas está trabajando"): convierte la espera del motor —hoy
 * instantánea desde el servidor— en la prueba de que el Evaluador cruza tu
 * situación con criterios reales, no en un spinner genérico.
 *
 * Los 5 criterios de abajo son un subconjunto curado de los 10 que evalúa
 * de verdad `lib/recommendationEngine/criterios.ts` — mostrar los 10 en
 * bruto abrumaría más de lo que educa (Sheet 12 del documento de
 * arquitectura UX), así que el resto se resume en una línea aparte.
 */

const CRITERIOS_DESTACADOS = [
  { etiqueta: "Tamaño de empresa", explicacion: "Comprobando qué tan bien encaja con negocios de tu tamaño." },
  { etiqueta: "Presupuesto", explicacion: "Cruzando precios reales con lo que puedes invertir." },
  { etiqueta: "Facilidad de uso", explicacion: "Viendo qué tan fácil es empezar a usarla hoy mismo." },
  { etiqueta: "Nivel técnico requerido", explicacion: "Comprobando si tu equipo puede sacarle partido sin fricción." },
  { etiqueta: "Integraciones", explicacion: "Revisando si conecta con lo que ya usas." },
] as const;

const OTROS_CRITERIOS = ["Sector", "Curva de aprendizaje", "Idioma", "Casos no recomendados", "Metodología de valoración"];

const PORCENTAJE_POR_CRITERIO = 100 / CRITERIOS_DESTACADOS.length;

export default function AtlasTrabajando({
  progreso,
  totalHerramientas,
}: {
  progreso: number;
  totalHerramientas: number | null;
}) {
  const completados = Math.min(
    Math.floor(progreso / PORCENTAJE_POR_CRITERIO),
    CRITERIOS_DESTACADOS.length
  );

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <AvatarAgente id="evaluador" tamano="grande" />

      <p className="mt-4 text-sm font-semibold text-agente-evaluador">Evaluador</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Cruzando tu situación con criterios reales
      </h1>
      <p className="mt-2 min-h-6 text-sm text-slate-500">
        {totalHerramientas !== null
          ? `Evaluamos ${totalHerramientas} herramientas de nuestro catálogo para ti.`
          : "No es una lista fija: cada herramienta se puntúa de nuevo para tu caso."}
      </p>

      <ul className="mt-8 w-full max-w-sm space-y-3 text-left">
        {CRITERIOS_DESTACADOS.map((criterio, i) => {
          const hecho = i < completados;
          return (
            <li key={criterio.etiqueta} className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  hecho
                    ? "border-agente-evaluador bg-agente-evaluador text-white"
                    : "border-slate-300 bg-white"
                }`}
              >
                {hecho && <Check className="h-3 w-3" aria-hidden="true" />}
              </span>
              <span>
                <span
                  className={`block text-sm font-semibold transition-colors ${
                    hecho ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {criterio.etiqueta}
                </span>
                <span className={`block text-xs transition-colors ${hecho ? "text-slate-500" : "text-slate-300"}`}>
                  {criterio.explicacion}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 max-w-sm text-xs leading-relaxed text-slate-400">
        + {OTROS_CRITERIOS.join(", ").toLowerCase()}.
      </p>

      <div className="mt-8 w-full max-w-sm">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-agente-evaluador transition-[width] duration-200 ease-out"
            style={{ width: `${Math.min(progreso, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-right text-xs font-medium text-slate-400">
          {Math.round(Math.min(progreso, 100))}%
        </p>
      </div>
    </div>
  );
}
