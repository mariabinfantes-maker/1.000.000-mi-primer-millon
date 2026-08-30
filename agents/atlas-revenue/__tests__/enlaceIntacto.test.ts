import { describe, expect, it } from "vitest";
import { elegirEnlaceAfiliado, SEGMENTO_GLOBAL } from "@/agents/atlas-affiliate-manager/seleccionarEnlace";
import type { CuentaAfiliado } from "@/data/esquemaInterno";

/**
 * El enlace de afiliada tiene que llegar al navegador **carácter por
 * carácter**.
 *
 * Es el punto donde un error cuesta dinero de verdad y no da ninguna señal:
 * si alguien "normaliza" la URL, recorta un parámetro o la vuelve a codificar,
 * el proveedor deja de reconocer la referencia y la comisión se pierde en
 * silencio. La web seguiría funcionando perfectamente y nadie se enteraría
 * hasta cuadrar cuentas meses después.
 *
 * Hoy la página de salida hace `<a href={destino}>` sin tocar nada, así que
 * pasa por construcción. Esta prueba existe para que siga siendo verdad
 * dentro de seis meses.
 */

function cuentaCon(url: string): CuentaAfiliado[] {
  return [
    {
      id: "programa-propio",
      plataforma: "Programa propio",
      estado: "activo",
      enlaces: [{ segmento: SEGMENTO_GLOBAL, url }],
      ultimaRevision: "2026-08-29",
    },
  ];
}

describe("la URL de afiliada sale intacta", () => {
  const enlaces = [
    // El parámetro que preguntó la propietaria.
    "https://ejemplo.test/producto?sa=D_193928417_1234",
    // La forma real del enlace de Systeme.io: ruta larga con hash.
    "https://systeme.io/tr/2/161/14644721748/39837047/440451745f2121783ce1e23223975a55aebd0decf",
    // Varios parámetros, orden incluido.
    "https://ejemplo.test/?sa=ABC&ref=molnip&utm_source=molnip&utm_medium=afiliado",
    // Fragmento, que algunos programas usan.
    "https://ejemplo.test/planes?sa=XYZ#precios",
    // Mayúsculas y guiones bajos, que una normalización agresiva estropearía.
    "https://ejemplo.test/Go?SA=Mixto_Case-123",
    // Un parámetro ya codificado: re-codificarlo lo rompería.
    "https://ejemplo.test/r?dest=https%3A%2F%2Fdestino.test%2Fplan&sa=99",
  ];

  for (const url of enlaces) {
    it(`conserva "${url.slice(0, 52)}…"`, () => {
      expect(elegirEnlaceAfiliado(cuentaCon(url), SEGMENTO_GLOBAL)).toBe(url);
    });
  }

  it("no recorta la cadena de consulta ni reordena los parámetros", () => {
    const url = "https://ejemplo.test/x?sa=1&b=2&a=3";
    const devuelto = elegirEnlaceAfiliado(cuentaCon(url), SEGMENTO_GLOBAL)!;
    expect(new URL(devuelto).search).toBe("?sa=1&b=2&a=3");
  });

  it("una cuenta que NO está activa nunca genera tráfico de afiliada", () => {
    for (const estado of ["no_solicitado", "pendiente", "aprobado", "rechazado"] as const) {
      const cuentas = cuentaCon("https://ejemplo.test/?sa=1");
      cuentas[0].estado = estado;
      expect(elegirEnlaceAfiliado(cuentas, SEGMENTO_GLOBAL), estado).toBeUndefined();
    }
  });
});
