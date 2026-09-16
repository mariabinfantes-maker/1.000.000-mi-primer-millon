import { describe, expect, it } from "vitest";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { convertirSalida, citaNombraElPlanLocal, type SalidaLote } from "../convertir";
import { capacidadIdsDelVocabulario, citaNombraElPlan, erroresDeIdioma, erroresDeRecorrido, erroresDeRegistro } from "../repositorio";
import { erroresDeLoteDeUsos, peticionesPrevistas, type LoteDeUsos } from "../lotes";

/**
 * El conversor con usos, recorridos e idioma (tercera ronda). Lo que se
 * prueba es lo mismo que con las capacidades: que NO deje pasar una
 * afirmación sin la frase que la sostiene.
 */
const herramientas = getTodasLasHerramientas().map((h) => h.id);
const capacidades = capacidadIdsDelVocabulario();
const PRECIOS = "https://systeme.io/pricing";
const PORTADA = "https://systeme.io";
const fuentes = { "systeme-io": { urlPrecios: PRECIOS } };

const salida = (extra: Record<string, unknown>): SalidaLote => ({
  herramientas: [
    {
      herramientaId: "systeme-io",
      fechaConsulta: "2026-09-17",
      urlsSolicitadas: [PRECIOS, PORTADA],
      urlsRecuperadas: [
        { url: PRECIOS, estado: "URL_RETRIEVAL_STATUS_SUCCESS", recuperada: true },
        { url: PORTADA, estado: "URL_RETRIEVAL_STATUS_SUCCESS", recuperada: true },
      ],
      capacidadesPedidas: ["cap.payment_collection", "cap.training_lms", "cap.website_builder"],
      respuestas: [
        { capacidadId: "cap.payment_collection", veredicto: "si", profundidad: "nativa", urlFuente: PRECIOS, cita: "Sell products and collect payments with Stripe or PayPal from the Free plan", planMinimo: "Free" },
        { capacidadId: "cap.training_lms", veredicto: "si", profundidad: "nativa", urlFuente: PRECIOS, cita: "Create and host online courses with unlimited students on the Free plan", planMinimo: "Free" },
        { capacidadId: "cap.website_builder", veredicto: "si", profundidad: "nativa", urlFuente: PRECIOS, cita: "Build your website with the drag and drop editor on the Free plan", planMinimo: "Free" },
      ],
      usosPedidos: ["uso.pago_unico_y_a_plazos", "uso.acceso_al_curso_tras_el_pago"],
      recorridosPedidos: ["rec.pagina_pago_y_acceso_al_curso"],
      idiomaPedido: true,
      ...extra,
    },
  ],
});

const conUsos = (usos: Record<string, unknown[]>, extra: Record<string, unknown> = {}) => {
  const s = salida(extra);
  for (const r of s.herramientas![0].respuestas!) {
    if (usos[r.capacidadId!]) (r as { usos?: unknown[] }).usos = usos[r.capacidadId!];
  }
  return convertirSalida(s, fuentes);
};
const registroDe = (c: ReturnType<typeof convertirSalida>, capacidadId: string) => c.registros.find((r) => r.capacidadId === capacidadId)!;

describe("los usos", () => {
  it("un uso afirmado con cita literal de una dirección leída sale demostrado, y el registro entero pasa el validador", () => {
    const c = conUsos({ "cap.payment_collection": [{ usoId: "uso.pago_unico_y_a_plazos", veredicto: "si", urlFuente: PRECIOS, cita: "Offer one-time payments or payment plans in several installments", nota: "Hasta 12 plazos." }] });
    const r = registroDe(c, "cap.payment_collection");
    expect(r.usos).toEqual([{ usoId: "uso.pago_unico_y_a_plazos", estado: "demostrado", fuentes: [{ tipo: "tarifa_oficial", url: PRECIOS, fechaConsulta: "2026-09-17", cita: "Offer one-time payments or payment plans in several installments" }], nota: "Hasta 12 plazos." }]);
    expect(erroresDeRegistro(r, herramientas, capacidades)).toEqual([]);
    expect(c.descartesDeUso.filter((d) => d.usoId === "uso.pago_unico_y_a_plazos")).toEqual([]);
  });

  it("un uso pedido y sin respuesta queda como no consta, con el motivo en la nota y en los descartes de uso", () => {
    const c = conUsos({});
    const r = registroDe(c, "cap.training_lms");
    expect(r.usos).toMatchObject([{ usoId: "uso.acceso_al_curso_tras_el_pago", estado: "no_consta", nota: "El modelo no llegó a responder por este uso." }]);
    expect(c.descartesDeUso).toContainEqual(expect.objectContaining({ usoId: "uso.acceso_al_curso_tras_el_pago", motivo: "uso sin respuesta" }));
    // Y NO en los descartes de capacidad: la repesca no tiene que repetir el par.
    expect(c.descartes.filter((d) => d.capacidadId === "cap.training_lms")).toEqual([]);
    expect(erroresDeRegistro(r, herramientas, capacidades)).toEqual([]);
  });

  it("no_documentado es no consta, sin descarte: es una respuesta correcta", () => {
    const c = conUsos({ "cap.training_lms": [{ usoId: "uso.acceso_al_curso_tras_el_pago", veredicto: "no_documentado", nota: "Se buscó «automatic access» y «enrollment»." }] });
    expect(registroDe(c, "cap.training_lms").usos).toMatchObject([{ estado: "no_consta", nota: "Se buscó «automatic access» y «enrollment»." }]);
    expect(c.descartesDeUso.filter((d) => d.usoId === "uso.acceso_al_curso_tras_el_pago")).toEqual([]);
  });

  it("afirmado sin cita, con cita de una dirección no leída, o con cita breve sin revisar: no consta, nunca demostrado", () => {
    const casos = [
      { usoId: "uso.acceso_al_curso_tras_el_pago", veredicto: "si", urlFuente: PRECIOS, cita: "" },
      { usoId: "uso.acceso_al_curso_tras_el_pago", veredicto: "si", urlFuente: "https://systeme.io/otra", cita: "Students get instant access after paying" },
      { usoId: "uso.acceso_al_curso_tras_el_pago", veredicto: "si", urlFuente: PRECIOS, cita: "Instant access" },
    ];
    for (const caso of casos) {
      const c = conUsos({ "cap.training_lms": [caso] });
      const uso = registroDe(c, "cap.training_lms").usos![0];
      expect(uso.estado, JSON.stringify(caso)).toBe("no_consta");
      expect(uso.nota, JSON.stringify(caso)).toMatch(/^Se afirmó "si" sin una cita que valga/);
      expect(uso.fuentes.every((f) => !f.cita), JSON.stringify(caso)).toBe(true);
    }
  });

  it("una cita breve revisada y aceptada para ESE uso sí vale; la revisión de la capacidad no sirve para el uso", () => {
    const revisadaDelUso = [{ herramientaId: "systeme-io", capacidadId: "cap.training_lms", usoId: "uso.acceso_al_curso_tras_el_pago", cita: "Instant access", veredicto: "vale" as const, motivo: "En la tabla de cursos." }];
    const revisadaDeLaCapacidad = [{ herramientaId: "systeme-io", capacidadId: "cap.training_lms", cita: "Instant access", veredicto: "vale" as const, motivo: "x" }];
    const s = salida({});
    (s.herramientas![0].respuestas![1] as { usos?: unknown[] }).usos = [{ usoId: "uso.acceso_al_curso_tras_el_pago", veredicto: "si", urlFuente: PRECIOS, cita: "Instant access" }];
    expect(registroDe(convertirSalida(s, fuentes, revisadaDelUso), "cap.training_lms").usos![0].estado).toBe("demostrado");
    expect(registroDe(convertirSalida(s, fuentes, revisadaDeLaCapacidad), "cap.training_lms").usos![0].estado).toBe("no_consta");
  });

  it("«no» con cita es no_lo_hace; y un uso no se escribe sobre una capacidad que no salió afirmada", () => {
    const c = conUsos({ "cap.training_lms": [{ usoId: "uso.acceso_al_curso_tras_el_pago", veredicto: "no", urlFuente: PRECIOS, cita: "Access to courses is granted manually by the course owner after purchase" }] });
    expect(registroDe(c, "cap.training_lms").usos).toMatchObject([{ estado: "no_lo_hace" }]);

    const s = salida({});
    s.herramientas![0].respuestas![1] = { capacidadId: "cap.training_lms", veredicto: "no_documentado" };
    const c2 = convertirSalida(s, fuentes);
    expect(registroDe(c2, "cap.training_lms").estado).toBe("desconocido");
    expect(registroDe(c2, "cap.training_lms").usos).toBeUndefined();
  });
});

describe("los recorridos", () => {
  const recorrido = (r: Record<string, unknown>) => ({ recorridoId: "rec.pagina_pago_y_acceso_al_curso", ...r });

  it("demostrado con plan cuando todas las piezas salieron afirmadas, la fuente sostiene planes y la cita nombra el plan", () => {
    const c = convertirSalida(salida({ recorridos: [recorrido({ veredicto: "si", urlFuente: PRECIOS, cita: "Free plan: build your site, sell your course and give access automatically after payment", planMinimo: "Free", limites: "1 curso, 2.000 contactos" })] }), fuentes);
    expect(c.recorridos).toMatchObject([{ estado: "demostrado", planEstado: "verificado", planMinimo: "Free", limites: "1 curso, 2.000 contactos" }]);
    expect(c.recorridos.flatMap((r) => erroresDeRecorrido(r, herramientas))).toEqual([]);
  });

  it("demostrado con plan desconocido cuando la cita no nombra el plan, y queda anotado en los descartes de uso", () => {
    const c = convertirSalida(salida({ recorridos: [recorrido({ veredicto: "si", urlFuente: PRECIOS, cita: "Build your site, sell your course and give access automatically after payment", planMinimo: "Free" })] }), fuentes);
    expect(c.recorridos).toMatchObject([{ estado: "demostrado", planEstado: "desconocido" }]);
    expect(c.recorridos[0]).not.toHaveProperty("planMinimo");
    expect(c.descartesDeUso).toContainEqual(expect.objectContaining({ recorridoId: "rec.pagina_pago_y_acceso_al_curso" }));
  });

  it("si una pieza no salió afirmada, el recorrido no consta diga lo que diga la cita", () => {
    const s = salida({ recorridos: [recorrido({ veredicto: "si", urlFuente: PRECIOS, cita: "Free plan: build your site, sell your course and give access automatically after payment", planMinimo: "Free" })] });
    s.herramientas![0].respuestas![1] = { capacidadId: "cap.training_lms", veredicto: "no_documentado" };
    const c = convertirSalida(s, fuentes);
    expect(c.recorridos).toMatchObject([{ estado: "no_consta" }]);
    expect(c.recorridos[0].nota).toMatch(/piezas no salieron afirmadas/);
    expect(c.descartesDeUso).toContainEqual(expect.objectContaining({ motivo: "recorrido con piezas sin afirmar" }));
  });

  it("sin respuesta, no documentado, o afirmado sin cita: no consta y pasa el validador", () => {
    for (const extra of [
      {},
      { recorridos: [recorrido({ veredicto: "no_documentado", nota: "No se ve cómo se conectan." })] },
      { recorridos: [recorrido({ veredicto: "si", urlFuente: PRECIOS, cita: "" })] },
    ]) {
      const c = convertirSalida(salida(extra), fuentes);
      expect(c.recorridos, JSON.stringify(extra)).toMatchObject([{ estado: "no_consta" }]);
      expect(c.recorridos.flatMap((r) => erroresDeRecorrido(r, herramientas)), JSON.stringify(extra)).toEqual([]);
    }
  });
});

describe("el idioma", () => {
  it("interfaz verificada con códigos y cita; soporte desconocido si la página no lo dice", () => {
    const c = convertirSalida(salida({ idioma: { interfaz: ["es", "en", "FR"], interfazUrlFuente: PORTADA, interfazCita: "Available in English, French and Spanish", soporte: null, nota: "La página no dice en qué idioma atiende el soporte." } }), fuentes);
    expect(c.idiomas).toMatchObject([{ interfaz: { estado: "verificado", idiomas: ["es", "en", "fr"] }, soporte: { estado: "desconocido" } }]);
    expect(c.idiomas.flatMap((r) => erroresDeIdioma(r, herramientas))).toEqual([]);
  });

  it("idiomas afirmados sin cita, o sin ser códigos, quedan desconocidos", () => {
    const sinCita = convertirSalida(salida({ idioma: { interfaz: ["es"], interfazUrlFuente: PORTADA, interfazCita: "" } }), fuentes);
    expect(sinCita.idiomas[0].interfaz.estado).toBe("desconocido");
    const sinCodigos = convertirSalida(salida({ idioma: { interfaz: ["Español"], interfazUrlFuente: PORTADA, interfazCita: "Disponible en español" } }), fuentes);
    expect(sinCodigos.idiomas[0].interfaz.estado).toBe("desconocido");
    expect(sinCodigos.descartesDeUso).toContainEqual(expect.objectContaining({ idioma: "interfaz", motivo: "idioma con códigos inválidos" }));
  });

  it("sin respuesta, todo desconocido y válido; sin pedirlo, no se escribe nada", () => {
    const c = convertirSalida(salida({}), fuentes);
    expect(c.idiomas).toMatchObject([{ interfaz: { estado: "desconocido" }, soporte: { estado: "desconocido" } }]);
    expect(c.idiomas.flatMap((r) => erroresDeIdioma(r, herramientas))).toEqual([]);
    expect(convertirSalida(salida({ idiomaPedido: false }), fuentes).idiomas).toEqual([]);
  });
});

describe("lo que no cambia", () => {
  it("una salida sin usos, recorridos ni idioma convierte exactamente igual que antes", () => {
    const c = convertirSalida(salida({ usosPedidos: undefined, recorridosPedidos: undefined, idiomaPedido: undefined }), fuentes);
    expect(c.registros.every((r) => r.usos === undefined)).toBe(true);
    expect(c.recorridos).toEqual([]);
    expect(c.idiomas).toEqual([]);
    expect(c.descartesDeUso).toEqual([]);
  });

  it("la comprobación local del plan es la misma que la del repositorio", () => {
    for (const [cita, plan] of [["Kanban boards — Business", "Business"], ["free for freelancers", "Free"], ["Plan Básico incluye", "básico"], ["", "Free"]] as const) {
      expect(citaNombraElPlanLocal(cita, plan)).toBe(citaNombraElPlan(cita, plan));
    }
  });
});

describe("un lote de usos", () => {
  const lote: LoteDeUsos = {
    id: "usos-prueba",
    nombre: "prueba",
    motivo: "probar el validador",
    fecha: "2026-09-16",
    topeDePeticiones: 40,
    peticionesPorMinuto: 5,
    herramientas: [
      { herramientaId: "systeme-io", criterio: "las tres piezas del recorrido A", capacidadIds: ["cap.website_builder", "cap.payment_collection", "cap.training_lms"], usoIds: ["uso.acceso_al_curso_tras_el_pago"], recorridoIds: ["rec.pagina_pago_y_acceso_al_curso"], idioma: true },
    ],
  };
  const e = (cambios: Partial<LoteDeUsos>) => erroresDeLoteDeUsos({ ...lote, ...cambios }, herramientas, capacidades).join(" | ");
  const h = (cambios: Partial<LoteDeUsos["herramientas"][0]>) => e({ herramientas: [{ ...lote.herramientas[0], ...cambios }] });

  it("acepta uno bien hecho y prevé sus llamadas", () => {
    expect(e({})).toBe("");
    expect(peticionesPrevistas(lote, 5)).toEqual({ llamadas: 2, maximoConReintentos: 6 });
    expect(peticionesPrevistas({ ...lote, herramientas: [{ ...lote.herramientas[0], capacidadIds: ["a", "b", "c", "d", "e", "f"] }] }, 5)).toEqual({ llamadas: 4, maximoConReintentos: 12 });
  });

  it("rechaza lo que haría gastar sin saber qué se pregunta", () => {
    expect(e({ topeDePeticiones: 0 })).toContain("tope de peticiones");
    expect(e({ fecha: "ayer" })).toContain("fecha inválida");
    expect(h({ criterio: "" })).toContain("sin criterio escrito");
    expect(h({ herramientaId: "hotmart" })).toContain("no existe en el catálogo");
    expect(h({ usoIds: ["uso.reserva_de_servicio"] })).toContain("cuelga de cap.online_self_service_booking, que no está en sus capacidades");
    expect(h({ capacidadIds: ["cap.website_builder", "cap.payment_collection"] })).toContain("necesita cap.training_lms, y no está en sus capacidades");
    expect(h({ recorridoIds: ["rec.nada"] })).toContain('el recorrido "rec.nada" no existe');
  });
});
