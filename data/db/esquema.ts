/**
 * Fuente única del esquema Postgres de estrategia de afiliación — la usan
 * tanto el script de aprovisionamiento real (`scripts/aprovisionar-esquema-postgres.ts`,
 * contra Neon) como las pruebas locales contra un Postgres temporal. Cada
 * elemento es una sentencia DDL independiente, en el orden en que deben
 * ejecutarse.
 *
 * `estrategias_afiliacion` guarda el mismo objeto `EstrategiaAfiliacion`
 * (ver `data/esquemaInterno.ts`) completo como JSONB, una fila por
 * herramienta — mismo modelo que los JSON actuales (un archivo por
 * herramienta), para no tener que tocar los contratos de
 * `fusionarEstrategiaAfiliacion`/`panelDatos.ts`/rutas API/CLI.
 *
 * `historial_cambios_afiliacion` es estrictamente de solo-inserción: el
 * trigger `historial_solo_insertar` rechaza cualquier UPDATE o DELETE a
 * nivel de base de datos, no solo por disciplina de la aplicación —
 * restaurar un valor anterior debe crear un evento nuevo, nunca modificar
 * uno existente.
 */
export const SENTENCIAS_ESQUEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS estrategias_afiliacion (
    herramienta_id text PRIMARY KEY,
    datos jsonb NOT NULL,
    actualizado_en timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS historial_cambios_afiliacion (
    id bigserial PRIMARY KEY,
    herramienta_id text NOT NULL,
    campo text NOT NULL,
    valor_anterior jsonb,
    valor_nuevo jsonb,
    motivo text,
    usuario text NOT NULL,
    fecha timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_historial_herramienta_fecha
   ON historial_cambios_afiliacion (herramienta_id, fecha DESC)`,
  `CREATE OR REPLACE FUNCTION prohibir_modificar_historial()
   RETURNS trigger AS $fn$
   BEGIN
     RAISE EXCEPTION 'historial_cambios_afiliacion es append-only: % no permitido en esta tabla', TG_OP;
   END;
   $fn$ LANGUAGE plpgsql`,
  `DROP TRIGGER IF EXISTS historial_solo_insertar ON historial_cambios_afiliacion`,
  `CREATE TRIGGER historial_solo_insertar
   BEFORE UPDATE OR DELETE ON historial_cambios_afiliacion
   FOR EACH ROW EXECUTE FUNCTION prohibir_modificar_historial()`,
];
