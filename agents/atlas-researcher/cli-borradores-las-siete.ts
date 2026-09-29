/**
 * LOS BORRADORES DE LAS SIETE QUE QUEDABAN DE LAS CORTADAS.
 *
 * `npx tsx agents/atlas-researcher/cli-borradores-las-siete.ts`
 *
 * Clinic Cloud, DriCloud, flowww, TutorBird, QVET, Gesden G5 y Treatwell.
 *
 * ES OTRO CONSTRUCTOR Y NO SUSTITUYE A LOS ANTERIORES. Los de reservas leen
 * cuatro entregas distintas y las cosen; ése era el formato viejo, donde la
 * ficha venía de una tanda, el tamaño de otra y el sector de un derivado. El
 * encargo del 2026-09-30 pide TODO de una vez por herramienta, así que aquí
 * cada objeto se lee entero y no hace falta coser nada.
 *
 * NO promueve nada. Eso lo decide la propietaria, una a una.
 */
import fs from "node:fs";
import path from "node:path";
import { escribirBorrador } from "@/agents/atlas-researcher/borrador";
import type { HerramientaPropuesta } from "@/agents/atlas-researcher/tipos";

const CARPETA = path.join(process.cwd(), "data", "investigacion", "las-siete-2026-09-30", "crudo");
const MODELO = ["freemium", "suscripcion_mensual", "suscripcion_anual", "pago_unico", "por_usuario", "a_medida"];

/**
 * `no_consta` NO EXISTE en el vocabulario del esquema, que sólo conoce
 * `verificado`, `desconocido` y `descartado`. GPT lo escribió igualmente, y
 * significa exactamente lo que dice `desconocido`: buscado y no encontrado,
 * que NO es lo mismo que no tenerlo.
 *
 * Se traduce aquí, no en el fichero crudo: el crudo se guarda tal y como
 * llegó, y si mañana se corrige el encargo esta traducción sobra.
 */
const traducirEstado = (e: string | null | undefined) =>
  e === "no_consta" || e == null ? "desconocido" : e;

const ficheros = fs.existsSync(CARPETA)
  ? fs.readdirSync(CARPETA).filter((f) => f.endsWith("-crudo.json"))
  : [];

if (ficheros.length === 0) {
  console.log("No hay entregas en", path.relative(process.cwd(), CARPETA));
  process.exit(0);
}

for (const f of ficheros) {
  const entrega = JSON.parse(fs.readFileSync(path.join(CARPETA, f), "utf8"));
  for (const h of entrega.herramientas ?? []) {
    const id = h.id;
    const advertencias: string[] = [];

    /**
     * CÓMO COBRA VA A LA FICHA, NO A UNA ADVERTENCIA. Decisión de la
     * propietaria del 2026-09-29: una advertencia abierta bloquea la
     * promoción y encima no la ve el cliente, que es quien la necesita.
     */
    const comoCobra = h.notaDelPrecio ? [String(h.notaDelPrecio)] : [];

    /**
     * LOS LÍMITES SÍ SE RECOGEN, aunque el esquema no tenga campo `limites`:
     * van a `casosNoRecomendados`, que es donde el catálogo guarda «con qué
     * te das de bruces aunque seas su cliente».
     */
    const limites: string[] = [
      ...(h.limites ?? []).map((l: any) => (typeof l === "string" ? l : l.texto)),
      ...(h.inconvenientes ?? []),
      ...comoCobra,
    ].filter(Boolean);

    /**
     * EL IDIOMA DE LA GESTIÓN, sin deducir. `idioma.interfaz` es
     * explícitamente las pantallas que usa el negocio —eso pide el encargo—,
     * así que de ahí SÍ se puede leer si se gestiona en español. De la lista
     * suelta de idiomas, no: Schedulista tiene la reserva en español y el
     * panel en inglés.
     */
    const interfaz = h.idioma?.interfaz;
    const idiomasGestion: string[] | undefined =
      interfaz?.estado === "verificado" ? interfaz.idiomas : undefined;

    const datos: Record<string, unknown> = {
      nombre: h.nombre,
      paginaOficial: h.paginaOficial,
      urlPrecios: h.urlPrecios ?? h.urlDelPrecio,
      categoriaId: h.categoriaId,
      descripcion: h.descripcion,
      problemasQueResuelve: h.problemasQueResuelve,
      casosDeUso: h.casosDeUso,
      idealPara: h.idealPara,
      segmentosIdeales: h.segmentosIdeales ?? undefined,
      industriasIdeales: h.industriasIdeales,
      // SIN RELLENO: si no consta, se queda vacío y el validador protesta.
      noRecomendadaPara: h.noRecomendadaPara ?? undefined,
      casosNoRecomendados: limites,
      funcionesPrincipales: h.funcionesPrincipales,
      integraciones: h.integraciones,
      integracionesPrincipales: h.integracionesPrincipales,
      curvaDeAprendizaje: h.curvaDeAprendizaje ?? undefined,
      precioInicial: h.precioInicial,
      modeloDePrecio: (h.modeloDePrecio ?? ["suscripcion_mensual"]).filter((m: string) => MODELO.includes(m)),
      tienePlanGratuito: h.tienePlanGratuito ?? undefined,
      /**
       * EL RECIBO DEL PRECIO. `citaDelPrecio` son las cifras; la prueba de
       * tarifa es cualquier cosa que se leyera en esa página y no sirve de
       * recibo salvo que enseñe un número. Corregido el 2026-09-29, cuando
       * el recibo de Koibox acabó diciendo «Mailchimp, Brevo, Paypal y
       * Stripe».
       */
      preciosComprobados: (() => {
        const url = h.urlDelPrecio ?? h.urlPrecios;
        if (!url) return undefined;
        const fecha = entrega.fecha ?? h.fecha;
        const cita = h.citaDelPrecio ?? "";
        const ensenaUnPrecio = /[0-9]|[€$£]|gratis|gratuit|free/i.test(cita);
        return { url, fecha, ...(ensenaUnPrecio ? { cita } : {}) };
      })(),
      idiomasDisponibles: idiomasGestion,
      disponibleEnEspanol: idiomasGestion ? idiomasGestion.includes("es") : undefined,
      tieneAppMovil: h.tieneAppMovil ?? undefined,
      tieneApiPublica: h.tieneApiPublica ?? undefined,
      puntuaciones: h.puntuaciones,
      metodologiaValoracion: h.metodologiaValoracion,
      ventajas: h.ventajas,
      inconvenientes: [...(h.inconvenientes ?? []), ...comoCobra],
      informacionEmpresa: h.informacionEmpresa,
      // El hueco, dicho: ninguna trae objetivo y el catálogo tiene campo para eso.
      objetivoPendienteDeInvestigacion: true,
    };

    const verificadas = (h.capacidades ?? []).filter(
      (c: any) => traducirEstado(c.estado) === "verificado"
    ).length;

    const propuesta: HerramientaPropuesta = {
      datos: datos as never,
      // La afiliación está aparcada desde el 2026-09-17.
      datosAfiliados: {},
      camposFaltantes: ["reputacion"],
      fuentes: (h.paginasQueAbriste ?? [h.paginaOficial]).filter(Boolean),
      confianza: "alta",
      advertencias,
    };

    const r = escribirBorrador(id, propuesta);
    console.log(
      `${id.padEnd(16)} → ${verificadas} capacidades verificadas · ` +
        `${path.relative(process.cwd(), r.rutaHerramienta)}`
    );
  }
}
