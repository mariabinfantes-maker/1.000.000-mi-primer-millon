import { expect, test } from "@playwright/test";

/**
 * El recorrido completo del fallo que encontró la propietaria el 2026-09-02
 * probando Molnip en producción: escribió "soy peluquera y estoy perdiendo
 * citas" y recibió Grammarly con un círculo que ponía 100.
 *
 * `sinRecomendacion.test.ts` ya fija el comportamiento del motor. Esto
 * comprueba lo otro: que la decisión de no recomendar llega hasta la
 * pantalla, en un navegador de verdad, y que no rompe los recorridos que sí
 * funcionaban.
 */

const FRASE = "Soy peluquera, estoy perdiendo citas";

/**
 * Recorre las cinco preguntas de la puerta de texto libre, paso a paso y con
 * los textos reales de cada pantalla.
 *
 * Se escribe explícito, no en un bucle genérico "pulsa lo primero que
 * encuentres": un bucle así pasa en verde mientras el cuestionario se
 * reordena por detrás, y aquí lo que importa es recorrer exactamente lo que
 * recorrió la propietaria.
 */
async function completarCuestionarioLibre(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate((texto) => sessionStorage.setItem("atlas:texto-libre", texto), FRASE);
  await page.goto("/libre/cuestionario");

  // 1 · ¿Todo en uno o especializadas?
  await expect(page.getByText(/Pregunta 1 de/i)).toBeVisible();
  await page.getByRole("button", { name: /No tengo preferencia clara/i }).click();
  await page.getByRole("button", { name: /^Siguiente$/i }).click();

  // 2 · Sector
  await page.locator('input[placeholder*="tienda de ropa"]').fill("Peluquería");
  await page.getByRole("button", { name: /^Siguiente$/i }).click();

  // 3 · Tamaño
  await page.getByRole("button", { name: /^1-10$/ }).click();
  await page.getByRole("button", { name: /^Siguiente$/i }).click();

  // 4 · El problema, ya traído desde la portada por sessionStorage.
  await expect(page.locator("textarea")).toHaveValue(FRASE);
  await page.getByRole("button", { name: /^Siguiente$/i }).click();

  // 5 · ¿Usa ya alguna herramienta?
  await page.getByRole("button", { name: /^No$/i }).first().click();
  await page.getByRole("button", { name: /Obtener recomendación/i }).click();
}

test.describe("cuando Molnip no entiende la necesidad", () => {
  test("lo dice, en vez de recomendar cualquier cosa", async ({ page }) => {
    await completarCuestionarioLibre(page);

    await expect(page.getByRole("heading", { name: /No he sabido entender qué necesitas/i })).toBeVisible({
      timeout: 20000,
    });

    // Lo esencial: ninguna herramienta irrelevante en pantalla.
    await expect(page.getByText("Grammarly")).toHaveCount(0);
    await expect(page.getByText("Canva")).toHaveCount(0);
    // Y nunca se navega a una página de resultado inventada.
    expect(new URL(page.url()).pathname).not.toContain("/resultado/");
  });

  test("ofrece un camino hacia delante, no un callejón sin salida", async ({ page }) => {
    await completarCuestionarioLibre(page);
    await expect(page.getByRole("heading", { name: /No he sabido entender/i })).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole("link", { name: /Ver los tipos de herramienta/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Volver al inicio/i })).toBeVisible();
  });
});

test.describe("los recorridos que ya funcionaban no cambian", () => {
  test("por categoría, el cuestionario sigue avanzando", async ({ page }) => {
    await page.goto("/categoria/crm/cuestionario");
    await expect(page.getByText(/Pregunta 1 de/i)).toBeVisible();
  });

  test("las páginas de subtipo siguen mostrando sus tres alternativas", async ({ page }) => {
    await page.goto("/categoria/asistentes-ia/subtipo/presentaciones");
    await expect(page.getByRole("heading", { name: /Las 3 alternativas/i })).toBeVisible();
  });
});
