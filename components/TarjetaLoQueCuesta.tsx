import { ExternalLink, ShieldCheck, ShieldQuestion } from "lucide-react";

/**
 * «Lo que te va a costar» — el dinero, aparte del consejo.
 *
 * Decisión de la propietaria (2026-09-18): «esta es la mejor en tu
 * especialidad, y al lado o abajo una tarjeta que explique el plan
 * comercial». Ver ATLAS.md, «ESTAMOS ENDIOSANDO LO GRATIS».
 *
 * UNA PREGUNTA, UNA RESPUESTA. La primera versión decía cuatro cosas de
 * dinero a la vez —precio de entrada, etiqueta de gratis, plan que necesita,
 * fecha de comprobación— y dos se contradecían: leías «Gratis, indefinido» y
 * en la línea siguiente «necesitas 29 $». La propietaria lo cortó en seco:
 * «es demasiado confusa». Ahora hay una cifra que contesta «¿esto, a mí,
 * cuánto me cuesta?» y debajo el detalle para quien lo quiera.
 *
 * ACOMPAÑA, NO COMPITE. Sin color de marca, sin sombra: si pesara lo mismo
 * que la recomendación habríamos hecho un comparador de precios en dos cajas.
 * Lo único grande es la cifra, porque es la respuesta.
 *
 * Y ES EL ÚLTIMO PASO ANTES DE DECIDIR. Por eso termina diciendo qué pasa si
 * pulsa —«puedes probarla 14 días antes de pagar»— y por eso el botón va
 * después de esto y no antes: pedirle que actúe antes de decirle el precio es
 * pedirle un salto a ciegas.
 *
 * Contrato plano a propósito: sólo cadenas ya redactadas. Quién decide CÓMO
 * se dice cada cosa es `lib/catalogoCompleto.ts`, para que la ficha, el
 * catálogo y esto no digan tres versiones del mismo dato.
 */
export type TarjetaLoQueCuestaProps = {
  /** La respuesta, en una cifra: «24 €/usuario/mes», «Nada», o el precio de entrada si no hubo diagnóstico. */
  cuanto: string;
  /** La letra pequeña: «Es su plan Starter. Mes a mes son 29 €.» */
  detalle?: string;
  /**
   * Ya redactado: «Precio comprobado en su web el 17 de septiembre de 2026»,
   * o la frase de que no se ha comprobado. Nunca vacío: que una página esté
   * viva es que tenga fecha, y que no la tenga también dice algo.
   */
  comprobacion: string;
  /** Si el precio se comprobó de verdad. Cambia el icono, no el texto. */
  estaComprobado: boolean;
  /** La página de precios del fabricante, para que pueda ir a mirarlo ella. */
  urlPrecios?: string;
  /**
   * Hubo diagnóstico y la evidencia no dice en qué plan está esa función. Se
   * dice, en vez de callarlo. Ausente cuando no hubo necesidad concreta que
   * preguntar: ahí no hay nada que confirmar ni que ocultar.
   */
  planSinConfirmar?: boolean;
};

export default function TarjetaLoQueCuesta({
  cuanto,
  detalle,
  comprobacion,
  estaComprobado,
  urlPrecios,
  planSinConfirmar,
}: TarjetaLoQueCuestaProps) {
  const IconoComprobacion = estaComprobado ? ShieldCheck : ShieldQuestion;

  return (
    <section aria-label="Lo que te va a costar" className="mt-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
      <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Lo que te va a costar</h3>

      <p className="font-display mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{cuanto}</p>

      {detalle && <p className="mt-1 text-sm leading-relaxed text-slate-600">{detalle}</p>}

      {planSinConfirmar && (
        <p className="mt-1 text-sm leading-relaxed text-slate-500">No hemos confirmado en qué plan está esa función.</p>
      )}

      <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-slate-500">
        <IconoComprobacion className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
        <span>
          {comprobacion}
          {urlPrecios && (
            <>
              {" "}
              <a
                href={urlPrecios}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-brand-600 inline-flex items-center gap-0.5 font-medium underline-offset-4 hover:underline"
              >
                Verlo tú
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </>
          )}
        </span>
      </p>
    </section>
  );
}
