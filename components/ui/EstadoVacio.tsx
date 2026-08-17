import Image from "next/image";

/**
 * Estado vacío del sistema de imágenes de marca (Sistema Prisma): una
 * piedra de cristal lisa, sin tallar, en vez de un icono genérico — "nada
 * se ha encontrado todavía aquí". Componente único para que las tres
 * páginas que hoy pueden quedarse sin resultados (categoría, problema,
 * alternativas) compartan el mismo tratamiento en vez de repetir el
 * párrafo suelto.
 */
export default function EstadoVacio({ mensaje }: { mensaje: string }) {
  return (
    <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-6 py-10 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="h-20 w-20 overflow-hidden rounded-2xl shadow-premium">
        <Image
          src="/imagenes/marca/vacio-piedra.png"
          alt=""
          width={160}
          height={160}
          className="h-full w-full object-cover"
        />
      </div>
      <p className="max-w-sm text-sm leading-relaxed text-slate-500">{mensaje}</p>
    </div>
  );
}
