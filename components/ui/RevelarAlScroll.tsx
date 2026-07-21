"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * Revela su contenido con un fundido + desplazamiento suave cuando entra en
 * el viewport, para que las secciones bajo el pliegue se descubran al hacer
 * scroll en vez de aparecer todas de golpe. Respeta prefers-reduced-motion.
 */
export default function RevelarAlScroll({
  children,
  retrasoMs = 0,
  className = "",
}: {
  children: ReactNode;
  retrasoMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (visible) return;
    const nodo = ref.current;
    if (!nodo) return;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true);
          observador.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -80px 0px" }
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [visible]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${retrasoMs}ms` }}
    >
      {children}
    </div>
  );
}
