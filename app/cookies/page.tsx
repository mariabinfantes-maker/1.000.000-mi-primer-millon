import type { Metadata } from "next";
import { metadataCookies } from "@/agents/atlas-generador-contenido/metadatos";
import DocumentoLegal, { SeccionLegal } from "@/components/ui/DocumentoLegal";

export const metadata: Metadata = metadataCookies();

/**
 * Política de cookies. Comprobado en el propio código antes de escribir
 * esta página (no una plantilla genérica): Molnip no fija ninguna cookie,
 * propia ni de terceros, ni usa scripts de analítica o publicidad — ver
 * la ausencia total de `document.cookie` y de librerías de analítica en
 * todo el repositorio. Por eso no hace falta banner de consentimiento: la
 * LSSI-CE solo lo exige para cookies no esenciales, y hoy no hay ninguna.
 * Si eso cambia, este archivo es el primero que hay que tocar.
 */
export default function CookiesPage() {
  return (
    <DocumentoLegal titulo="Política de cookies" actualizado="18 de agosto de 2026">
      <SeccionLegal titulo="Molnip no usa cookies">
        <p>
          A día de hoy, Molnip no instala ninguna cookie propia ni de terceros en tu navegador —
          ni técnicas, ni de análisis, ni de publicidad. No hay ningún sistema de medición de
          audiencia, ningún píxel publicitario ni ningún proveedor externo que reciba tu
          actividad de navegación en Molnip.
        </p>
        <p>
          Por eso no verás ningún aviso pidiéndote aceptar cookies: al no usar ninguna que
          requiera consentimiento según la LSSI-CE, no hace falta pedírtelo.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="Lo único que guardamos: tu progreso, en tu propio navegador">
        <p>
          Cuando respondes al cuestionario, Molnip guarda tus respuestas temporalmente en el
          almacenamiento local de tu navegador (<code className="rounded-codigo bg-slate-100 px-1 py-0.5 font-mono text-[13px]">sessionStorage</code>),
          para poder mostrarte los resultados sin que tengas que repetir el cuestionario al
          navegar entre pantallas. Esta información:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Nunca se envía a ningún servidor ni se comparte con terceros.</li>
          <li>Desaparece automáticamente al cerrar la pestaña del navegador.</li>
          <li>No se usa para identificarte, hacer seguimiento entre webs, ni elaborar perfiles.</li>
        </ul>
        <p>
          Técnicamente no es una cookie — es otro tipo de almacenamiento del navegador — pero
          cumple una función parecida (recordar algo entre pantallas), así que la mencionamos
          aquí por transparencia, aunque quede fuera del alcance de la normativa de cookies al
          ser estrictamente necesaria para que el cuestionario funcione.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="Si esto cambia">
        <p>
          Si en el futuro incorporamos analítica, publicidad o cualquier cookie no esencial,
          actualizaremos esta página y te pediremos tu consentimiento antes de activarla, como
          exige la normativa.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="Medición de clics sin cookies">
        <p>
          Cuando pulsas &quot;Ir al proveedor&quot;, Molnip registra qué herramienta pulsaste, desde
          qué pantalla o recorrido llegaste, si el enlace era de afiliación y la fecha.{" "}
          <span className="font-semibold text-slate-700">Esa medición no utiliza cookies</span> ni
          ninguna otra tecnología de almacenamiento en tu dispositivo, y no guarda tu dirección IP
          ni identificadores de sesión. No se puede asociar a una persona ni relacionar dos clics
          entre sí. Se explica con detalle en nuestra{" "}
          <a href="/privacidad" className="font-semibold text-brand-700 underline">política de privacidad</a>.
        </p>
      </SeccionLegal>
    </DocumentoLegal>
  );
}
