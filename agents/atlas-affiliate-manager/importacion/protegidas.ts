import type { CuentaAfiliado } from "@/data/esquemaInterno";

/**
 * Qué no puede tocar una importación en bloque.
 *
 * La propietaria pidió que el piloto de cinco afiliaciones y Systeme.io
 * quedaran fuera del alcance de la importación. La forma obvia sería una
 * lista de nombres, pero ATLAS.md no las nombra y los JSON del repositorio
 * son respaldos de la migración: los datos vivos están en Neon. Escribir
 * aquí cinco identificadores a ojo sería inventarse el dato justo en la
 * pieza encargada de protegerlo.
 *
 * Así que se protege por lo que la cuenta ES, no por cómo se llama. Dos
 * reglas, y las dos apuntan a lo mismo: que un archivo no pueda deshacer un
 * trabajo hecho a mano.
 *
 *  1. Una cuenta ACTIVA no se toca. Es la que está generando tráfico real
 *     ahora mismo; cambiarla desde un archivo puede cortar los ingresos sin
 *     que nadie se entere hasta el siguiente cobro.
 *  2. Un enlace ya guardado no se pisa. Añadir uno donde no había es el
 *     objetivo de esta función; sustituir uno que alguien pegó y comprobó
 *     es otra cosa muy distinta.
 *
 * Ninguna de las dos impide editar desde «Gestionar»: ahí se ve la cuenta
 * entera y se cambia una cosa a la vez. Lo que se bloquea es el cambio
 * masivo y a ciegas.
 */

export type MotivoProteccion = { motivo: string };

/** Nombres protegidos explícitamente, además de por las reglas de arriba. */
export const PROTEGIDAS_POR_NOMBRE: ReadonlySet<string> = new Set([
  // La única que consta con certeza en esta conversación. Se pueden añadir
  // más aquí; las reglas de abajo ya cubren a las demás del piloto por su
  // estado y por tener enlace guardado.
  "systeme-io",
]);

export function comprobarProteccion(
  herramientaId: string,
  cuenta: CuentaAfiliado | undefined,
  cambia: { enlace?: string; estado?: string }
): MotivoProteccion | undefined {
  if (PROTEGIDAS_POR_NOMBRE.has(herramientaId)) {
    return { motivo: `«${herramientaId}» está protegida: se gestiona a mano desde «Gestionar».` };
  }

  if (!cuenta) return undefined;

  const tocaAlgo = cambia.enlace !== undefined || cambia.estado !== undefined;

  if (cuenta.estado === "activo" && tocaAlgo) {
    return {
      motivo:
        "La cuenta está ACTIVA y en uso: su enlace y su estado no se cambian desde una importación. Hazlo desde «Gestionar».",
    };
  }

  if (cambia.enlace !== undefined && cuenta.enlaces.length > 0) {
    const actual = cuenta.enlaces.find((e) => e.url === cambia.enlace);
    if (!actual) {
      return {
        motivo: "Ya tiene un enlace guardado y este es distinto. Sustituirlo se hace desde «Gestionar», a la vista.",
      };
    }
  }

  return undefined;
}
