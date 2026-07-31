"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { leerTextoLibre } from "@/lib/textoLibreSesion";
import type { OrigenDiagnostico } from "@/lib/origenDiagnostico";
import Cuestionario from "@/components/Cuestionario";

/**
 * Puerta C ("Cuéntanoslo"): el texto libre viaja por sessionStorage desde
 * el selector de entrada (nunca por la URL). Si no hay nada guardado —
 * entrada directa a esta ruta, por ejemplo—, no hay nada que precargar y
 * se vuelve al inicio para elegir una puerta.
 */
export default function CuestionarioLibrePage() {
  const router = useRouter();
  const [origen, setOrigen] = useState<OrigenDiagnostico | null>(null);

  useEffect(() => {
    const texto = leerTextoLibre();
    if (!texto) {
      router.replace("/");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigen({
      tipo: "libre",
      id: "libre",
      titulo: "Tu diagnóstico",
      notasPrefill: texto,
      rutaBase: "/libre",
    });
  }, [router]);

  if (!origen) return null;

  return <Cuestionario origen={origen} />;
}
