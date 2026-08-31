import { describe, it, expect } from "vitest";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { PLANTILLA_CSV, ID_EJEMPLO_PLANTILLA, aEntradaLote, proponerEmparejamiento } from "../columnas";
import { leerCsv } from "../leerCsv";
import { previsualizarLote } from "../previsualizar";
import type { EstrategiaAfiliacion } from "@/data/esquemaInterno";

/**
 * La plantilla es lo primero que toca quien usa la importación. Si al
 * previsualizarla sale un error, lo que se aprende es a desconfiar de la
 * pantalla. Estas pruebas fijan que salga limpia y que no pueda aplicar nada.
 */

describe("la plantilla que se descarga", () => {
  it("su id de ejemplo EXISTE en el catálogo", () => {
    // Si algún día se retira esa herramienta, esta prueba falla y avisa antes
    // de que la plantilla vuelva a dar error en producción.
    const ids = new Set(getTodasLasHerramientas().map((h) => h.id));
    expect(ids.has(ID_EJEMPLO_PLANTILLA)).toBe(true);
  });

  it("se lee como una fila con solo el id relleno", () => {
    const { filas, encabezados } = leerCsv(PLANTILLA_CSV);
    expect(filas).toHaveLength(1);
    const { emparejamiento } = proponerEmparejamiento(encabezados);
    const entrada = aEntradaLote(filas[0], emparejamiento);
    expect(entrada).toEqual({ id: ID_EJEMPLO_PLANTILLA });
  });

  it("todas sus columnas se emparejan solas", () => {
    const { encabezados } = leerCsv(PLANTILLA_CSV);
    const { sinReconocer } = proponerEmparejamiento(encabezados);
    expect(sinReconocer).toEqual([]);
  });

  it("previsualizarla NO da error y NO propone ningún cambio", () => {
    const existente: EstrategiaAfiliacion = {
      herramientaId: ID_EJEMPLO_PLANTILLA,
      cuentas: [
        {
          id: "principal",
          plataforma: "Programa propio",
          estado: "aprobado",
          enlaces: [],
          ultimaRevision: "2026-08-30",
        },
      ],
    } as EstrategiaAfiliacion;

    const { filas, encabezados } = leerCsv(PLANTILLA_CSV);
    const { emparejamiento } = proponerEmparejamiento(encabezados);
    const entradas = filas.map((f) => aEntradaLote(f, emparejamiento));

    const resumen = previsualizarLote(entradas, {
      idsValidos: new Set([ID_EJEMPLO_PLANTILLA]),
      nombres: { [ID_EJEMPLO_PLANTILLA]: "Ejemplo" },
      existentes: new Map([[ID_EJEMPLO_PLANTILLA, existente]]),
    });

    expect(resumen.conError).toBe(0);
    expect(resumen.filas[0].veredicto).toBe("sin_cambios");
    expect(resumen.aplicables).toBe(0);
    expect(resumen.activaciones).toBe(0);
  });

  it("la fila de ejemplo NO trae estado ni enlace: no puede activar ni tocar un enlace", () => {
    // Lo que hacía peligroso el arreglo obvio: un id real con los valores de
    // ejemplo rellenos habría propuesto escribirlos sobre una herramienta real.
    const { filas, encabezados } = leerCsv(PLANTILLA_CSV);
    const { emparejamiento } = proponerEmparejamiento(encabezados);
    const entrada = aEntradaLote(filas[0], emparejamiento);
    expect(entrada.estado).toBeUndefined();
    expect(entrada.enlace).toBeUndefined();
  });
});
