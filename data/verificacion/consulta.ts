import type { RegistroDeIdioma, RegistroDeRecorrido, RegistroVerificacion } from "./esquema";
import { evidenciaDeIdioma, evidenciaDeRecorrido, evidenciaDeRegistro, evidenciaDeUso } from "./evidencia";
import type { EvidenciaDeCapacidad, EvidenciaDeIdioma, EvidenciaDeRecorrido, EvidenciaDeUso, PuertoDeEvidencia } from "./puerto";
import { getIdiomas, getRecorridos, getRegistros } from "./repositorio";
import { filaDeRuta } from "./rutas";
import { getUso } from "./usos";

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
export function crearPuertoDeEvidencia(
  registros: RegistroVerificacion[],
  recorridos: RegistroDeRecorrido[] = [],
  idiomas: RegistroDeIdioma[] = []
): PuertoDeEvidencia {
  const porPar = new Map<string, RegistroVerificacion>();
  const recorridoPorPar = new Map<string, RegistroDeRecorrido>();
  const idiomaPorHerramienta = new Map<string, RegistroDeIdioma>();

  for (const r of recorridos) {
    const k = clave(r.herramientaId, r.recorridoId);
    if (recorridoPorPar.has(k)) throw new Error(`La verificación tiene dos recorridos para ${r.herramientaId} / ${r.recorridoId}.`);
    recorridoPorPar.set(k, r);
  }
  for (const i of idiomas) {
    if (idiomaPorHerramienta.has(i.herramientaId)) throw new Error(`La verificación tiene dos registros de idioma para ${i.herramientaId}.`);
    idiomaPorHerramienta.set(i.herramientaId, i);
  }
  const verificadasPorHerramienta = new Map<string, string[]>();
  const herramientasPorCapacidad = new Map<string, string[]>();

  for (const registro of registros) {
    const k = clave(registro.herramientaId, registro.capacidadId);
    if (porPar.has(k)) {
      throw new Error(`La verificación tiene dos registros para ${registro.herramientaId} / ${registro.capacidadId}.`);
    }
    porPar.set(k, registro);

    // Sólo lo demostrado entra en los índices. Un `no_disponible` está
    // verificado y no es algo que la herramienta sepa hacer: indexarlo aquí
    // sería decir lo contrario de lo que la evidencia dice.
    if (registro.estado !== "verificado" || registro.profundidad === "no_disponible") continue;
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
    usoDe(herramientaId: string, usoId: string): EvidenciaDeUso {
      // El uso cuelga de su capacidad: se busca el registro de ESA capacidad.
      const uso = getUso(usoId);
      const registro = uso ? porPar.get(clave(herramientaId, uso.capacidadId)) : undefined;
      return evidenciaDeUso(herramientaId, usoId, registro);
    },
    recorridoDe(herramientaId: string, recorridoId: string): EvidenciaDeRecorrido {
      return evidenciaDeRecorrido(herramientaId, recorridoId, recorridoPorPar.get(clave(herramientaId, recorridoId)));
    },
    idiomaDe(herramientaId: string): EvidenciaDeIdioma {
      return evidenciaDeIdioma(herramientaId, idiomaPorHerramienta.get(herramientaId));
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
  cachePuerto = crearPuertoDeEvidencia(getRegistros(), getRecorridos(), getIdiomas());
  return cachePuerto;
}

/**
 * La verificación con la forma exacta que el motor pide — F3, bloque 5.
 *
 * Es el ÚNICO punto por el que la verificación entra en la aplicación. El
 * motor no importa nada de aquí: recibe este objeto por parámetro desde la
 * ruta de API, y con eso `data/verificacion` sigue teniendo un solo lector.
 *
 * `loDemuestra` devuelve `true` sólo con un `demostrada`: verificado Y con la
 * profundidad distinta de `no_disponible`. Devuelven `false` los otros dos
 * estados —«no consta», se preguntara o no, y «ausencia demostrada»— y el
 * motor no los distingue porque para decidir quién compite pesan igual.
 *
 * Cuidado con leer ese `false` como una negación: en dos de los tres casos
 * significa que no lo ha demostrado, no que no lo haga.
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
      return puerto.estadoDe(herramientaId, capacidadId).estado === "demostrada";
    },
    /**
     * Los tres estados de un uso, sin colapsar: el motor los necesita los
     * tres, porque un uso imprescindible sólo pasa con `demostrada`, y una
     * ausencia demostrada aparta a la herramienta de ese uso aunque no sea
     * imprescindible. `no_consta` la deja como candidata.
     */
    estadoDeUso(herramientaId: string, usoId: string) {
      return puerto.usoDe(herramientaId, usoId).estado;
    },
  };
}
