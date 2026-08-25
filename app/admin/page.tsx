import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { getTodasLasEstrategiasAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";
import { getTodosLosDatosDeAfiliados } from "@/data/repositorioAfiliados";
import { construirFilasPanel } from "@/agents/atlas-affiliate-manager/panelDatos";
import { COOKIE_SESION } from "@/lib/admin/cookies";
import { verificarTokenSesion } from "@/lib/admin/sesion";
import PanelAfiliacion from "@/components/admin/PanelAfiliacion";

/**
 * Segunda verificación de sesión a nivel de página, además del proxy —
 * mismo criterio de "nunca confiar en una sola capa" que ya aplican las
 * rutas de `/api/admin/*`. Si no hay sesión válida (no debería llegar
 * aquí sin pasar antes por el proxy, pero se comprueba igual), redirige
 * al login en vez de renderizar nada del panel.
 */
export default async function AdminPage() {
  const cookieStore = await cookies();
  const sesion = verificarTokenSesion(cookieStore.get(COOKIE_SESION)?.value);
  if (!sesion) redirect("/admin/login");

  const herramientas = getTodasLasHerramientas();
  const estrategias = getTodasLasEstrategiasAfiliacion();
  const datosAfiliados = getTodosLosDatosDeAfiliados();
  const hoy = new Date().toISOString().slice(0, 10);

  const filasIniciales = construirFilasPanel(herramientas, estrategias, datosAfiliados, hoy);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-slate-900">Affiliate Manager</h1>
      <p className="mt-1 text-sm text-slate-600">
        {filasIniciales.length} herramienta{filasIniciales.length === 1 ? "" : "s"} en total.
      </p>
      <PanelAfiliacion filasIniciales={filasIniciales} />
    </div>
  );
}
