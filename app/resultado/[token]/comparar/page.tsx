import type { Metadata } from "next";
import { resolverResultadoCompartido } from "@/lib/resultadoCompartido";
import { separarPorRespaldo } from "@/agents/atlas-advisor";
import { rutaDesdeOrigenDiagnostico } from "@/agents/atlas-revenue/rutaOrigen";
import PantallaComparador from "@/components/PantallaComparador";
import Boton from "@/components/ui/Boton";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const resultado = resolverResultadoCompartido(token);
  if (!resultado) return { title: "Enlace no válido", robots: { index: false, follow: true } };

  const { respaldadas } = separarPorRespaldo(resultado.top, resultado.evidencia);
  const nombres = respaldadas.map((e) => e.herramienta.nombre).join(" vs ");
  return {
    title: resultado.usoSinConfirmar ? `Comparar candidatas sin confirmar: ${nombres}` : `Comparar: ${nombres}`,
    ...(resultado.usoSinConfirmar ? { description: resultado.usoSinConfirmar.tarjeta } : {}),
    robots: { index: false, follow: true },
  };
}

export default async function ResultadoComparadorPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const resultado = resolverResultadoCompartido(token);
  // El comparador sólo compara las opciones con respaldo suficiente; los
  // candidatos pendientes se quedan fuera (decisión del 2026-09-16).
  const respaldadas = resultado ? separarPorRespaldo(resultado.top, resultado.evidencia).respaldadas : [];

  if (!resultado || respaldadas.length < 2) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Todavía no hay nada que comparar
        </h1>
        <p className="mt-2 leading-relaxed text-slate-600">
          {resultado
            ? "Esta recomendación solo tiene una opción, así que no hay nada que poner una junto a otra."
            : "Este enlace no es válido o ha dejado de estar disponible."}
        </p>
        <Boton href={resultado ? `/resultado/${token}` : "/"} className="mt-6">
          {resultado ? "Ver tu recomendación" : "Volver al inicio"}
        </Boton>
      </div>
    );
  }

  return (
    <PantallaComparador
      token={token}
      top={respaldadas}
      rutaOrigen={rutaDesdeOrigenDiagnostico(resultado.origen)}
      usoSinConfirmar={resultado.usoSinConfirmar}
    />
  );
}
