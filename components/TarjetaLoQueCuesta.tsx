import { ExternalLink, ShieldCheck, ShieldQuestion } from "lucide-react";

/**
 * «Lo que te va a costar» — el dinero, aparte del consejo.
 *
 * Decisión de la propietaria (2026-09-18): «esta es la mejor en tu
 * especialidad, y al lado o abajo una tarjeta que explique el plan
 * comercial». Ver ATLAS.md, «ESTAMOS ENDIOSANDO LO GRATIS».
 *
 * ORDENADA, NO RECORTADA. Dos intentos anteriores fallaron por lo mismo: una
 * pila de frases sueltas sobre dinero que había que leer entera para
 * enterarse de algo, y en la que «Gratis, indefinido» y «necesitas 29 $»
 * parecían discutir. La propietaria lo cortó dos veces —«es demasiado
 * confusa», «no me gusta»— y dio la regla: «que tenga toda la información
 * pero ordenada, que el cliente la pueda entender».
 *
 * Así que no se quita nada: se estructura. Arriba la respuesta a la única
 * pregunta que tiene —¿esto, a mí, cuánto me cuesta?—. Debajo, filas de
 * «concepto → dato» que se escanean con la vista sin leerlas. Y al final, de
 * dónde sale y cuándo se miró.
 *
 * ACOMPAÑA, NO COMPITE: sin color de marca, sin sombra. Lo único grande es la
 * respuesta, porque es lo que vino a saber.
 *
 * Contrato plano: sólo cadenas ya redactadas. Quién decide CÓMO se dice cada
 * cosa es `lib/catalogoCompleto.ts`.
 */
export type TarjetaLoQueCuestaProps = {
  /** La respuesta: «24 $/mes», «Nada», o el precio de entrada si no hubo diagnóstico. */
  respuesta: string;
  /** El resto, en orden: el plan, la otra modalidad de pago, lo que ofrece su paquete. */
  filas: { concepto: string; dato: string }[];
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
   * dice, en vez de callarlo.
   */
  planSinConfirmar?: boolean;
};

export default function TarjetaLoQueCuesta({
  respuesta,
  filas,
  comprobacion,
  estaComprobado,
  urlPrecios,
  planSinConfirmar,
}: TarjetaLoQueCuestaProps) {
  const IconoComprobacion = estaComprobado ? ShieldCheck : ShieldQuestion;

  return (
    <section aria-label="Lo que te va a costar" className="mt-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
      <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Lo que te va a costar</h3>

      <p className="font-display mt-1 text-2xl font-bold tracking-tight text-slate-900">{respuesta}</p>

      {filas.length > 0 && (
        <dl className="mt-3 space-y-1.5 border-t border-slate-200/80 pt-3">
          {filas.map((fila) => (
            <div key={fila.concepto} className="flex items-baseline justify-between gap-3">
              <dt className="shrink-0 text-sm text-slate-500">{fila.concepto}</dt>
              <dd className="text-right text-sm font-medium text-slate-800">{fila.dato}</dd>
            </div>
          ))}
        </dl>
      )}

      {planSinConfirmar && (
        <p className="mt-2 text-sm leading-relaxed text-slate-500">No hemos confirmado en qué plan está esa función.</p>
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
