import type { EstadoPanel } from "@/agents/atlas-affiliate-manager/proximaAccion";

/**
 * Cómo se presenta cada estado del proceso de afiliación: su nombre, su
 * explicación y su color. Un solo sitio, a propósito.
 *
 * Antes esto vivía dentro de `PanelAfiliacion.tsx`, y el color de cada estado
 * estaba escrito con clases sueltas de Tailwind: «aprobada» era `lime`,
 * «seguimiento» era `orange`, y otras cuatro usaban los tokens de MENSAJE
 * (`exito`, `error`, `atencion`, `info`) como si un estado del negocio y un
 * aviso de pantalla fueran la misma cosa. No lo son: el verde de «guardado
 * correctamente» y el verde de «esta afiliación está activa» pueden
 * evolucionar por separado, y con el nombre compartido no podrían.
 *
 * Ahora cada estado tiene su propio par de tokens —`estado-<nombre>-fondo` y
 * `estado-<nombre>-texto`, declarados en `globals.css`— con exactamente el
 * mismo valor que antes. El color en pantalla no ha cambiado; lo que ha
 * cambiado es que ahora se llama por lo que significa.
 *
 * Los tokens `estado-*` solo se escriben aquí. Una prueba falla si aparecen
 * en cualquier otro fichero.
 */

/** El nombre corto que se ve en la píldora. */
export const ETIQUETA_ESTADO: Record<EstadoPanel, string> = {
  pendiente: "Pendiente",
  preparada: "Preparada",
  enviada: "Enviada",
  aprobada: "Aprobada",
  activa: "Activa",
  rechazada: "Rechazada",
  seguimiento: "Seguimiento",
};

/** Qué significa cada estado, en la propia pantalla. "Aprobada" y "Activa" se parecen demasiado como para dejarlo a la intuición. */
export const AYUDA_ESTADO: Record<EstadoPanel, string> = {
  pendiente: "Todavía no se ha solicitado el programa.",
  preparada: "Hay borrador de solicitud, falta enviarlo.",
  enviada: "Solicitud enviada, esperando respuesta.",
  aprobada: "Programa aprobado. El enlace AÚN NO se usa: hay que activarla.",
  activa: "En uso. Los botones «Ir al proveedor» ya llevan tu enlace.",
  rechazada: "El programa no la ha aceptado.",
  seguimiento: "Enviada hace tiempo y sin respuesta.",
};

/** El color de la píldora de cada estado. Mismos valores de siempre, ahora con nombre funcional. */
export const COLOR_ESTADO: Record<EstadoPanel, string> = {
  pendiente: "bg-estado-pendiente-fondo text-estado-pendiente-texto",
  preparada: "bg-estado-preparada-fondo text-estado-preparada-texto",
  enviada: "bg-estado-enviada-fondo text-estado-enviada-texto",
  aprobada: "bg-estado-aprobada-fondo text-estado-aprobada-texto",
  activa: "bg-estado-activa-fondo text-estado-activa-texto",
  rechazada: "bg-estado-rechazada-fondo text-estado-rechazada-texto",
  seguimiento: "bg-estado-seguimiento-fondo text-estado-seguimiento-texto",
};

/**
 * «Seguimiento» escrito suelto sobre fondo blanco: los días que una
 * afiliación lleva estancada, junto a la próxima acción. Necesita un tono con
 * más contraste que el de la píldora, porque no tiene fondo que lo sostenga.
 */
export const COLOR_DIAS_ESTANCADA = "text-estado-seguimiento-nota";
