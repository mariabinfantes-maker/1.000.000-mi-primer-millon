import { ShieldQuestion } from "lucide-react";

/**
 * Lo que ve alguien cuando Molnip NO ha podido confirmar lo que pedía.
 *
 * No es la pantalla de «no recomiendo nada» (`SinRecomendacion.tsx`): aquí sí
 * hay herramientas que enseñar, y precisamente por eso hace falta este aviso.
 * Enseñarlas sin él sería dejar creer que responden a lo que la persona
 * preguntó, que es la forma más cara de perder su confianza.
 *
 * Tres cosas que este texto NO puede hacer, y que hay pruebas para impedir:
 *
 *  - **Decir que las herramientas no lo tienen.** F2 hizo 1.544 comprobaciones
 *    y no obtuvo ni una ausencia demostrada. No sabemos que no lo hagan.
 *  - **Prometer que sí lo hacen.** El aviso también se enseñaría si algún día
 *    hubiera evidencia de que NO lo hacen, así que la frase tiene que ser
 *    verdad en los tres estados: sólo dice que no se puede confirmar.
 *  - **Afirmar que se revisaron todas sus páginas.** Puede tratarse de una
 *    herramienta que todavía no se ha comprobado; decir que se miró sería
 *    inventarse el trabajo hecho.
 *  - **Echarle la culpa a quien pregunta.** «No he podido confirmar», nunca
 *    «no lo has explicado bien».
 *
 * Sin componentes ni colores nuevos: los mismos tokens de marca que el resto.
 */
export default function AvisoSinVerificar({ necesidad }: { necesidad: string }) {
  return (
    <section
      aria-labelledby="aviso-sin-confirmar"
      className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 ring-1 ring-contorno sm:p-8"
    >
      <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand-600">
        <ShieldQuestion className="h-4 w-4" aria-hidden="true" />
        No he podido comprobarlo
      </p>

      <h2
        id="aviso-sin-confirmar"
        className="mt-2 font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
      >
        Con la información comprobada que tenemos, no he podido confirmar que estas herramientas
        hagan lo que necesitas
      </h2>

      <p className="mt-4 leading-relaxed text-slate-600">
        Lo que buscabas: <strong className="font-semibold text-slate-900">{necesidad}</strong>.
      </p>

      <p className="mt-3 leading-relaxed text-slate-600">
        Con la información comprobada que tenemos, no puedo darte esa necesidad por confirmada.
        Prefiero decírtelo antes que darte por buena una recomendación que no lo es.
      </p>
    </section>
  );
}
