"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import Boton from "@/components/ui/Boton";

/**
 * La URL que se comparte es siempre `window.location.href` en el momento
 * del clic, nunca una prop calculada en el servidor: así no hay riesgo de
 * que diverja de la barra de direcciones real (redirecciones, dominio de
 * previsualización, etc.).
 */
export default function BotonCompartir({ titulo, texto }: { titulo: string; texto: string }) {
  const [copiado, setCopiado] = useState(false);

  async function compartir() {
    const url = window.location.href;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: titulo, text: texto, url });
        return;
      } catch {
        // El usuario cerró el panel nativo de compartir, o el navegador lo
        // rechazó: seguimos con el portapapeles como alternativa.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Portapapeles no disponible (contexto no seguro, permiso denegado):
      // no queda ninguna alternativa que ofrecer.
    }
  }

  return (
    <Boton type="button" variante="secundario" onClick={compartir} className="shrink-0">
      {copiado ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
      {copiado ? "Enlace copiado" : "Compartir"}
    </Boton>
  );
}
