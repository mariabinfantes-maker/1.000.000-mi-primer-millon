import fs from "node:fs";
import path from "node:path";

/**
 * `npm run verificar-despliegue -- --url https://xxxx.vercel.app`
 *
 * Comprueba un despliegue ya publicado (vista previa o producción) desde
 * fuera, como lo vería cualquiera por internet. Está pensado para
 * ejecutarse desde el ordenador de quien gestiona el proyecto, porque el
 * entorno donde se escribe el código no tiene salida a internet.
 *
 * Qué comprueba, sin necesitar ninguna credencial:
 *  1. Las páginas públicas responden y tienen contenido.
 *  2. Opcional (--comparar-con): que el texto visible de las páginas
 *     públicas es idéntico al de otra dirección (p. ej. la web en
 *     producción), para confirmar que un cambio no ha alterado nada.
 *  3. Ninguna ruta administrativa es accesible sin sesión.
 *  4. El panel no es indexable (robots.txt y metaetiquetas).
 *  5. Ninguna respuesta filtra secretos.
 *  6. Opcional (--probar-bloqueo): que a los cinco intentos fallidos el
 *     acceso queda bloqueado de verdad en el despliegue real.
 *
 * NUNCA pide ni recibe la contraseña: el bloqueo se prueba con
 * credenciales inventadas. Iniciar sesión de verdad es algo que debe hacer
 * una persona en su navegador.
 *
 * Escribe un informe de texto sin secretos, que se puede compartir tal cual.
 */

const lineas: string[] = [];
function informar(l = "") {
  console.log(l);
  lineas.push(l);
}

let fallos = 0;
let avisos = 0;
function comprobar(descripcion: string, ok: boolean, detalle?: string) {
  informar(`  ${ok ? "✓" : "✗"} ${descripcion}`);
  if (detalle) informar(`      ${detalle}`);
  if (!ok) fallos++;
}
function avisar(texto: string) {
  informar(`  ⚠ ${texto}`);
  avisos++;
}

function leerFlag(args: string[], nombre: string): string | undefined {
  const i = args.indexOf(`--${nombre}`);
  return i === -1 || i + 1 >= args.length ? undefined : args[i + 1];
}

/** Texto que lee una persona: sin scripts, sin estilos, sin etiquetas. */
function textoVisible(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");
}

async function pedir(url: string, opciones: RequestInit = {}) {
  const respuesta = await fetch(url, { redirect: "manual", ...opciones });
  const cuerpo = await respuesta.text();
  return { estado: respuesta.status, cabeceras: respuesta.headers, cuerpo, destino: respuesta.headers.get("location") };
}

const RUTAS_PUBLICAS = ["/", "/sobre", "/blog", "/aviso-legal", "/privacidad", "/cookies", "/terminos"];
const RUTAS_ADMIN = [
  "/admin",
  "/api/admin/afiliacion",
  "/api/admin/afiliacion/exportar",
  "/api/admin/afiliacion/historial?herramientaId=grammarly",
];

/**
 * Rastros que NUNCA deben aparecer en una respuesta pública. No se buscan
 * valores concretos (no los conocemos), sino la forma que tendrían.
 */
const PATRONES_DE_SECRETO: [string, RegExp][] = [
  ["cadena de conexión a Postgres", /postgres(ql)?:\/\/[^\s"'<]*:[^\s"'<@]+@/i],
  ["cadena de conexión a Redis", /rediss?:\/\/[^\s"'<]*:[^\s"'<@]+@/i],
  ["token de Upstash o KV", /(UPSTASH_REDIS_REST_TOKEN|KV_REST_API_TOKEN)\s*[:=]\s*["']?[A-Za-z0-9_-]{12,}/],
  ["hash de la contraseña administrativa", /ADMIN_PANEL_PASSWORD_HASH\s*[:=]\s*["']?[0-9a-f]{16,}/i],
  ["secreto de sesión administrativa", /ADMIN_PANEL_SECRETO\s*[:=]\s*["']?[A-Za-z0-9_-]{20,}/],
  ["usuario administrativo", /ADMIN_PANEL_USUARIO\s*[:=]\s*["']?\S+/],
  ["formato de hash sal:clave", /\b[0-9a-f]{32}:[0-9a-f]{64,}\b/i],
];

function buscarSecretos(donde: string, texto: string) {
  for (const [nombre, patron] of PATRONES_DE_SECRETO) {
    if (patron.test(texto)) {
      comprobar(`${donde}: SIN rastro de ${nombre}`, false, "Se ha encontrado algo con esa forma — revísalo antes de desplegar.");
      return;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const base = (leerFlag(args, "url") ?? "").replace(/\/$/, "");
  const referencia = (leerFlag(args, "comparar-con") ?? "").replace(/\/$/, "");
  const probarBloqueo = args.includes("--probar-bloqueo");

  if (!base) {
    console.error("Uso: npm run verificar-despliegue -- --url https://tu-vista-previa.vercel.app");
    console.error("");
    console.error("Opciones:");
    console.error("  --comparar-con https://molnip.com   compara el texto visible con esa dirección");
    console.error("  --probar-bloqueo                    prueba el bloqueo tras 5 intentos fallidos");
    console.error("                                      (dejará TU IP bloqueada 15 minutos)");
    process.exitCode = 1;
    return;
  }

  informar("═".repeat(70));
  informar("  VERIFICACIÓN DE UN DESPLIEGUE PUBLICADO");
  informar(`  ${base}`);
  informar(`  ${new Date().toISOString()}`);
  informar("═".repeat(70));

  // ── 1 · Páginas públicas ──────────────────────────────────────────
  informar("");
  informar("1 · LAS PÁGINAS PÚBLICAS FUNCIONAN");
  const publicas: Record<string, string> = {};
  for (const ruta of RUTAS_PUBLICAS) {
    try {
      const r = await pedir(`${base}${ruta}`, { redirect: "follow" });
      const texto = textoVisible(r.cuerpo);
      publicas[ruta] = texto;
      comprobar(`${ruta} responde correctamente`, r.estado === 200 && texto.length > 200, `HTTP ${r.estado} · ${texto.split("\n").length} líneas de texto`);
      buscarSecretos(ruta, r.cuerpo);
    } catch (error) {
      comprobar(`${ruta} responde correctamente`, false, error instanceof Error ? error.message : "error de red");
    }
  }

  // ── 2 · Comparación con otra dirección ────────────────────────────
  if (referencia) {
    informar("");
    informar(`2 · EL CONTENIDO PÚBLICO ES IDÉNTICO AL DE ${referencia}`);
    for (const ruta of RUTAS_PUBLICAS) {
      if (!publicas[ruta]) continue;
      try {
        const r = await pedir(`${referencia}${ruta}`, { redirect: "follow" });
        const textoReferencia = textoVisible(r.cuerpo);
        comprobar(`${ruta} — mismo texto visible`, textoReferencia === publicas[ruta]);
      } catch {
        avisar(`${ruta} — no se pudo leer de ${referencia} para comparar`);
      }
    }
  } else {
    informar("");
    informar("2 · COMPARACIÓN CON OTRA DIRECCIÓN — omitida (usa --comparar-con)");
  }

  // ── 3 · Rutas administrativas cerradas ────────────────────────────
  informar("");
  informar("3 · NINGUNA RUTA ADMINISTRATIVA ES ACCESIBLE SIN SESIÓN");
  for (const ruta of RUTAS_ADMIN) {
    try {
      const r = await pedir(`${base}${ruta}`);
      const cerrada = r.estado === 401 || r.estado === 403 || (r.estado >= 300 && r.estado < 400 && (r.destino ?? "").includes("/admin/login"));
      comprobar(
        `${ruta} — cerrada al público`,
        cerrada,
        `HTTP ${r.estado}${r.destino ? ` → ${r.destino}` : ""}`
      );
      // Aunque esté cerrada, la respuesta no debe filtrar nada.
      buscarSecretos(ruta, r.cuerpo);
    } catch (error) {
      comprobar(`${ruta} — cerrada al público`, false, error instanceof Error ? error.message : "error de red");
    }
  }

  // ── 4 · No indexable ──────────────────────────────────────────────
  informar("");
  informar("4 · EL PANEL NO ES INDEXABLE POR BUSCADORES");
  try {
    const robots = await pedir(`${base}/robots.txt`, { redirect: "follow" });
    comprobar("robots.txt prohíbe /admin", /Disallow:\s*\/admin/i.test(robots.cuerpo), robots.cuerpo.split("\n").filter((l) => /disallow/i.test(l)).join(" · "));
  } catch {
    comprobar("robots.txt prohíbe /admin", false, "no se pudo leer robots.txt");
  }

  try {
    const login = await pedir(`${base}/admin/login`, { redirect: "follow" });
    const noindexCabecera = login.cabeceras.get("x-robots-tag") ?? "";
    const noindexMeta = /<meta[^>]+name=["']robots["'][^>]*noindex/i.test(login.cuerpo);
    comprobar("La página de acceso pide no ser indexada", noindexMeta || /noindex/i.test(noindexCabecera), noindexMeta ? "metaetiqueta noindex presente" : `cabecera: ${noindexCabecera || "(ninguna)"}`);
    buscarSecretos("/admin/login", login.cuerpo);
  } catch {
    comprobar("La página de acceso pide no ser indexada", false, "no se pudo leer /admin/login");
  }

  try {
    const mapa = await pedir(`${base}/sitemap.xml`, { redirect: "follow" });
    comprobar("El mapa del sitio no menciona /admin", !/\/admin/i.test(mapa.cuerpo));
  } catch {
    avisar("No se pudo leer sitemap.xml");
  }

  // ── 5 · Bloqueo de intentos ───────────────────────────────────────
  informar("");
  if (probarBloqueo) {
    informar("5 · BLOQUEO TRAS INTENTOS FALLIDOS (contra el Redis real del despliegue)");
    informar("      Se usan credenciales inventadas: nunca tu usuario ni tu contraseña.");
    const usuarioInventado = `prueba-bloqueo-${Date.now()}`;
    const estados: number[] = [];
    for (let i = 1; i <= 6; i++) {
      try {
        const r = await pedir(`${base}/api/admin/login`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ usuario: usuarioInventado, password: `intento-${i}` }),
        });
        estados.push(r.estado);
        buscarSecretos("respuesta de /api/admin/login", r.cuerpo);
      } catch {
        estados.push(0);
      }
    }
    informar(`      Códigos de los seis intentos: ${estados.join(", ")}`);
    const rechazadosAlPrincipio = estados.slice(0, 5).every((e) => e === 401 || e === 429);
    const bloqueadoAlFinal = estados[5] === 429;
    comprobar("Los intentos fallidos se rechazan", rechazadosAlPrincipio);
    comprobar("Al superar el límite, el acceso queda bloqueado (429)", bloqueadoAlFinal);
    if (bloqueadoAlFinal) {
      informar("");
      informar("      NOTA: tu conexión queda bloqueada unos 15 minutos. Es la prueba");
      informar("      de que funciona. Espera ese rato antes de entrar al panel.");
    }
  } else {
    informar("5 · BLOQUEO TRAS INTENTOS FALLIDOS — omitido");
    informar("      Añade --probar-bloqueo para comprobarlo.");
    informar("      Aviso: dejará tu conexión bloqueada 15 minutos, así que hazlo");
    informar("      DESPUÉS de haber entrado al panel y comprobado lo demás.");
  }

  // ── Resumen ───────────────────────────────────────────────────────
  informar("");
  informar("═".repeat(70));
  if (fallos === 0) informar(avisos === 0 ? "  ✓ TODAS LAS COMPROBACIONES CORRECTAS" : `  ✓ COMPROBACIONES CORRECTAS (con ${avisos} aviso(s))`);
  else informar(`  ✗ ${fallos} COMPROBACIÓN(ES) FALLIDA(S)`);
  informar("═".repeat(70));
  informar("");
  informar("Este informe no contiene contraseñas, tokens ni cadenas de conexión:");
  informar("se puede compartir tal cual.");

  const dir = path.join(process.cwd(), "copias-seguridad-afiliacion");
  fs.mkdirSync(dir, { recursive: true });
  const ruta = path.join(dir, `informe-despliegue-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`);
  fs.writeFileSync(ruta, `${lineas.join("\n")}\n`, "utf-8");
  console.log("");
  console.log(`Informe guardado en: ${path.relative(process.cwd(), ruta)}`);

  if (fallos > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("");
  console.error("✗ Error:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
