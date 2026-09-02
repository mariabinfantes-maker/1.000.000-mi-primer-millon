import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import EstadoVacio from "@/components/ui/EstadoVacio";
import Boton from "@/components/ui/Boton";
import type { MotivoSinRecomendacion } from "@/agents/atlas-advisor";

/**
 * Lo que ve alguien cuando Molnip decide NO recomendar nada.
 *
 * Antes esta pantalla no podía existir: el motor siempre devolvía tres
 * herramientas, aunque no hubiera entendido la pregunta. Ahora puede decir
 * que no, y esta es la cara de ese "no".
 *
 * Dos decisiones de tono, ambas deliberadas:
 *
 *  - **La culpa es nuestra, nunca de quien pregunta.** "No he sabido
 *    entender lo que necesitas", no "no has escrito bien". Quien llega aquí
 *    ya ha explicado su problema con sus palabras; decirle que lo ha hecho
 *    mal es la peor respuesta posible.
 *  - **Nunca se queda en un callejón sin salida.** Siempre hay un camino
 *    hacia delante: las categorías, que son la vía experta y sí funcionan.
 *
 * Reutiliza `EstadoVacio` (la piedra sin tallar del Sistema Prisma), que ya
 * es el tratamiento de "aquí todavía no hay nada" en las páginas de
 * categoría, problema y alternativas. Mismo lenguaje visual, ningún
 * componente nuevo.
 */
export default function SinRecomendacion({ motivo }: { motivo: MotivoSinRecomendacion }) {
  const noEntendido = motivo.tipo === "necesidad_no_entendida";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-20">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
        {noEntendido ? "No lo he entendido" : "Todavía no lo cubrimos"}
      </p>

      <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        {noEntendido
          ? "No he sabido entender qué necesitas"
          : "Todavía no tenemos herramientas para esto"}
      </h1>

      <p className="mt-4 leading-relaxed text-slate-600">
        {noEntendido ? (
          <>
            Prefiero decírtelo antes que recomendarte cualquier cosa. Molnip solo recomienda cuando
            entiende el problema: si te enseñara tres herramientas ahora, estaría adivinando, y una
            recomendación adivinada te haría perder tiempo y dinero.
          </>
        ) : (
          <>
            He entendido lo que necesitas, y esa es la buena noticia. La mala es que nuestro
            catálogo todavía no tiene ninguna herramienta que lo resuelva de verdad. Prefiero
            decírtelo a ofrecerte algo parecido que no te vale.
          </>
        )}
      </p>

      <EstadoVacio
        mensaje={
          noEntendido
            ? "Molnip no rellena huecos: cuando no sabe qué recomendar, lo dice."
            : "Cuando investiguemos herramientas de este tipo, entrarán en el catálogo con la misma exigencia que el resto."
        }
      />

      <div className="mt-10 rounded-2xl border border-slate-200/80 bg-white p-6 ring-1 ring-contorno">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-slate-900">
          <Compass className="h-5 w-5 text-brand-600" aria-hidden="true" />
          Prueba por el tipo de herramienta
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Si sabes más o menos qué clase de programa buscas, elígelo directamente. Ahí sí puedo
          compararte alternativas reales.
        </p>
        <Boton href="/#elige-camino" className="mt-4">
          Ver los tipos de herramienta
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Boton>
      </div>

      <p className="mt-8 text-sm text-slate-500">
        ¿Prefieres empezar de cero?{" "}
        <Link href="/" className="font-semibold text-brand-600 underline-offset-4 hover:underline">
          Volver al inicio
        </Link>
        .
      </p>
    </div>
  );
}
