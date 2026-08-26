import type { Metadata } from "next";
import { cookies } from "next/headers";
import BotonCerrarSesion from "@/components/admin/BotonCerrarSesion";
import NavegacionAdmin from "@/components/admin/NavegacionAdmin";
import { COOKIE_SESION } from "@/lib/admin/cookies";
import { verificarTokenSesion } from "@/lib/admin/sesion";

/**
 * Todo `/admin/*` es no indexable y depende de sesión en cada petición —
 * `dynamic = "force-dynamic"` heredado por cada página hija a menos que
 * ellas mismas lo sobrescriban (no lo hacen).
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Panel interno", template: "%s | Panel interno" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // El botón de cerrar sesión solo tiene sentido si hay sesión: sin esta
  // comprobación aparecía también en la propia pantalla de login (detectado
  // revisando las capturas de la verificación del 2026-08-25).
  const cookieStore = await cookies();
  const haySesion = verificarTokenSesion(cookieStore.get(COOKIE_SESION)?.value) !== null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <p className="text-sm font-semibold text-slate-900">Molnip — panel interno</p>
          {haySesion && <NavegacionAdmin />}
          {haySesion && (
            <div className="ml-auto">
              <BotonCerrarSesion />
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
