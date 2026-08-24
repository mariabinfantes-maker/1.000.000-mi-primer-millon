import type { Metadata } from "next";
import { resolverResultadoCompartido } from "@/lib/resultadoCompartido";
import PantallaRecomendacion from "@/components/PantallaRecomendacion";
import Boton from "@/components/ui/Boton";

/**
 * Resultado persistente y compartible (sustituye a las antiguas
 * `/[puerta]/recomendacion`, que dependían de `sessionStorage` y solo
 * funcionaban en la misma pestaña donde se hizo el cuestionario). Todo el
 * estado necesario viaja en `token` — ver `lib/resultadoToken.ts` — así
 * que esta página funciona igual recién calculada, compartida a otra
 * persona, o abierta un año después desde un marcador.
 *
 * Nunca indexable: es una recomendación personalizada para quien tiene el
 * enlace, no contenido editorial (ver `metadataFlujo` para el resto de
 * páginas de flujo). La imagen social la resuelve por su cuenta el
 * convenio de archivo `opengraph-image.tsx` de esta misma carpeta — por
 * eso `openGraph` no fija `images` aquí.
 */
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const resultado = resolverResultadoCompartido(token);
  if (!resultado) {
    return { title: "Enlace no válido", robots: { index: false, follow: true } };
  }

  const mejor = resultado.top[0].herramienta.nombre;
  const titulo = `Tu recomendación: ${mejor}`;
  const descripcion =
    resultado.top.length > 1
      ? `Molnip recomienda ${mejor} y ${resultado.top.length - 1} opción más para tu empresa.`
      : `Molnip recomienda ${mejor} para tu empresa.`;

  return {
    title: titulo,
    description: descripcion,
    robots: { index: false, follow: true },
    openGraph: { title: `${titulo} | Molnip`, description: descripcion, type: "website", locale: "es_ES" },
    twitter: { card: "summary_large_image", title: `${titulo} | Molnip`, description: descripcion },
  };
}

export default async function ResultadoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const resultado = resolverResultadoCompartido(token);

  if (!resultado) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Este enlace no es válido
        </h1>
        <p className="mt-2 leading-relaxed text-slate-600">
          Puede que esté incompleto, mal copiado, o que apunte a una recomendación que ya no podemos reconstruir.
          Responde de nuevo al cuestionario y te daremos un enlace nuevo.
        </p>
        <Boton href="/" className="mt-6">
          Volver al inicio
        </Boton>
      </div>
    );
  }

  return <PantallaRecomendacion origen={resultado.origen} token={token} top={resultado.top} />;
}
