import { describe, expect, it } from "vitest";
import { construirSeccionInforme, generarInformeHtml } from "../informe";

const datosCompletos = {
  nombre: "HubSpot",
  paginaOficial: "https://hubspot.com",
  categoriaId: "plataformas-todo-en-uno",
  descripcion: "Un CRM.",
  idealPara: "Pymes.",
  noRecomendadaPara: "Grandes corporaciones.",
  problemasQueResuelve: ["a"],
  casosDeUso: ["b"],
  segmentosIdeales: ["1-10"],
  industriasIdeales: ["Servicios"],
  casosNoRecomendados: ["c"],
  funcionesPrincipales: ["d"],
  integraciones: ["Gmail"],
  integracionesPrincipales: ["Gmail"],
  curvaDeAprendizaje: "facil",
  precioInicial: "Desde 10€/mes",
  modeloDePrecio: ["suscripcion_mensual"],
  tienePlanGratuito: true,
  precioRecomendadoPymes: "Plan Pro a 20€/mes",
  idiomasDisponibles: ["Español"],
  disponibleEnEspanol: true,
  tieneAppMovil: true,
  tieneApiPublica: true,
  puntuaciones: {
    facilidadDeUso: 8,
    calidad: 8,
    fiabilidad: 8,
    atencionAlCliente: 8,
    escalabilidad: 8,
    nivelTecnicoRequerido: 4,
  },
  ventajas: ["Fácil de usar"],
  inconvenientes: ["Caro"],
  metodologiaValoracion: "Basada en reseñas.",
  informacionEmpresa: { anioFundacion: 2006, paisOrigen: "Estados Unidos", tamanoAproximado: "5000+" },
  analisisAtlas: { puntuacion: 88, motivosPuntuacion: ["Buena reputación"] },
};

const datosAfiliadosCompletos = {
  hasAffiliateProgram: true,
  affiliatePlatform: "PartnerStack",
  affiliateUrl: "https://hubspot.com/partners",
  commission: "20% recurrente",
  approvalRequired: true,
  affiliateStatus: "active",
  confidenceLevel: "high",
  source: "https://hubspot.com/partners",
};

describe("construirSeccionInforme", () => {
  it("usa el id como nombre si datos.nombre falta", () => {
    const seccion = construirSeccionInforme("hubspot", { datos: {}, datosAfiliados: {} });
    expect(seccion.nombre).toBe("hubspot");
  });

  it("detecta campos públicos obligatorios faltantes", () => {
    const seccion = construirSeccionInforme("hubspot", { datos: { nombre: "HubSpot" }, datosAfiliados: {} });
    expect(seccion.camposPublicosFaltantes).toContain("descripcion");
    expect(seccion.camposPublicosFaltantes).toContain("idealPara");
  });

  it("no marca como faltante un campo público ya presente", () => {
    const seccion = construirSeccionInforme("hubspot", { datos: datosCompletos, datosAfiliados: {} });
    expect(seccion.camposPublicosFaltantes).not.toContain("descripcion");
  });

  it("detecta campos de afiliados obligatorios faltantes", () => {
    const seccion = construirSeccionInforme("hubspot", { datos: {}, datosAfiliados: {} });
    expect(seccion.camposAfiliadosFaltantes).toContain("hasAffiliateProgram");
  });

  it("no marca como faltante un campo de afiliados ya presente", () => {
    const seccion = construirSeccionInforme("hubspot", { datos: {}, datosAfiliados: datosAfiliadosCompletos });
    expect(seccion.camposAfiliadosFaltantes).not.toContain("commission");
  });

  it("conserva los metadatos si están presentes", () => {
    const seccion = construirSeccionInforme("hubspot", {
      datos: {},
      datosAfiliados: {},
      metadatos: { confianza: "alta", fuentes: ["https://x.com"], advertencias: [] },
    });
    expect(seccion.metadatos).toEqual({ confianza: "alta", fuentes: ["https://x.com"], advertencias: [] });
  });

  it("metadatos queda undefined si el borrador no lo tenía (compatibilidad con borradores antiguos)", () => {
    const seccion = construirSeccionInforme("hubspot", { datos: {}, datosAfiliados: {} });
    expect(seccion.metadatos).toBeUndefined();
  });
});

describe("generarInformeHtml", () => {
  it("genera HTML válido con el nombre, la puntuación y el id de la herramienta", () => {
    const seccion = construirSeccionInforme("hubspot", {
      datos: datosCompletos,
      datosAfiliados: datosAfiliadosCompletos,
      metadatos: { confianza: "alta", fuentes: ["https://hubspot.com"], advertencias: [] },
    });

    const html = generarInformeHtml([seccion]);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("HubSpot");
    expect(html).toContain("hubspot");
    expect(html).toContain("88");
    expect(html).toContain("PartnerStack");
    expect(html).toContain("https://hubspot.com");
  });

  it("escapa HTML en los valores para no romper el documento ni inyectar marcado", () => {
    const seccion = construirSeccionInforme("raro", {
      datos: { ...datosCompletos, nombre: "<script>alert(1)</script>" },
      datosAfiliados: {},
    });

    const html = generarInformeHtml([seccion]);

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("incluye una tabla comparativa solo cuando hay más de una herramienta", () => {
    const seccion1 = construirSeccionInforme("hubspot", { datos: datosCompletos, datosAfiliados: {} });
    const seccion2 = construirSeccionInforme("odoo", { datos: { ...datosCompletos, nombre: "Odoo" }, datosAfiliados: {} });

    expect(generarInformeHtml([seccion1])).not.toContain("Comparativa del lote");
    expect(generarInformeHtml([seccion1, seccion2])).toContain("Comparativa del lote");
  });

  it("señala los campos incompletos cuando faltan", () => {
    const seccion = construirSeccionInforme("incompleto", { datos: { nombre: "Incompleto" }, datosAfiliados: {} });

    const html = generarInformeHtml([seccion]);

    expect(html).toContain("Campos incompletos");
  });

  it("no muestra el aviso de campos incompletos cuando todo está completo", () => {
    const seccion = construirSeccionInforme("hubspot", { datos: datosCompletos, datosAfiliados: datosAfiliadosCompletos });

    const html = generarInformeHtml([seccion]);

    expect(html).not.toContain("Campos incompletos");
  });

  it("incluye los comandos exactos de aprobación y promoción para el id", () => {
    const seccion = construirSeccionInforme("hubspot", { datos: datosCompletos, datosAfiliados: {} });

    const html = generarInformeHtml([seccion]);

    expect(html).toContain("npm run aprobar-borrador -- hubspot --decision aprobado");
    expect(html).toContain("npm run promover-borrador -- hubspot");
  });

  it("indica que la confianza y las fuentes no están registradas para un borrador sin metadatos", () => {
    const seccion = construirSeccionInforme("antiguo", { datos: datosCompletos, datosAfiliados: {} });

    const html = generarInformeHtml([seccion]);

    expect(html).toContain("no registrada");
  });
});
