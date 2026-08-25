"use client";

import { useRouter } from "next/navigation";

export default function BotonCerrarSesion() {
  const router = useRouter();

  async function cerrarSesion() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={cerrarSesion}
      className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
    >
      Cerrar sesión
    </button>
  );
}
