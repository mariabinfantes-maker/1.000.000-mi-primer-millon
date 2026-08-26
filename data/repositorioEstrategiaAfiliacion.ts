import type { Pool } from "pg";
import type { CuentaAfiliado, EstrategiaAfiliacion } from "./esquemaInterno";
import { obtenerPool } from "./db/cliente";

/**
 * Capa de acceso a la ESTRATEGIA de afiliación de Atlas — la relación real
 * y propia de Atlas con cada programa de afiliados (ver el comentario de
 * `EstrategiaAfiliacion` en `esquemaInterno.ts` para la diferencia con
 * `AffiliateData`/`repositorioAfiliados.ts`).
 *
 * Desde el sub-sprint 1E vive en Postgres (Neon), tabla
 * `estrategias_afiliacion` — una fila por herramienta, el mismo objeto
 * `EstrategiaAfiliacion` completo como JSONB (mismo modelo que los JSON
 * anteriores, un archivo por herramienta). Los JSON de
 * `data/estrategia-afiliados/*.json` siguen en el repositorio como
 * semilla/copia de respaldo de la migración (`scripts/migrar-json-a-postgres.ts`)
 * — ya no son la fuente que lee ni escribe la aplicación.
 *
 * Cada escritura registra en `historial_cambios_afiliacion` qué campo
 * cambió, su valor anterior y el nuevo, cuándo y qué usuario administrativo
 * lo hizo — la tabla es append-only también a nivel de base de datos (ver
 * `data/db/esquema.ts`): restaurar un valor anterior crea un evento nuevo
 * (`restaurarValorHistorial`), nunca modifica uno existente.
 *
 * `opciones.pool` es un parámetro de pruebas — cada test le pasa un `Pool`
 * apuntando a un Postgres local temporal, nunca a Neon real. Sin `pool`
 * explícito, se usa `obtenerPool()` (`data/db/cliente.ts`), que ya aplica
 * su propio aislamiento fail-closed contra pruebas E2E (`MOLNIP_E2E` +
 * `POSTGRES_URL_TEST`) — mismo criterio que el antiguo
 * `ESTRATEGIA_AFILIACION_DIR`, ahora a nivel de conexión en vez de directorio.
 */

export type OpcionesRepositorio = { pool?: Pool };
export type OpcionesGuardar = OpcionesRepositorio & { usuario: string; motivo?: string };

export type EventoHistorial = {
  id: number;
  herramientaId: string;
  campo: string;
  valorAnterior: unknown;
  valorNuevo: unknown;
  motivo: string | null;
  usuario: string;
  fecha: string;
};

function resolverPool(poolExplicito?: Pool): Pool {
  return poolExplicito ?? obtenerPool();
}

/** La estrategia de afiliación de una herramienta, o `undefined` si todavía no se ha empezado a gestionar. */
export async function getEstrategiaAfiliacion(
  herramientaId: string,
  opciones: OpcionesRepositorio = {}
): Promise<EstrategiaAfiliacion | undefined> {
  const pool = resolverPool(opciones.pool);
  const { rows } = await pool.query<{ datos: EstrategiaAfiliacion }>(
    `SELECT datos FROM estrategias_afiliacion WHERE herramienta_id = $1`,
    [herramientaId]
  );
  return rows[0]?.datos;
}

/** Todas las estrategias de afiliación gestionadas hasta ahora. Para paneles internos o auditorías, nunca para el usuario final. */
export async function getTodasLasEstrategiasAfiliacion(opciones: OpcionesRepositorio = {}): Promise<EstrategiaAfiliacion[]> {
  const pool = resolverPool(opciones.pool);
  const { rows } = await pool.query<{ datos: EstrategiaAfiliacion }>(
    `SELECT datos FROM estrategias_afiliacion ORDER BY herramienta_id`
  );
  return rows.map((fila) => fila.datos);
}

type DiferenciaCampo = { campo: string; valorAnterior: unknown; valorNuevo: unknown };

/** Campos "planos" de una cuenta que se registran en el historial si cambian. `enlaces` se compara aparte por ser un array. */
const CAMPOS_CUENTA_HISTORIAL: (keyof CuentaAfiliado)[] = [
  "estado",
  "plataforma",
  "nombrePrograma",
  "usuarioRegistro",
  "urlSolicitud",
  "fechaSolicitud",
  "fechaAprobacion",
  "comision",
  "duracionCookie",
  "metodoPago",
  "frecuenciaPago",
  "observaciones",
  "verificacionPendiente",
  "requisitosPrograma",
  "borradorSolicitud",
  "enlaceUltimaComprobacion",
  "enlaceComprobacionOk",
];

function calcularDiferenciasCuenta(anterior: CuentaAfiliado | undefined, nueva: CuentaAfiliado): DiferenciaCampo[] {
  const diferencias: DiferenciaCampo[] = [];

  for (const campo of CAMPOS_CUENTA_HISTORIAL) {
    const valorAnterior = anterior?.[campo] ?? null;
    const valorNuevo = nueva[campo] ?? null;
    if (JSON.stringify(valorAnterior) !== JSON.stringify(valorNuevo)) {
      diferencias.push({ campo: `${nueva.id}.${campo}`, valorAnterior, valorNuevo });
    }
  }

  const enlacesAnterior = JSON.stringify(anterior?.enlaces ?? []);
  const enlacesNuevo = JSON.stringify(nueva.enlaces ?? []);
  if (enlacesAnterior !== enlacesNuevo) {
    diferencias.push({ campo: `${nueva.id}.enlaces`, valorAnterior: anterior?.enlaces ?? [], valorNuevo: nueva.enlaces });
  }

  return diferencias;
}

/**
 * Escribe (crea o sobrescribe por completo) la estrategia de afiliación de
 * una herramienta, y registra en `historial_cambios_afiliacion` cada campo
 * que cambió respecto a la versión guardada anteriormente. Todo dentro de
 * una única transacción: la actualización y su historial se escriben
 * juntos o no se escribe ninguno de los dos.
 */
export async function guardarEstrategiaAfiliacion(estrategia: EstrategiaAfiliacion, opciones: OpcionesGuardar): Promise<void> {
  const pool = resolverPool(opciones.pool);
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");

    const { rows } = await cliente.query<{ datos: EstrategiaAfiliacion }>(
      `SELECT datos FROM estrategias_afiliacion WHERE herramienta_id = $1 FOR UPDATE`,
      [estrategia.herramientaId]
    );
    const anterior = rows[0]?.datos;
    const cuentasAnterioresPorId = new Map((anterior?.cuentas ?? []).map((cuenta) => [cuenta.id, cuenta]));

    const diferencias = estrategia.cuentas.flatMap((cuenta) =>
      calcularDiferenciasCuenta(cuentasAnterioresPorId.get(cuenta.id), cuenta)
    );

    await cliente.query(
      `INSERT INTO estrategias_afiliacion (herramienta_id, datos, actualizado_en)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (herramienta_id) DO UPDATE SET datos = EXCLUDED.datos, actualizado_en = now()`,
      [estrategia.herramientaId, JSON.stringify(estrategia)]
    );

    for (const diferencia of diferencias) {
      await cliente.query(
        `INSERT INTO historial_cambios_afiliacion (herramienta_id, campo, valor_anterior, valor_nuevo, motivo, usuario)
         VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6)`,
        [
          estrategia.herramientaId,
          diferencia.campo,
          JSON.stringify(diferencia.valorAnterior),
          JSON.stringify(diferencia.valorNuevo),
          opciones.motivo ?? null,
          opciones.usuario,
        ]
      );
    }

    await cliente.query("COMMIT");
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
}

function filaAEvento(fila: {
  // `bigserial` — `pg` lo devuelve como texto para no perder precisión en
  // valores grandes; se convierte explícitamente a number (nunca se
  // acercará a 2^53 eventos reales).
  id: number | string;
  herramienta_id: string;
  campo: string;
  valor_anterior: unknown;
  valor_nuevo: unknown;
  motivo: string | null;
  usuario: string;
  fecha: Date;
}): EventoHistorial {
  return {
    id: Number(fila.id),
    herramientaId: fila.herramienta_id,
    campo: fila.campo,
    valorAnterior: fila.valor_anterior,
    valorNuevo: fila.valor_nuevo,
    motivo: fila.motivo,
    usuario: fila.usuario,
    fecha: fila.fecha.toISOString(),
  };
}

/** El historial de cambios de una herramienta, más reciente primero. */
export async function getHistorialCambios(herramientaId: string, opciones: OpcionesRepositorio = {}): Promise<EventoHistorial[]> {
  const pool = resolverPool(opciones.pool);
  const { rows } = await pool.query(
    `SELECT id, herramienta_id, campo, valor_anterior, valor_nuevo, motivo, usuario, fecha
     FROM historial_cambios_afiliacion WHERE herramienta_id = $1 ORDER BY fecha DESC, id DESC`,
    [herramientaId]
  );
  return rows.map(filaAEvento);
}

/**
 * Neutraliza los comodines de `LIKE` dentro del texto que escribe la
 * persona: en la base de datos `%` significa "cualquier cosa" y `_`
 * "cualquier carácter". Sin esto, buscar "%" —algo muy normal cuando los
 * valores son comisiones tipo "25%"— devolvería el historial entero en vez
 * de las líneas que contienen ese símbolo.
 */
function escaparComodines(texto: string): string {
  return texto.replace(/[\\%_]/g, (caracter) => `\\${caracter}`);
}

export type FiltroHistorial = {
  /** Limita a una herramienta concreta. */
  herramientaId?: string;
  /** Texto libre: busca en el nombre del campo, el usuario, el motivo y los valores. */
  busqueda?: string;
  /** Cuántos eventos devolver (por defecto 50, máximo 200). */
  limite?: number;
  /** Desde qué posición, para pasar páginas. */
  desplazamiento?: number;
};

/**
 * Historial de TODAS las herramientas, más reciente primero, con búsqueda
 * y paginación — lo que necesita la pantalla de historial del panel.
 *
 * Devuelve también el total de coincidencias (no solo la página actual)
 * para poder mostrar "X de Y" y saber si quedan más por cargar. La
 * búsqueda se hace en la propia base de datos y no trayéndose todo a
 * memoria: el historial crece sin techo por diseño (es de solo inserción),
 * así que no puede leerse entero cada vez.
 */
export async function getHistorialGlobal(
  filtro: FiltroHistorial = {},
  opciones: OpcionesRepositorio = {}
): Promise<{ eventos: EventoHistorial[]; total: number }> {
  const pool = resolverPool(opciones.pool);

  const condiciones: string[] = [];
  const parametros: unknown[] = [];

  if (filtro.herramientaId) {
    parametros.push(filtro.herramientaId);
    condiciones.push(`herramienta_id = $${parametros.length}`);
  }

  const busqueda = filtro.busqueda?.trim();
  if (busqueda) {
    parametros.push(`%${escaparComodines(busqueda)}%`);
    const posicion = parametros.length;
    // `valor_anterior`/`valor_nuevo` son JSONB: se convierten a texto para
    // poder buscar dentro de ellos igual que en el resto de columnas.
    const comparar = (columna: string) => `${columna} ILIKE $${posicion} ESCAPE '\\'`;
    condiciones.push(
      `(${[
        comparar("herramienta_id"),
        comparar("campo"),
        comparar("usuario"),
        comparar("coalesce(motivo, '')"),
        comparar("valor_anterior::text"),
        comparar("valor_nuevo::text"),
      ].join(" OR ")})`
    );
  }

  const donde = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

  const { rows: filasTotal } = await pool.query<{ total: string }>(
    `SELECT count(*) AS total FROM historial_cambios_afiliacion ${donde}`,
    parametros
  );

  const limite = Math.min(Math.max(filtro.limite ?? 50, 1), 200);
  const desplazamiento = Math.max(filtro.desplazamiento ?? 0, 0);
  parametros.push(limite, desplazamiento);

  const { rows } = await pool.query(
    `SELECT id, herramienta_id, campo, valor_anterior, valor_nuevo, motivo, usuario, fecha
     FROM historial_cambios_afiliacion ${donde}
     ORDER BY fecha DESC, id DESC
     LIMIT $${parametros.length - 1} OFFSET $${parametros.length}`,
    parametros
  );

  return { eventos: rows.map(filaAEvento), total: Number(filasTotal[0].total) };
}

/**
 * Restaura el valor anterior de un evento de historial concreto — nunca
 * modifica ni borra el evento original (la tabla lo impide a nivel de base
 * de datos), en vez de eso vuelve a llamar a `guardarEstrategiaAfiliacion`
 * con el campo revertido, lo que genera un evento NUEVO documentando la
 * restauración.
 */
export async function restaurarValorHistorial(idEvento: number, opciones: OpcionesGuardar): Promise<EstrategiaAfiliacion> {
  const pool = resolverPool(opciones.pool);
  const { rows } = await pool.query<{ herramienta_id: string; campo: string; valor_anterior: unknown }>(
    `SELECT herramienta_id, campo, valor_anterior FROM historial_cambios_afiliacion WHERE id = $1`,
    [idEvento]
  );
  const evento = rows[0];
  if (!evento) throw new Error(`No existe ningún evento de historial con id ${idEvento}.`);

  const separador = evento.campo.indexOf(".");
  const cuentaId = evento.campo.slice(0, separador);
  const nombreCampo = evento.campo.slice(separador + 1);

  const actual = await getEstrategiaAfiliacion(evento.herramienta_id, { pool });
  if (!actual) throw new Error(`"${evento.herramienta_id}" ya no tiene estrategia guardada — no se puede restaurar.`);
  if (!actual.cuentas.some((cuenta) => cuenta.id === cuentaId)) {
    throw new Error(`"${evento.herramienta_id}" ya no tiene la cuenta "${cuentaId}" — no se puede restaurar.`);
  }

  const cuentas = actual.cuentas.map((cuenta) =>
    cuenta.id === cuentaId ? { ...cuenta, [nombreCampo]: evento.valor_anterior } : cuenta
  );
  const restaurada: EstrategiaAfiliacion = { ...actual, cuentas };

  await guardarEstrategiaAfiliacion(restaurada, {
    ...opciones,
    motivo: `Restaurado desde historial #${idEvento}${opciones.motivo ? ` — ${opciones.motivo}` : ""}`,
  });
  return restaurada;
}
