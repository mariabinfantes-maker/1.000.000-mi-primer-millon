/**
 * IP real de quien hace la petición, detrás del proxy de Vercel.
 *
 * Punto delicado: estas cabeceras las puede escribir cualquiera. Si se
 * confiara en ellas sin más, bastaría con enviar una IP inventada distinta
 * en cada intento para saltarse por completo el límite por IP.
 *
 * Por eso se usa `x-vercel-forwarded-for` como primera opción: en Vercel la
 * fija el propio proxy y sobrescribe lo que mandara el cliente. Solo si no
 * existe se recurre a `x-forwarded-for`, tomando SIEMPRE la primera entrada
 * de la lista (la más cercana al cliente; las siguientes las puede haber
 * añadido cualquiera antes de llegar).
 *
 * Si no hay ninguna cabecera utilizable se devuelve `"desconocida"`, un
 * valor fijo: todos los intentos sin IP identificable comparten contador,
 * que es el comportamiento prudente. Nunca se devuelve algo controlado por
 * quien llama.
 */

const MAXIMA_LONGITUD_IP = 45; // una IPv6 completa cabe de sobra

function saneada(valor: string | undefined | null): string | null {
  if (!valor) return null;
  const primera = valor.split(",")[0]?.trim();
  if (!primera) return null;
  // Solo caracteres válidos en una IPv4/IPv6; cualquier otra cosa se
  // descarta en vez de acabar dentro de una clave de Redis.
  if (primera.length > MAXIMA_LONGITUD_IP || !/^[0-9a-fA-F.:]+$/.test(primera)) return null;
  return primera;
}

export function obtenerIpCliente(request: Request): string {
  return (
    saneada(request.headers.get("x-vercel-forwarded-for")) ??
    saneada(request.headers.get("x-real-ip")) ??
    saneada(request.headers.get("x-forwarded-for")) ??
    "desconocida"
  );
}
