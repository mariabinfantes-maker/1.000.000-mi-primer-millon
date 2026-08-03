import type { Herramienta } from "@/data/esquema";

/** Construye una Herramienta de prueba completa, con valores por defecto razonables que cada test sobrescribe según lo que quiera comprobar. */
export function construirHerramienta(overrides: Partial<Herramienta> & Pick<Herramienta, "id" | "nombre">): Herramienta {
  return {
    paginaOficial: `https://ejemplo.test/${overrides.id}`,
    categoriaId: "plataformas-todo-en-uno",
    descripcion: "Herramienta de prueba.",
    problemasQueResuelve: ["Problema de prueba"],
    casosDeUso: ["Caso de uso de prueba"],
    idealPara: "Equipos de prueba.",
    segmentosIdeales: ["1-10", "11-50"],
    industriasIdeales: ["retail"],
    noRecomendadaPara: "Nadie en particular.",
    casosNoRecomendados: [],
    funcionesPrincipales: ["Función de prueba"],
    integraciones: [],
    integracionesPrincipales: [],
    curvaDeAprendizaje: "media",
    precioInicial: "Desde 20€/mes",
    modeloDePrecio: ["suscripcion_mensual"],
    tienePlanGratuito: false,
    idiomasDisponibles: ["español", "inglés"],
    puntuaciones: {
      facilidadDeUso: 6,
      calidad: 6,
      fiabilidad: 6,
      atencionAlCliente: 6,
      escalabilidad: 6,
      nivelTecnicoRequerido: 5,
    },
    metodologiaValoracion: "Valoración editorial de Atlas.",
    ventajas: ["Ventaja de prueba"],
    inconvenientes: ["Inconveniente de prueba"],
    estado: "activo",
    fechaAltaEnAtlas: "2026-01-01",
    fechaUltimaRevision: "2026-01-01",
    ...overrides,
  };
}

/** CRM sencillo pensado para equipos pequeños, sin fricción técnica ni de precio. */
export const crmFacil = construirHerramienta({
  id: "crm-facil",
  nombre: "CRM Fácil",
  segmentosIdeales: ["1-10", "11-50"],
  industriasIdeales: ["retail"],
  tienePlanGratuito: true,
  precioInicial: "Gratis / Desde 10€/mes",
  modeloDePrecio: ["freemium"],
  curvaDeAprendizaje: "muy_facil",
  integraciones: ["Stripe", "Zapier"],
  integracionesPrincipales: ["Stripe"],
  idiomasDisponibles: ["español", "inglés"],
  casosNoRecomendados: ["Empresas grandes con necesidades muy complejas"],
  puntuaciones: {
    facilidadDeUso: 9,
    calidad: 7,
    fiabilidad: 7,
    atencionAlCliente: 7,
    escalabilidad: 5,
    nivelTecnicoRequerido: 2,
  },
  metodologiaValoracion: "Valoración basada en datos de uso reales de clientes de Atlas.",
});

/** ERP potente pero exigente: pensado para empresas grandes con equipo técnico y presupuesto. */
export const erpComplejo = construirHerramienta({
  id: "erp-complejo",
  nombre: "ERP Complejo",
  segmentosIdeales: ["51-200", "200+"],
  industriasIdeales: ["fabricacion"],
  tienePlanGratuito: false,
  precioInicial: "Desde 300€/mes",
  modeloDePrecio: ["suscripcion_mensual"],
  curvaDeAprendizaje: "dificil",
  integraciones: ["API REST"],
  integracionesPrincipales: [],
  idiomasDisponibles: ["inglés"],
  casosNoRecomendados: [
    "Equipos muy pequeños sin recursos técnicos propios",
    "Negocios con presupuesto ajustado",
  ],
  puntuaciones: {
    facilidadDeUso: 3,
    calidad: 8,
    fiabilidad: 8,
    atencionAlCliente: 5,
    escalabilidad: 9,
    nivelTecnicoRequerido: 9,
  },
  metodologiaValoracion: "Valoración editorial de Atlas. Pendiente de contrastar con datos de uso reales.",
});

/** Suite generalista de gama media: encaja en casi cualquier perfil sin destacar en ninguno. */
export const generalistaMedio = construirHerramienta({
  id: "generalista-medio",
  nombre: "Generalista Medio",
  segmentosIdeales: ["1-10", "11-50", "51-200"],
  industriasIdeales: ["generalista"],
  tienePlanGratuito: true,
  precioInicial: "Gratis / Desde 40€/mes",
  modeloDePrecio: ["freemium"],
  curvaDeAprendizaje: "media",
  integraciones: ["Slack", "Zapier", "Stripe"],
  integracionesPrincipales: ["Slack"],
  idiomasDisponibles: ["más de 20 idiomas, incluyendo español e inglés"],
  casosNoRecomendados: ["Empresas que necesiten un CRM de ventas muy avanzado y especializado"],
  puntuaciones: {
    facilidadDeUso: 6,
    calidad: 6,
    fiabilidad: 6,
    atencionAlCliente: 6,
    escalabilidad: 6,
    nivelTecnicoRequerido: 5,
  },
  metodologiaValoracion: "Valoración editorial de Atlas, pendiente de contrastar con datos de uso reales.",
});

/** Herramienta de nicho, usada para probar la coincidencia por solapamiento de texto libre (notasAdicionales). */
export const nichoVertical = construirHerramienta({
  id: "nicho-vertical",
  nombre: "Nicho Vertical",
  casosNoRecomendados: ["Negocios que gestionan inventario físico en varios almacenes"],
});

export const catalogoDePrueba: Herramienta[] = [crmFacil, erpComplejo, generalistaMedio, nichoVertical];
