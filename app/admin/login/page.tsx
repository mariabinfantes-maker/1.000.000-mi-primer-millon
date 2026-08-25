import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "@/components/admin/LoginForm";

/**
 * Panel interno: nunca indexable, nunca enlazado desde el sitio público.
 * Se llega solo escribiendo la URL directamente. `dynamic = "force-dynamic"`
 * porque depende de cookies/sesión en cada petición — nunca tiene sentido
 * prerenderizarla como página estática.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Acceso — panel interno",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-8 shadow-premium">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Panel interno</p>
        <h1 className="mt-2 font-display text-xl font-bold text-slate-900">Affiliate Manager</h1>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
