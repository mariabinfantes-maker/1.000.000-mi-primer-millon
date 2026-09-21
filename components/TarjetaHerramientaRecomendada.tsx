import { AlertTriangle, ArrowUpRight, Check, ChevronRight, Code2, ExternalLink, Globe, Lightbulb, Puzzle, ShieldCheck, ShieldQuestion, Smartphone, X } from "lucide-react";
import type { EtiquetaEvidencia } from "@/agents/atlas-advisor/etiquetaEvidencia";
import Link from "next/link";
import type { Reputacion } from "@/data/esquema";
import Tarjeta from "@/components/ui/Tarjeta";
import Etiqueta from "@/components/ui/Etiqueta";
import TarjetaLoQueCuesta from "@/components/TarjetaLoQueCuesta";
import { textoDelPlan } from "@/lib/catalogoCompleto";
import Boton from "@/components/ui/Boton";
import AnilloPuntuacion from "@/components/ui/AnilloPuntuacion";
import InsigniaReputacion from "@/components/ui/InsigniaReputacion";

/**
 * Contrato de la tarjeta, deliberadamente plano y ajeno al motor de
 * recomendación: solo tipos primitivos, sin importar nada de
 * `agents/atlas-advisor` ni `data/esquema`. Si el algoritmo cambia
 * (nuevos criterios, pesos distintos, otra forma de puntuar), solo hay que
 * tocar el adaptador que produce estas props — nunca este componente.
 */
export type TarjetaHerramientaRecomendadaProps = {
  /** Atlas Revenue: de qué recorrido viene quien ve esta tarjeta (`categoria:crm`, `objetivo:conseguir-clientes`). Etiqueta el RECORRIDO, nunca a la persona. */
  rutaOrigen?: string;
  /** Posición en el ranking (1, 2, 3...), para la etiqueta de la tarjeta destacada. */
  posicion: number;
  /** Slug estable de la herramienta, para enlazar a su ficha completa (P-04) y a la salida al proveedor (P-07). */
  id: string;
  nombre: string;
  /** Puntuación Atlas (0-100), calculada por lib/puntuacionAtlas.ts. `null` si no hay ninguna señal con la que calcularla. */
  puntuacionAtlas: number | null;
  /** Motivos legibles de la puntuación (calidad editorial, reputación externa, señales de producto...). */
  motivosPuntuacion: string[];
  precioInicial: string;
  tienePlanGratuito: boolean;
  /** Ya redactado por `textoDePlanGratuito`: «Gratis, indefinido», «Gratis 14 días» o «Con plan gratuito» cuando no se ha comprobado. */
  textoPlanGratuito?: string;
  /**
   * Ya redactado: «Precio comprobado en su web el 17 de septiembre de 2026»,
   * o `PRECIO_SIN_COMPROBAR` cuando nadie fue a mirarlo. Va a la tarjeta de
   * «lo que te va a costar», no a la recomendación.
   */
  comprobacionDelPrecio: string;
  /** Si ese precio se comprobó de verdad contra la web del fabricante. */
  precioComprobado: boolean;
  /** La página de precios del fabricante, para que pueda ir a mirarla ella. */
  urlPrecios?: string;
  /**
   * Los planes con su precio, tal como se comprobaron. La tarjeta no busca
   * aquí: se lo pasa a `textoDelPlan`, que decide cómo se dice. Ausente
   * mientras esa ficha no tenga los precios de sus escalones.
   */
  planesDeLaFicha?: { nombre: string; mensual?: string; anual?: string }[];
  ventajas: string[];
  inconvenientes: string[];
  /** Párrafo ya redactado en lenguaje natural explicando por qué se recomienda para este usuario. */
  explicacionPersonalizada: string;
  /** Integración más relevante para destacar en la tarjeta, o null si no hay ninguna curada. */
  integracionPrincipal: string | null;
  /** Si hay algún aviso a tener en cuenta (ej. el perfil del usuario coincide con un caso no recomendado). */
  tieneAdvertencia?: boolean;
  /** Un ejemplo real de uso, para anclar la recomendación en algo concreto en vez de quedarse en lo abstracto. */
  casoDeUso: string | null;
  /** Situaciones reales en las que esta misma herramienta podría no ser la mejor opción. */
  casosNoRecomendados: string[];
  /** Reputación externa (G2/Capterra) ya investigada por Atlas — ver InsigniaReputacion. `undefined` si no existe, nunca inventada. */
  reputacion?: Reputacion;
  disponibleEnEspanol: boolean;
  /**
   * Frase honesta sobre el idioma cuando la persona dijo dónde tiene el
   * negocio y la ficha NO confirma ese idioma. No se calla: lo que no consta
   * se dice. Ausente cuando el idioma está confirmado o cuando nadie ha
   * dicho qué idioma hace falta.
   */
  idiomaSinConfirmar?: string;
  tieneAppMovil: boolean;
  tieneApiPublica: boolean;
  /**
   * Cómo demuestra la necesidad que la persona eligió (opción B). Sólo llega
   * cuando hubo pregunta de aclaración. Es un tipo plano y sin lógica, como
   * el resto del contrato: la tarjeta lo pinta, no lo decide.
   */
  evidencia?: EtiquetaEvidencia;
  /** Aviso de uso sin confirmar (regla del 2026-09-16): la capacidad está demostrada, este uso concreto no. Nunca dice que no sirva. */
  usoSinConfirmar?: string;
  /** Para QUÉ está confirmada la función. Va en la propia línea de «Función confirmada» para que no afirme más de lo que la evidencia dice. */
  confirmadoPara?: string;
};

export default function TarjetaHerramientaRecomendada({
  posicion,
  id,
  nombre,
  puntuacionAtlas,
  motivosPuntuacion,
  precioInicial,
  tienePlanGratuito,
  textoPlanGratuito,
  comprobacionDelPrecio,
  precioComprobado,
  urlPrecios,
  planesDeLaFicha,
  ventajas,
  inconvenientes,
  explicacionPersonalizada,
  integracionPrincipal,
  rutaOrigen,
  tieneAdvertencia = false,
  casoDeUso,
  casosNoRecomendados,
  reputacion,
  disponibleEnEspanol,
  idiomaSinConfirmar,
  tieneAppMovil,
  tieneApiPublica,
  evidencia,
  usoSinConfirmar,
  confirmadoPara,
}: TarjetaHerramientaRecomendadaProps) {
  const destacada = posicion === 1;
  const tieneDetalles = motivosPuntuacion.length > 0 || casosNoRecomendados.length > 0;
  const badgesEncaje = [
    disponibleEnEspanol ? { icono: Globe, etiqueta: "Español" } : null,
    tieneAppMovil ? { icono: Smartphone, etiqueta: "App móvil" } : null,
    tieneApiPublica ? { icono: Code2, etiqueta: "API" } : null,
  ].filter((b): b is { icono: typeof Globe; etiqueta: string } => b !== null);

  return (
    /**
     * Dos cosas separadas en la pantalla: arriba el consejo, abajo lo que
     * cuesta. Ver `TarjetaLoQueCuesta` y ATLAS.md, «ESTAMOS ENDIOSANDO LO
     * GRATIS». El envoltorio existe para que la recomendación siga estirando
     * hasta abajo dentro de la rejilla y la de dinero quede pegada al pie.
     */
    <div className="flex h-full flex-col">
    <Tarjeta
      ganadora={destacada}
      className="relative flex flex-1 flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-premium-lg"
    >
      {destacada && (
        <div
          className="absolute -top-3 left-6 rounded-full bg-gold-500 px-3 py-1 text-xs font-bold tracking-wide text-white shadow-sm"
          aria-hidden="true"
        >
          La opción elegida
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <Etiqueta variante={destacada ? "marca" : "neutra"}>
          {destacada ? "Mejor ajuste para ti" : `Opción #${posicion}`}
        </Etiqueta>
        {puntuacionAtlas !== null && <AnilloPuntuacion puntuacion={puntuacionAtlas} />}
      </div>

      <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-slate-900">
        <Link href={`/herramienta/${id}`} className="transition hover:text-brand-700">
          {nombre}
        </Link>
      </h3>

      <InsigniaReputacion reputacion={reputacion} />

      <p className="mt-3 rounded-xl bg-brand-50/70 p-3 text-sm leading-relaxed text-brand-800">
        {explicacionPersonalizada}
      </p>

      {/*
        Lo que la evidencia de F2 dice de ESTA necesidad, en el orden que
        decidió la propietaria (2026-09-16): función confirmada; el plan, si
        se conoce, o que no lo hemos confirmado; el tercero y lo anotado,
        cuando corresponda; y la fuente con su fecha, enlazada. Ninguna frase
        dice que la herramienta NO haga algo: F2 no obtuvo ni una ausencia
        demostrada, y sin ese dato la frase no puede escribirse.
      */}
      {evidencia?.tipo === "confirmada" && (
        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-3 text-sm leading-relaxed text-slate-600">
          <p className="flex items-start gap-1.5 font-medium text-slate-800">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-exito-500" aria-hidden="true" />
            <span>
              {confirmadoPara
                ? `Función confirmada en una fuente oficial: ${confirmadoPara}.`
                : "Función confirmada en una fuente oficial."}
            </span>
          </p>
          {/*
            El uso concreto, por herramienta (2026-09-16, tercera ronda): si
            ESTA herramienta lo ha demostrado, se dice con su fuente y el
            aviso fijo de la fila no aparece, porque ya no es verdad para
            ella. Si no consta, el aviso fijo sigue diciendo lo único que se
            sabe. Nunca se dice que no lo haga.
          */}
          {evidencia.uso ? (
            <p className="mt-1.5 flex items-start gap-1.5 font-medium text-slate-800">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-exito-500" aria-hidden="true" />
              <span>
                Uso confirmado en una fuente oficial: {evidencia.uso.etiqueta}.
                {evidencia.uso.anotado && <span className="font-normal text-slate-600"> Anotado al comprobarlo: {evidencia.uso.anotado}</span>}
                {evidencia.uso.fuente && (
                  <span className="font-normal text-slate-600">
                    {" "}
                    <a
                      href={evidencia.uso.fuente.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center gap-0.5 font-medium text-brand-600 underline-offset-4 hover:underline"
                    >
                      {dominioDe(evidencia.uso.fuente.url)}
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                    {" · "}comprobado el {fechaLarga(evidencia.uso.fuente.fecha)}
                  </span>
                )}
              </span>
            </p>
          ) : (
            usoSinConfirmar && (
              <p className="mt-1.5 flex items-start gap-1.5 text-atencion-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{usoSinConfirmar}</span>
              </p>
            )
          )}
          {evidencia.integraCon && (
            <p className="mt-1.5">
              Lo hace a través de otra herramienta: <span className="font-medium text-slate-800">{evidencia.integraCon}</span>.
              El precio y las condiciones de esa conexión no los conocemos.
            </p>
          )}
          {evidencia.anotado && <p className="mt-1.5">Anotado al comprobarlo: {evidencia.anotado}</p>}
          {evidencia.fuente && (
            <p className="mt-1.5 text-xs text-slate-500">
              Fuente:{" "}
              <a
                href={evidencia.fuente.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-0.5 font-medium text-brand-600 underline-offset-4 hover:underline"
              >
                {dominioDe(evidencia.fuente.url)}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
              {" · "}comprobado el {fechaLarga(evidencia.fuente.fecha)}
            </p>
          )}
        </div>
      )}
      {evidencia?.tipo === "pendiente" && (
        <p className="mt-3 flex items-start gap-1.5 text-sm leading-relaxed text-slate-600">
          <ShieldQuestion className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <span>
            Tenemos registrada esta función, pero falta información para confirmar cómo cubre tu necesidad: lo hace a
            través de otra herramienta y no nos consta cuál.
          </span>
        </p>
      )}

      {badgesEncaje.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {badgesEncaje.map(({ icono: Icono, etiqueta }) => (
            <span key={etiqueta} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
              <Icono className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
              {etiqueta}
            </span>
          ))}
        </div>
      )}

      {idiomaSinConfirmar && (
        <p className="mt-3 flex items-start gap-1.5 text-sm text-atencion-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{idiomaSinConfirmar}</span>
        </p>
      )}

      {integracionPrincipal && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
          <Puzzle className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          Se integra con <span className="font-medium text-slate-800">{integracionPrincipal}</span>
        </p>
      )}

      {casoDeUso && (
        <p className="mt-3 flex items-start gap-1.5 text-sm text-slate-600">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <span>{casoDeUso}</span>
        </p>
      )}

      <div className="mt-5 grid flex-1 grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ventajas</h4>
          <ul className="mt-2 space-y-1.5">
            {ventajas.map((ventaja) => (
              <li key={ventaja} className="flex gap-1.5 text-sm text-slate-700">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-exito-500" aria-hidden="true" />
                <span>{ventaja}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Desventajas</h4>
          <ul className="mt-2 space-y-1.5">
            {inconvenientes.map((inconveniente) => (
              <li key={inconveniente} className="flex gap-1.5 text-sm text-slate-700">
                <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-error-400" aria-hidden="true" />
                <span>{inconveniente}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {tieneAdvertencia && (
        <p className="mt-4 flex items-start gap-1.5 text-xs text-atencion-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Puede no encajar del todo con algún aspecto de tu situación. Revisa los detalles antes de decidir.
        </p>
      )}

      {tieneDetalles && (
        <details className="mt-4 border-t border-slate-100 pt-4">
          <summary className="cursor-pointer select-none text-sm font-semibold text-slate-600 transition hover:text-brand-700">
            Ver más detalles
          </summary>
          <div className="mt-3 space-y-4">
            {motivosPuntuacion.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Por qué esta puntuación
                </h4>
                <ul className="mt-1.5 space-y-1">
                  {motivosPuntuacion.map((motivo) => (
                    <li key={motivo} className="text-sm leading-relaxed text-slate-600">
                      {motivo}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {casosNoRecomendados.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Cuándo podría no ser la mejor opción
                </h4>
                <ul className="mt-1.5 space-y-1">
                  {casosNoRecomendados.map((caso) => (
                    <li key={caso} className="text-sm leading-relaxed text-slate-600">
                      {caso}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      )}

      <Link
        href={`/herramienta/${id}`}
        className="mt-6 flex items-center justify-center gap-1 text-sm font-semibold text-brand-600 transition hover:text-brand-800"
      >
        Ver ficha completa
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>

      <Boton
        href={`/herramienta/${id}/ir?origen=resultado${rutaOrigen ? `&ruta=${encodeURIComponent(rutaOrigen)}` : ""}`}
        tamano="grande"
        variante={destacada ? "primario" : "secundario"}
        className="mt-3 w-full"
      >
        {tienePlanGratuito ? "Probar gratis" : `Ir a ${nombre}`}
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Boton>
    </Tarjeta>
    <TarjetaLoQueCuesta
      precioInicial={precioInicial}
      comoSeEmpieza={textoPlanGratuito ?? (tienePlanGratuito ? "Con plan gratuito" : "Sin plan gratuito")}
      tienePlanGratuito={tienePlanGratuito}
      comprobacion={comprobacionDelPrecio}
      estaComprobado={precioComprobado}
      {...(urlPrecios ? { urlPrecios } : {})}
      {...(evidencia?.tipo === "confirmada" && evidencia.plan ? { planDeLaFuncion: evidencia.plan } : {})}
      {...(evidencia?.tipo === "confirmada" && evidencia.plan && textoDelPlan(evidencia.plan, planesDeLaFicha)
        ? { precioDelPlan: textoDelPlan(evidencia.plan, planesDeLaFicha)! }
        : {})}
      {...(evidencia?.tipo === "confirmada" && !evidencia.plan ? { planSinConfirmar: true } : {})}
    />
    </div>
  );
}

/** Sólo el dominio, para que el enlace se lea: «pipedrive.com», no la dirección entera. */
function dominioDe(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** «2026-09-07» → «7 de septiembre de 2026». Si la fecha no es válida, se enseña tal cual antes que inventar una. */
function fechaLarga(iso: string): string {
  const fecha = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(fecha.getTime())) return iso;
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(fecha);
}
