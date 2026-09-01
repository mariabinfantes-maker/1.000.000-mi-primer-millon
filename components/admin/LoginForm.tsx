"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  // Poder ver lo que se escribe evita el caso más frustrante: teclear bien
  // la contraseña, que el navegador la muestre como puntos, y no tener
  // forma de saber si el fallo fue una errata o las credenciales.
  const [mostrarPassword, setMostrarPassword] = useState(false);

  async function alEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setError(null);

    try {
      const respuesta = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password }),
      });

      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => ({}));
        setError(datos.error ?? "No se pudo iniciar sesión.");
        setEnviando(false);
        return;
      }

      const destino = searchParams.get("desde");
      router.push(destino && destino.startsWith("/admin") ? destino : "/admin");
      router.refresh();
    } catch {
      setError("Error de red. Inténtalo de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <form className="mt-6 flex flex-col gap-4" onSubmit={alEnviar}>
      <div>
        <label htmlFor="usuario" className="block text-sm font-medium text-slate-700">
          Usuario
        </label>
        <input
          id="usuario"
          name="usuario"
          type="text"
          autoComplete="username"
          required
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 shadow-sm placeholder:text-slate-400 transition hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          Contraseña
        </label>
        <div className="relative mt-1">
          <input
            id="password"
            name="password"
            type={mostrarPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-4 pr-12 text-base text-slate-900 shadow-sm placeholder:text-slate-400 transition hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <button
            type="button"
            onClick={() => setMostrarPassword((visible) => !visible)}
            aria-label={mostrarPassword ? "Ocultar la contraseña" : "Mostrar la contraseña"}
            aria-pressed={mostrarPassword}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 transition hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
          >
            {mostrarPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-error-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="mt-2 inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-premium transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enviando ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
