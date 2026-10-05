import { NextResponse } from "next/server";
import {
  aclarar,
  aconsejar,
  entender,
  getOficios,
  loQueTraeUnOficio,
  necesidadesDeLaLista,
  conLaRespuesta,
  necesidadesQueSePuedenElegir,
  estadoDesde,
  estadoLimpio,
  casoDe,
  conUnaRespuesta,
  preguntasContestadas,
  ultimaRespuestaDicha,
  continuar,
  describirCambios,
  hayCambios,
  conLaAclaracion,
  type EstadoDelCaso,
  type PreguntaUtil,
} from "@/agents/atlas-advisor/asesor";
import { crearProveedorGemini } from "@/agents/compartido/proveedores/gemini";
import { MENSAJE_DE_FALLO_TECNICO } from "@/app/asesor/falloTecnico";

/**
 * La versión de PRUEBA del asesor. No toca la web actual.
 *
 * Condición de la propietaria (2026-09-24): «primero se conecta en una
 * versión de prueba, conservando la web actual. Tú recorres varios casos
 * distintos y ves cómo usa información de varias casas. La publicación se
 * decide después de ver el servicio completo funcionando, no porque haya
 * muchas pruebas técnicas en verde.»
 *
 * Esta ruta NO lee el vocabulario ni la verificación: entra todo por
 * `@/agents/atlas-advisor/asesor`, que es la única puerta. La IA sólo hace el
 * paso 1, entender; todo lo que se afirma de una herramienta sale de
 * `aconsejar`, que únicamente lee datos verificados.
 */

/**
 * Hay IA si hay clave... o si la pone el proxy, que es como funciona el
 * entorno remoto donde se lanzan los lotes (`GEMINI_CLAVE_INYECTADA_POR_PROXY`
 * en `agents/compartido/proveedores/gemini.ts`, con su motivo escrito allí).
 *
 * Faltaba esa segunda mitad, y por eso el asesor decía «todavía no sé leer tu
 * texto» en un entorno donde sí podía: se miraba sólo la variable de la clave.
 */
function hayClave(): boolean {
  return Boolean(process.env.GEMINI_API_KEY) || process.env.GEMINI_CLAVE_INYECTADA_POR_PROXY === "true";
}

/**
 * EL INTERRUPTOR PROPIO DE LA IA DEL ASESOR. Apagado salvo que
 * `ATLAS_ASESOR_IA_ACTIVA=true` esté en el entorno.
 *
 * Propietaria, 2026-10-03: «Quiero también un interruptor propio de la IA del
 * asesor, encendido en producción.» Sigue la regla del 6 de agosto para el
 * cuestionario (`ATLAS_RECOMENDADOR_IA_ACTIVA`): la IA que cuesta en cada
 * visita no se enciende sola porque exista la clave. Hasta este día el asesor
 * se encendía con la clave sola; ver ATLAS.md, «Gemini en el asesor: cuándo y
 * por qué se conectó».
 *
 * Se lee en cada petición y no al cargar el archivo: en Vercel da igual, y así
 * las pruebas pueden encenderlo y apagarlo.
 *
 * - Apagado: el asesor no llama a la IA y lo dice; la persona elige lo que le
 *   pasa de una lista. Es un estado buscado, no un fallo.
 * - Encendido y sin clave: eso SÍ es un fallo —alguien quiso la IA y no puede
 *   funcionar—, y se trata como cualquier otro fallo técnico.
 */
function iaDelAsesorEncendida(): boolean {
  return process.env.ATLAS_ASESOR_IA_ACTIVA === "true";
}

/**
 * Modelo que no existe, para la prueba de fallo: Google contesta con un error
 * real y todo el camino —llamada, error, registro, mensaje— se recorre igual
 * que en un fallo de verdad. Se pide desde la página con `?prueba=fallo`.
 * Sólo afecta a quien lo pide y no gasta: un modelo inexistente no se cobra.
 */
const MODELO_DE_PRUEBA_DE_FALLO = "modelo-inexistente-prueba-de-fallo-molnip";

/**
 * Un fallo técnico de la IA NO se esconde. Hasta el 2026-10-03 se atrapaba en
 * silencio y salía como «no te he entendido»: con la clave mal puesta, el
 * asesor estuvo días sin entender nada en producción mientras Vercel
 * registraba 200 y cero errores. Ahora queda en el registro de Vercel con su
 * causa —busca «[asesor]»— y la respuesta va con estado 503.
 *
 * No se registra lo que escribió la persona: sólo cuánto medía.
 */
function registrarFalloTecnico(momento: "entender" | "continuar", causa: unknown, texto: string, esPrueba: boolean) {
  const motivo = causa instanceof Error ? causa.message : String(causa);
  console.error(
    `[asesor] Fallo técnico de la IA al ${momento}${esPrueba ? " (prueba provocada)" : ""}: ${motivo}`,
    JSON.stringify({ momento, causa: motivo, prueba: esPrueba, largoDelMensaje: texto.length })
  );
}

function respuestaDeFalloTecnico() {
  return NextResponse.json({ falloTecnico: { mensaje: MENSAJE_DE_FALLO_TECNICO } }, { status: 503 });
}

/**
 * El lector que la IA usa para leer, con memoria de si falló. `entender` y
 * `continuar` siguen como estaban —`continuar` atrapa el error y sigue con el
 * caso intacto—; lo que cambia es que la ruta se entera y lo dice.
 */
function lectorQueAvisa(esPrueba: boolean) {
  const proveedor = crearProveedorGemini(esPrueba ? { modelo: MODELO_DE_PRUEBA_DE_FALLO } : {});
  let fallo: unknown = null;
  return {
    leer: (prompt: string) =>
      proveedor.generarJson(prompt).catch((e: unknown) => {
        fallo = e;
        throw e;
      }),
    fallo: () => fallo,
  };
}

/** Las casas: los oficios. Se piden sin cuerpo, para pintar la portada. */
export async function GET() {
  return NextResponse.json({ oficios: getOficios() });
}

export async function POST(peticion: Request) {
  const cuerpo = (await peticion.json()) as {
    texto?: string;
    necesidadIds?: string[];
    oficioId?: string;
    /** Lo que acaba de contestar a la pregunta anterior. */
    respondida?: { dimensionId?: string; respuestaId?: string };
    /** Lo que ya se sabía antes de contestar, para no volver a leer el texto. */
    necesidadesPrevias?: string[];
    /**
     * Las preguntas que ya ha contestado. No se repiten.
     *
     * Hace falta porque una respuesta puede no traer ninguna necesidad —«lo
     * asignamos nosotros»— y entonces el caso queda igual que antes: `aclarar`
     * la volvería a proponer y Molnip preguntaría lo mismo dos veces. Contestar
     * «no» también es contestar.
     */
    respondidas?: string[];
    /**
     * EL CASO QUE YA SE CONOCE, en su forma estructurada: lo que contó, lo
     * que contestó y los datos sueltos. Con él, cada mensaje nuevo se lee
     * dentro del caso y no como una consulta desde cero. Ver `continuar.ts`.
     */
    estado?: unknown;
    /** La pregunta a la que dijo «te lo explico yo», si su mensaje la contesta. */
    preguntaAbierta?: string;
    /** La palabra de la que Molnip acaba de preguntar «¿para qué?», si su mensaje lo contesta. */
    aclaracionAbierta?: string;
    /** Eligió uno de los «¿para qué?» con un botón. */
    aclarada?: { termino?: string; necesidadId?: string };
    /** Prueba de fallo pedida con `?prueba=fallo`: ver `MODELO_DE_PRUEBA_DE_FALLO`. */
    probarFallo?: boolean;
  };
  const esPrueba = cuerpo.probarFallo === true;
  const yaContestadas = new Set(cuerpo.respondidas ?? []);
  const sinRepetir = (ps: ReturnType<typeof aclarar>) => ps.filter((p) => !yaContestadas.has(p.dimension.id));
  const texto = (cuerpo.texto ?? "").trim();

  /**
   * LA CONVERSACIÓN SIGUE. Con estado, nada empieza de cero: un botón aplica
   * su respuesta al caso, y un mensaje escrito se lee dentro del caso. Si el
   * mensaje no cambia nada, se devuelve SÓLO eso, y la página conserva el
   * consejo que ya tenía: un mensaje no entendido nunca vacía el caso.
   */
  if (cuerpo.estado) {
    const estado = estadoLimpio(cuerpo.estado);
    if (cuerpo.respondida?.dimensionId && cuerpo.respondida.respuestaId) {
      const nuevo = conUnaRespuesta(estado, {
        dimensionId: cuerpo.respondida.dimensionId,
        respuestaId: cuerpo.respondida.respuestaId,
      });
      return NextResponse.json({ ...conElCaso(nuevo, texto), leyoLaIA: false });
    }
    // Eligió para qué quiere algo: entra en el mismo estado, sin llamar al modelo.
    if (cuerpo.aclarada?.termino && cuerpo.aclarada.necesidadId) {
      const c = conLaAclaracion(estado, cuerpo.aclarada.termino, cuerpo.aclarada.necesidadId);
      const continuacion = { estado: c.estado, lineas: describirCambios(c.cambios), noEntendido: [], aclaraciones: [], sinCambios: !hayCambios(c.cambios) };
      if (continuacion.sinCambios) return NextResponse.json({ continuacion });
      return NextResponse.json({ ...conElCaso(c.estado, texto), continuacion, leyoLaIA: false });
    }
    if (!texto) return NextResponse.json({ error: "Cuéntame algo primero." }, { status: 400 });
    if (!iaDelAsesorEncendida()) {
      return NextResponse.json({
        continuacion: {
          estado,
          lineas: [],
          noEntendido: [texto],
          aclaraciones: [],
          sinCambios: true,
          sinIA: true,
        },
      });
    }
    if (!hayClave()) {
      registrarFalloTecnico("continuar", "La IA del asesor está encendida pero falta GEMINI_API_KEY.", texto, esPrueba);
      return respuestaDeFalloTecnico();
    }
    const lector = lectorQueAvisa(esPrueba);
    const c = await continuar(texto, estado, lector.leer, cuerpo.preguntaAbierta, cuerpo.aclaracionAbierta);
    // Si la IA falló, lo que devuelve `continuar` es «no entendido», y no lo
    // es: no ha leído nada. El caso no se toca y se dice lo que pasa.
    if (lector.fallo()) {
      registrarFalloTecnico("continuar", lector.fallo(), texto, esPrueba);
      return respuestaDeFalloTecnico();
    }
    const continuacion = {
      estado: c.estado,
      lineas: describirCambios(c.cambios),
      noEntendido: c.noEntendido,
      aclaraciones: c.aclaraciones,
      sinCambios: !hayCambios(c.cambios),
    };
    if (continuacion.sinCambios) return NextResponse.json({ continuacion });
    return NextResponse.json({ ...conElCaso(c.estado, texto), continuacion, leyoLaIA: true });
  }

  /*
   * DESCONECTADO EL 2026-09-30, NO BORRADO. Era el camino de los botones:
   * recibía la lista plana de necesidades y la respuesta, y no guardaba de
   * qué respuesta venía cada cosa, así que una respuesta no se podía
   * corregir. La página ya manda `estado` y entra por arriba. Se deja por si
   * algo lo llama todavía.
   */
  // Contestó una pregunta: se continúa desde lo que ya se sabía, sin volver a
  // llamar al modelo ni pedirle que repita su historia.
  if (cuerpo.respondida?.respuestaId && cuerpo.necesidadesPrevias?.length) {
    const delCaso = conLaRespuesta(necesidadesDeLaLista(cuerpo.necesidadesPrevias), cuerpo.respondida);
    return NextResponse.json({
      comprension: { loQueDijo: texto, necesidades: delCaso, noEntendido: [], circunstancias: [] },
      preguntas: sinRepetir(aclarar(delCaso)).map(resumir),
      consejo: aconsejar(delCaso),
      leyoLaIA: false,
      yaRespondio: true,
    });
  }

  // La puerta principal: entrar diciendo QUÉ ERES. Un oficio trae sus
  // necesidades y el asesor hace el resto, sin que ella escriba una palabra.
  if (cuerpo.oficioId) {
    const delCaso = loQueTraeUnOficio(cuerpo.oficioId);
    if (delCaso.length) {
      return NextResponse.json({
        comprension: { loQueDijo: "", necesidades: delCaso, noEntendido: [], circunstancias: [] },
        preguntas: aclarar(delCaso).map(resumir),
        consejo: aconsejar(delCaso),
        estado: estadoDesde(delCaso),
        leyoLaIA: false,
        porOficio: true,
      });
    }
  }

  // Camino sin IA: ella elige lo que le pasa y el asesor sigue desde ahí. Se
  // dice en voz alta que el paso de entender no ha corrido; callarlo sería
  // enseñar una comprensión que no ha existido.
  if (cuerpo.necesidadIds?.length) {
    const delCaso = necesidadesDeLaLista(cuerpo.necesidadIds);
    return NextResponse.json({
      comprension: { loQueDijo: texto, necesidades: delCaso, noEntendido: [], circunstancias: [] },
      preguntas: aclarar(delCaso).map(resumir),
      consejo: aconsejar(delCaso),
      estado: estadoDesde(delCaso),
      leyoLaIA: false,
    });
  }

  if (!texto) return NextResponse.json({ error: "Cuéntame algo primero." }, { status: 400 });
  if (!iaDelAsesorEncendida()) return NextResponse.json({ sinIA: true, necesidades: necesidadesQueSePuedenElegir() });
  if (!hayClave()) {
    registrarFalloTecnico("entender", "La IA del asesor está encendida pero falta GEMINI_API_KEY.", texto, esPrueba);
    return respuestaDeFalloTecnico();
  }

  /*
   * Aquí ponía `.catch(() => leerComprension(texto, {}))`: un fallo de la IA
   * se convertía en una comprensión vacía y la persona leía «no tengo nada que
   * proponerte», igual que si no la hubiera entendido. Ya no: se registra y se
   * dice. `leerComprension` sigue siendo quien lee una respuesta que SÍ llegó.
   */
  const lector = lectorQueAvisa(esPrueba);
  let comprension;
  try {
    comprension = await entender(texto, lector.leer);
  } catch (e) {
    registrarFalloTecnico("entender", e, texto, esPrueba);
    return respuestaDeFalloTecnico();
  }
  return NextResponse.json({
    comprension,
    preguntas: aclarar(comprension.necesidades).map(resumir),
    consejo: aconsejar(comprension.necesidades),
    estado: estadoDesde(comprension.necesidades, comprension.circunstancias),
    leyoLaIA: true,
  });
}

/**
 * Todo lo que la página necesita a partir del estado: el caso calculado, las
 * preguntas que quedan, el consejo y lo último que contestó. `yaRespondio`
 * sigue significando lo mismo que antes: con una respuesta dada, no se vuelve
 * a preguntar.
 */
function conElCaso(estado: EstadoDelCaso, texto: string) {
  const delCaso = casoDe(estado);
  const contestadas = new Set(preguntasContestadas(estado));
  return {
    comprension: { loQueDijo: texto, necesidades: delCaso, noEntendido: [], circunstancias: estado.circunstancias },
    preguntas: aclarar(delCaso).filter((p) => !contestadas.has(p.dimension.id)).map(resumir),
    consejo: aconsejar(delCaso),
    estado,
    yaRespondio: estado.respuestas.length > 0,
    ultimaRespuesta: ultimaRespuestaDicha(estado),
  };
}

function resumir(p: PreguntaUtil) {
  return {
    id: p.dimension.id,
    pregunta: p.dimension.pregunta,
    porQuePreguntamos: p.dimension.porQuePreguntamos,
    respuestas: p.dimension.respuestas,
    candidatasQueSeMueven: p.candidatasQueSeMueven,
    cercaDeLoQueConto: p.cercaDeLoQueConto,
  };
}
