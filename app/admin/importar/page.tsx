import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { COOKIE_SESION } from "@/lib/admin/cookies";
import { verificarTokenSesion } from "@/lib/admin/sesion";
import PanelImportacion from "@/components/admin/PanelImportacion";

/**
 * Importación en bloque de enlaces de afiliación.
 *
 * Pantalla aparte y no un botón más del panel de afiliación: es la única
 * acción que puede cambiar decenas de herramientas de una vez, y merece
 * espacio para enseñar antes lo que va a hacer.
 */
export const metadata = { title: "Importar en bloque" };

export default async function ImportarPage() {
  const cookieStore = await cookies();
  if (!verificarTokenSesion(cookieStore.get(COOKIE_SESION)?.value)) redirect("/admin/login");
  return <PanelImportacion />;
}
