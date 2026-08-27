import { defineConfig, devices } from "@playwright/test";

/**
 * Configuración del navegador de verdad.
 *
 * Estas pruebas existen porque el 2026-08-27 se desplegó con 677 pruebas en
 * verde y la web quedó inservible: nada de lo que había podía pulsar un
 * botón. Por eso se ejecutan siempre contra el BUILD DE PRODUCCIÓN (`next
 * build` + `next start`) y no contra el servidor de desarrollo: el fallo
 * vivía justo ahí, en los archivos con hash que solo genera producción.
 */
const PUERTO = Number(process.env.PUERTO_E2E ?? 3100);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PUERTO}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "escritorio",
      use: {
        ...devices["Desktop Chrome"],
        // El navegador ya viene instalado en el entorno; no se descarga otro.
        launchOptions: { executablePath: process.env.RUTA_CHROMIUM ?? "/opt/pw-browsers/chromium" },
      },
    },
    {
      // El fallo del 2026-08-27 se vio también en un Android, y las pruebas
      // de aquel día solo miraban a un escritorio. Aquí hay pantalla
      // estrecha y dedo de verdad, que es donde el diseño se apila y las
      // cosas se van fuera de la vista.
      name: "movil",
      use: {
        ...devices["Pixel 5"],
        launchOptions: { executablePath: process.env.RUTA_CHROMIUM ?? "/opt/pw-browsers/chromium" },
      },
      // En una pantalla táctil no existe "pasar el ratón por encima": el
      // navegador ni siquiera aplica esos estilos. Esa comprobación solo
      // tiene sentido en escritorio.
      grepInvert: /@raton/,
    },
  ],
  webServer: {
    command: `npx next start --port ${PUERTO}`,
    url: `http://127.0.0.1:${PUERTO}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
