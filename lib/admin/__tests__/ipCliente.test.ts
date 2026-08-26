import { describe, expect, it } from "vitest";
import { obtenerIpCliente } from "../ipCliente";

/**
 * La IP es la clave del límite por dirección: si quien intenta entrar
 * pudiera elegirla, bastaría con enviar una distinta en cada intento para
 * saltarse el bloqueo por completo. Por eso se prioriza la cabecera que
 * fija el propio proxy de Vercel y se descarta cualquier valor que no
 * parezca una IP.
 */

function peticionCon(cabeceras: Record<string, string>): Request {
  return new Request("https://molnip.com/api/admin/login", { method: "POST", headers: cabeceras });
}

describe("obtenerIpCliente", () => {
  it("da prioridad a la cabecera que fija Vercel sobre la que puede enviar el cliente", () => {
    const ip = obtenerIpCliente(
      peticionCon({ "x-vercel-forwarded-for": "203.0.113.5", "x-forwarded-for": "1.2.3.4" })
    );
    expect(ip).toBe("203.0.113.5");
  });

  it("usa x-forwarded-for solo si no hay cabecera de Vercel", () => {
    expect(obtenerIpCliente(peticionCon({ "x-forwarded-for": "198.51.100.7" }))).toBe("198.51.100.7");
  });

  it("toma la PRIMERA entrada de la lista, la más cercana al cliente", () => {
    // Las siguientes las puede haber añadido cualquier intermediario.
    expect(obtenerIpCliente(peticionCon({ "x-forwarded-for": "198.51.100.7, 10.0.0.1, 172.16.0.1" }))).toBe("198.51.100.7");
  });

  it("descarta un valor que no parece una IP en vez de meterlo en una clave de Redis", () => {
    expect(obtenerIpCliente(peticionCon({ "x-forwarded-for": "no-soy-una-ip" }))).toBe("desconocida");
    expect(obtenerIpCliente(peticionCon({ "x-forwarded-for": "molnip:login:ip:*" }))).toBe("desconocida");
    expect(obtenerIpCliente(peticionCon({ "x-forwarded-for": "1.2.3.4; DROP TABLE" }))).toBe("desconocida");
  });

  it("descarta un valor absurdamente largo", () => {
    expect(obtenerIpCliente(peticionCon({ "x-forwarded-for": "1".repeat(500) }))).toBe("desconocida");
  });

  it("acepta IPv6", () => {
    expect(obtenerIpCliente(peticionCon({ "x-vercel-forwarded-for": "2001:db8::1" }))).toBe("2001:db8::1");
  });

  it("devuelve un valor fijo si no hay ninguna cabecera, nunca algo elegido por quien llama", () => {
    expect(obtenerIpCliente(peticionCon({}))).toBe("desconocida");
    expect(obtenerIpCliente(peticionCon({ "x-forwarded-for": "" }))).toBe("desconocida");
  });
});
