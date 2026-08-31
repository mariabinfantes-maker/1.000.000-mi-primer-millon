import { describe, it, expect, afterEach } from "vitest";
import { destinoEsSeguro, ipEsPublica } from "../destinoSeguro";

const entornoOriginal = { ...process.env };
afterEach(() => {
  process.env = { ...entornoOriginal };
});

/** `NODE_ENV` está tipado como de solo lectura; en una prueba hace falta cambiarlo. */
function fijarEntorno(valor: string) {
  (process.env as Record<string, string | undefined>).NODE_ENV = valor;
}

/** Resolver de mentira: así se prueba sin DNS ni red. */
const resuelveA = (...direcciones: string[]) => async () => direcciones;

describe("ipEsPublica", () => {
  it("acepta direcciones de internet de verdad", () => {
    for (const ip of ["8.8.8.8", "1.1.1.1", "93.184.216.34", "2606:4700::6812:1633"]) {
      expect(ipEsPublica(ip), ip).toBe(true);
    }
  });

  it("rechaza el bucle local y las redes privadas", () => {
    for (const ip of [
      "127.0.0.1", "127.1.2.3", "0.0.0.0",
      "10.0.0.1", "10.255.255.255",
      "172.16.0.1", "172.31.255.255",
      "192.168.1.1",
      "100.64.0.1",
      "::1", "::",
    ]) {
      expect(ipEsPublica(ip), ip).toBe(false);
    }
  });

  it("rechaza el enlace local, que es donde viven los metadatos de la nube", () => {
    // 169.254.169.254 responde en AWS, GCP y Azure y entrega credenciales.
    expect(ipEsPublica("169.254.169.254")).toBe(false);
    expect(ipEsPublica("169.254.0.1")).toBe(false);
    expect(ipEsPublica("fe80::1")).toBe(false);
  });

  it("rechaza las IPv4 disfrazadas de IPv6", () => {
    // ::ffff:127.0.0.1 es 127.0.0.1 con otra ropa.
    expect(ipEsPublica("::ffff:127.0.0.1")).toBe(false);
    expect(ipEsPublica("::ffff:169.254.169.254")).toBe(false);
    expect(ipEsPublica("::ffff:8.8.8.8")).toBe(true);
  });

  it("rechaza las locales únicas, la multidifusión y lo reservado", () => {
    for (const ip of ["fc00::1", "fd12:3456::1", "ff02::1", "224.0.0.1", "240.0.0.1", "255.255.255.255"]) {
      expect(ipEsPublica(ip), ip).toBe(false);
    }
  });

  it("172.32 ya NO es privada: el rango acaba en 172.31", () => {
    expect(ipEsPublica("172.32.0.1")).toBe(true);
    expect(ipEsPublica("172.15.0.1")).toBe(true);
  });

  it("lo que no es una IP no cuela", () => {
    for (const valor of ["", "no-es-una-ip", "999.1.1.1", "1.2.3"]) {
      expect(ipEsPublica(valor), valor).toBe(false);
    }
  });
});

describe("destinoEsSeguro — protocolo y forma", () => {
  it("acepta http y https", async () => {
    expect((await destinoEsSeguro("https://ejemplo.test/x", resuelveA("93.184.216.34"))).permitido).toBe(true);
    expect((await destinoEsSeguro("http://ejemplo.test/x", resuelveA("93.184.216.34"))).permitido).toBe(true);
  });

  it("rechaza cualquier otro esquema", async () => {
    for (const url of [
      "file:///etc/passwd",
      "ftp://ejemplo.test/x",
      "gopher://ejemplo.test/x",
      "data:text/html,hola",
      "javascript:alert(1)",
    ]) {
      const r = await destinoEsSeguro(url, resuelveA("93.184.216.34"));
      expect(r.permitido, url).toBe(false);
    }
  });

  it("rechaza usuario y contraseña en la dirección", async () => {
    // https://ejemplo.test@169.254.169.254/ apunta a la segunda, no a la primera.
    const r = await destinoEsSeguro("https://usuario:clave@ejemplo.test/x", resuelveA("93.184.216.34"));
    expect(r.permitido).toBe(false);
  });

  it("rechaza lo que no es una dirección", async () => {
    expect((await destinoEsSeguro("no es una url")).permitido).toBe(false);
  });
});

describe("destinoEsSeguro — nombres que nunca salen a internet", () => {
  it("rechaza localhost y compañía sin ni siquiera resolver", async () => {
    for (const nombre of [
      "localhost",
      "algo.localhost",
      "servidor.local",
      "algo.internal",
      "metadata.google.internal",
      "instance-data",
    ]) {
      const r = await destinoEsSeguro(`http://${nombre}/x`, async () => {
        throw new Error("no debería llegar a resolver");
      });
      expect(r.permitido, nombre).toBe(false);
    }
  });

  it("rechaza un nombre sin punto", async () => {
    expect((await destinoEsSeguro("http://servidorinterno/x")).permitido).toBe(false);
  });
});

describe("destinoEsSeguro — IP escrita directamente", () => {
  it("rechaza las internas sin resolver nada", async () => {
    for (const ip of ["127.0.0.1", "169.254.169.254", "10.0.0.5", "192.168.0.1", "[::1]"]) {
      const r = await destinoEsSeguro(`http://${ip}/x`, async () => {
        throw new Error("no debería resolver");
      });
      expect(r.permitido, ip).toBe(false);
    }
  });

  it("acepta una IP pública escrita a mano", async () => {
    expect((await destinoEsSeguro("http://8.8.8.8/x")).permitido).toBe(true);
  });
});

describe("destinoEsSeguro — lo que resuelve el nombre", () => {
  it("rechaza un dominio que apunta a una dirección interna", async () => {
    // El truco habitual: un dominio propio con un registro A a 127.0.0.1.
    const r = await destinoEsSeguro("https://parece-normal.test/x", resuelveA("127.0.0.1"));
    expect(r.permitido).toBe(false);
    if (!r.permitido) expect(r.motivo).toMatch(/127\.0\.0\.1/);
  });

  it("basta UNA dirección interna entre varias para rechazarlo", async () => {
    const r = await destinoEsSeguro("https://mixto.test/x", resuelveA("93.184.216.34", "169.254.169.254"));
    expect(r.permitido).toBe(false);
  });

  it("un nombre que no resuelve se rechaza", async () => {
    expect((await destinoEsSeguro("https://vacio.test/x", resuelveA())).permitido).toBe(false);
    expect((await destinoEsSeguro("https://falla.test/x", async () => { throw new Error("dns"); })).permitido).toBe(false);
  });
});

describe("el permiso de red local solo existe fuera de producción", () => {
  it("con la variable puesta y fuera de producción, se admite 127.0.0.1", async () => {
    fijarEntorno("test");
    process.env.MOLNIP_PERMITIR_RED_LOCAL = "true";
    expect((await destinoEsSeguro("http://127.0.0.1:3000/x")).permitido).toBe(true);
  });

  it("en producción NO, aunque la variable esté puesta", async () => {
    // Dos condiciones a propósito: activarla por descuido en producción no
    // debe servir de nada.
    fijarEntorno("production");
    process.env.MOLNIP_PERMITIR_RED_LOCAL = "true";
    expect((await destinoEsSeguro("http://127.0.0.1:3000/x")).permitido).toBe(false);
    expect((await destinoEsSeguro("http://169.254.169.254/latest/meta-data/")).permitido).toBe(false);
  });

  it("sin la variable tampoco, aunque no sea producción", async () => {
    fijarEntorno("test");
    delete process.env.MOLNIP_PERMITIR_RED_LOCAL;
    expect((await destinoEsSeguro("http://127.0.0.1:3000/x")).permitido).toBe(false);
  });
});
