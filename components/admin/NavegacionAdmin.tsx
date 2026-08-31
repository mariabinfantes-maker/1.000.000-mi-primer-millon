"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Navegación entre las pantallas del panel interno. Se marca la activa
 * comparando con la ruta actual, no guardando estado: así sigue siendo
 * correcta si se llega a una pantalla escribiendo la dirección a mano o
 * volviendo con el botón de atrás del navegador.
 */

const SECCIONES = [
  { href: "/admin", etiqueta: "Afiliación" },
  { href: "/admin/ingresos", etiqueta: "Ingresos" },
  { href: "/admin/historial", etiqueta: "Historial" },
] as const;

export default function NavegacionAdmin() {
  const ruta = usePathname();

  return (
    <nav aria-label="Secciones del panel" className="flex items-center gap-1">
      {SECCIONES.map((seccion) => {
        // `/admin` solo está activa en la raíz exacta; si no, lo estaría
        // también dentro de `/admin/historial`.
        const activa = seccion.href === "/admin" ? ruta === "/admin" : ruta.startsWith(seccion.href);
        return (
          <Link
            key={seccion.href}
            href={seccion.href}
            aria-current={activa ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              activa ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            {seccion.etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
