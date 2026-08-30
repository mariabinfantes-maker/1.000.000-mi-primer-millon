import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { COOKIE_SESION } from "@/lib/admin/cookies";
import { verificarTokenSesion } from "@/lib/admin/sesion";
import {
  contarClicsPorHerramienta,
  contarClicsPorPantalla,
  contarClicsPorRuta,
  sumarIngresosConfirmados,
} from "@/agents/atlas-revenue/repositorio";
import { construirFilas, ordenarRutas, resumir } from "@/agents/atlas-revenue/informe";
import PanelIngresos from "@/components/admin/PanelIngresos";

/**
 * Atlas Revenue en el panel.
 *
 * Misma doble verificación de sesión que el resto de `/admin`: el proxy ya
 * protege la ruta, y aquí se vuelve a comprobar — nunca confiar en una sola
 * capa.
 *
 * Si la base de datos falla, la pantalla se muestra vacía con un aviso en vez
 * de reventar: un informe es para consultarlo, y una consulta que no se puede
 * hacer no debería tirar el panel entero.
 */
export const metadata = { title: "Ingresos y clics" };

export default async function IngresosPage() {
  const cookieStore = await cookies();
  if (!verificarTokenSesion(cookieStore.get(COOKIE_SESION)?.value)) redirect("/admin/login");

  const datos = await Promise.all([
    contarClicsPorHerramienta(),
    sumarIngresosConfirmados(),
    contarClicsPorRuta(),
    contarClicsPorPantalla(),
  ]).catch(() => undefined);

  const nombres: Record<string, string> = {};
  for (const h of getTodasLasHerramientas()) nombres[h.id] = h.nombre;

  if (!datos) {
    return <PanelIngresos filas={[]} resumen={undefined} rutas={[]} pantallas={[]} nombres={nombres} sinConexion />;
  }

  const [clics, ingresos, rutas, pantallas] = datos;
  const filas = construirFilas(clics, ingresos);

  return (
    <PanelIngresos
      filas={filas}
      resumen={resumir(filas)}
      rutas={ordenarRutas(rutas)}
      pantallas={pantallas}
      nombres={nombres}
    />
  );
}
