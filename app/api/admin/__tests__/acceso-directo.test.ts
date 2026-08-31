import { describe, expect, it } from "vitest";
import { GET as listarFilas } from "../afiliacion/route";
import { POST as actualizar } from "../afiliacion/actualizar/route";
import { POST as generarRequisitos } from "../afiliacion/requisitos/route";
import { POST as generarBorrador } from "../afiliacion/borrador/route";
import { POST as verificarEnlaces } from "../afiliacion/verificar-enlaces/route";
import { GET as exportar } from "../afiliacion/exportar/route";
import { POST as importar } from "../afiliacion/importar/route";
import { POST as importarLote } from "../afiliacion/importar-lote/route";
import { GET as historial } from "../afiliacion/historial/route";
import { POST as restaurar } from "../afiliacion/restaurar/route";
import { POST as anotarIngreso } from "../ingresos/route";
import { GET as verEsquema, POST as aprovisionarEsquema } from "../esquema/route";
import { generarTokenSesion } from "@/lib/admin/sesion";

/**
 * "Acceso directo a APIs": confirma que CADA ruta de /api/admin/* rechaza
 * una petición sin cookie de sesión válida, y que las que escriben rechazan
 * además una petición con sesión pero sin token CSRF.
 *
 * La lista de aquí se escribe a mano, así que se complementa con
 * `toda-ruta-admin-protegida.test.ts`, que recorre el directorio: esta lista
 * ya se quedó corta una vez —cubría siete rutas de trece— mientras este mismo
 * comentario afirmaba cubrirlas todas.
 *
 * Confirma también que cada ruta rechaza sin cookie de sesión — sin excepción, sin depender de que `proxy.ts` haga el trabajo
 * (la propia documentación de Next.js para esta versión advierte no
 * confiar solo en el proxy). Ninguna de estas peticiones llega a tocar
 * `data/estrategia-afiliados/` real: todas se rechazan en
 * `verificarPeticionAdmin()` antes de cualquier lectura o escritura.
 */

function peticionSinSesion(url: string, metodo: string = "GET"): Request {
  return new Request(url, { method: metodo, headers: { "content-type": "application/json" } });
}

/**
 * Con sesión válida pero SIN el token CSRF. Es la forma que tendría una
 * petición lanzada desde otro sitio web mientras la administradora está
 * dentro: el navegador adjuntaría la cookie, pero no la cabecera. La cookie
 * es `sameSite: "strict"` y ya lo frenaría, pero eso es una sola capa y
 * depende del navegador; la comprobación del token es la segunda.
 */
function peticionSinCsrf(url: string): Request {
  const sesion = generarTokenSesion("admin-test");
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: `molnip_admin_sesion=${sesion}` },
    body: "{}",
  });
}

describe("Cada ruta de /api/admin/* rechaza el acceso sin sesión (401)", () => {
  it("GET /api/admin/afiliacion", async () => {
    const respuesta = await listarFilas(peticionSinSesion("https://molnip.com/api/admin/afiliacion"));
    expect(respuesta.status).toBe(401);
  });

  it("POST /api/admin/afiliacion/actualizar", async () => {
    const respuesta = await actualizar(peticionSinSesion("https://molnip.com/api/admin/afiliacion/actualizar", "POST"));
    expect(respuesta.status).toBe(401);
  });

  it("POST /api/admin/afiliacion/requisitos", async () => {
    const respuesta = await generarRequisitos(peticionSinSesion("https://molnip.com/api/admin/afiliacion/requisitos", "POST"));
    expect(respuesta.status).toBe(401);
  });

  it("POST /api/admin/afiliacion/borrador", async () => {
    const respuesta = await generarBorrador(peticionSinSesion("https://molnip.com/api/admin/afiliacion/borrador", "POST"));
    expect(respuesta.status).toBe(401);
  });

  it("POST /api/admin/afiliacion/verificar-enlaces", async () => {
    const respuesta = await verificarEnlaces(peticionSinSesion("https://molnip.com/api/admin/afiliacion/verificar-enlaces", "POST"));
    expect(respuesta.status).toBe(401);
  });

  it("GET /api/admin/afiliacion/exportar", async () => {
    const respuesta = await exportar(peticionSinSesion("https://molnip.com/api/admin/afiliacion/exportar"));
    expect(respuesta.status).toBe(401);
  });

  it("POST /api/admin/afiliacion/importar-lote", async () => {
    const respuesta = await importarLote(peticionSinSesion("https://molnip.com/api/admin/afiliacion/importar-lote", "POST"));
    expect(respuesta.status).toBe(401);
  });

  it("GET /api/admin/afiliacion/historial", async () => {
    expect((await historial(peticionSinSesion("https://molnip.com/api/admin/afiliacion/historial"))).status).toBe(401);
  });

  it("POST /api/admin/afiliacion/restaurar", async () => {
    expect((await restaurar(peticionSinSesion("https://molnip.com/api/admin/afiliacion/restaurar", "POST"))).status).toBe(401);
  });

  it("POST /api/admin/ingresos", async () => {
    expect((await anotarIngreso(peticionSinSesion("https://molnip.com/api/admin/ingresos", "POST"))).status).toBe(401);
  });

  it("GET /api/admin/esquema", async () => {
    expect((await verEsquema(peticionSinSesion("https://molnip.com/api/admin/esquema"))).status).toBe(401);
  });

  it("POST /api/admin/esquema", async () => {
    expect((await aprovisionarEsquema(peticionSinSesion("https://molnip.com/api/admin/esquema", "POST"))).status).toBe(401);
  });

  it("POST /api/admin/afiliacion/importar", async () => {
    const respuesta = await importar(peticionSinSesion("https://molnip.com/api/admin/afiliacion/importar", "POST"));
    expect(respuesta.status).toBe(401);
  });

  it("una sesión con firma manipulada tampoco pasa (no basta con tener ALGUNA cookie)", async () => {
    const peticion = new Request("https://molnip.com/api/admin/afiliacion", {
      headers: { cookie: "molnip_admin_sesion=payload-falso.firma-falsa" },
    });
    const respuesta = await listarFilas(peticion);
    expect(respuesta.status).toBe(401);
  });
});

describe("con sesión pero sin token CSRF, las rutas que escriben también rechazan", () => {
  it("POST /api/admin/afiliacion/importar-lote", async () => {
    const respuesta = await importarLote(peticionSinCsrf("https://molnip.com/api/admin/afiliacion/importar-lote"));
    expect(respuesta.status).toBe(401);
  });

  it("POST /api/admin/afiliacion/verificar-enlaces", async () => {
    const respuesta = await verificarEnlaces(peticionSinCsrf("https://molnip.com/api/admin/afiliacion/verificar-enlaces"));
    expect(respuesta.status).toBe(401);
  });

  it("POST /api/admin/ingresos", async () => {
    // Esta era la única que comprobaba la sesión pero NO el token: escribía
    // en una tabla que no admite correcciones. Detectado al revisar las
    // protecciones antes de desplegar.
    const respuesta = await anotarIngreso(peticionSinCsrf("https://molnip.com/api/admin/ingresos"));
    expect(respuesta.status).toBe(401);
  });

  it("POST /api/admin/esquema", async () => {
    expect((await aprovisionarEsquema(peticionSinCsrf("https://molnip.com/api/admin/esquema"))).status).toBe(401);
  });

  it("POST /api/admin/afiliacion/actualizar", async () => {
    expect((await actualizar(peticionSinCsrf("https://molnip.com/api/admin/afiliacion/actualizar"))).status).toBe(401);
  });
});
