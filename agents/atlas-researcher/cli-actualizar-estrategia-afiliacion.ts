import { getHerramienta } from "@/data/repositorio";
import { getEstrategiaAfiliacion, guardarEstrategiaAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";
import { borradorYaExiste } from "./borrador";
import {
  esEstadoAfiliacionValido,
  fusionarEstrategiaAfiliacion,
  generarIdCuenta,
  type CambiosCuentaAfiliado,
} from "./estrategiaAfiliacion";

/**
 * `npm run actualizar-estrategia-afiliacion -- id [--cuenta id] [--estado ...] [--plataforma ...] ...`
 *
 * Registra o actualiza la relación real de Atlas con un programa de
 * afiliados de una herramienta (solicitud, aprobación, condiciones,
 * enlaces propios) — independiente de `AffiliateData` (lo investigado) y de
 * `decision.ts` (el veredicto editorial). Solo actualiza los campos que
 * indiques; el resto conserva su valor anterior.
 *
 * Una herramienta puede tener varias cuentas de afiliado (varias
 * plataformas, o varias cuentas en la misma plataforma): `--cuenta`
 * identifica cuál se actualiza. Si no se indica, se deriva de
 * `--plataforma`; si tampoco se indica ninguna de las dos, se usa
 * "principal" — así el caso simple de una sola cuenta no exige pensar en
 * ids.
 */

const USO =
  'Uso: npm run actualizar-estrategia-afiliacion -- id [--cuenta id] [--estado no_solicitado|pendiente|aprobado|rechazado|activo] ' +
  "[--nombre-programa \"...\"] [--plataforma \"...\"] [--url-solicitud \"...\"] [--usuario-registro \"...\"] " +
  "[--fecha-solicitud AAAA-MM-DD] [--fecha-aprobacion AAAA-MM-DD] [--comision \"...\"] [--cookie \"...\"] " +
  "[--metodo-pago \"...\"] [--frecuencia-pago \"...\"] [--enlace \"...\"] [--segmento pais_o_idioma] [--notas \"...\"]";

function leerFlag(args: string[], nombre: string): string | undefined {
  const indice = args.indexOf(`--${nombre}`);
  if (indice === -1 || indice + 1 >= args.length) return undefined;
  return args[indice + 1];
}

function main() {
  const args = process.argv.slice(2);
  const id = args[0];

  if (!id || id.startsWith("--")) {
    console.error(USO);
    process.exitCode = 1;
    return;
  }

  const estado = leerFlag(args, "estado");
  if (estado !== undefined && !esEstadoAfiliacionValido(estado)) {
    console.error(`--estado inválido: "${estado}". Debe ser uno de: no_solicitado, pendiente, aprobado, rechazado, activo.`);
    process.exitCode = 1;
    return;
  }

  if (!borradorYaExiste(id) && !getHerramienta(id)) {
    console.warn(`⚠ No se encontró ningún borrador ni herramienta en el catálogo real con id "${id}" — continúo igualmente.`);
  }

  const plataforma = leerFlag(args, "plataforma");
  const cuentaId = leerFlag(args, "cuenta") ?? (plataforma ? generarIdCuenta(plataforma) : "principal");

  const cambios: CambiosCuentaAfiliado = {
    estado: estado as CambiosCuentaAfiliado["estado"],
    nombrePrograma: leerFlag(args, "nombre-programa"),
    plataforma,
    urlSolicitud: leerFlag(args, "url-solicitud"),
    usuarioRegistro: leerFlag(args, "usuario-registro"),
    fechaSolicitud: leerFlag(args, "fecha-solicitud"),
    fechaAprobacion: leerFlag(args, "fecha-aprobacion"),
    comision: leerFlag(args, "comision"),
    duracionCookie: leerFlag(args, "cookie"),
    metodoPago: leerFlag(args, "metodo-pago"),
    frecuenciaPago: leerFlag(args, "frecuencia-pago"),
    enlaceUrl: leerFlag(args, "enlace"),
    segmentoEnlace: leerFlag(args, "segmento"),
    observaciones: leerFlag(args, "notas"),
  };

  const existente = getEstrategiaAfiliacion(id);
  const hoy = new Date().toISOString().slice(0, 10);
  const actualizada = fusionarEstrategiaAfiliacion(id, cuentaId, existente, cambios, hoy);

  guardarEstrategiaAfiliacion(actualizada);

  const cuenta = actualizada.cuentas.find((c) => c.id === cuentaId)!;
  console.log(`✓ Estrategia de afiliación de "${id}" (cuenta "${cuentaId}") actualizada: estado "${cuenta.estado}" (revisado ${hoy}).`);
}

main();
