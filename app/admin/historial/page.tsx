import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { getHistorialGlobal } from "@/data/repositorioEstrategiaAfiliacion";
import { COOKIE_SESION } from "@/lib/admin/cookies";
import { verificarTokenSesion } from "@/lib/admin/sesion";
import PanelHistorial from "@/components/admin/PanelHistorial";

/**
 * Historial de cambios de la estrategia de afiliación.
 *
 * Segunda verificación de sesión a nivel de página, además del proxy —
 * mismo criterio de "nunca confiar en una sola capa" que ya aplican
 * `/admin` y las rutas de `/api/admin/*`.
 */
export const metadata = { title: "Historial de cambios" };

const EVENTOS_POR_PAGINA = 50;

export default async function HistorialPage() {
  const cookieStore = await cookies();
  const sesion = verificarTokenSesion(cookieStore.get(COOKIE_SESION)?.value);
  if (!sesion) redirect("/admin/login");

  const { eventos, total } = await getHistorialGlobal({ limite: EVENTOS_POR_PAGINA });

  // Para poder mostrar "Grammarly" en vez de "grammarly" en cada apunte.
  const nombresDeHerramienta: Record<string, string> = {};
  for (const herramienta of getTodasLasHerramientas()) {
    nombresDeHerramienta[herramienta.id] = herramienta.nombre;
  }

  return (
    <PanelHistorial
      eventosIniciales={eventos}
      totalInicial={total}
      nombresDeHerramienta={nombresDeHerramienta}
      porPagina={EVENTOS_POR_PAGINA}
    />
  );
}
