import { describe, expect, it } from "vitest";
import { crearPuertoDeEvidencia, getPuertaDeEvidencia, getPuertoDeEvidencia } from "../consulta";
import type { RegistroDeIdioma, RegistroDeRecorrido, RegistroVerificacion } from "../esquema";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { USOS, RECORRIDOS } from "../usos";

/**
 * Los usos, recorridos e idiomas leídos por el puerto — con registros
 * inventados, como el resto del índice, y al final con los reales.
 */
const fuente = { tipo: "pagina_oficial" as const, url: "https://ejemplo.test/p", fechaConsulta: "2026-09-16" };
const conCita = { ...fuente, cita: "Clients book a haircut with its duration and price." };

function registro(herramientaId: string, capacidadId: string, cambios: Partial<RegistroVerificacion> = {}): RegistroVerificacion {
  return {
    herramientaId,
    capacidadId,
    estado: "verificado",
    profundidad: "nativa",
    planEstado: "desconocido",
    fuentes: [conCita],
    confianza: "alta",
    proximaRevision: "2027-06-01",
    ...cambios,
  };
}

const RESERVA = "cap.online_self_service_booking";
const USO = "uso.reserva_de_servicio";

const MUESTRA: RegistroVerificacion[] = [
  registro("demuestra", RESERVA, { usos: [{ usoId: USO, estado: "demostrado", fuentes: [conCita], nota: "Sólo desde el móvil." }] }),
  registro("no-consta", RESERVA, { usos: [{ usoId: USO, estado: "no_consta", fuentes: [fuente], nota: "Se buscó «service»." }] }),
  registro("no-lo-hace", RESERVA, { usos: [{ usoId: USO, estado: "no_lo_hace", fuentes: [{ ...fuente, cita: "Only meetings can be booked." }] }] }),
  registro("sin-uso", RESERVA),
  // Un uso escrito sobre una capacidad que NO consta no vale: el índice lo ignora.
  registro("capacidad-desconocida", RESERVA, { estado: "desconocido", profundidad: undefined, planEstado: undefined, nota: "no está" }),
];

const RECORRIDOS_MUESTRA: RegistroDeRecorrido[] = [
  {
    herramientaId: "demuestra",
    recorridoId: "rec.pagina_pago_y_acceso_al_curso",
    estado: "demostrado",
    planEstado: "verificado",
    planMinimo: "Free",
    fuentes: [{ tipo: "tarifa_oficial", url: "https://ejemplo.test/pricing", fechaConsulta: "2026-09-16", cita: "Free — 1 course, sell it with a payment page" }],
    limites: "1 curso",
    proximaRevision: "2027-03-01",
  },
  { herramientaId: "no-consta", recorridoId: "rec.pagina_pago_y_acceso_al_curso", estado: "no_consta", fuentes: [fuente], nota: "Se buscó.", proximaRevision: "2027-06-01" },
];

const IDIOMAS_MUESTRA: RegistroDeIdioma[] = [
  {
    herramientaId: "demuestra",
    interfaz: { estado: "verificado", idiomas: ["es", "en"], fuentes: [{ ...fuente, cita: "Available in Spanish and English" }] },
    soporte: { estado: "desconocido", fuentes: [fuente], nota: "No dice en qué idioma atiende." },
    proximaRevision: "2027-09-01",
  },
];

describe("los usos en el puerto", () => {
  const puerto = crearPuertoDeEvidencia(MUESTRA, RECORRIDOS_MUESTRA, IDIOMAS_MUESTRA);

  it("demostrado, con su nota y su fuente", () => {
    expect(puerto.usoDe("demuestra", USO)).toMatchObject({ estado: "demostrada", origen: "verificado", nota: "Sólo desde el móvil.", fuente: { url: fuente.url } });
  });

  it("no consta con origen desconocido cuando se preguntó, y sin registro cuando no", () => {
    expect(puerto.usoDe("no-consta", USO)).toMatchObject({ estado: "no_consta", origen: "desconocido" });
    expect(puerto.usoDe("sin-uso", USO)).toEqual({ herramientaId: "sin-uso", usoId: USO, estado: "no_consta", origen: "sin_registro" });
    expect(puerto.usoDe("nadie", USO)).toMatchObject({ estado: "no_consta", origen: "sin_registro" });
  });

  it("una ausencia demostrada se conserva como tal, no se colapsa", () => {
    expect(puerto.usoDe("no-lo-hace", USO)).toMatchObject({ estado: "ausencia_demostrada", origen: "verificado" });
    expect(puerto.usoDe("no-lo-hace", USO).fuente).toBeUndefined();
  });

  it("un uso de una capacidad que no consta no consta, y un uso inexistente tampoco", () => {
    expect(puerto.usoDe("capacidad-desconocida", USO)).toMatchObject({ estado: "no_consta", origen: "sin_registro" });
    expect(puerto.usoDe("demuestra", "uso.inventado")).toMatchObject({ estado: "no_consta", origen: "sin_registro" });
  });

  it("la puerta reparte los tres estados sin colapsarlos", () => {
    // La puerta real se construye sobre el puerto real; aquí se comprueba la misma regla sobre el inventado.
    const estado = (h: string) => puerto.usoDe(h, USO).estado;
    expect([estado("demuestra"), estado("no-consta"), estado("no-lo-hace"), estado("sin-uso")]).toEqual([
      "demostrada",
      "no_consta",
      "ausencia_demostrada",
      "no_consta",
    ]);
  });

  it("los recorridos: demostrado con plan y límites, no consta, y sin registro", () => {
    expect(puerto.recorridoDe("demuestra", "rec.pagina_pago_y_acceso_al_curso")).toMatchObject({
      estado: "demostrada",
      plan: { certeza: "verificado", nombre: "Free" },
      limites: "1 curso",
    });
    expect(puerto.recorridoDe("no-consta", "rec.pagina_pago_y_acceso_al_curso")).toMatchObject({ estado: "no_consta", origen: "desconocido", plan: { certeza: "no_procede" } });
    expect(puerto.recorridoDe("sin-uso", "rec.pagina_pago_y_acceso_al_curso")).toMatchObject({ estado: "no_consta", origen: "sin_registro" });
  });

  it("el idioma: interfaz verificada y soporte desconocido son dos certezas; sin registro, todo desconocido", () => {
    expect(puerto.idiomaDe("demuestra")).toMatchObject({ interfaz: { estado: "verificado", idiomas: ["es", "en"] }, soporte: { estado: "desconocido" } });
    expect(puerto.idiomaDe("sin-uso")).toEqual({ herramientaId: "sin-uso", interfaz: { estado: "desconocido" }, soporte: { estado: "desconocido" } });
  });

  it("dos recorridos o dos idiomas del mismo par hacen fallar la construcción", () => {
    expect(() => crearPuertoDeEvidencia([], [RECORRIDOS_MUESTRA[0], RECORRIDOS_MUESTRA[0]])).toThrow(/dos recorridos/);
    expect(() => crearPuertoDeEvidencia([], [], [IDIOMAS_MUESTRA[0], IDIOMAS_MUESTRA[0]])).toThrow(/dos registros de idioma/);
  });
});

describe("con los datos reales", () => {
  const puerto = getPuertoDeEvidencia();
  const puerta = getPuertaDeEvidencia();
  const catalogo = getTodasLasHerramientas();

  it("hoy ningún uso está demostrado ni negado, ningún recorrido consta, y el idioma es desconocido en las 62", () => {
    for (const h of catalogo) {
      for (const u of USOS) expect(puerto.usoDe(h.id, u.id).estado, `${h.id} / ${u.id}`).toBe("no_consta");
      for (const r of RECORRIDOS) expect(puerto.recorridoDe(h.id, r.id).estado, `${h.id} / ${r.id}`).toBe("no_consta");
      const idioma = puerto.idiomaDe(h.id);
      expect(idioma.interfaz.estado, h.id).toBe("desconocido");
      expect(idioma.soporte.estado, h.id).toBe("desconocido");
      for (const u of USOS) expect(puerta.estadoDeUso(h.id, u.id), `${h.id} / ${u.id}`).toBe("no_consta");
    }
  });
});
