"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown, ChevronRight, X } from "lucide-react";
import Boton from "@/components/ui/Boton";
import SimboloMolnip from "@/components/ui/SimboloMolnip";
import { mayuscula, type Camino, type Opcion, type Pieza } from "./Variantes";
import { titular, type Abierta } from "./TarjetaDelConsejo";

/**
 * LA PANTALLA DEL CONSEJO, tal como la aprobó la propietaria el 2026-09-30.
 *
 * El orden es una sola idea de arriba abajo, y sólo una superficie tiene
 * relieve: Mi consejo → si no te convence → he comparado N → explorar →
 * seguir hablando. Se alimenta de LA DECISIÓN DEL MOTOR —`loQueHaria` y
 * `alternativas`, que vienen de `elegirUna` y `ordenarPorCercania`— y no del
 * orden de la búsqueda. La tarjeta anterior enseñaba como primera fila la
 * primera de `caminos[0].opciones`, que va por el alfabeto: a una clínica
 * dental le salía Archivex arriba y «Mi consejo» hablaba de Koibox.
 *
 * LA REGLA DE PRODUCTO QUE MANDA AQUÍ, con sus palabras:
 *
 *   «La posición expresa la prioridad del asesor. La calidad de presentación
 *    no depende de la posición.»
 *
 * Por eso hay UN solo componente de tarjeta, `Tarjeta`, con dos estados
 * —compacta y abierta— y lo usan las tres: la principal nace abierta y con el
 * anillo dorado; las alternativas nacen compactas y, al pulsarlas, se abren
 * con la misma presentación entera. Abrir una alternativa no la convierte en
 * «Mi consejo» ni cambia el orden: sólo cambia cuánto se ve de ella.
 *
 * Y las tres reglas de redacción que salieron de sus correcciones ese día:
 *
 *  - CADA LÍNEA SALE DE UN CAMPO CON FUENTE, O NO SALE. Nada de la
 *    descripción de la ficha; sólo lo que la pieza trae del motor: qué
 *    resuelve con cita, precio con fecha, idioma con recibo, lo que falta por
 *    confirmar. Si un sitio queda vacío, queda vacío.
 *  - LO QUE SE COMPARTE SE DICE COMO COMPARTIDO; LO QUE DECIDIÓ, COMO LO
 *    ÚNICO QUE DECIDIÓ. «Las seis lo hacen igual de bien… me decido por
 *    Koibox porque es la única de las seis con plan gratuito.»
 *  - NINGUNA ALTERNATIVA AFIRMA SER «LA MÁS BARATA». Su precio se dice tal
 *    cual lo publica su tarifa; ninguno se compara con otro.
 */

const TARJETA = "rounded-2xl border border-slate-200/80 bg-white";

type Elegida = Opcion & { desempate?: { criterio: string; porQue: string } };

function enumerar(cosas: string[]): string {
  if (cosas.length === 0) return "lo que me has contado";
  if (cosas.length === 1) return cosas[0];
  return `${cosas.slice(0, -1).join(", ")} y ${cosas[cosas.length - 1]}`;
}

const nombreDe = (o: Opcion) => o.piezas.map((p) => p.nombre).join(" + ");
const idDe = (o: Opcion) => o.piezas.map((p) => p.herramientaId).join("+");
const cubreEnCorto = (o: Opcion) => [...new Set(o.piezas.flatMap((p) => p.cubreEnCorto))];

/**
 * EL LOGO: IDENTIFICADOR, NO ESCAPARATE.
 *
 * Tres tamaños, uno por nivel: 44 px en «Mi consejo», 30 px en las
 * alternativas, 22 px al explorar. Siempre sobre baldosa blanca con NUESTRO
 * borde y NUESTRO radio, para que el color de cada marca se quede dentro de
 * su cuadradito y nunca pinte la tarjeta. Hoy ninguna ficha tiene logo, así
 * que se pinta la inicial; cuando llegue el logo, se pinta el logo.
 */
function Logo({ pieza, tamano }: { pieza: Pieza; tamano: "l" | "m" | "s" }) {
  const clase =
    tamano === "l" ? "h-11 w-11 rounded-xl text-lg" : tamano === "m" ? "h-8 w-8 rounded-xl text-sm" : "h-6 w-6 rounded-xl text-xs";
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 select-none items-center justify-center overflow-hidden bg-white font-display font-bold text-slate-500 ring-1 ring-slate-200 ${clase}`}
    >
      {pieza.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={pieza.logoUrl} alt="" className="h-full w-full object-contain" />
      ) : (
        pieza.nombre.charAt(0).toUpperCase()
      )}
    </span>
  );
}

/** Varias piezas, varios logos: uno por herramienta, sin apilarlos. */
function Logos({ opcion, tamano }: { opcion: Opcion; tamano: "l" | "m" | "s" }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5">
      {opcion.piezas.map((p) => <Logo key={p.herramientaId} pieza={p} tamano={tamano} />)}
    </span>
  );
}

/**
 * El precio para una fila: la cifra corta de los planes citados, con su
 * unidad y sin convertir. Cuando no hay cifra corta se dice lo que sí sabemos
 * —que tiene plan gratuito— o se manda a su web. Nunca se inventa una.
 */
function precioCorto(opcion: Opcion): { cifra: string; nota?: string } {
  const cortos = opcion.piezas.map((p) => p.coste.desdeCorto).filter(Boolean) as string[];
  const gratis = opcion.piezas.every((p) => p.coste.tienePlanGratuito);
  // Sin cifra corta, la fila no dice nada: la tarjeta abierta trae la tarifa
  // entera tal cual la publica. Antes ponía «Precio en su web» y era mentira
  // a medias: DriCloud tiene el precio comprobado, sólo que en una frase.
  if (cortos.length < opcion.piezas.length) {
    return gratis ? { cifra: "Plan gratuito", nota: "y planes de pago" } : { cifra: "" };
  }
  return {
    cifra: `desde ${cortos.join(" + ")}`,
    nota: opcion.piezas.length > 1 ? "son dos cuotas" : gratis ? "y plan gratuito" : undefined,
  };
}

/**
 * Lo que ÉSTA demuestra de más y las demás de la pantalla no. Si todas traen
 * lo mismo, no distingue nada y no se escribe: la línea sólo habla cuando
 * tiene algo que decir, y nunca se inventa una ventaja para rellenar.
 */
function loQueDistingue(opcion: Opcion, entreEllas: Opcion[]): string[] {
  const suyos = [...new Set(opcion.piezas.flatMap((p) => p.ademas))];
  return suyos.filter((e) => !entreEllas.every((o) => o.piezas.some((p) => p.ademas.includes(e))));
}

const PLAN_SIN_TARIFA = /^En qué plan entra «.+»: lo hemos visto en su página, pero no en qué tarifa\.$/;

/**
 * «A TENER EN CUENTA»: lo que no nos consta, dicho como aviso y nunca como
 * pega. Las tres líneas iguales de «en qué plan entra X» se dicen una vez;
 * lo que no se cubre se dice como «sin confirmar», salvo que esté demostrado
 * que no lo hace. Si no hay nada, el bloque no se pinta.
 */
function aTenerEnCuenta(opcion: Opcion): string[] {
  const lineas = opcion.piezas.flatMap((p) => p.faltaPorConfirmar);
  const dePlan = lineas.some((l) => PLAN_SIN_TARIFA.test(l));
  const resto = lineas.filter((l) => !PLAN_SIN_TARIFA.test(l));
  const salida: string[] = [];
  if (dePlan) salida.push("Lo hemos visto en su página, pero no en qué tarifa entra cada cosa. Míralo antes de decidir.");
  if (opcion.noLoHace.length > 0) salida.push(`No resuelve ${opcion.noLoHace.join(" ni ")}.`);
  if (opcion.sinConfirmar.length > 0) salida.push(`${mayuscula(opcion.sinConfirmar.join(" y "))}: sin confirmar.`);
  for (const l of resto) if (!salida.includes(l)) salida.push(l);
  return salida;
}

function Antetitulo({ children, gris = false }: { children: React.ReactNode; gris?: boolean }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-[0.06em] ${gris ? "text-slate-500" : "text-brand-600"}`}>
      {children}
    </p>
  );
}

/**
 * LA TARJETA. Una sola, para las tres. `papel` dice quién es; `abierta` dice
 * cuánto se ve. La principal siempre está abierta y lleva el anillo dorado
 * —el uso que la web da al dorado: «la opción elegida», una vez por
 * pantalla—. Una alternativa abierta tiene la misma presentación entera,
 * sin el dorado y sin «Mi consejo», porque no lo es.
 */
function Tarjeta({
  opcion, papel, abierta, alAlternar, entreEllas, principal, cuantas, alAbrir, tamanoCompacta = "m",
}: {
  opcion: Elegida;
  papel: "principal" | "alternativa";
  abierta: boolean;
  alAlternar?: () => void;
  /** Las que están en pantalla con ella, para saber qué la distingue. */
  entreEllas: Opcion[];
  /** La elegida, para poder decir «resuelve lo mismo que Koibox». */
  principal?: Opcion | null;
  /** Cuántas empataron cubriendo lo mismo. */
  cuantas: number;
  alAbrir: (a: Abierta) => void;
  tamanoCompacta?: "m" | "s";
}) {
  const nombre = nombreDe(opcion);
  const forma = opcion.piezas.length === 1 ? "todo-en-uno" : "por-separado";
  const distingue = loQueDistingue(opcion, entreEllas);
  const avisos = aTenerEnCuenta(opcion);
  const precio = precioCorto(opcion);
  const enEspanol = opcion.piezas.every((p) => p.coste.espanol.panel === "confirmado");

  if (!abierta) {
    return (
      <button
        onClick={alAlternar}
        aria-expanded={false}
        className={`${TARJETA} flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:border-brand-200`}
      >
        <Logos opcion={opcion} tamano={tamanoCompacta} />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-slate-900">{nombre}</span>
          {distingue.length > 0 ? (
            <span className="block text-sm text-slate-600">Además: {distingue.join(", ").toLowerCase()}</span>
          ) : opcion.piezas.length > 1 ? (
            <span className="block text-sm text-slate-600">Son {opcion.piezas.length} programas y {opcion.piezas.length} cuotas</span>
          ) : null}
          {opcion.sinConfirmar.length > 0 && (
            <span className="block text-sm text-slate-500">{mayuscula(opcion.sinConfirmar.join(" y "))}: sin confirmar</span>
          )}
          {/* En móvil la cifra va debajo del texto: a la derecha lo estrujaba en una columna de tres palabras. */}
          {precio.cifra && (
            <span className="mt-1 block font-mono text-sm font-medium text-slate-800 sm:hidden">
              {precio.cifra}
              {precio.nota && <span className="ml-1.5 font-sans text-xs font-normal text-slate-500">{precio.nota}</span>}
            </span>
          )}
        </span>
        {precio.cifra && (
          <span className="hidden shrink-0 text-right sm:block">
            <span className="block font-mono text-sm font-medium text-slate-800">{precio.cifra}</span>
            {precio.nota && <span className="block text-xs text-slate-500">{precio.nota}</span>}
          </span>
        )}
        <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-slate-300" />
      </button>
    );
  }

  const esPrincipal = papel === "principal";
  const resuelveLoMismo = principal && opcion.noCubre.length === 0 && principal.noCubre.length === 0;

  return (
    <section
      aria-label={esPrincipal ? "Mi consejo" : nombre}
      className={`rounded-3xl bg-white p-5 shadow-premium-lg ${esPrincipal ? "border border-gold-400" : "border border-slate-200/80"}`}
    >
      <div className="flex items-start justify-between gap-3">
        {esPrincipal ? (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
            Mi consejo
          </span>
        ) : (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 ring-1 ring-brand-100">
            También encaja
          </span>
        )}
        {!esPrincipal && alAlternar && (
          <button onClick={alAlternar} aria-label={`Cerrar ${nombre}`} className="rounded-xl p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {/* Manda el resultado, no la marca: el titular dice qué consigue, y el nombre va dentro de la frase. */}
      <h2 className="mt-3 font-display text-[26px] font-bold leading-[1.12] tracking-tight text-slate-900">
        {titular(forma, opcion)}:{" "}
        {esPrincipal ? (
          <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">empezaría por {nombre}</span>
        ) : (
          nombre
        )}
        .
      </h2>

      <div className="mt-4 flex items-center gap-3">
        <Logos opcion={opcion} tamano="l" />
        <span className="font-display text-lg font-bold text-slate-900">{nombre}</span>
      </div>

      <p className="mt-3 leading-relaxed text-slate-600">
        {opcion.noCubre.length === 0 ? "Resuelve lo que me has contado" : `Te resuelve ${enumerar(cubreEnCorto(opcion))}`}
        {enEspanol ? ", y está en español." : "."}
      </p>

      <div className="mt-4 space-y-1.5">
        <Antetitulo>{esPrincipal ? "Por qué te la recomiendo" : "Por qué la he incluido"}</Antetitulo>
        <ul className="list-disc space-y-1 pl-[18px] text-sm leading-relaxed text-slate-800">
          {esPrincipal && cuantas > 1 && opcion.piezas.length === 1 && opcion.noCubre.length === 0 && (
            <li>Las {cuantas} que lo resuelven todo lo hacen igual de bien con lo que me has contado.</li>
          )}
          {esPrincipal && opcion.desempate?.porQue && <li>{opcion.desempate.porQue}</li>}
          {!esPrincipal && (
            <li>
              {resuelveLoMismo
                ? `Resuelve lo mismo que ${nombreDe(principal!)} con lo que me has contado.`
                : `Te resuelve ${enumerar(cubreEnCorto(opcion))}.`}
            </li>
          )}
          {opcion.piezas.length > 1 && <li>Son {opcion.piezas.length} programas y {opcion.piezas.length} cuotas.</li>}
          {distingue.length > 0 && (
            <li>Además lleva {distingue.join(", ").toLowerCase()}, que no me pediste pero te {distingue.length > 1 ? "tocan" : "toca"}.</li>
          )}
        </ul>
      </div>

      {avisos.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <Antetitulo>A tener en cuenta</Antetitulo>
          <ul className="space-y-1 text-sm leading-relaxed text-slate-800">
            {avisos.map((a) => <li key={a}>{a}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-4 border-t border-slate-200 pt-4">
        {opcion.piezas.map((p) => (
          <div key={p.herramientaId} className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
            <p className="font-mono text-sm font-semibold text-slate-900">
              {opcion.piezas.length > 1 && <span className="mr-1.5 font-sans font-semibold text-slate-500">{p.nombre}:</span>}
              {p.coste.desde ?? "Precio en su web"}
            </p>
            {p.coste.comprobadoEl && (
              <p className="shrink-0 text-xs text-slate-500 sm:text-right">
                precio comprobado el {p.coste.comprobadoEl}
              </p>
            )}
          </div>
        ))}
      </div>

      <Boton
        tamano="grande"
        className="mt-4 w-full"
        onClick={() => alAbrir({ opcion, titular: titular(forma, opcion), porQue: esPrincipal ? opcion.desempate?.porQue : undefined })}
      >
        Ver {nombre}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Boton>
    </section>
  );
}

/** «He comparado 90 herramientas para este caso · 6 encajan con todo lo que necesitas.» */
function HeComparado({ herramientas, cuantas, todo }: { herramientas: number; cuantas: number; todo: boolean }) {
  return (
    <p className="text-sm text-slate-600">
      He comparado <b className="font-bold text-slate-900">{herramientas} herramientas</b> para este caso
      {cuantas > 0 && (
        <>
          {" "}· <b className="font-bold text-slate-900">{cuantas}</b> {todo ? "encajan con todo lo que necesitas" : "son las que más se acercan"}
        </>
      )}
    </p>
  );
}

const DE_TRES_EN_TRES = 3;

export default function ConsejoDelAsesor({
  loQueHaria, alternativas, caminos, loQueNecesitoSaber, dondeSeBusco, sinConfirmarEnNinguna = [], alAbrir,
}: {
  loQueHaria: Elegida | null;
  alternativas: Opcion[];
  masAlternativas: number;
  caminos: Camino[];
  loQueNecesitoSaber?: string | null;
  dondeSeBusco?: { herramientas: number; casas: number };
  sinConfirmarEnNinguna?: string[];
  alAbrir: (a: Abierta) => void;
}) {
  /** Qué alternativa está abierta. Una como mucho: no queremos tres fichas grandes a la vez. */
  const [abierta, setAbierta] = useState<string | null>(null);
  const [explorando, setExplorando] = useState(false);
  const [visibles, setVisibles] = useState(DE_TRES_EN_TRES);
  const [parcialesVisibles, setParcialesVisibles] = useState(0);

  if (caminos.length === 0) return null;

  const alternar = (o: Opcion) => setAbierta((a) => (a === idDe(o) ? null : idDe(o)));

  // Las dos alternativas de delante, y todo lo demás detrás de «explorar».
  const principal = loQueHaria;
  const dosAlternativas = alternativas.slice(0, 2);
  const enPantalla = [...(principal ? [principal] : []), ...dosAlternativas];
  const yaSeVen = new Set(enPantalla.map(idDe));
  const restantes: Opcion[] = [];
  for (const o of [...alternativas.slice(2), ...caminos.flatMap((c) => [...c.opciones, ...c.masOpciones])]) {
    const id = idDe(o);
    if (yaSeVen.has(id)) continue;
    yaSeVen.add(id);
    restantes.push(o);
  }
  const parciales: Opcion[] = [];
  const idsParciales = new Set<string>();
  for (const o of caminos.flatMap((c) => c.parciales)) {
    const id = idDe(o);
    if (idsParciales.has(id) || yaSeVen.has(id)) continue;
    idsParciales.add(id);
    parciales.push(o);
  }
  /**
   * «6 encajan con todo lo que necesitas» cuenta HERRAMIENTAS, no
   * combinaciones: las que lo resuelven todo ellas solas. Contar también las
   * parejas daba «141 encajan», que es verdad y no dice nada. Y son las mismas
   * seis del desempate: «la única de las 6 que están en español con plan
   * gratuito».
   */
  const cuantas = new Set(
    [...(principal ? [principal] : []), ...alternativas, ...caminos.flatMap((c) => [...c.opciones, ...c.masOpciones])]
      .filter((o) => o.piezas.length === 1 && o.noCubre.length === 0)
      .map(idDe)
  ).size;
  const todo = principal ? principal.noCubre.length === 0 : false;

  return (
    <div className="space-y-5">
      {/*
        Con algo que ella pidió sin confirmar en ninguna, Molnip NO elige una
        para el conjunto: dice dónde estamos y enseña lo que sí hay comprobado.
        Misma decisión del 2026-09-25: «lo que falta es que la nueva respuesta
        cambie el juicio del asesor, no sólo las etiquetas».
      */}
      {sinConfirmarEnNinguna.length > 0 ? (
        <div className="flex gap-3 rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-100">
          <SimboloMolnip className="mt-0.5 h-8 w-8 shrink-0 rounded-xl" />
          <div>
            <p className="font-display text-base font-bold text-brand-900">Dónde estamos</p>
            <p className="mt-1 leading-relaxed text-brand-900">
              De estas hemos comprobado lo que te enseño abajo, pero todavía no hemos confirmado{" "}
              {enumerar(sinConfirmarEnNinguna.slice(0, 3))}. Puedes explorarlas por lo que aportan; para recomendarte una para
              el conjunto, falta resolver ese punto.
            </p>
          </div>
        </div>
      ) : principal ? (
        <Tarjeta opcion={principal} papel="principal" abierta entreEllas={enPantalla} cuantas={cuantas} alAbrir={alAbrir} />
      ) : loQueNecesitoSaber ? (
        <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-premium-lg">
          <span className="inline-flex w-fit items-center rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
            Todavía no te digo cuál
          </span>
          <p className="mt-3 font-display text-[22px] font-bold leading-[1.15] tracking-tight text-slate-900">
            Varias lo resuelven igual de bien con lo que me has contado.
          </p>
          <p className="mt-2 leading-relaxed text-slate-800">{loQueNecesitoSaber}</p>
        </section>
      ) : null}

      {/*
        Sin principal —empate o algo sin confirmar—, las que empatan salen
        como filas compactas, todas abribles, y ninguna con el dorado.
      */}
      {!principal && (
        <div className="space-y-2">
          {caminos.flatMap((c) => c.opciones).slice(0, DE_TRES_EN_TRES).map((o) => (
            <Tarjeta
              key={idDe(o)} opcion={o} papel="alternativa" abierta={abierta === idDe(o)} alAlternar={() => alternar(o)}
              entreEllas={caminos.flatMap((c) => c.opciones).slice(0, DE_TRES_EN_TRES)} principal={null} cuantas={cuantas} alAbrir={alAbrir}
            />
          ))}
        </div>
      )}

      {principal && dosAlternativas.length > 0 && (
        <div className="space-y-2">
          <Antetitulo gris>Si {nombreDe(principal)} no te convence</Antetitulo>
          {dosAlternativas.map((o) => (
            <Tarjeta
              key={idDe(o)} opcion={o} papel="alternativa" abierta={abierta === idDe(o)} alAlternar={() => alternar(o)}
              entreEllas={enPantalla} principal={principal} cuantas={cuantas} alAbrir={alAbrir}
            />
          ))}
        </div>
      )}

      {(restantes.length > 0 || parciales.length > 0) && (
        <div className="space-y-3">
          {dondeSeBusco && <HeComparado herramientas={dondeSeBusco.herramientas} cuantas={cuantas} todo={todo} />}
          <Boton variante="secundario" onClick={() => setExplorando(!explorando)} aria-expanded={explorando}>
            {explorando ? "Ocultar" : "Explorar otras opciones"}
            <ChevronDown aria-hidden className={`h-4 w-4 transition-transform ${explorando ? "rotate-180" : ""}`} />
          </Boton>
          {explorando && (
            <div className="space-y-2">
              {restantes.length > 0 && <p className="text-sm text-slate-700">Te enseño tres cada vez.</p>}
              {restantes.slice(0, visibles).map((o) => (
                <Tarjeta
                  key={idDe(o)} opcion={o} papel="alternativa" abierta={abierta === idDe(o)} alAlternar={() => alternar(o)}
                  entreEllas={[...enPantalla, ...restantes.slice(0, visibles)]} principal={principal} cuantas={cuantas} alAbrir={alAbrir}
                  tamanoCompacta="s"
                />
              ))}
              {restantes.length > visibles && (
                <Boton variante="fantasma" onClick={() => setVisibles(visibles + DE_TRES_EN_TRES)}>
                  Ver {Math.min(DE_TRES_EN_TRES, restantes.length - visibles)} más
                </Boton>
              )}
              {parciales.length > 0 && (
                <div className="border-t border-slate-200/80 pt-3">
                  <p className="text-sm leading-relaxed text-slate-500">
                    También hay herramientas que resuelven sólo una parte de lo que necesitas. Te sirven si lo otro ya lo tienes resuelto.
                  </p>
                  {parcialesVisibles === 0 ? (
                    <Boton variante="fantasma" className="mt-1" onClick={() => setParcialesVisibles(DE_TRES_EN_TRES)}>
                      Ver cuáles
                    </Boton>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {parciales.slice(0, parcialesVisibles).map((o) => (
                        <Tarjeta
                          key={idDe(o)} opcion={o} papel="alternativa" abierta={abierta === idDe(o)} alAlternar={() => alternar(o)}
                          entreEllas={parciales.slice(0, parcialesVisibles)} principal={principal} cuantas={cuantas} alAbrir={alAbrir}
                          tamanoCompacta="s"
                        />
                      ))}
                      {parciales.length > parcialesVisibles && (
                        <Boton variante="fantasma" onClick={() => setParcialesVisibles(parcialesVisibles + DE_TRES_EN_TRES)}>
                          Ver {Math.min(DE_TRES_EN_TRES, parciales.length - parcialesVisibles)} más
                        </Boton>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
