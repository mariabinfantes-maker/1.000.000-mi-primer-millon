import { describe, expect, it } from "vitest";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { recomendarHerramientas } from "@/agents/atlas-advisor/motor";
import { convertirSalida } from "../convertir";
import { crearPuertoDeEvidencia } from "../consulta";
import { afirmaAusencia, describir, esElegible, evidenciaDeRegistro } from "../evidencia";
import { getRegistros } from "../repositorio";
import { RUTAS_CONGELADAS, cumpleLaRuta } from "../rutas";
import type { RegistroVerificacion } from "../esquema";

/**
 * El tercer estado: sabemos que NO lo hace.
 *
 * En F2, `estado: "verificado"` no significa «lo hace»: significa «tenemos
 * evidencia», y la dirección la lleva `profundidad`. Con `no_disponible` la
 * evidencia dice que NO está disponible.
 *
 * La primera versión de F3 leía sólo `estado` y lo daba por capacidad
 * demostrada. Lo encontró la revisión independiente del 2026-09-10, y era el
 * peor error posible en la puerta: la única herramienta de la que sabemos con
 * certeza que no sirve era justo la que promovía, descrita como comprobada.
 *
 * No ocurre con los datos de hoy —hay cero registros `no_disponible` en los
 * 1.544— pero el conversor los produce en cuanto el modelo responda «no», y el
 * validador no los rechaza. Estas pruebas cubren las cuatro capas por las que
 * pasaría: conversor, reglas, índice y puerta.
 */

const AUSENTE: RegistroVerificacion = {
  herramientaId: "beautiful-ai",
  capacidadId: "cap.project_planning",
  estado: "verificado",
  profundidad: "no_disponible",
  fuentes: [{ tipo: "pagina_oficial", url: "https://ejemplo.test/p", fechaConsulta: "2026-09-10", cita: "x" }],
  confianza: "alta",
  proximaRevision: "2027-09-10",
};

describe("el conversor sí produce este registro", () => {
  /**
   * No es una hipótesis: el prompt vivo pide «si | no | no_documentado», y un
   * «no» sale de aquí como verificado con `no_disponible`.
   */
  const PRECIOS = "https://www.pipedrive.com/es/prices";

  it("un veredicto «no» se convierte en verificado + no_disponible", () => {
    const { registros, descartes } = convertirSalida(
      {
        herramientas: [
          {
            herramientaId: "pipedrive",
            fechaConsulta: "2026-09-10",
            urlsSolicitadas: [PRECIOS],
            urlsRecuperadas: [{ url: PRECIOS, estado: "URL_RETRIEVAL_STATUS_SUCCESS", recuperada: true }],
            capacidadesPedidas: ["cap.online_self_service_booking"],
            respuestas: [
              {
                capacidadId: "cap.online_self_service_booking",
                veredicto: "no",
                urlFuente: PRECIOS,
                cita: "Pipedrive no incluye reserva de citas por internet",
              },
            ],
          },
        ],
      },
      { pipedrive: { urlPrecios: PRECIOS } }
    );
    expect(descartes).toEqual([]);
    const r = registros.find((x) => x.capacidadId === "cap.online_self_service_booking");
    expect(r?.estado).toBe("verificado");
    expect(r?.profundidad).toBe("no_disponible");
  });

  /**
   * Y el registro que produce el conversor, leído por F3, cae en el estado
   * nuevo. Es la cadena completa: si un lote futuro trae un «no», llega hasta
   * aquí y la puerta lo aparta.
   */
  it("y lo que produce el conversor lo lee F3 como ausencia demostrada", () => {
    const { registros } = convertirSalida(
      {
        herramientas: [
          {
            herramientaId: "pipedrive",
            fechaConsulta: "2026-09-10",
            urlsSolicitadas: [PRECIOS],
            urlsRecuperadas: [{ url: PRECIOS, estado: "URL_RETRIEVAL_STATUS_SUCCESS", recuperada: true }],
            capacidadesPedidas: ["cap.online_self_service_booking"],
            respuestas: [
              {
                capacidadId: "cap.online_self_service_booking",
                veredicto: "no",
                urlFuente: PRECIOS,
                cita: "Pipedrive no incluye reserva de citas por internet",
              },
            ],
          },
        ],
      },
      { pipedrive: { urlPrecios: PRECIOS } }
    );
    const e = evidenciaDeRegistro("pipedrive", "cap.online_self_service_booking", registros[0]);
    expect(e.estado).toBe("ausencia_demostrada");
    expect(esElegible(e)).toBe(false);
  });
});

describe("las reglas no lo presentan como capacidad comprobada", () => {
  const e = evidenciaDeRegistro(AUSENTE.herramientaId, AUSENTE.capacidadId, AUSENTE);

  it("tiene su propio estado, ni demostrada ni no_consta", () => {
    expect(e.estado).toBe("ausencia_demostrada");
    expect(e.estado).not.toBe("demostrada");
    expect(e.estado).not.toBe("no_consta");
  });

  it("no es elegible", () => {
    expect(esElegible(e)).toBe(false);
  });

  /**
   * No se confunde con «no consta», y ésa es la mitad que faltaba: colapsarlo
   * ahí perdería la diferencia entre saber que no está y no saberlo.
   */
  it("se distingue de los dos «no consta»", () => {
    const desconocida = evidenciaDeRegistro("x", "cap.y", { ...AUSENTE, estado: "desconocido", profundidad: undefined });
    const sinRegistro = evidenciaDeRegistro("x", "cap.y", undefined);
    expect(desconocida.estado).toBe("no_consta");
    expect(sinRegistro.estado).toBe("no_consta");
    expect(e.estado).not.toBe(desconocida.estado);
    expect(e.origen).toBe("verificado");
    expect(desconocida.origen).toBe("desconocido");
    expect(sinRegistro.origen).toBe("sin_registro");
  });

  it("conserva el dato dentro: la profundidad, la confianza y la fuente", () => {
    expect(e.profundidad).toBe("no_disponible");
    expect(e.confianza).toBe("alta");
  });

  it("no puede llevar plan", () => {
    expect(e.plan).toEqual({ certeza: "no_procede" });
    expect(
      evidenciaDeRegistro("x", "cap.y", { ...AUSENTE, planEstado: "verificado", planMinimo: "Enterprise" }).plan.nombre
    ).toBeUndefined();
  });

  /**
   * El dato se guarda; afirmarlo en voz alta es otra decisión y la propietaria
   * no la ha tomado. El texto no dice que lo haga, y tampoco dice que no.
   */
  it("el texto no lo da por comprobado ni afirma la ausencia", () => {
    const texto = describir(e, "Proyectos e hitos");
    expect(texto).not.toContain("comprobado");
    expect(afirmaAusencia(texto)).toBe(false);
  });
});

describe("el índice no lo cuenta como demostrado", () => {
  const puerto = crearPuertoDeEvidencia([AUSENTE]);

  it("no aparece entre lo que la herramienta sabe hacer", () => {
    expect(puerto.capacidadesVerificadasDe("beautiful-ai")).toEqual([]);
  });

  it("ni entre quienes demuestran la capacidad", () => {
    expect(puerto.herramientasQueDemuestran("cap.project_planning")).toEqual([]);
  });

  it("pero el estado sigue ahí cuando se le pregunta", () => {
    expect(puerto.estadoDe("beautiful-ai", "cap.project_planning").estado).toBe("ausencia_demostrada");
  });
});

describe("la puerta no lo deja pasar", () => {
  const fila = RUTAS_CONGELADAS.find((f) => f.ambito === "gestion-proyectos")!;

  it("no cumple la fila de su ruta", () => {
    const puerto = crearPuertoDeEvidencia([AUSENTE]);
    const lo = (h: string, c: string) => puerto.estadoDe(h, c).estado === "demostrada";
    expect(cumpleLaRuta(fila, "beautiful-ai", lo)).toBe(false);
  });

  /**
   * El caso exacto del bloqueante, de punta a punta y con el catálogo real:
   * inyectar una ausencia demostrada de Odoo NO la mete entre las candidatas.
   */
  it("inyectada en los datos reales, no entra entre las candidatas", () => {
    const catalogo = getTodasLasHerramientas();
    const conAusencia = crearPuertoDeEvidencia([
      ...getRegistros().filter((r) => !(r.herramientaId === "odoo" && r.capacidadId === "cap.project_planning")),
      { ...AUSENTE, herramientaId: "odoo" },
    ]);
    const evidencia = {
      filaDe: () => ({ ambito: fila.ambito, necesidad: fila.necesidad, exigeAlgunaDe: fila.exigeAlgunaDe }),
      loDemuestra: (h: string, c: string) => conAusencia.estadoDe(h, c).estado === "demostrada",
    };
    const ids = recomendarHerramientas({ categoriaId: "gestion-proyectos" }, catalogo, { evidencia }).todas.map(
      (x) => x.herramienta.id
    );
    expect(ids).not.toContain("odoo");
  });
});

describe("y los 1.544 registros de hoy no cambian de comportamiento", () => {
  const registros = getRegistros();

  it("no hay ni un registro con ausencia demostrada", () => {
    expect(registros.filter((r) => r.profundidad === "no_disponible")).toEqual([]);
  });

  it("los 659 verificados siguen siendo capacidad demostrada", () => {
    const demostradas = registros.filter(
      (r) => evidenciaDeRegistro(r.herramientaId, r.capacidadId, r).estado === "demostrada"
    );
    expect(demostradas.length).toBe(659);
  });

  it("y ninguno cae en el estado nuevo", () => {
    const conAusencia = registros.filter(
      (r) => evidenciaDeRegistro(r.herramientaId, r.capacidadId, r).estado === "ausencia_demostrada"
    );
    expect(conAusencia).toEqual([]);
  });
});
