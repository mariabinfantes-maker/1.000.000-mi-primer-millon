import type { Metadata } from "next";
import { resolverResultadoCompartido } from "@/lib/resultadoCompartido";
import { rutaDesdeOrigenDiagnostico } from "@/agents/atlas-revenue/rutaOrigen";
import PantallaComparador from "@/components/PantallaComparador";
import Boton from "@/components/ui/Boton";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const resultado = resolverResultadoCompartido(token);
  if (!resultado) return { title: "Enlace no válido", robots: { index: false, follow: true } };

  return {
    title: `Comparar: ${resultado.top.map((e) => e.herramienta.nombre).join(" vs ")}`,
    robots: { index: false, follow: true },
  };
}

export default async function ResultadoComparadorPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const resultado = resolverResultadoCompartido(token);

  if (!resultado || resultado.top.length < 2) {
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

  return <PantallaComparador token={token} top={resultado.top} rutaOrigen={rutaDesdeOrigenDiagnostico(resultado.origen)} />;
}
