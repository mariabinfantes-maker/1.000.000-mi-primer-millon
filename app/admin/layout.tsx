import type { Metadata } from "next";
import BotonCerrarSesion from "@/components/admin/BotonCerrarSesion";

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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6">
          <p className="text-sm font-semibold text-slate-900">Molnip — panel interno</p>
          <BotonCerrarSesion />
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
