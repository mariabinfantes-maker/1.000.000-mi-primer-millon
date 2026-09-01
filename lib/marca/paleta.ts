/**
 * LA PALETA OFICIAL DE MOLNIP, para los sitios donde no llega el CSS.
 *
 * La fuente de verdad son los tokens de `app/globals.css`. Este fichero
 * existe solo porque hay superficies que NO pueden leer variables CSS:
 *
 * - Las imágenes de OpenGraph y los iconos los dibuja Satori a un PNG en el
 *   servidor, fuera del navegador.
 * - `themeColor` de `app/layout.tsx` acaba dentro de una etiqueta `<meta>`.
 * - `app/global-error.tsx` tiene que poder pintarse aunque la hoja de estilos
 *   no haya cargado — es justo la pantalla que se ve cuando eso falla.
 *
 * Antes esos ficheros escribían los colores a mano. Ahora los importan de
 * aquí, y una prueba comprueba que estos valores siguen coincidiendo con los
 * de `globals.css`: si alguien cambia la paleta en un sitio y no en el otro,
 * salta.
 *
 * Ver `brand-guidelines.md`. El color principal está congelado: no se cambia
 * sin aprobación expresa de la propietaria.
 */

export const PALETA_MOLNIP = {
  /** Índigo-violeta de marca. El ancla es el 600. */
  brand: {
    50: "#f7f6fd",
    100: "#f5f3fe",
    200: "#ddd9fa",
    300: "#b5adf2",
    400: "#a49aef",
    500: "#8073e8",
    600: "#6e5fe4",
    700: "#5849d0",
    800: "#3f2fb7",
    900: "#2e228c",
    950: "#1f1859",
  },
  /** Dorado de «la opción elegida». Como mucho una vez por pantalla. */
  gold: {
    50: "#fbf4e4",
    100: "#f6ecd6",
    200: "#ead6ac",
    300: "#dcbd7e",
    400: "#d0aa5b",
    500: "#c99a3d",
    600: "#ad812e",
    700: "#8a6624",
  },
  /** Escala neutra con matiz violeta: sustituye al gris de Tailwind. */
  slate: {
    50: "#faf9fc",
    100: "#f3f1f9",
    200: "#e7e3f5",
    300: "#d3cde8",
    400: "#a79fc9",
    500: "#8079a8",
    600: "#605892",
    700: "#4a4272",
    800: "#362f52",
    900: "#211d38",
    950: "#14121f",
  },
  /** Fondo cálido de la portada. No es el `slate-50` del resto de la web. */
  fondoCalido: "#fdfaf5",
  blanco: "#ffffff",
} as const;

/**
 * EL COLOR PRINCIPAL DE MOLNIP.
 *
 * Fijado por la propietaria el 2026-09-01. No se modifica sin su aprobación
 * explícita. Una prueba falla si este valor cambia.
 */
export const COLOR_PRINCIPAL = PALETA_MOLNIP.brand[600];
