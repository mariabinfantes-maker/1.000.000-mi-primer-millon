import { describe, expect, it } from "vitest";
import { GET as listarFilas } from "../afiliacion/route";
import { POST as actualizar } from "../afiliacion/actualizar/route";
import { POST as generarRequisitos } from "../afiliacion/requisitos/route";
import { POST as generarBorrador } from "../afiliacion/borrador/route";
import { POST as verificarEnlaces } from "../afiliacion/verificar-enlaces/route";
import { GET as exportar } from "../afiliacion/exportar/route";
import { POST as importar } from "../afiliacion/importar/route";

/**
 * "Acceso directo a APIs" (punto 4 pedido explícitamente): confirma que
 * CADA ruta de /api/admin/* rechaza una petición sin cookie de sesión
 * válida — sin excepción, sin depender de que `proxy.ts` haga el trabajo
 * (la propia documentación de Next.js para esta versión advierte no
 * confiar solo en el proxy). Ninguna de estas peticiones llega a tocar
 * `data/estrategia-afiliados/` real: todas se rechazan en
 * `verificarPeticionAdmin()` antes de cualquier lectura o escritura.
 */

function peticionSinSesion(url: string, metodo: string = "GET"): Request {
  return new Request(url, { method: metodo, headers: { "content-type": "application/json" } });
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
