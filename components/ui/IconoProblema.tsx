import { Target, Cog, Clock, FolderKanban, MessageCircle, type LucideIcon } from "lucide-react";

const ICONOS: Record<string, LucideIcon> = {
  "conseguir-clientes": Target,
  "automatizar-tareas": Cog,
  "ahorrar-tiempo": Clock,
  "organizar-empresa": FolderKanban,
  "atencion-cliente": MessageCircle,
};

/** Icono de marca para cada problema, en sustitución de los emoji del catálogo de datos. */
export default function IconoProblema({
  problemaId,
  className = "h-6 w-6",
}: {
  problemaId: string;
  className?: string;
}) {
  const Icono = ICONOS[problemaId] ?? Target;
  return <Icono className={className} aria-hidden="true" />;
}
