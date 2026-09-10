import { describe, expect, it } from "vitest";
import { recomendarHerramientas } from "../motor";
import { construirHerramienta } from "./fixtures";
import type { PuertaDeEvidencia, RespuestasUsuario } from "../tipos";

/**
 * La puerta de evidencia dentro del motor — F3, bloque 5.
 *
 * Aquí no se importa nada de `data/verificacion`: el motor recibe la puerta
 * por parámetro, así que estas pruebas la construyen a mano. Es lo que permite
 * comprobar la conducta sin cargar los 1.544 registros, y lo que mantiene al
 * motor sin saber que ese directorio existe.
 */

const crm = (id: string) => construirHerramienta({ id, nombre: id, categoriaId: "crm", tipoProducto: "especializada" });
const proyectos = (id: string) =>
  construirHerramienta({ id, nombre: id, categoriaId: "gestion-proyectos", tipoProducto: "especializada" });

/** Una puerta que exige `cap.x` en gestión de proyectos y sólo cree a quien esté en `demuestran`. */
function puertaDe(demuestran: string[], exigeAlgunaDe = ["cap.x"]): PuertaDeEvidencia {
  return {
    filaDe: (categoriaId) =>
      categoriaId === "gestion-proyectos" ? { ambito: "gestion-proyectos", necesidad: "planificar el trabajo", exigeAlgunaDe } : undefined,
    loDemuestra: (herramientaId, capacidadId) =>
      demuestran.includes(herramientaId) && exigeAlgunaDe.includes(capacidadId),
  };
}

const perfil: RespuestasUsuario = { categoriaId: "gestion-proyectos" };
const ids = (r: { todas: { herramienta: { id: string } }[] }) => r.todas.map((e) => e.herramienta.id).sort();

describe("sólo una capacidad verificada supera la puerta", () => {
  const catalogo = [proyectos("demuestra"), proyectos("no-demuestra")];

  it("pasa quien lo ha demostrado", () => {
    expect(ids(recomendarHerramientas(perfil, catalogo, { evidencia: puertaDe(["demuestra"]) }))).toEqual(["demuestra"]);
  });

  it("sin puerta, el motor se comporta como antes de F3", () => {
    expect(ids(recomendarHerramientas(perfil, catalogo))).toEqual(["demuestra", "no-demuestra"]);
  });

  it("basta con demostrar UNA de las capacidades que pide la fila", () => {
    const puerta: PuertaDeEvidencia = {
      filaDe: () => ({ ambito: "gestion-proyectos", necesidad: "planificar el trabajo", exigeAlgunaDe: ["cap.a", "cap.b"] }),
      loDemuestra: (h, c) => (h === "demuestra" ? c === "cap.b" : false),
    };
    expect(ids(recomendarHerramientas(perfil, catalogo, { evidencia: puerta }))).toEqual(["demuestra"]);
  });

  /**
   * Filtrar antes de puntuar no es un detalle de orden: puntuar primero sería
   * ordenar herramientas que no sirven, que es lo que respondía «Grammarly» a
   * «soy peluquera y pierdo citas».
   */
  it("la puerta corre ANTES de puntuar: lo apartado no llega a evaluarse", () => {
    const r = recomendarHerramientas(perfil, catalogo, { evidencia: puertaDe(["demuestra"]) });
    expect(r.todas.map((e) => e.herramienta.id)).not.toContain("no-demuestra");
    expect(r.top.map((e) => e.herramienta.id)).not.toContain("no-demuestra");
  });
});

describe("«no consta» no se lee como ausencia", () => {
  /**
   * El motor recibe `false` tanto si se preguntó y no quedó claro como si
   * nunca se preguntó. Los dos pesan igual, y ninguno de los dos autoriza a
   * decir que la herramienta no lo hace: F2 hizo 1.544 comprobaciones y no
   * obtuvo ni una ausencia demostrada.
   */
  it("desconocido y sin registro dan exactamente el mismo resultado", () => {
    const catalogo = [proyectos("a"), proyectos("preguntada-sin-respuesta"), proyectos("nunca-preguntada")];
    const soloA = puertaDe(["a"]);
    const r = recomendarHerramientas(perfil, catalogo, { evidencia: soloA });
    expect(ids(r)).toEqual(["a"]);
    // La puerta no distingue los dos casos: si lo hiciera, uno de ellos estaría
    // valiendo como prueba de algo.
    expect(soloA.loDemuestra("preguntada-sin-respuesta", "cap.x")).toBe(
      soloA.loDemuestra("nunca-preguntada", "cap.x")
    );
  });

  it("el resultado no dice en ningún sitio que lo apartado no lo tenga", () => {
    const catalogo = [proyectos("a"), proyectos("b")];
    const r = recomendarHerramientas(perfil, catalogo, { evidencia: puertaDe(["a"]) });
    const texto = JSON.stringify(r);
    for (const frase of ["no tiene", "no dispone", "no ofrece", "no incluye", "carece"]) {
      expect(texto.toLowerCase(), frase).not.toContain(frase);
    }
  });

  /**
   * Dejar a la persona sin nada, o callarse y enseñarle la categoría entera
   * como si su respuesta se hubiera aplicado, son las dos formas de
   * equivocarse. Aquí no se hace ninguna: no se aplica y queda dicho.
   */
  it("si nadie lo demuestra, no se aparta a todos y queda constancia", () => {
    const catalogo = [proyectos("a"), proyectos("b")];
    const r = recomendarHerramientas(perfil, catalogo, { evidencia: puertaDe([]) });
    expect(ids(r)).toEqual(["a", "b"]);
    expect(r.necesidadesSinConfirmar).toEqual([
      {
        causa: "capacidad_sin_evidencia",
        ambito: "gestion-proyectos",
        necesidad: "planificar el trabajo",
        exigeAlgunaDe: ["cap.x"],
      },
    ]);
  });

  it("y cuando sí se aplica, no se marca nada", () => {
    const r = recomendarHerramientas(perfil, [proyectos("a")], { evidencia: puertaDe(["a"]) });
    expect(r.necesidadesSinConfirmar).toBeUndefined();
  });
});

describe("el plan no entra en la puerta", () => {
  /**
   * La puerta sólo sabe si la capacidad está demostrada. No hay forma de que
   * el plan influya, porque el motor no recibe el plan: `loDemuestra` devuelve
   * un booleano sobre la capacidad y nada más.
   */
  it("la puerta sólo pregunta por la capacidad, nunca por el plan", () => {
    const puerta = puertaDe(["a"]);
    expect(Object.keys(puerta).sort()).toEqual(["filaDe", "loDemuestra"]);
    expect(puerta.loDemuestra.length).toBe(2); // herramientaId y capacidadId. Nada más.
  });

  it("dos herramientas con la misma capacidad demostrada puntúan igual", () => {
    const catalogo = [proyectos("a"), proyectos("b")];
    const conPuerta = recomendarHerramientas(perfil, catalogo, { evidencia: puertaDe(["a", "b"]) });
    const sinPuerta = recomendarHerramientas(perfil, catalogo);
    expect(conPuerta.todas.map((e) => e.puntuacionTotal)).toEqual(sinPuerta.todas.map((e) => e.puntuacionTotal));
  });

  /**
   * La puerta no reparte ni quita puntos. Lo que sí puede mover una puntuación
   * es que el conjunto de comparables se haga más pequeño: varios criterios
   * son COMPARATIVOS —profundidad frente a sus iguales, superioridad frente al
   * módulo de una suite— y comparan contra las candidatas, no contra el
   * catálogo entero. Medido sobre los datos reales: la puntuación se mueve
   * como mucho 0,5 puntos en gestión de proyectos, y el orden relativo de las
   * supervivientes no cambia en ninguna de las 2.160 combinaciones.
   */
  it("la puerta no toca la puntuación cuando el conjunto de comparables no cambia", () => {
    const catalogo = [proyectos("a"), proyectos("b")];
    const conPuerta = recomendarHerramientas(perfil, catalogo, { evidencia: puertaDe(["a", "b"]) });
    const sinPuerta = recomendarHerramientas(perfil, catalogo);
    expect(conPuerta.todas.map((e) => e.puntuacionTotal)).toEqual(sinPuerta.todas.map((e) => e.puntuacionTotal));
  });

  it("y cuando aparta a alguien, no altera el orden entre las que quedan", () => {
    const catalogo = [proyectos("a"), proyectos("b"), proyectos("c")];
    const sinPuerta = recomendarHerramientas(perfil, catalogo).todas.map((e) => e.herramienta.id);
    const conPuerta = recomendarHerramientas(perfil, catalogo, { evidencia: puertaDe(["a", "c"]) }).todas.map(
      (e) => e.herramienta.id
    );
    expect(conPuerta).toEqual(sinPuerta.filter((id) => id !== "b"));
  });
});

describe("la afiliación no cambia lo que pasa la puerta", () => {
  it("colgarle datos de afiliación a una ficha no la mete ni la saca", () => {
    const a = proyectos("a");
    const b = proyectos("b");
    const bRico = {
      ...b,
      comision: "80% recurrente",
      enlaceAfiliado: "https://ejemplo.test/ref",
      estadoAfiliacion: "activa",
    } as typeof b;
    const puerta = puertaDe(["a"]);
    expect(ids(recomendarHerramientas(perfil, [a, bRico], { evidencia: puerta }))).toEqual(["a"]);
    expect(ids(recomendarHerramientas(perfil, [a, b], { evidencia: puerta }))).toEqual(["a"]);
  });

  it("la que no tiene programa gana a la que paga comisión si es la que lo ha demostrado", () => {
    const honrada = proyectos("sin-programa");
    const pagana = { ...proyectos("con-comision"), comision: "80%", estadoAfiliacion: "activa" } as ReturnType<typeof proyectos>;
    const r = recomendarHerramientas(perfil, [pagana, honrada], { evidencia: puertaDe(["sin-programa"]) });
    expect(r.top.map((e) => e.herramienta.id)).toEqual(["sin-programa"]);
  });
});

describe("los ámbitos pendientes no pasan por ninguna regla", () => {
  /**
   * CRM y las plataformas todo en uno siguen sin fila porque su regla está sin
   * decidir. Que la puerta no los toque es la conducta correcta: inventarles
   * una haría más daño que no tener ninguna.
   */
  it("sin fila para el ámbito, la puerta no aparta a nadie", () => {
    const catalogo = [crm("a"), crm("b")];
    const r = recomendarHerramientas({ categoriaId: "crm" }, catalogo, { evidencia: puertaDe([]) });
    expect(ids(r)).toEqual(["a", "b"]);
    expect(r.necesidadesSinConfirmar).toBeUndefined();
  });

  it("y tampoco se aplica cuando la persona no eligió categoría", () => {
    const catalogo = [proyectos("a"), proyectos("b")].map((h) => ({ ...h, problemasIds: ["ahorrar-tiempo"] }));
    const r = recomendarHerramientas({ problemaIdsCandidatos: ["ahorrar-tiempo"] }, catalogo, {
      evidencia: puertaDe([]),
    });
    expect(ids(r)).toEqual(["a", "b"]);
  });
});

/**
 * Las dos causas se enseñan igual y se guardan distintas — F3, bloque 6.
 *
 * Fundirlas en un motivo único ahorraría código y perdería el dato que sirve:
 * que falte evidencia de una capacidad se arregla comprobándola, y que ninguna
 * ficha encaje con una opción se arregla ampliando el catálogo. Son dos
 * problemas y dos arreglos.
 */
describe("por qué no se pudo confirmar", () => {
  it("falta de evidencia: la capacidad que la ruta exige, sin demostrar por nadie", () => {
    const r = recomendarHerramientas(perfil, [proyectos("a")], { evidencia: puertaDe([]) });
    expect(r.necesidadesSinConfirmar).toEqual([
      {
        causa: "capacidad_sin_evidencia",
        ambito: "gestion-proyectos",
        necesidad: "planificar el trabajo",
        exigeAlgunaDe: ["cap.x"],
      },
    ]);
  });

  /**
   * El aviso que `filtrarPorNecesidad` lleva devolviendo desde siempre y que el
   * motor tiraba a la basura: la respuesta de la persona dejaba de aplicarse
   * sin que nadie se enterara.
   */
  it("falta de catálogo: ninguna ficha encaja con la opción elegida", () => {
    const sinNadaQueEncaje = construirHerramienta({
      id: "crm-pelado",
      nombre: "CRM Pelado",
      categoriaId: "crm",
      tipoProducto: "especializada",
      funcionesPrincipales: ["Nada que se parezca a lo que pide la opción"],
      problemasQueResuelve: [],
      casosDeUso: [],
      ventajas: [],
    });
    const r = recomendarHerramientas(
      { categoriaId: "crm", necesidadDelSubtipo: "llamar-desde-dentro" },
      [sinNadaQueEncaje]
    );
    expect(r.necesidadesSinConfirmar).toEqual([
      {
        causa: "opcion_sin_candidatas",
        ambito: "crm",
        necesidad: "poder llamar y mandar SMS desde el propio CRM",
        opcionId: "llamar-desde-dentro",
      },
    ]);
    // Y no se queda sin nada que enseñar: conserva el conjunto.
    expect(r.todas.map((e) => e.herramienta.id)).toEqual(["crm-pelado"]);
  });

  it("cuando la opción sí encaja, no se marca nada", () => {
    const encaja = construirHerramienta({
      id: "crm-con-telefono",
      nombre: "CRM con teléfono",
      categoriaId: "crm",
      tipoProducto: "especializada",
      funcionesPrincipales: ["Telefonía VoIP integrada"],
    });
    const r = recomendarHerramientas(
      { categoriaId: "crm", necesidadDelSubtipo: "llamar-desde-dentro" },
      [encaja]
    );
    expect(r.necesidadesSinConfirmar).toBeUndefined();
  });

  /**
   * La puerta corre antes. Si las dos fallaran, manda la suya: sin evidencia de
   * lo que la ruta entera exige, la opción concreta es lo de menos.
   */
  it("si fallan las dos, manda la falta de evidencia Y se conservan las dos", () => {
    const puerta = {
      filaDe: () => ({ ambito: "crm", necesidad: "llevar tus clientes", exigeAlgunaDe: ["cap.x"] }),
      loDemuestra: () => false,
    };
    const pelado = construirHerramienta({
      id: "pelado",
      nombre: "Pelado",
      categoriaId: "crm",
      tipoProducto: "especializada",
      funcionesPrincipales: ["Nada"],
      problemasQueResuelve: [],
      casosDeUso: [],
      ventajas: [],
    });
    const r = recomendarHerramientas(
      { categoriaId: "crm", necesidadDelSubtipo: "llamar-desde-dentro" },
      [pelado],
      { evidencia: puerta }
    );
    expect(r.necesidadesSinConfirmar?.map((n) => n.causa)).toEqual([
      "capacidad_sin_evidencia",
      "opcion_sin_candidatas",
    ]);
    // La segunda conserva su propio detalle: es otro problema con otro arreglo.
    const segunda = r.necesidadesSinConfirmar![1];
    expect(segunda.causa === "opcion_sin_candidatas" && segunda.opcionId).toBe("llamar-desde-dentro");
  });

  it("la necesidad se enseña en palabras de una persona, sin identificadores", () => {
    const r = recomendarHerramientas(perfil, [proyectos("a")], { evidencia: puertaDe([]) });
    expect(r.necesidadesSinConfirmar?.[0].necesidad).not.toMatch(/cap\.|_/);
  });
});
