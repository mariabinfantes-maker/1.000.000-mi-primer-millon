"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  CLAVE_RECARGA,
  MENSAJE_REGISTRO,
  evaluarEvento,
  type Recuperacion,
} from "@/lib/recuperacionDeVersion";

/**
 * Conecta la lógica de `lib/recuperacionDeVersion.ts` al navegador.
 *
 * No pinta nada mientras todo va bien: solo escucha. Si detecta que el
 * navegador se ha quedado con una versión vieja de la web, recarga UNA vez
 * y, si aun así sigue rota, enseña un aviso con un botón para actualizar a
 * mano.
 *
 * Nunca borra `sessionStorage`: ahí viaja lo que la persona ha escrito
 * entre pantallas (ver `lib/textoLibreSesion.ts`), y una recarga que
 * perdiera esos datos sería peor que el problema que arregla.
 */
export default function RecuperacionDeVersion() {
  const [mostrarAviso, setMostrarAviso] = useState(false);

  useEffect(() => {
    // Se lee y se escribe siempre dentro de try/catch: `sessionStorage`
    // lanza excepción, no devuelve null, cuando el navegador lo bloquea.
    function leerEstado(): { yaSeRecargo: boolean; sePuedeRecordar: boolean } {
      try {
        return { yaSeRecargo: sessionStorage.getItem(CLAVE_RECARGA) !== null, sePuedeRecordar: true };
      } catch {
        return { yaSeRecargo: false, sePuedeRecordar: false };
      }
    }

    function actuar(decision: Recuperacion) {
      if (decision === "ignorar") return;

      if (decision === "avisar") {
        console.warn(MENSAJE_REGISTRO.avisar);
        setMostrarAviso(true);
        return;
      }

      console.warn(MENSAJE_REGISTRO.recargar);
      try {
        sessionStorage.setItem(CLAVE_RECARGA, "1");
      } catch {
        // Sin memoria no se recarga: mejor un aviso que un bucle.
        setMostrarAviso(true);
        return;
      }
      // `reload()` conserva `sessionStorage`, así que lo que la persona
      // haya escrito sigue ahí al volver.
      window.location.reload();
    }

    function alFallarUnRecurso(evento: Event) {
      const objetivo = evento.target as (HTMLElement & { src?: string; href?: string }) | null;
      actuar(
        evaluarEvento(
          { objetivo: objetivo ? { tagName: objetivo.tagName, src: objetivo.src, href: objetivo.href } : null },
          leerEstado()
        )
      );
    }

    function alRechazarsePromesa(evento: PromiseRejectionEvent) {
      const motivo = evento.reason as { name?: string; message?: string } | undefined;
      actuar(
        evaluarEvento({ mensaje: motivo?.message, nombreDelError: motivo?.name }, leerEstado())
      );
    }

    // `true` en el tercer argumento: los fallos de carga de un recurso no
    // burbujean, solo se ven en la fase de captura.
    window.addEventListener("error", alFallarUnRecurso, true);
    window.addEventListener("unhandledrejection", alRechazarsePromesa);
    return () => {
      window.removeEventListener("error", alFallarUnRecurso, true);
      window.removeEventListener("unhandledrejection", alRechazarsePromesa);
    };
  }, []);

  if (!mostrarAviso) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-atencion-300 bg-atencion-50 px-4 py-3 shadow-premium-lg sm:px-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-atencion-900">
          Tu navegador tiene guardada una versión antigua de Molnip y algunos enlaces pueden no funcionar.
          Actualiza la página para cargar la última versión.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-atencion-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-atencion-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-atencion-400"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Actualizar la página
        </button>
      </div>
    </div>
  );
}
