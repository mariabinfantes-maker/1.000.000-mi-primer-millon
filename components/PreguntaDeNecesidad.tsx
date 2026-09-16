"use client";

import { Check } from "lucide-react";
import {
  NINGUNA_DE_ESTAS,
  enunciadoDe,
  sePreguntaPorFamilias,
  textoDeFila,
  tituloDeFamilia,
  type PreguntaDeNecesidad as Pregunta,
} from "@/agents/atlas-advisor/necesidades";
import { TEXTOS_NECESIDADES } from "@/agents/atlas-advisor/necesidades.textos.es";

/**
 * La pregunta de aclaración (opción B), en dos pasos cuando el objetivo tiene
 * familias: primero «¿por dónde va lo tuyo?» y después la necesidad concreta
 * dentro de esa familia. Decisión de la propietaria del 2026-09-16: nunca
 * enseñar las catorce opciones juntas, ni en móvil ni en escritorio.
 *
 * «Ninguna de éstas» está en los dos pasos y es una salida inmediata: quien
 * la elige no contesta nada más. Por eso nunca aparece «seleccionada».
 *
 * Es el mismo componente para la entrada por objetivo (primer paso del
 * cuestionario) y para la aclaración de la entrada libre (después de leer el
 * texto): la pregunta no sabe por dónde entró la persona.
 */
export default function PreguntaDeNecesidad({
  pregunta,
  familiaElegida,
  necesidadElegida,
  onElegirFamilia,
  onElegirNecesidad,
}: {
  pregunta: Pregunta;
  familiaElegida: string | null;
  necesidadElegida: string | null;
  onElegirFamilia: (familiaId: string) => void;
  onElegirNecesidad: (filaId: string) => void;
}) {
  const porFamilias = sePreguntaPorFamilias(pregunta);
  const enPasoDeFamilia = porFamilias && familiaElegida === null;
  const familia = porFamilias ? pregunta.familias.find((f) => f.id === familiaElegida) : pregunta.familias[0];

  if (enPasoDeFamilia) {
    return (
      <fieldset>
        <legend className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {TEXTOS_NECESIDADES.enunciadoFamilia}
        </legend>
        <p className="mt-2 text-sm text-slate-500">Elige el camino que más se parezca. Después te pregunto el detalle.</p>
        <div className="mt-5 flex flex-col gap-3">
          {pregunta.familias.map((f) => (
            <Opcion
              key={f.id}
              etiqueta={tituloDeFamilia(f.id)}
              descripcion={f.filas.map((fila) => textoDeFila(fila.id).etiqueta).join(" · ")}
              seleccionado={false}
              onClick={() => onElegirFamilia(f.id)}
            />
          ))}
          <Opcion
            etiqueta={TEXTOS_NECESIDADES.ningunaFamilia.etiqueta}
            descripcion={TEXTOS_NECESIDADES.ningunaFamilia.descripcion}
            seleccionado={false}
            discontinua
            onClick={() => onElegirFamilia(NINGUNA_DE_ESTAS)}
          />
        </div>
      </fieldset>
    );
  }

  return (
    <fieldset>
      <legend className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        {enunciadoDe(pregunta.objetivoId)}
      </legend>
      <p className="mt-2 text-sm text-slate-500">
        {porFamilias && familia ? (
          <>
            Dentro de <span className="font-semibold text-slate-700">{tituloDeFamilia(familia.id)}</span>. Elige lo que más
            se parezca a lo tuyo; si no está, dímelo abajo.
          </>
        ) : (
          "Elige lo que más se parezca a lo tuyo. Si no está, dímelo abajo y te lo pregunto de otra forma."
        )}
      </p>
      <div className="mt-5 flex flex-col gap-3">
        {(familia?.filas ?? []).map((fila) => {
          const texto = textoDeFila(fila.id);
          return (
            <Opcion
              key={fila.id}
              etiqueta={texto.etiqueta}
              descripcion={texto.descripcion}
              seleccionado={necesidadElegida === fila.id}
              onClick={() => onElegirNecesidad(fila.id)}
            />
          );
        })}
        {/* Siempre la última y siempre presente: elegirla nunca devuelve algo genérico. */}
        <Opcion
          etiqueta={TEXTOS_NECESIDADES.ninguna.etiqueta}
          descripcion={TEXTOS_NECESIDADES.ninguna.descripcion}
          seleccionado={false}
          discontinua
          onClick={() => onElegirNecesidad(NINGUNA_DE_ESTAS)}
        />
      </div>
    </fieldset>
  );
}

function Opcion({
  etiqueta,
  descripcion,
  seleccionado,
  discontinua = false,
  onClick,
}: {
  etiqueta: string;
  descripcion: string;
  seleccionado: boolean;
  discontinua?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-all ${
        discontinua ? "border-dashed " : ""
      }${
        seleccionado
          ? "border-brand-600 bg-brand-50 shadow-premium ring-1 ring-brand-100"
          : `${discontinua ? "border-slate-300" : "border-slate-200"} bg-white hover:border-brand-300 hover:bg-brand-50/40`
      }`}
    >
      <span>
        <span className={`block text-sm font-semibold ${seleccionado ? "text-brand-700" : "text-slate-700"}`}>{etiqueta}</span>
        <span className="mt-0.5 block text-sm text-slate-500">{descripcion}</span>
      </span>
      {seleccionado && <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />}
    </button>
  );
}
