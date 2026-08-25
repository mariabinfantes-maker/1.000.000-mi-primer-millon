import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    globalSetup: "./vitest.global-setup.postgres.ts",
    // Varios archivos de test comparten el mismo Postgres local temporal
    // (un solo proceso para toda la ejecución, ver vitest.global-setup.postgres.ts)
    // y hacen TRUNCATE entre pruebas — en paralelo, un archivo podía vaciar
    // las tablas justo cuando otro estaba verificando lo que acababa de
    // escribir. Sin paralelismo entre archivos, cada uno tiene el Postgres
    // de pruebas para sí solo mientras corre.
    fileParallelism: false,
  },
});
