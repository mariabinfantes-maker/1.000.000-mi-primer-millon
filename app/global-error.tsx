"use client";

import { useEffect } from "react";

/**
 * Red de seguridad para un fallo en el propio layout raíz (fuente,
 * `<Header>`, o cualquier cosa fuera del `<main>` que cubre `error.tsx`).
 * Next.js exige que este archivo pinte su propio `<html>`/`<body>` — el
 * layout que ha fallado ya no está disponible, así que no puede depender
 * de `globals.css`, `Boton` ni ningún otro componente que pudiera formar
 * parte del problema. Estilos en línea a propósito: es la última red, no
 * el sitio normal.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          background: "#faf9fc",
          color: "#14121f",
        }}
      >
        <div style={{ maxWidth: 420, padding: "0 24px", textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: "0 auto",
              borderRadius: 16,
              background: "#6e5fe4",
            }}
          />
          <h1 style={{ marginTop: 24, fontSize: 22, fontWeight: 700 }}>Algo ha fallado</h1>
          <p style={{ marginTop: 8, lineHeight: 1.6, color: "#605892" }}>
            No ha sido cosa tuya — ha ocurrido un error inesperado. Puedes intentarlo de nuevo o
            volver al inicio.
          </p>
          <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                cursor: "pointer",
                border: "none",
                borderRadius: 10,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                background: "#6e5fe4",
              }}
            >
              Reintentar
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- deliberado: el layout raíz (con el router) es justo lo que puede haber fallado aquí, así que un enlace normal que fuerza una recarga completa es más fiable que depender de next/link. */}
            <a
              href="/"
              style={{
                borderRadius: 10,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 600,
                color: "#6e5fe4",
                border: "1px solid #ddd9fa",
                textDecoration: "none",
              }}
            >
              Volver al inicio
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
