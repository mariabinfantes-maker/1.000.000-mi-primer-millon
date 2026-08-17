import Image from "next/image";
import { Eye, Lock } from "lucide-react";
import { getHerramienta, getHerramientas } from "@/data/repositorio";
import { evaluarHerramienta } from "@/agents/atlas-advisor";
import { AGENTES, type IdAgente } from "@/lib/agentes";
import AvatarAgente from "@/components/ui/AvatarAgente";
import RevelarAlScroll from "@/components/ui/RevelarAlScroll";
import Boton from "@/components/ui/Boton";

const COLOR_TEXTO: Record<IdAgente, string> = {
  researcher: "text-agente-researcher",
  evaluador: "text-agente-evaluador",
  recomendador: "text-agente-recomendador",
};

/**
 * P-06: "Cómo trabaja Atlas" — no es un destino de navegación permanente
 * (no vive en el menú principal, que hoy ni siquiera existe como tal);
 * se enlaza solo desde la franja "Así piensa Atlas" del home. Es la pieza
 * educativa en sí misma, así que los tres ejemplos de abajo se calculan
 * de verdad con las funciones reales del motor — nunca texto inventado.
 */
export default function AgentesPage() {
  const herramientaEjemplo = getHerramienta("hubspot") ?? getHerramientas()[0];
  const evaluacionEjemplo = evaluarHerramienta(herramientaEjemplo, {
    tamanoEmpresa: "1-10",
    industria: "peluquería",
  });
  const explicacionCriterioEjemplo =
    evaluacionEjemplo.detalles.find((detalle) => detalle.explicacion !== "")?.explicacion ??
    evaluacionEjemplo.explicacion;

  const EJEMPLOS: Record<IdAgente, string> = {
    researcher: `Sobre ${herramientaEjemplo.nombre}: "${herramientaEjemplo.idealPara}"`,
    evaluador: explicacionCriterioEjemplo,
    recomendador: evaluacionEjemplo.explicacion,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="relative lg:pr-40">
        <div className="absolute -top-2 -right-4 hidden h-32 w-32 overflow-hidden rounded-3xl shadow-premium-lg lg:block">
          <Image
            src="/imagenes/marca/carga-luz.png"
            alt="Un cristal con un haz de luz visible por dentro, atravesándolo de un lado a otro"
            width={480}
            height={480}
            className="h-full w-full object-cover"
          />
        </div>

        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Transparencia</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Cómo trabaja Molnip
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
          Molnip no es una caja negra. Cada recomendación pasa por tres agentes distintos, cada uno con un
          trabajo concreto y con acceso solo a los datos que necesita — nunca a la información de afiliación,
          reservada al funcionamiento interno de Molnip.
        </p>
      </div>

      <div className="mt-10 space-y-6">
        {AGENTES.map((agente, i) => (
          <RevelarAlScroll key={agente.id} retrasoMs={i * 100}>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.02] sm:p-8">
              <div className="flex items-center gap-4">
                <AvatarAgente id={agente.id} tamano="grande" />
                <div>
                  <h2 className={`font-display text-xl font-bold ${COLOR_TEXTO[agente.id]}`}>{agente.nombre}</h2>
                  <p className="text-sm text-slate-500">{agente.rol}</p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-700">{agente.queHace}</p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-2 rounded-xl bg-emerald-50/60 p-3">
                  <Eye className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Datos públicos
                    </p>
                    <p className="mt-0.5 text-sm text-slate-600">{agente.datosPublicos}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Datos internos
                    </p>
                    <p className="mt-0.5 text-sm text-slate-600">{agente.datosInternos}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-brand-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Un ejemplo real</p>
                <p className="mt-1.5 text-sm leading-relaxed text-brand-900">{EJEMPLOS[agente.id]}</p>
              </div>
            </div>
          </RevelarAlScroll>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Boton href="/" variante="secundario">
          Volver al inicio
        </Boton>
      </div>
    </div>
  );
}
