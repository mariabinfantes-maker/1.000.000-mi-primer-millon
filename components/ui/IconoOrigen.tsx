import { LayoutGrid, MessageCircle } from "lucide-react";
import IconoProblema from "@/components/ui/IconoProblema";
import type { TipoOrigenDiagnostico } from "@/lib/origenDiagnostico";

/** Icono para cualquiera de las tres puertas de entrada. Delega en IconoProblema para "objetivo" (ya existía y sigue siendo la única fuente de verdad para esos iconos). */
export default function IconoOrigen({
  tipo,
  id,
  className = "h-6 w-6",
}: {
  tipo: TipoOrigenDiagnostico;
  id: string;
  className?: string;
}) {
  if (tipo === "objetivo") return <IconoProblema problemaId={id} className={className} />;
  if (tipo === "categoria") return <LayoutGrid className={className} aria-hidden="true" />;
  return <MessageCircle className={className} aria-hidden="true" />;
}
