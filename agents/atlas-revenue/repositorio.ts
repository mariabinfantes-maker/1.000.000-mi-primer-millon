import type { Pool } from "pg";
import { obtenerPool } from "@/data/db/cliente";
import type { EventoClic } from "@/lib/analitica/proveedorAnalitica";
import { normalizarRutaOrigen, type RutaOrigen } from "./rutaOrigen";
import type {
  AsientoIngreso,
  ClicsPorHerramienta,
  ClicsPorPantalla,
  ClicsPorRuta,
  IngresosPorHerramienta,
} from "./tipos";

// El vocabulario vive en `tipos.ts`, sin dependencias de servidor, para que
// el panel pueda compartirlo sin arrastrar `pg` al navegador.
export * from "./tipos";

/**
 * Atlas Revenue — persistencia.
 *
 * Guarda dos cosas y solo dos: el clic saliente y lo que la propietaria anota
 * de los paneles de afiliación.
 *
 * **Lo que NO guarda importa más que lo que guarda.** Ni IP, ni cookie, ni
 * identificador de sesión, ni user-agent, ni referer. No es una promesa de no
 * usarlos: es que el dato nunca entra, así que no hay nada que reidentificar
 * ni con qué enlazar dos clics del mismo visitante. `data/db/esquema.ts`
 * declara las columnas y una prueba comprueba que no aparezca ninguna más.
 *
 * **Revenue es exclusivamente analítico.** No importa ni un módulo de Advisor
 * ni de Affiliate Manager, no escribe en `estrategias_afiliacion` y no puede
 * influir en el ranking. Hay una prueba que lo verifica sobre el código.
 */

export type OpcionesRepositorio = { pool?: Pool };

function resolverPool(explicito?: Pool): Pool {
  return explicito ?? obtenerPool();
}

/**
 * Registra un clic. **Nunca lanza**: si la base de datos está caída, el
 * usuario ya va camino del proveedor y perder la medición de ese clic es
 * infinitamente preferible a romperle el recorrido. Devuelve si se pudo
 * guardar, para que quien llame pueda contarlo si le interesa.
 */
export async function registrarClicSaliente(
  evento: EventoClic & { rutaOrigen?: RutaOrigen },
  opciones: OpcionesRepositorio = {}
): Promise<boolean> {
  try {
    await resolverPool(opciones.pool).query(
      `INSERT INTO clics_salientes (herramienta_id, categoria_id, tipo_enlace, origen, ruta_origen)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        evento.herramientaId,
        evento.categoriaId,
        evento.tipoEnlace,
        evento.origen,
        normalizarRutaOrigen(evento.rutaOrigen) ?? null,
      ]
    );
    return true;
  } catch {
    return false;
  }
}

/** Clics agrupados por herramienta, de más a menos. */
export async function contarClicsPorHerramienta(
  opciones: OpcionesRepositorio & { desde?: string; hasta?: string } = {}
): Promise<ClicsPorHerramienta[]> {
  const { rows } = await resolverPool(opciones.pool).query<{
    herramienta_id: string;
    total: string;
    por_afiliado: string;
    por_oficial: string;
  }>(
    `SELECT herramienta_id,
            count(*) AS total,
            count(*) FILTER (WHERE tipo_enlace = 'afiliado') AS por_afiliado,
            count(*) FILTER (WHERE tipo_enlace = 'oficial')  AS por_oficial
       FROM clics_salientes
      WHERE ($1::timestamptz IS NULL OR fecha >= $1)
        AND ($2::timestamptz IS NULL OR fecha <  $2)
      GROUP BY herramienta_id
      ORDER BY total DESC, herramienta_id`,
    [opciones.desde ?? null, opciones.hasta ?? null]
  );
  return rows.map((f) => ({
    herramientaId: f.herramienta_id,
    total: Number(f.total),
    porAfiliado: Number(f.por_afiliado),
    porOficial: Number(f.por_oficial),
  }));
}

/**
 * Clics agrupados por recorrido de entrada. La respuesta a "¿qué pantallas y
 * recorridos producen los clics?", que es lo que hace útil el piloto.
 */
export async function contarClicsPorRuta(opciones: OpcionesRepositorio = {}): Promise<ClicsPorRuta[]> {
  const { rows } = await resolverPool(opciones.pool).query<{ ruta_origen: string | null; total: string }>(
    `SELECT coalesce(ruta_origen, 'sin-ruta') AS ruta_origen, count(*) AS total
       FROM clics_salientes
      GROUP BY 1
      ORDER BY total DESC, 1`
  );
  return rows.map((f) => ({ rutaOrigen: f.ruta_origen ?? "sin-ruta", total: Number(f.total) }));
}

export async function contarClicsPorPantalla(opciones: OpcionesRepositorio = {}): Promise<ClicsPorPantalla[]> {
  const { rows } = await resolverPool(opciones.pool).query<{ origen: string; total: string }>(
    `SELECT origen, count(*) AS total FROM clics_salientes GROUP BY origen ORDER BY total DESC, origen`
  );
  return rows.map((f) => ({ origen: f.origen, total: Number(f.total) }));
}

/**
 * Anota lo que ha comunicado un panel de afiliación. Append-only por trigger
 * de base de datos: corregir una cifra crea un asiento nuevo, nunca modifica
 * el anterior. Las comisiones se revierten por reembolsos, y el rastro de esa
 * reversión es parte de la contabilidad, no ruido que convenga borrar.
 */
export async function anotarIngreso(
  asiento: AsientoIngreso,
  opciones: OpcionesRepositorio & { usuario: string }
): Promise<void> {
  await resolverPool(opciones.pool).query(
    `INSERT INTO ingresos_afiliacion
       (herramienta_id, periodo, conversiones, importe_centimos, moneda, estado, fuente, nota, usuario)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      asiento.herramientaId,
      asiento.periodo,
      asiento.conversiones,
      asiento.importeCentimos,
      asiento.moneda,
      asiento.estado,
      asiento.fuente ?? null,
      asiento.nota ?? null,
      opciones.usuario,
    ]
  );
}

/**
 * Ingresos netos por herramienta: lo confirmado menos lo revertido. Lo
 * pendiente NO suma — es una cifra que el proveedor todavía puede retirar, y
 * contarla como ingreso sería contarse el dinero antes de tenerlo.
 */
export async function sumarIngresosConfirmados(
  opciones: OpcionesRepositorio = {}
): Promise<IngresosPorHerramienta[]> {
  const { rows } = await resolverPool(opciones.pool).query<{
    herramienta_id: string;
    moneda: string;
    conversiones: string;
    importe: string;
  }>(
    `SELECT herramienta_id, moneda,
            sum(CASE WHEN estado = 'confirmado' THEN conversiones
                     WHEN estado = 'revertido'  THEN -conversiones ELSE 0 END) AS conversiones,
            sum(CASE WHEN estado = 'confirmado' THEN importe_centimos
                     WHEN estado = 'revertido'  THEN -importe_centimos ELSE 0 END) AS importe
       FROM ingresos_afiliacion
      GROUP BY herramienta_id, moneda
      ORDER BY importe DESC, herramienta_id`
  );
  return rows.map((f) => ({
    herramientaId: f.herramienta_id,
    moneda: f.moneda,
    conversiones: Number(f.conversiones),
    importeCentimos: Number(f.importe),
  }));
}
