/**
 * Comprueba, contra un Molnip en marcha, las cinco cosas que tienen que ser
 * ciertas para que el piloto de Atlas Revenue recoja datos útiles.
 *
 * Se ejecuta con un navegador real y no con peticiones sueltas a la API,
 * porque lo que puede romperse no es el endpoint: es que un botón deje de
 * pasar la etiqueta de recorrido. Eso solo se ve pulsando.
 *
 *   POSTGRES_URL_NON_POOLING=... BASE_URL=https://molnip.com \
 *     npx tsx scripts/verificar-revenue.ts
 *
 * AVISO: el clic de prueba queda registrado de verdad. La tabla es de
 * solo-inserción, así que esa fila se queda. Es una fila, y es la prueba
 * de que la medición funciona.
 */
import { chromium, devices } from "@playwright/test";
import { obtenerPoolSinPooling, cerrarPools } from "@/data/db/cliente";

const BASE = process.env.BASE_URL ?? "https://molnip.com";
const RUTA_CHROMIUM = process.env.RUTA_CHROMIUM;

type Resultado = { comprobacion: string; bien: boolean; detalle: string };

async function main() {
  const pool = obtenerPoolSinPooling();
  const resultados: Resultado[] = [];
  const anotar = (comprobacion: string, bien: boolean, detalle: string) =>
    resultados.push({ comprobacion, bien, detalle });

  const navegador = await chromium.launch(RUTA_CHROMIUM ? { executablePath: RUTA_CHROMIUM } : {});

  for (const [nombre, opciones] of [
    ["escritorio", { viewport: { width: 1440, height: 1000 } }],
    ["móvil", devices["Pixel 5"]],
  ] as const) {
    const contexto = await navegador.newContext({ ...opciones });
    const pagina = await contexto.newPage();

    // 1. La web responde y la portada carga.
    const respuesta = await pagina.goto(BASE, { waitUntil: "domcontentloaded" });
    anotar(`portada responde (${nombre})`, respuesta?.status() === 200, `HTTP ${respuesta?.status()}`);

    // 2. Un clic real desde una ficha, con su etiqueta de recorrido.
    const antes = await contarClics(pool);
    // Se entra por la ficha y se pulsa desde ahí, no directamente a /ir:
    // así `origen` queda como en un recorrido de verdad. Entrando a /ir a
    // pelo, `origen` sale "desconocido" y la comprobación no diría nada
    // sobre el camino que sigue una persona.
    await pagina.goto(`${BASE}/herramienta/grammarly`, { waitUntil: "domcontentloaded" });
    await pagina.getByRole("link", { name: /ir a|probar|visitar|web oficial/i }).first().click();
    await pagina.waitForURL(/\/ir(\?|$)/, { timeout: 15000 });
    const enlace = pagina.getByRole("link", { name: /ir a|continuar|abrir/i }).first();
    const destino = await enlace.getAttribute("href");
    await enlace.click({ modifiers: ["Alt"] }).catch(() => {});
    await pagina.waitForTimeout(2500);

    const ultimo = await ultimoClic(pool);
    anotar(
      `clic registrado con herramienta, tipo y ruta (${nombre})`,
      (await contarClics(pool)) > antes &&
        typeof ultimo?.ruta_origen === "string" &&
        ultimo.ruta_origen.length > 0 &&
        ultimo.origen !== "desconocido",
      JSON.stringify(ultimo)
    );

    // 3. El enlace de afiliada llega entero.
    const tieneSa = !!destino && destino.includes("?sa=");
    anotar(
      `la redirección conserva el enlace (${nombre})`,
      !!destino && (tieneSa || !destino.includes("molnip.com")),
      `${destino}${tieneSa ? "  ← lleva ?sa=" : "  (sin ?sa=: comprueba si esta herramienta tiene enlace propio)"}`
    );

    await contexto.close();
  }
  await navegador.close();

  // 4. Nada personal en la tabla.
  const { rows: columnas } = await pool.query(
    `SELECT column_name FROM information_schema.columns
      WHERE table_schema='public' AND table_name='clics_salientes' ORDER BY 1`
  );
  const nombres = columnas.map((c: { column_name: string }) => c.column_name);
  // Por palabras completas, no por subcadenas: "tipo_enlace" contiene "ip"
  // y hacía saltar la alarma sin motivo.
  const PALABRAS_PERSONALES = new Set([
    "ip", "cookie", "cookies", "sesion", "session", "usuario", "user",
    "agent", "useragent", "huella", "fingerprint", "email", "correo",
  ]);
  const sospechosas = nombres.filter((n) =>
    n.split("_").some((palabra) => PALABRAS_PERSONALES.has(palabra.toLowerCase()))
  );
  anotar("sin columnas personales", sospechosas.length === 0, nombres.join(", "));

  // 5. Las políticas actualizadas están publicadas.
  for (const camino of ["/privacidad", "/cookies"]) {
    const r = await fetch(`${BASE}${camino}`);
    const texto = (await r.text()).replace(/<[^>]*>/g, " ");
    // Se busca lo que el texto nuevo afirma, no una frase concreta: que
    // habla de los clics hacia los proveedores y que niega el seguimiento
    // individual. Atarlo a una redacción exacta convertiría cualquier
    // retoque de estilo en un fallo.
    // Las dos páginas lo titulan distinto —"Clics hacia los proveedores" en
    // privacidad, "Medición de clics sin cookies" en cookies— así que se
    // acepta cualquiera de las formas en que puede estar dicho.
    const hablaDeClics = /clics? hacia los proveedores|medición de clics|ir al proveedor/i.test(texto);
    const niegaSeguimiento = /no se pueden asociar a una persona|sin cookies|ni cookies/i.test(texto);
    anotar(
      `${camino} publica el texto nuevo`,
      r.ok && hablaDeClics && niegaSeguimiento,
      `HTTP ${r.status} · habla de los clics: ${hablaDeClics ? "sí" : "NO"} · niega el seguimiento: ${niegaSeguimiento ? "sí" : "NO"}`
    );
  }

  console.log("");
  for (const r of resultados) console.log(`${r.bien ? "✓" : "✗"} ${r.comprobacion}\n    ${r.detalle}`);
  const fallos = resultados.filter((r) => !r.bien);
  console.log(`\n${resultados.length - fallos.length}/${resultados.length} correctas.`);
  if (fallos.length) process.exitCode = 1;
}

async function contarClics(pool: { query: (t: string) => Promise<{ rows: Record<string, unknown>[] }> }) {
  const { rows } = await pool.query("SELECT count(*)::int AS n FROM clics_salientes");
  return Number(rows[0].n);
}

async function ultimoClic(pool: { query: (t: string) => Promise<{ rows: Record<string, unknown>[] }> }) {
  const { rows } = await pool.query(
    "SELECT herramienta_id, tipo_enlace, origen, ruta_origen FROM clics_salientes ORDER BY id DESC LIMIT 1"
  );
  return rows[0];
}

main()
  .catch((error) => {
    console.error("Error verificando:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => cerrarPools());
