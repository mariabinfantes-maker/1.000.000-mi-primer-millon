import type { RegistroVerificacion } from "./esquema";
import { evidenciaDeRegistro } from "./evidencia";
import type { EvidenciaDeCapacidad, PuertoDeEvidencia } from "./puerto";
import { getRegistros } from "./repositorio";
import { filaDeRuta } from "./rutas";

/**
 * El índice de la verificación — F3, bloque 1.
 *
 * `registros.json` son 988 KB y 32.523 líneas. Recorrerlo para responder a una
 * sola pregunta, o volver a parsearlo en cada petición, no es una opción: el
 * motor pregunta una vez por cada herramienta candidata y cada capacidad
 * exigida, así que hablamos de decenas de consultas por cuestionario.
 *
 * Se construye una vez, con tres índices, y se responde en tiempo constante.
 *
 * La función que construye el puerto (`crearPuertoDeEvidencia`) es pura y
 * recibe los registros: así las pruebas la ejercitan con seis registros
 * inventados en vez de con el millón de caracteres del archivo real. La que
 * lee del disco (`getPuertoDeEvidencia`) es la única que toca `fs`, y memoiza
 * igual que `getHerramientas()` en `data/repositorio.ts`.
 *
 * NADIE LO LEE TODAVÍA: conectar esto al motor es el bloque 5.
 */

/** La clave del índice. El separador no puede aparecer en un id, y hay prueba de ello. */
function clave(herramientaId: string, capacidadId: string): string {
  return `${herramientaId}|${capacidadId}`;
}

/**
 * Construye un puerto sobre los registros que se le den.
 *
 * Un par repetido hace fallar la construcción en vez de quedarse con uno de
 * los dos: dos registros del mismo par pueden decir cosas distintas, y elegir
 * en silencio sería afirmar algo que nadie decidió. Las pruebas de F2 ya
 * garantizan que no los hay; esto es el cinturón por si alguna vez dejan de
 * garantizarlo.
 */
export function crearPuertoDeEvidencia(registros: RegistroVerificacion[]): PuertoDeEvidencia {
  const porPar = new Map<string, RegistroVerificacion>();
  const verificadasPorHerramienta = new Map<string, string[]>();
  const herramientasPorCapacidad = new Map<string, string[]>();

  for (const registro of registros) {
    const k = clave(registro.herramientaId, registro.capacidadId);
    if (porPar.has(k)) {
      throw new Error(`La verificación tiene dos registros para ${registro.herramientaId} / ${registro.capacidadId}.`);
    }
    porPar.set(k, registro);

    if (registro.estado !== "verificado") continue;
    const suyas = verificadasPorHerramienta.get(registro.herramientaId) ?? [];
    suyas.push(registro.capacidadId);
    verificadasPorHerramienta.set(registro.herramientaId, suyas);

    const quienes = herramientasPorCapacidad.get(registro.capacidadId) ?? [];
    quienes.push(registro.herramientaId);
    herramientasPorCapacidad.set(registro.capacidadId, quienes);
  }

  // Orden estable: el resultado no puede depender de en qué orden se escribió
  // el archivo, ni cambiar al reconvertir un lote.
  for (const lista of verificadasPorHerramienta.values()) lista.sort();
  for (const lista of herramientasPorCapacidad.values()) lista.sort();

  return {
    estadoDe(herramientaId: string, capacidadId: string): EvidenciaDeCapacidad {
      return evidenciaDeRegistro(herramientaId, capacidadId, porPar.get(clave(herramientaId, capacidadId)));
    },
    capacidadesVerificadasDe(herramientaId: string): string[] {
      return [...(verificadasPorHerramienta.get(herramientaId) ?? [])];
    },
    herramientasQueDemuestran(capacidadId: string): string[] {
      return [...(herramientasPorCapacidad.get(capacidadId) ?? [])];
    },
  };
}

let cachePuerto: PuertoDeEvidencia | null = null;

/** El puerto sobre los registros reales. Se construye una vez por proceso. */
export function getPuertoDeEvidencia(): PuertoDeEvidencia {
  if (cachePuerto) return cachePuerto;
  cachePuerto = crearPuertoDeEvidencia(getRegistros());
  return cachePuerto;
}

/**
 * La verificación con la forma exacta que el motor pide — F3, bloque 5.
 *
 * Es el ÚNICO punto por el que la verificación entra en la aplicación. El
 * motor no importa nada de aquí: recibe este objeto por parámetro desde la
 * ruta de API, y con eso `data/verificacion` sigue teniendo un solo lector.
 *
 * `loDemuestra` devuelve `true` sólo con un `verificado`. Un «no consta» —se
 * preguntara o no— devuelve `false`, y eso NO significa que la herramienta no
 * lo haga: significa que no lo ha demostrado.
 */
export function getPuertaDeEvidencia() {
  const puerto = getPuertoDeEvidencia();
  return {
    filaDe(categoriaId: string, subtipoId?: string) {
      const fila = filaDeRuta(categoriaId, subtipoId);
      return fila
        ? { ambito: fila.ambito, necesidad: fila.necesidad, exigeAlgunaDe: fila.exigeAlgunaDe }
        : undefined;
    },
    loDemuestra(herramientaId: string, capacidadId: string): boolean {
      return puerto.estadoDe(herramientaId, capacidadId).estado === "verificado";
    },
  };
}
