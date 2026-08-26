import { describe, expect, it } from "vitest";
import { forzarVerificacionSsl } from "../cliente";

/**
 * `pg` resuelve la configuración con
 * `Object.assign({}, config, parse(config.connectionString))`: lo que viene
 * en la cadena de conexión PISA lo que se pasa como opción. Por eso no
 * basta con un `ssl: { rejectUnauthorized: true }` explícito — hay que
 * dejar escrito `verify-full` en la propia cadena.
 *
 * Detectado el 2026-08-25 al ver el aviso de `pg-connection-string` durante
 * la primera migración real contra Neon.
 */
describe("forzarVerificacionSsl", () => {
  it("reemplaza el sslmode=require que genera Neon por verify-full", () => {
    const resultado = forzarVerificacionSsl("postgres://usuario:clave@ep-algo.aws.neon.tech/neondb?sslmode=require");
    expect(resultado).toContain("sslmode=verify-full");
    expect(resultado).not.toContain("sslmode=require");
  });

  it("añade sslmode=verify-full si la cadena remota no traía ninguno", () => {
    const resultado = forzarVerificacionSsl("postgres://usuario:clave@ep-algo.aws.neon.tech/neondb");
    expect(resultado).toContain("sslmode=verify-full");
  });

  it("sustituye también un sslmode que desactivaría la verificación", () => {
    const resultado = forzarVerificacionSsl("postgres://usuario:clave@ep-algo.aws.neon.tech/neondb?sslmode=no-verify");
    expect(resultado).toContain("sslmode=verify-full");
    expect(resultado).not.toContain("no-verify");
  });

  it("conserva el resto de parámetros de la cadena", () => {
    const resultado = forzarVerificacionSsl("postgres://u:c@ep-algo.aws.neon.tech/neondb?sslmode=require&application_name=molnip");
    expect(resultado).toContain("application_name=molnip");
    expect(resultado).toContain("sslmode=verify-full");
  });

  it("no toca las conexiones locales, que no usan TLS", () => {
    const local = "postgres://testuser@localhost:5477/molnip_test";
    expect(forzarVerificacionSsl(local)).toBe(local);

    const porSocket = "/var/run/postgresql";
    expect(forzarVerificacionSsl(porSocket)).toBe(porSocket);
  });

  it("devuelve la cadena intacta si no se puede interpretar, sin lanzar", () => {
    const rara = "esto-no-es-una-url";
    expect(() => forzarVerificacionSsl(rara)).not.toThrow();
  });

  it("no expone la contraseña al transformar la cadena", () => {
    // La contraseña sigue dentro (es una cadena de conexión), pero la
    // transformación no debe duplicarla ni sacarla a otro sitio.
    const original = "postgres://usuario:MiClaveSecreta@ep-algo.aws.neon.tech/neondb?sslmode=require";
    const resultado = forzarVerificacionSsl(original);
    const apariciones = resultado.split("MiClaveSecreta").length - 1;
    expect(apariciones).toBe(1);
  });
});
