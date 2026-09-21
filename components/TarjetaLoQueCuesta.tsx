import { CircleDollarSign, ExternalLink, ShieldCheck, ShieldQuestion } from "lucide-react";
import Etiqueta from "@/components/ui/Etiqueta";

/**
 * «Lo que te va a costar» — el dinero, aparte del consejo.
 *
 * Decisión de la propietaria (2026-09-18): «esta es la mejor en tu
 * especialidad, y al lado o abajo una tarjeta que explique el plan
 * comercial». Ver ATLAS.md, «ESTAMOS ENDIOSANDO LO GRATIS».
 *
 * Son dos cosas distintas y por eso van separadas:
 *
 *  - La recomendación dice cuál le sirve. Eso lo decide Molnip y no habla
 *    de dinero.
 *  - Esto dice lo que cuesta. Eso lo decide ella.
 *
 * Y hay una razón técnica además de la de producto: **las dos no envejecen
 * igual.** Lo que una herramienta hace se comprobó con su cita y cambia
 * despacio; lo que cuesta cambió en 20 de 22 fichas en dos días de septiembre
 * de 2026. Meterlo en la misma caja daría a entender que son igual de firmes.
 *
 * ACOMPAÑA, NO COMPITE. Sin color de marca, sin sombra, tipografía menor: si
 * pesara lo mismo que la recomendación habríamos hecho un comparador de
 * precios en dos cajas. Que se lea entero, pero después.
 *
 * Contrato plano a propósito, como el de la tarjeta de recomendación: sólo
 * cadenas ya redactadas. Quien decide CÓMO se dice cada cosa es
 * `lib/catalogoCompleto.ts`, para que la ficha, el catálogo y esto no digan
 * tres versiones distintas del mismo dato.
 */
export type TarjetaLoQueCuestaProps = {
  /** Tal cual está en la ficha: «Gratis para hasta 2 usuarios. De pago desde $7/usuario/mes». */
  precioInicial: string;
  /** Ya redactado por `textoDePlanGratuito`: «Gratis, indefinido», «Gratis 14 días», «Sin plan gratuito». */
  comoSeEmpieza: string;
  tienePlanGratuito: boolean;
  /**
   * Ya redactado: «Precio comprobado en su web el 17 de septiembre de 2026»,
   * o la frase de que no se ha comprobado. Nunca vacío: que una página esté
   * viva es que tenga fecha, y que no la tenga también dice algo.
   */
  comprobacion: string;
  /** Si el precio se comprobó de verdad. Cambia el icono y el tono, no el texto. */
  estaComprobado: boolean;
  /** La página de precios del fabricante, para que pueda ir a mirarlo ella. */
  urlPrecios?: string;
  /**
   * En qué plan vive la función que la persona pidió, cuando F2 lo demostró.
   *
   * Vive AQUÍ y no en la recomendación, donde estuvo hasta el 2026-09-21
   * diciendo «Plan: Growth.» a secas. En qué plan está una función es parte de
   * lo que cuesta, no de si sirve — y la recomendación no habla de dinero.
   *
   * Es una regla del fabricante, como el precio o los días de prueba, así que
   * se dice plana: sin «pero», sin compararla con el plan gratuito y sin
   * énfasis. Nosotros la transcribimos; lo nuestro es haberla comprobado.
   */
  planDeLaFuncion?: string;
  /**
   * Hubo pregunta de necesidad y la evidencia no dice en qué plan está. Se
   * dice, en vez de callarlo. `false` o ausente cuando no hubo necesidad
   * concreta que preguntar: ahí no hay nada que confirmar ni que ocultar.
   */
  planSinConfirmar?: boolean;
};

export default function TarjetaLoQueCuesta({
  precioInicial,
  comoSeEmpieza,
  tienePlanGratuito,
  comprobacion,
  estaComprobado,
  urlPrecios,
  planDeLaFuncion,
  planSinConfirmar,
}: TarjetaLoQueCuestaProps) {
  const IconoComprobacion = estaComprobado ? ShieldCheck : ShieldQuestion;

  return (
    <section
      aria-label="Lo que te va a costar"
      className="mt-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-4"
    >
      <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        <CircleDollarSign className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Lo que te va a costar
      </h3>

      <p className="mt-2 text-sm leading-relaxed font-medium text-slate-800">{precioInicial}</p>

      <div className="mt-2.5">
        <Etiqueta variante={tienePlanGratuito ? "exito" : "neutra"}>{comoSeEmpieza}</Etiqueta>
      </div>

      {planDeLaFuncion && (
        <p className="mt-2.5 text-sm leading-relaxed text-slate-700">
          La función que buscas está en el plan <span className="font-medium text-slate-900">{planDeLaFuncion}</span>.
        </p>
      )}
      {!planDeLaFuncion && planSinConfirmar && (
        <p className="mt-2.5 text-sm leading-relaxed text-slate-500">No hemos confirmado en qué plan está esa función.</p>
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
                className="inline-flex items-center gap-0.5 font-medium text-brand-600 underline-offset-4 hover:underline"
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
