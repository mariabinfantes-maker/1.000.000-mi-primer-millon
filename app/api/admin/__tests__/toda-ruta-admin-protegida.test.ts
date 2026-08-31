import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Ninguna ruta bajo /api/admin puede quedarse sin comprobar la sesión.
 *
 * La prueba hermana, `acceso-directo.test.ts`, llama a cada ruta una por una,
 * lo cual está muy bien hasta que alguien añade una ruta nueva y se olvida de
 * añadirla también allí. Pasó: al revisar las protecciones antes de desplegar,
 * la lista escrita a mano cubría siete rutas de trece —entre las que faltaban
 * la importación en bloque y el aprovisionamiento del esquema— mientras el
 * comentario del fichero afirmaba cubrirlas todas.
 *
 * Esta recorre el directorio. Una ruta nueva sin guarda hace fallar la suite
 * el día que se escribe, no el día que alguien se acuerde de mirarlo.
 */

const RAIZ_ADMIN = join(__dirname, "..");

/** Se protegen solas y a propósito: entrar y salir no pueden exigir sesión previa. */
const SIN_SESION_A_PROPOSITO = new Set(["/login", "/logout"]);

function rutasDeApi(): string[] {
  const encontradas: string[] = [];
  function recorrer(directorio: string) {
    for (const entrada of readdirSync(directorio, { withFileTypes: true })) {
      const camino = join(directorio, entrada.name);
      if (entrada.isDirectory()) {
        if (entrada.name === "__tests__") continue;
        recorrer(camino);
      } else if (entrada.name === "route.ts") {
        encontradas.push(camino);
      }
    }
  }
  recorrer(RAIZ_ADMIN);
  return encontradas.sort();
}

function rutaPublica(archivo: string): string {
  return "/" + relative(RAIZ_ADMIN, archivo).replace(/\/route\.ts$/, "").replace(/route\.ts$/, "");
}

describe("toda ruta de /api/admin comprueba la sesión", () => {
  const rutas = rutasDeApi();

  it("hay rutas que revisar (si esto falla, el recorrido está roto)", () => {
    expect(rutas.length).toBeGreaterThan(8);
  });

  for (const archivo of rutas) {
    const nombre = rutaPublica(archivo);
    if (SIN_SESION_A_PROPOSITO.has(nombre)) continue;

    it(`${nombre} llama a verificarPeticionAdmin`, () => {
      const codigo = readFileSync(archivo, "utf-8");
      expect(codigo).toContain("verificarPeticionAdmin(request)");
    });

    it(`${nombre} lo hace ANTES de leer el cuerpo o tocar datos`, () => {
      const codigo = readFileSync(archivo, "utf-8");
      // Cada manejador exportado tiene que verificar en sus primeras líneas:
      // verificar después de haber leído el cuerpo o consultado la base ya
      // habría hecho trabajo por encargo de quien no se ha identificado.
      const manejadores = [...codigo.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)\s*\([^)]*\)\s*{/g)];
      expect(manejadores.length).toBeGreaterThan(0);

      for (const manejador of manejadores) {
        const desde = manejador.index! + manejador[0].length;
        const primerasLineas = codigo.slice(desde).split("\n").slice(0, 4).join("\n");
        expect(primerasLineas, `${nombre} · ${manejador[1]}`).toContain("verificarPeticionAdmin(request)");
      }
    });
  }
});
