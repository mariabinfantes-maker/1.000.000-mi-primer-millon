import { getAgente, type IdAgente } from "@/lib/agentes";

type Tamano = "pequeno" | "normal" | "grande";

/** Clases estáticas a propósito (nunca construidas por interpolación): Tailwind necesita ver el nombre completo de cada clase para incluirla en el build. */
const COLORES: Record<IdAgente, { fondo: string; texto: string; anillo: string }> = {
  researcher: {
    fondo: "bg-agente-researcher-soft",
    texto: "text-agente-researcher",
    anillo: "ring-agente-researcher/20",
  },
  evaluador: {
    fondo: "bg-agente-evaluador-soft",
    texto: "text-agente-evaluador",
    anillo: "ring-agente-evaluador/20",
  },
  recomendador: {
    fondo: "bg-agente-recomendador-soft",
    texto: "text-agente-recomendador",
    anillo: "ring-agente-recomendador/20",
  },
};

const TAMANOS_CONTENEDOR: Record<Tamano, string> = {
  pequeno: "h-8 w-8",
  normal: "h-11 w-11",
  grande: "h-14 w-14",
};

const TAMANOS_ICONO: Record<Tamano, string> = {
  pequeno: "h-4 w-4",
  normal: "h-5 w-5",
  grande: "h-6 w-6",
};

/** Insignia circular de un agente de Atlas: mismo icono y color allá donde aparezca (P-02, P-03, P-04, P-06...). */
export default function AvatarAgente({
  id,
  tamano = "normal",
  className = "",
}: {
  id: IdAgente;
  tamano?: Tamano;
  className?: string;
}) {
  const agente = getAgente(id);
  const colores = COLORES[id];

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ring-1 ${colores.fondo} ${colores.texto} ${colores.anillo} ${TAMANOS_CONTENEDOR[tamano]} ${className}`}
    >
      <agente.Icono className={TAMANOS_ICONO[tamano]} aria-hidden="true" />
    </span>
  );
}
