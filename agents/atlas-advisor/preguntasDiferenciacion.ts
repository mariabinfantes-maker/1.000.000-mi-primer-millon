import type { Herramienta } from "@/data/esquema";

/**
 * Preguntas adaptativas de diferenciación — piloto del subtipo "escritura".
 *
 * El problema que resuelven, medido el 2026-08-27: dentro del subtipo
 * escritura el orden estaba CONGELADO. En los 120 perfiles simulados, sin una
 * sola excepción, Grammarly salía 1ª, Copy.ai 2ª y Jasper 3ª. El cuestionario
 * pregunta tamaño de empresa, presupuesto y plan gratuito, y ninguna de esas
 * tres cosas decide si necesitas corregir un correo o generar copys de
 * campaña. La pregunta que faltaba no era una más: era la única que
 * distinguía.
 *
 * ── Cómo NO está hecho ──────────────────────────────────────────────
 *
 * Aquí no hay ni un solo identificador de herramienta. Cada opción declara
 * una CAPACIDAD, y se queda con las fichas que la declaran por sí mismas. Si
 * mañana Grammarly añade optimización SEO, aparecerá en esa opción sin tocar
 * este archivo; si Jasper deja de integrarse con Surfer, dejará de aparecer.
 * Escribir aquí "gana Jasper" sería falsear la recomendación con pasos
 * extra, que es exactamente lo que Molnip promete no hacer.
 *
 * Tampoco se reparten puntos ni cuotas: la respuesta FILTRA el conjunto de
 * candidatas comparables, igual que ya hacen la categoría y el subtipo. Dentro
 * del conjunto que quede, gana quien gane por su ficha.
 *
 * La redacción original de las opciones 2 y 3 ("crear contenido de marketing"
 * y "mantener una voz de marca") se descartó porque NO diferenciaba: las tres
 * fichas declaran ambas cosas, así que las dos opciones dejaban el mismo
 * conjunto y Jasper no podía ganar con ninguna respuesta. Las de abajo se
 * eligieron buscando qué declara UNA SOLA de las tres.
 */

/** Campos de la ficha donde se busca la capacidad. Todos son texto editorial ya investigado. */
function textoDeclarado(herramienta: Herramienta): string {
  return [
    ...(herramienta.funcionesPrincipales ?? []),
    ...(herramienta.problemasQueResuelve ?? []),
    ...(herramienta.casosDeUso ?? []),
    ...(herramienta.ventajas ?? []),
  ]
    .join(" · ")
    .toLowerCase();
}

export type OpcionDiferenciacion = {
  id: string;
  etiqueta: string;
  /** Qué capacidad concreta se busca, en palabras de una persona. Se muestra como ayuda. */
  descripcion: string;
  /** La señal se contrasta contra el texto YA INVESTIGADO de la ficha, no contra una lista de nombres. */
  senal: RegExp;
};

export type PreguntaDiferenciacion = {
  /** Ámbito donde aplica: "<categoriaId>/<subtipoId>". Fuera de él, la pregunta no existe. */
  ambito: string;
  categoriaId: string;
  subtipoId: string;
  enunciado: string;
  opciones: OpcionDiferenciacion[];
};

export const PREGUNTAS_DIFERENCIACION: PreguntaDiferenciacion[] = [
  {
    ambito: "asistentes-ia/escritura",
    categoriaId: "asistentes-ia",
    subtipoId: "escritura",
    enunciado: "¿Qué necesitas hacer principalmente con el texto?",
    opciones: [
      {
        id: "corregir",
        etiqueta: "Corregir y mejorar lo que ya he escrito",
        descripcion: "Revisar correos, documentos y propuestas antes de enviarlos.",
        // Solo lo declara quien revisa texto existente: corrección, reescritura, plagio.
        senal: /correcci[óo]n (ortogr[áa]fica|gramatical)|errores gramaticales|reescritura|detecci[óo]n de plagio|claridad, concisi[óo]n/i,
      },
      {
        id: "marketing-seo",
        etiqueta: "Crear contenido de marketing y posicionarlo en Google",
        descripcion: "Artículos de blog, anuncios y campañas que además tienen que posicionar.",
        // Solo lo declara quien trabaja el posicionamiento en buscadores.
        senal: /\bseo\b|motores de b[úu]squeda|surfer/i,
      },
      {
        id: "ventas-idiomas",
        etiqueta: "Escribir mensajes de venta y prospección, o en varios idiomas",
        descripcion: "Secuencias comerciales, prospección B2B o contenido en varios idiomas.",
        // Solo lo declara quien produce mensajes comerciales o localiza a escala.
        senal: /prospecci[óo]n|b2b|traducci[óo]n y localizaci[óo]n|m[áa]s de \d+ idiomas|m[úu]ltiples idiomas/i,
      },
    ],
  },
];

/**
 * ¿Hay pregunta para este ámbito? Solo la hay donde la concentración medida la
 * justifica — y eso lo comprueba una prueba, no una condición en caliente:
 * calcular la concentración en cada petición costaría recorrer el catálogo
 * entero para acabar dando siempre la misma respuesta.
 *
 * Si algún día ese ámbito deja de estar concentrado, la prueba falla y avisa
 * de que la pregunta sobra. Preguntar de más también es un coste.
 */
export function preguntaParaAmbito(
  categoriaId: string | undefined,
  subtipoId: string | undefined
): PreguntaDiferenciacion | undefined {
  if (!categoriaId || !subtipoId) return undefined;
  return PREGUNTAS_DIFERENCIACION.find((p) => p.categoriaId === categoriaId && p.subtipoId === subtipoId);
}

/**
 * Aplica la respuesta al conjunto de candidatas.
 *
 * Devuelve también si el filtro se pudo aplicar: cuando ninguna ficha declara
 * la capacidad, se conserva el conjunto completo y se registra el aviso. Antes
 * dejar ver de más que dejar a alguien sin recomendación por una respuesta que
 * el catálogo todavía no sabe atender.
 */
export function filtrarPorNecesidad(
  candidatas: Herramienta[],
  pregunta: PreguntaDiferenciacion,
  necesidadId: string
): { candidatas: Herramienta[]; seAplico: boolean; aviso?: string } {
  const opcion = pregunta.opciones.find((o) => o.id === necesidadId);
  if (!opcion) return { candidatas, seAplico: false, aviso: `Respuesta desconocida "${necesidadId}" en ${pregunta.ambito}.` };

  const encajan = candidatas.filter((herramienta) => opcion.senal.test(textoDeclarado(herramienta)));
  if (encajan.length === 0) {
    return {
      candidatas,
      seAplico: false,
      aviso: `Ninguna ficha de "${pregunta.ambito}" declara la capacidad de "${opcion.etiqueta}". Se conserva el conjunto completo para no dejar a la persona sin recomendación, y queda anotado que falta catálogo para esa necesidad.`,
    };
  }
  return { candidatas: encajan, seAplico: true };
}

/** Qué fichas del catálogo declaran cada capacidad. Para el informe de Curator y las pruebas. */
export function cobertaraDeOpciones(
  candidatas: Herramienta[],
  pregunta: PreguntaDiferenciacion
): { opcionId: string; herramientaIds: string[] }[] {
  return pregunta.opciones.map((opcion) => ({
    opcionId: opcion.id,
    herramientaIds: candidatas.filter((h) => opcion.senal.test(textoDeclarado(h))).map((h) => h.id),
  }));
}
