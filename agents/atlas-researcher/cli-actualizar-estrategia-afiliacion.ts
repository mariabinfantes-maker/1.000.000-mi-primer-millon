import { getHerramienta } from "@/data/repositorio";
import { getEstrategiaAfiliacion, guardarEstrategiaAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";
import { borradorYaExiste } from "./borrador";
import { esEstadoAfiliacionValido, fusionarEstrategiaAfiliacion, type CambiosEstrategiaAfiliacion } from "./estrategiaAfiliacion";

/**
 * `npm run actualizar-estrategia-afiliacion -- id [--estado ...] [--nombre-programa ...] ...`
 *
 * Registra o actualiza la relación real de Atlas con el programa de
 * afiliados de una herramienta (solicitud, aprobación, condiciones,
 * enlace propio) — independiente de `AffiliateData` (lo investigado) y de
 * `decision.ts` (el veredicto editorial). Solo actualiza los campos que
 * indiques; el resto conserva su valor anterior.
 */

const USO =
  'Uso: npm run actualizar-estrategia-afiliacion -- id [--estado no_solicitado|pendiente|aprobado|rechazado|activo] ' +
  "[--nombre-programa \"...\"] [--plataforma \"...\"] [--url-solicitud \"...\"] [--usuario-registro \"...\"] " +
  "[--fecha-solicitud AAAA-MM-DD] [--fecha-aprobacion AAAA-MM-DD] [--comision \"...\"] [--cookie \"...\"] " +
  "[--metodo-pago \"...\"] [--frecuencia-pago \"...\"] [--enlace-afiliado \"...\"] [--notas \"...\"]";

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

  const cambios: CambiosEstrategiaAfiliacion = {
    estado,
    nombrePrograma: leerFlag(args, "nombre-programa"),
    plataforma: leerFlag(args, "plataforma"),
    urlSolicitud: leerFlag(args, "url-solicitud"),
    usuarioRegistro: leerFlag(args, "usuario-registro"),
    fechaSolicitud: leerFlag(args, "fecha-solicitud"),
    fechaAprobacion: leerFlag(args, "fecha-aprobacion"),
    comision: leerFlag(args, "comision"),
    duracionCookie: leerFlag(args, "cookie"),
    metodoPago: leerFlag(args, "metodo-pago"),
    frecuenciaPago: leerFlag(args, "frecuencia-pago"),
    enlaceAfiliadoPropio: leerFlag(args, "enlace-afiliado"),
    observaciones: leerFlag(args, "notas"),
  };

  const existente = getEstrategiaAfiliacion(id);
  const hoy = new Date().toISOString().slice(0, 10);
  const actualizada = fusionarEstrategiaAfiliacion(id, existente, cambios, hoy);

  guardarEstrategiaAfiliacion(actualizada);

  console.log(`✓ Estrategia de afiliación de "${id}" actualizada: estado "${actualizada.estado}" (revisado ${hoy}).`);
}

main();
