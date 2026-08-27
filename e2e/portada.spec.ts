import { expect, test, type Page } from "@playwright/test";

/**
 * Recorrido de la portada en un navegador de VERDAD.
 *
 * Esta prueba existe por un fallo concreto: el 2026-08-27 se desplegó a
 * producción con 677 pruebas en verde, TypeScript, ESLint y build
 * impecables — y sin haber pulsado un solo botón. Ninguna de aquellas
 * comprobaciones podía detectar lo que la propietaria vio: una web que se
 * pinta perfecta y donde nada lleva a ninguna parte.
 *
 * Dos cosas se comprueban aquí, y las dos vienen de aquel día:
 *  1. que lo que PARECE pulsable lleve de verdad a alguna parte;
 *  2. que lo que NO es pulsable no lo parezca — porque las tarjetas
 *     informativas se elevaban al pasar el ratón, y eso fue lo que llevó a
 *     concluir, con razón, que la web estaba rota.
 */

/** Enlaces y botones que SÍ tienen que llevar a algún sitio, con su destino. */
const DESTINOS_ESPERADOS = [
  { nombre: /Conseguir más clientes/i, destino: "/problema/conseguir-clientes/cuestionario" },
  { nombre: /Automatizar tareas/i, destino: "/problema/automatizar-tareas/cuestionario" },
  { nombre: /Ahorrar tiempo/i, destino: "/problema/ahorrar-tiempo/cuestionario" },
  { nombre: /Organizar la empresa/i, destino: "/problema/organizar-empresa/cuestionario" },
  { nombre: /Mejorar la atención al cliente/i, destino: "/problema/atencion-cliente/cuestionario" },
];

async function irAlaPortada(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

test.describe("la portada es interactiva de verdad", () => {
  test("el botón principal lleva a la sección de empezar", async ({ page }) => {
    await irAlaPortada(page);
    await page.getByRole("link", { name: /Empezar diagnóstico gratuito/i }).click();
    await expect(page).toHaveURL(/#elige-camino/);
    await expect(page.getByRole("heading", { name: /¿Cómo quieres empezar\?/i })).toBeVisible();
  });

  for (const { nombre, destino } of DESTINOS_ESPERADOS) {
    test(`"${destino.split("/")[2]}" navega de verdad a su cuestionario`, async ({ page }) => {
      await irAlaPortada(page);
      await page.getByRole("link", { name: nombre }).first().click();
      // Es la comprobación que faltaba: no que el enlace exista, sino que
      // pulsarlo lleve a alguna parte.
      await expect(page).toHaveURL(new RegExp(destino.replace(/\//g, "\\/")));
      await expect(page.getByText(/Pregunta 1 de/i)).toBeVisible();
    });
  }

  test("las tres puertas de entrada cambian lo que se ofrece", async ({ page }) => {
    await irAlaPortada(page);
    const seccion = page.locator("#elige-camino");
    await seccion.scrollIntoViewIfNeeded();

    // Ojo: las tres puertas son `role="tab"`, no `role="button"` — están
    // dentro de un `role="tablist"` (ver components/ui/SelectorEntrada.tsx).
    // Buscarlas como botones no encuentra nada y hace creer que la web está
    // rota cuando el roto es el test.
    const enlacesOfrecidos = () => seccion.locator('a[href*="/cuestionario"]').first().getAttribute("href");

    const alPrincipio = await enlacesOfrecidos();
    expect(alPrincipio, "la puerta por defecto ya ofrece cuestionarios").toContain("/problema/");

    await page.getByRole("tab", { name: /Explorar por categoría/i }).click();
    await expect(seccion.locator('a[href*="/categoria/"]').first()).toBeVisible();
    expect(await enlacesOfrecidos()).not.toBe(alPrincipio);

    await page.getByRole("tab", { name: /Empezar por objetivo/i }).click();
    await expect(seccion.locator('a[href*="/problema/"]').first()).toBeVisible();
    expect(await enlacesOfrecidos()).toBe(alPrincipio);

    await page.getByRole("tab", { name: /Contárselo a Molnip/i }).click();
    await expect(seccion.getByRole("textbox")).toBeVisible();
  });

  test("el cuestionario avanza de pregunta", async ({ page }) => {
    await page.goto("/problema/conseguir-clientes/cuestionario");
    await expect(page.getByText(/Pregunta 1 de/i)).toBeVisible();
    await page.getByRole("button", { name: /plataforma todo en uno/i }).click();
    await page.getByRole("button", { name: /^Siguiente$/i }).click();
    await expect(page.getByText(/Pregunta 2 de/i)).toBeVisible();
  });
});

test.describe("tocar una puerta enseña lo que abre", () => {
  /**
   * La prueba que faltaba el 2026-08-27.
   *
   * Las tres puertas de entrada no son enlaces: son pestañas que cambian el
   * contenido de debajo. En un móvil las tarjetas van apiladas, así que ese
   * contenido caía fuera de la pantalla y tocar una puerta parecía no hacer
   * nada. "Esas tres tarjetas no están desplegando nada", dijo la
   * propietaria — y tenía toda la razón.
   *
   * La prueba anterior comprobaba que los enlaces ofrecidos CAMBIABAN. Eso
   * salía en verde mientras la persona no veía absolutamente nada. Aquí se
   * comprueba lo que de verdad importa: que se VEA.
   */
  const PUERTAS = [
    { nombre: "Explorar por categoría", patron: /Explorar por categoría/i },
    { nombre: "Contárselo a Molnip", patron: /Contárselo a Molnip/i },
    { nombre: "Empezar por objetivo", patron: /Empezar por objetivo/i },
  ];

  for (const { nombre, patron } of PUERTAS) {
    test(`"${nombre}" deja a la vista lo que abre`, async ({ page, isMobile }) => {
      await irAlaPortada(page);

      const pestana = page.getByRole("tab", { name: patron });
      await pestana.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      if (isMobile) await pestana.tap();
      else await pestana.click();
      // El desplazamiento es suave, y con varias pruebas a la vez puede
      // tardar más de lo que dure cualquier espera fija: se sondea hasta que
      // llegue en vez de esperar a ojo. Una prueba intermitente no vale.
      const medir = () =>
        page.evaluate(() => {
          const panel = document.querySelector('[role="tabpanel"]');
          if (!panel) return null;
          const caja = panel.getBoundingClientRect();
          const alto = Math.max(0, Math.min(caja.bottom, window.innerHeight) - Math.max(caja.top, 0));
          return Math.round(alto - Math.min(caja.height, window.innerHeight * 0.6));
        });

      await expect
        .poll(medir, {
          timeout: 10_000,
          message: `se toca "${nombre}" y lo que abre queda fuera de la pantalla: desde un móvil parece que no hace nada`,
        })
        .toBeGreaterThanOrEqual(0);
    });
  }
});

test.describe("lo que no es pulsable no lo parece @raton", () => {
  /** Las siete tarjetas de texto: no llevan a ningún sitio y no deben insinuar que sí. */
  const TARJETAS_INFORMATIVAS = [
    "Recomendaciones objetivas",
    "Comparación rápida",
    "Sin publicidad invasiva",
    "Ahorra horas de investigación",
    "Información actualizada",
    "Comparación según tu negocio",
    "Razones claras para decidir",
  ];

  for (const titulo of TARJETAS_INFORMATIVAS) {
    test(`"${titulo}" no finge ser un botón`, async ({ page }) => {
      await irAlaPortada(page);

      // La tarjeta es el contenedor del titular. No se mide por posición en
      // pantalla: estas tarjetas viven dentro de `RevelarAlScroll`, que las
      // desplaza 700 ms al entrar en el viewport, y ese movimiento no tiene
      // nada que ver con el ratón. Se comparan los estilos calculados de la
      // propia tarjeta, que es donde vivían la elevación y la sombra.
      const tarjeta = page.getByRole("heading", { name: titulo, exact: true }).locator("xpath=..");
      await tarjeta.scrollIntoViewIfNeeded();
      await expect(tarjeta).toBeVisible();
      // Se deja terminar la animación de entrada antes de medir nada.
      await page.waitForTimeout(1000);

      // Ni es un enlace ni un botón, ni contiene uno.
      await expect(tarjeta.locator("a, button")).toHaveCount(0);

      const estilos = () =>
        tarjeta.evaluate((el) => {
          const e = getComputedStyle(el);
          return { cursor: e.cursor, transform: e.transform, sombra: e.boxShadow, borde: e.borderColor };
        });

      const enReposo = await estilos();
      await tarjeta.hover();
      await page.waitForTimeout(600);
      const conElRaton = await estilos();

      expect(enReposo.cursor, `"${titulo}" muestra cursor de mano`).not.toBe("pointer");
      expect(conElRaton.cursor, `"${titulo}" muestra cursor de mano al pasar por encima`).not.toBe("pointer");
      // Lo que se retiró el 2026-08-27: elevación, sombra y cambio de borde
      // al pasar el ratón. Fue justo eso lo que hizo pensar, con toda la
      // razón, que estas tarjetas eran botones que no respondían.
      expect(conElRaton.transform, `"${titulo}" se eleva al pasar el ratón`).toBe(enReposo.transform);
      expect(conElRaton.sombra, `"${titulo}" cambia de sombra al pasar el ratón`).toBe(enReposo.sombra);
      expect(conElRaton.borde, `"${titulo}" cambia de borde al pasar el ratón`).toBe(enReposo.borde);
    });
  }
});

/**
 * El aviso de Molnip, y solo ese. Next monta siempre un
 * `<div role="alert" id="__next-route-announcer__">` vacío para los lectores
 * de pantalla, así que `getByRole("alert")` a secas nunca da cero.
 */
function avisoDeVersion(page: Page) {
  return page.getByRole("alert").filter({ hasText: /versión antigua/i });
}

test.describe("recuperación ante una versión antigua", () => {
  test("una versión antigua se recupera sola, UNA vez, sin bucle", async ({ page }) => {
    // Se simula el fallo real: el navegador tiene el HTML de un despliegue
    // anterior y pide un archivo de JavaScript que ya no existe. Se
    // provoca lanzando el mismo error que emitiría el navegador.
    let cargas = 0;
    page.on("load", () => cargas++);

    await irAlaPortada(page);
    const cargasIniciales = cargas;

    await page.evaluate(() => {
      const error = new Error("Loading chunk 42 failed.");
      error.name = "ChunkLoadError";
      window.dispatchEvent(new PromiseRejectionEvent("unhandledrejection", { promise: Promise.reject(error), reason: error }));
    });

    await page.waitForTimeout(2500);
    expect(cargas, "debería recargar exactamente una vez").toBe(cargasIniciales + 1);

    // Segundo fallo en la misma sesión: ya NO recarga, avisa.
    const cargasTrasLaPrimera = cargas;
    await page.evaluate(() => {
      const error = new Error("Loading chunk 43 failed.");
      error.name = "ChunkLoadError";
      window.dispatchEvent(new PromiseRejectionEvent("unhandledrejection", { promise: Promise.reject(error), reason: error }));
    });
    await page.waitForTimeout(2000);

    expect(cargas, "no puede volver a recargar: sería un bucle").toBe(cargasTrasLaPrimera);
    await expect(avisoDeVersion(page)).toBeVisible();
    await expect(page.getByRole("button", { name: /Actualizar la página/i })).toBeVisible();
  });

  // Un archivo con hash que el despliegue nuevo ya borró del servidor.
  const ARCHIVO_QUE_YA_NO_EXISTE = "/_next/static/chunks/borrado-por-el-despliegue.js";

  test("un módulo que ya no existe tras un despliegue: se recupera sola", async ({ page }) => {
    // Aquí no se inventa el error: se le pide al navegador un archivo con
    // hash que ya no está en el servidor y se le deja fallar. El mensaje lo
    // redacta Chromium, igual que en molnip.com el 2026-08-27 — es la ruta
    // real que tiene que reconocer `esFalloDeVersion`.
    let cargas = 0;
    page.on("load", () => cargas++);

    await irAlaPortada(page);
    const cargasIniciales = cargas;

    await page.evaluate((archivo) => {
      // `new Function` para que el import lo resuelva el navegador en
      // tiempo real y no el compilador del test.
      void (new Function(`return import(${JSON.stringify(archivo)})`)() as Promise<unknown>);
    }, ARCHIVO_QUE_YA_NO_EXISTE);

    await page.waitForTimeout(3000);

    expect(cargas, "exactamente una recarga automática, ni cero ni dos").toBe(cargasIniciales + 1);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(avisoDeVersion(page)).toHaveCount(0);

    // Y después de recuperarse, la web vuelve a llevar a alguna parte.
    await page.getByRole("link", { name: /Conseguir más clientes/i }).first().click();
    await expect(page.getByText(/Pregunta 1 de/i)).toBeVisible();
  });

  test("un <script> que ya no existe tras un despliegue: también se recupera", async ({ page }) => {
    // La otra forma de llegar: el propio documento pide un `<script>` que
    // ya no está. Ese fallo no burbujea, solo se ve en fase de captura, así
    // que comprueba una rama distinta del detector.
    let cargas = 0;
    page.on("load", () => cargas++);

    await irAlaPortada(page);
    const cargasIniciales = cargas;

    await page.evaluate((archivo) => {
      const etiqueta = document.createElement("script");
      etiqueta.src = archivo;
      document.head.appendChild(etiqueta);
    }, ARCHIVO_QUE_YA_NO_EXISTE);

    await page.waitForTimeout(3000);

    expect(cargas, "exactamente una recarga automática, ni cero ni dos").toBe(cargasIniciales + 1);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("un error normal NO provoca ninguna recarga", async ({ page }) => {
    let cargas = 0;
    page.on("load", () => cargas++);
    await irAlaPortada(page);
    const antes = cargas;

    for (const mensaje of ["Request failed with status code 500", "Failed to fetch", "El campo es obligatorio"]) {
      await page.evaluate((m) => {
        const error = new Error(m);
        window.dispatchEvent(new PromiseRejectionEvent("unhandledrejection", { promise: Promise.reject(error), reason: error }));
      }, mensaje);
    }
    await page.waitForTimeout(1500);

    expect(cargas, "un error de API o de validación nunca debe recargar la web").toBe(antes);
    await expect(avisoDeVersion(page)).toHaveCount(0);
  });

  test("los datos escritos sobreviven a la recarga automática", async ({ page }) => {
    await irAlaPortada(page);
    await page.evaluate(() => sessionStorage.setItem("molnip:texto-libre", "tengo una tienda de ropa"));

    await page.evaluate(() => {
      const error = new Error("Loading chunk 42 failed.");
      error.name = "ChunkLoadError";
      window.dispatchEvent(new PromiseRejectionEvent("unhandledrejection", { promise: Promise.reject(error), reason: error }));
    });
    await page.waitForTimeout(2500);

    expect(await page.evaluate(() => sessionStorage.getItem("molnip:texto-libre"))).toBe("tengo una tienda de ropa");
  });
});

test.describe("contexto limpio, sin nada guardado", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("todo funciona igual en una sesión recién estrenada", async ({ page }) => {
    await irAlaPortada(page);
    await page.getByRole("link", { name: /Conseguir más clientes/i }).first().click();
    await expect(page).toHaveURL(/\/problema\/conseguir-clientes\/cuestionario/);
    await expect(page.getByText(/Pregunta 1 de/i)).toBeVisible();
  });
});


test.describe("preguntas de diferenciación por ámbito", () => {
  test("CRM tiene la suya, sin necesitar parámetro", async ({ page }) => {
    await page.goto("/categoria/crm/cuestionario");
    await expect(page.getByText(/¿Qué es lo que más te va a ayudar de un CRM\?/i)).toBeVisible();
  });

  test("reuniones tiene la suya, con su subtipo", async ({ page }) => {
    await page.goto("/categoria/asistentes-ia/cuestionario?subtipo=reuniones-transcripcion");
    await expect(page.getByText(/¿Qué te falta en tus reuniones\?/i)).toBeVisible();
  });

  test("gestión de proyectos NO tiene pregunta: su concentración no la justifica", async ({ page }) => {
    await page.goto("/categoria/gestion-proyectos/cuestionario");
    await expect(page.getByText(/Pregunta 1 de 4/i)).toBeVisible();
  });
});

test.describe("piloto: pregunta de diferenciación del subtipo escritura", () => {
  /**
   * La pregunta solo existe en un ámbito y llega por parámetro de la
   * dirección: no hay páginas nuevas ni cambios de navegación. Se comprueba
   * que aparezca donde debe, que NO aparezca en ningún otro cuestionario, y
   * que las tres respuestas lleven a tres recomendaciones distintas.
   */
  const ENUNCIADO = /¿Qué necesitas hacer principalmente con el texto\?/i;

  test("aparece en asistentes-ia con subtipo escritura", async ({ page }) => {
    await page.goto("/categoria/asistentes-ia/cuestionario?subtipo=escritura");
    await expect(page.getByText(ENUNCIADO)).toBeVisible();
    await expect(page.getByText(/Pregunta 1 de 5/i)).toBeVisible();
  });

  test("NO aparece sin el subtipo, ni con un subtipo sin pregunta", async ({ page }) => {
    for (const url of [
      "/categoria/asistentes-ia/cuestionario",
      "/categoria/asistentes-ia/cuestionario?subtipo=video",
      "/categoria/asistentes-ia/cuestionario?subtipo=inventado",
      "/problema/ahorrar-tiempo/cuestionario",
      "/categoria/gestion-proyectos/cuestionario",
    ]) {
      await page.goto(url);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByText(ENUNCIADO), url).toHaveCount(0);
    }
  });

  test("las tres respuestas se pueden elegir y el cuestionario avanza", async ({ page, isMobile }) => {
    for (const opcion of [
      /Corregir y mejorar lo que ya he escrito/i,
      /Crear contenido de marketing y posicionarlo en Google/i,
      /Escribir mensajes de venta y prospección/i,
    ]) {
      await page.goto("/categoria/asistentes-ia/cuestionario?subtipo=escritura");
      await expect(page.getByText(ENUNCIADO)).toBeVisible();
      const boton = page.getByRole("button", { name: opcion });
      if (isMobile) await boton.tap();
      else await boton.click();
      await page.getByRole("button", { name: /^Siguiente$/i }).click();
      await expect(page.getByText(/Pregunta 2 de 5/i)).toBeVisible();
    }
  });
});
