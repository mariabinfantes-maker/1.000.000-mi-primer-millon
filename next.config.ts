import type { NextConfig } from "next";

/**
 * Cabecera de caché de los DOCUMENTOS HTML.
 *
 * Sin esto, Next sirve las páginas prerenderizadas con
 * `Cache-Control: s-maxage=31536000` y nada más. `s-maxage` solo se lo
 * aplican las cachés compartidas (el CDN de Vercel, que además se vacía en
 * cada despliegue); para el NAVEGADOR esa cabecera no dice nada. Y una
 * respuesta sin `max-age` ni `Expires` cae en la "caché heurística": el
 * navegador decide por su cuenta cuánto tiempo la da por buena, y puede
 * servir el HTML guardado sin preguntar al servidor.
 *
 * Eso es exactamente lo que rompió molnip.com el 2026-08-27. El HTML viejo
 * se quedó en el navegador; los archivos de JavaScript de cada despliegue
 * llevan un hash distinto en el nombre, así que ese HTML pedía archivos que
 * ya no existían. Resultado: la página se pinta entera y ningún enlace
 * funciona, sin un solo error a la vista — porque los enlaces de Next
 * interceptan la pulsación y luego no pueden completar la navegación.
 *
 * `max-age=0, must-revalidate` no desactiva la caché: el navegador sigue
 * guardando el HTML, pero PREGUNTA siempre antes de usarlo. Si no ha
 * cambiado, el servidor responde 304 y no se descarga nada — mismo coste de
 * red, misma velocidad, pero nunca una versión vieja. `s-maxage` se mantiene
 * intacto, así que el CDN sigue sirviendo la página al instante.
 *
 * Los archivos de `/_next/static/` quedan FUERA a propósito: llevan un hash
 * en el nombre, son inmutables por definición y Next no permite (ni debe
 * permitir) cambiarles la cabecera.
 */
const CABECERAS_HTML = [
  {
    key: "Cache-Control",
    value: "public, max-age=0, must-revalidate",
  },
];

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        // Todo menos los recursos con hash en el nombre, que son inmutables.
        source: "/((?!_next/static|_next/image).*)",
        headers: CABECERAS_HTML,
      },
    ];
  },
};

export default nextConfig;
