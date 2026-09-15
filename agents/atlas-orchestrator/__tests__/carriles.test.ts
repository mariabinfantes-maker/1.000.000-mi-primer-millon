import { describe, expect, it } from "vitest";
import { exigeAutorizacion, exigirArgumentosValidos, explicarMotivo, revisarArgumentos, tareasDelCarril } from "../carriles";
import { TAREAS, tareaDe, type Tarea } from "../tareas";

const t = (id: string) => tareaDe(id)!;
const vale = (tarea: Tarea, args: unknown[]) => revisarArgumentos(tarea, args).validos;
const porQueNo = (tarea: Tarea, args: unknown[]) => {
  const r = revisarArgumentos(tarea, args);
  return r.validos ? "(lo aceptó)" : r.explicacion;
};

describe("los dos carriles", () => {
  it("los dos carriles suman todas las tareas y ninguna está en los dos", () => {
    const libre = tareasDelCarril("libre");
    const conPermiso = tareasDelCarril("conPermiso");
    expect(libre.length + conPermiso.length).toBe(TAREAS.length);
    expect(libre.some((x) => conPermiso.includes(x))).toBe(false);
  });

  it("pedir permiso es exactamente estar en el carril conPermiso", () => {
    for (const tarea of TAREAS) expect(exigeAutorizacion(tarea)).toBe(tarea.carril === "conPermiso");
  });

  it("el motivo se explica sin jerga: dice qué hace, no cómo se llama el carril", () => {
    expect(explicarMotivo("gasta_dinero")).toContain("dinero");
    expect(explicarMotivo("escribe_datos")).toContain("escribe");
    for (const motivo of ["gasta_dinero", "escribe_datos", "ninguno"] as const) {
      expect(explicarMotivo(motivo)).not.toContain("conPermiso");
      expect(explicarMotivo(motivo)).not.toContain("carril");
    }
  });

  it("una tarea del carril libre nunca gasta ni escribe", () => {
    for (const tarea of tareasDelCarril("libre")) expect(tarea.motivo).toBe("ninguno");
  });
});

/**
 * El suelo se aplica a TODA tarea, tenga tipo declarado o no. Es lo que
 * protege a la tarea que alguien añada mañana antes de acordarse de
 * escribirle su tipo.
 */
describe("el suelo: lo que no pasa nunca, en ninguna tarea", () => {
  it("rechaza caracteres de control e invisibles", () => {
    for (const malo of ["a\nb", "a\tb", "a\u0000b", "\u202Eevil", "a\u200Bb", "a\uFEFFb"]) {
      expect(porQueNo(t("investigar-herramienta"), [malo])).toContain("control o invisibles");
    }
  });

  it("rechaza lo que no es texto", () => {
    for (const malo of [42, null, { ruta: "x" }, ["anidado"]]) {
      expect(porQueNo(t("investigar-herramienta"), [malo])).toContain("no es texto");
    }
  });

  it("rechaza lo vacío y lo desmesurado", () => {
    expect(porQueNo(t("investigar-herramienta"), [""])).toContain("vacío");
    expect(porQueNo(t("investigar-herramienta"), ["x".repeat(201)])).toContain("200 caracteres");
    expect(porQueNo(t("investigar-herramienta"), new Array(25).fill("a"))).toContain("demasiados argumentos");
  });

  it("un valor suelto no puede empezar por guion: dejaría de ser un dato", () => {
    expect(porQueNo(t("investigar-lote"), ["-rf"])).toContain("empieza por «-»");
    expect(porQueNo(t("investigar-lote"), ["-"])).toContain("empieza por «-»");
  });
});

/**
 * Un argumento con travesía de directorios en una tarea del carril libre
 * —que se ejecuta sin firma ninguna— resolvería a un fichero de fuera del
 * repositorio. Es el caso que obliga a comprobar las rutas y no sólo los
 * caracteres.
 */
describe("una ruta no puede salirse del repositorio", () => {
  for (const fuera of [
    "../../../etc/passwd",
    "data/../../../.env",
    "..",
    "a/../../b",
    "/etc/shadow",
    "/absoluta",
    "C:/Windows/System32",
    "\\\\servidor\\share",
  ]) {
    it(`rechaza ${JSON.stringify(fuera)}`, () => {
      const r = revisarArgumentos(t("investigar-lote"), [fuera]);
      expect(r.validos).toBe(false);
      if (!r.validos) expect(r.explicacion).toMatch(/fuera del repositorio|forma de ruta|empieza por/);
    });
  }

  it("una ruta relativa normal sí pasa", () => {
    expect(vale(t("investigar-lote"), ["data/lotes/lote-1.json"])).toBe(true);
    expect(vale(t("convertir-verificacion"), ["data/borradores/salida/todo-lote1.json"])).toBe(true);
  });

  it("un fichero que se llama «..algo» no es una travesía", () => {
    expect(vale(t("investigar-lote"), ["..algo.json"])).toBe(true);
  });
});

describe("el techo: cada tarea sólo admite lo suyo", () => {
  it("una tarea sin argumentos no admite ninguno", () => {
    expect(porQueNo(t("informe-curador"), ["data/algo.json"])).toContain("no admite ningún argumento");
    expect(vale(t("informe-curador"), [])).toBe(true);
  });

  it("una tarea que los exige no arranca sin ellos", () => {
    expect(porQueNo(t("investigar-lote"), [])).toContain("necesita argumentos");
  });

  it("un id tiene que tener forma de id", () => {
    expect(vale(t("promover-borrador"), ["simplybook-me"])).toBe(true);
    expect(porQueNo(t("promover-borrador"), ["SimplyBook"])).toContain("forma de id");
    expect(porQueNo(t("promover-borrador"), ["data/ruta.json"])).toContain("forma de id");
  });

  it("una opción no declarada se rechaza por su nombre", () => {
    expect(porQueNo(t("investigar-lote"), ["data/x.json", "--forzar"])).toContain("no admite la opción");
    expect(porQueNo(t("promover-borrador"), ["viday", "--borrar-todo"])).toContain("no admite la opción");
  });

  it("una opción declarada sí pasa, con su valor", () => {
    expect(vale(t("promover-borrador"), ["viday", "--ignorar-duplicado"])).toBe(true);
    expect(vale(t("promover-borrador"), ["viday", "--justificacion", "Es otra herramienta distinta"])).toBe(true);
    expect(vale(t("migrar-a-neon"), ["--env", ".env.neon.local", "--forzar"])).toBe(true);
  });

  it("una opción de lista cerrada sólo admite sus valores", () => {
    expect(vale(t("aprobar-borrador"), ["viday", "--decision", "aprobado"])).toBe(true);
    expect(porQueNo(t("aprobar-borrador"), ["viday", "--decision", "quiza"])).toContain("sólo admite");
    expect(porQueNo(t("actualizar-estrategia-afiliacion"), ["viday", "--estado", "inventado"])).toContain("sólo admite");
  });

  it("el valor de una opción tampoco puede ser otra opción", () => {
    expect(porQueNo(t("promover-borrador"), ["viday", "--justificacion", "--ignorar-duplicado"])).toContain("empieza por «-»");
  });

  it("una fecha tiene que ser una fecha", () => {
    expect(vale(t("actualizar-estrategia-afiliacion"), ["viday", "--fecha-solicitud", "2026-09-15"])).toBe(true);
    expect(porQueNo(t("actualizar-estrategia-afiliacion"), ["viday", "--fecha-solicitud", "ayer"])).toContain("forma de fecha");
  });

  it("una url tiene que ser https y con dominio", () => {
    expect(vale(t("verificar-despliegue"), ["--url", "https://vista-previa.vercel.app"])).toBe(true);
    expect(porQueNo(t("verificar-despliegue"), ["--url", "http://sin-cifrar.test"])).toContain("forma de url");
    expect(porQueNo(t("verificar-despliegue"), ["--url", "javascript:alert(1)"])).toContain("forma de url");
  });

  it("un texto libre admite espacios y acentos; un id no", () => {
    expect(vale(t("promover-borrador"), ["viday", "--justificacion", "Única que cubre reserva online en español"])).toBe(true);
    expect(vale(t("investigar-herramienta"), ["Notion", "AI"])).toBe(true);
    expect(porQueNo(t("promover-borrador"), ["dos palabras"])).toContain("forma de id");
  });

  it("un posicional repetible admite varios; uno que no lo es, no", () => {
    expect(vale(t("generar-informe"), ["uno", "dos", "tres"])).toBe(true);
    expect(porQueNo(t("investigar-lote"), ["data/a.json", "data/b.json"])).toContain("no admite tantos");
  });

  it("generar-informe acepta --todos en vez de la lista", () => {
    expect(vale(t("generar-informe"), ["--todos"])).toBe(true);
    expect(porQueNo(t("generar-informe"), [])).toContain("necesita argumentos");
  });

  it("la contraseña del panel admite lo que la propietaria teclee, menos invisibles", () => {
    expect(vale(t("generar-hash-admin"), ["Contraseña con espacios y símbolos !#%"])).toBe(true);
    expect(porQueNo(t("generar-hash-admin"), ["con\nsalto"])).toContain("control o invisibles");
  });

  it("devuelve los argumentos revisados, no los de entrada", () => {
    const r = revisarArgumentos(t("promover-borrador"), ["viday", "--justificacion", "un motivo"]);
    expect(r.validos).toBe(true);
    if (r.validos) expect(r.argumentos).toEqual(["viday", "--justificacion", "un motivo"]);
  });

  it("exigir lanza y nombra el problema", () => {
    expect(() => exigirArgumentosValidos(t("investigar-lote"), ["/etc/passwd"])).toThrow(/Argumentos rechazados/);
  });
});

/**
 * Las dos capas son independientes: que una tarea declare un tipo no la
 * exime del suelo, y que no declare nada no la deja sin protección.
 */
describe("las dos capas se aplican siempre, no una u otra", () => {
  it("toda tarea, declare lo que declare, rechaza un byte nulo", () => {
    for (const tarea of TAREAS) {
      const r = revisarArgumentos(tarea, ["a\u0000b"]);
      expect(r.validos, tarea.id).toBe(false);
    }
  });

  /**
   * La travesía se comprueba donde importa: en los huecos de clase `ruta`,
   * que son los únicos que un CLI abre como fichero. Sólo hay cuatro en
   * todo el catálogo, y esta prueba los recorre todos sin nombrarlos, para
   * que un hueco `ruta` nuevo entre solo.
   *
   * Un hueco `texto` o `secreto` NO se comprueba así a propósito: el
   * nombre de una herramienta o la contraseña del panel pueden parecerse a
   * una ruta y no lo son — nadie las abre. Exigirles forma de ruta sería
   * la regla rígida que rompe trabajo legítimo.
   */
  it("ningún hueco de clase ruta acepta salirse del repositorio", () => {
    const huecosDeRuta: string[] = [];

    for (const tarea of TAREAS) {
      for (const posicional of tarea.argumentos.posicionales.filter((p) => p.clase === "ruta")) {
        huecosDeRuta.push(`${tarea.id} (${posicional.descripcion})`);
        for (const fuera of ["/etc/shadow", "../../fuera", "data/../../x"]) {
          expect(revisarArgumentos(tarea, [fuera]).validos, `${tarea.id} ← ${fuera}`).toBe(false);
        }
      }
      for (const bandera of tarea.argumentos.banderas.filter((b) => b.clase === "ruta")) {
        huecosDeRuta.push(`${tarea.id} --${bandera.nombre}`);
        for (const fuera of ["/etc/shadow", "../../fuera", "data/../../x"]) {
          expect(
            revisarArgumentos(tarea, [`--${bandera.nombre}`, fuera]).validos,
            `${tarea.id} --${bandera.nombre} ← ${fuera}`
          ).toBe(false);
        }
      }
    }

    // Si aparece un quinto, que sea porque alguien lo añadió a conciencia.
    expect(huecosDeRuta.sort()).toEqual([
      "actualizar-estrategia-afiliacion --lote",
      "convertir-verificacion (salida cruda del lote)",
      "copia-seguridad-afiliacion --env",
      "investigar-lote (fichero JSON con la lista de candidatas)",
      "migrar-a-neon --env",
      "verificar-neon --env",
    ]);
  });

  it("los huecos de texto y de secreto no son rutas, y no se les exige forma de ruta", () => {
    // El nombre de una herramienta puede ser cualquier cosa: nadie lo abre.
    expect(revisarArgumentos(t("investigar-herramienta"), ["/etc/shadow"]).validos).toBe(true);
    // Una contraseña también.
    expect(revisarArgumentos(t("generar-hash-admin"), ["../mi-contraseña"]).validos).toBe(true);
  });
});
