import type { Metadata } from "next";
import { metadataPrivacidad } from "@/agents/atlas-generador-contenido/metadatos";
import DocumentoLegal, { SeccionLegal, DatoPendiente } from "@/components/ui/DocumentoLegal";

export const metadata: Metadata = metadataPrivacidad();

/**
 * Política de privacidad (RGPD + LOPDGDD). Escrita para reflejar cómo
 * funciona Molnip hoy de verdad — sin cuentas de usuario, sin formularios
 * que recojan datos personales, con una medición de clics agregada y anónima, sin cookies (ver
 * app/cookies/page.tsx) — no una plantilla genérica que promete cosas que
 * el sitio no hace. Si eso cambia (se añade analítica, un formulario de
 * contacto, etc.), esta página debe actualizarse en el mismo cambio.
 */
export default function PrivacidadPage() {
  return (
    <DocumentoLegal titulo="Política de privacidad" actualizado="18 de agosto de 2026">
      <SeccionLegal titulo="1. Responsable del tratamiento">
        <p>
          El responsable del tratamiento de datos de molnip.com es{" "}
          <DatoPendiente>[nombre o razón social del titular]</DatoPendiente>, NIF/CIF{" "}
          <DatoPendiente>[NIF/CIF]</DatoPendiente>, con domicilio en{" "}
          <DatoPendiente>[domicilio completo]</DatoPendiente> y dirección de contacto{" "}
          <DatoPendiente>hola@molnip.com</DatoPendiente>.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="2. Qué datos tratamos">
        <p>
          Molnip no requiere registro ni cuenta de usuario, y hoy no dispone de ningún formulario
          que recoja datos identificativos (nombre, email, teléfono). Concretamente:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <span className="font-semibold text-slate-700">Respuestas del cuestionario.</span>{" "}
            Sector, tamaño de empresa y una descripción libre de tu problema se envían a nuestro
            servidor únicamente para calcular tu recomendación en el momento. No se almacenan en
            ninguna base de datos ni se conservan una vez calculada la respuesta.
          </li>
          <li>
            <span className="font-semibold text-slate-700">Progreso del cuestionario y resultados.</span>{" "}
            Se guardan temporalmente en tu propio navegador (sessionStorage), nunca en nuestros
            servidores, y desaparecen al cerrar la pestaña. Más detalle en nuestra{" "}
            <a href="/cookies" className="font-semibold text-brand-600 transition hover:text-brand-800">
              política de cookies
            </a>
            .
          </li>
          <li>
            <span className="font-semibold text-slate-700">Registros técnicos del servidor.</span>{" "}
            Como cualquier sitio web, nuestro proveedor de alojamiento (Vercel Inc.) genera de
            forma automática registros técnicos de las peticiones (dirección IP, navegador, fecha
            y hora) con fines de seguridad y funcionamiento del servicio, durante un periodo
            limitado. Molnip no los utiliza para elaborar perfiles ni con fines publicitarios.
          </li>
          <li>
            <span className="font-semibold text-slate-700">Clics hacia los proveedores.</span>{" "}
            Cuando pulsas &quot;Ir al proveedor&quot;, registramos cuatro datos: qué herramienta
            pulsaste, desde qué pantalla o recorrido llegaste, si el enlace era de afiliación o la
            dirección oficial del proveedor, y la fecha. Nos sirve para saber qué recomendaciones
            resultan útiles.{" "}
            <span className="font-semibold text-slate-700">
              No usamos cookies, no guardamos tu dirección IP, ni identificadores de sesión, ni
              ningún dato que permita identificarte o seguirte
            </span>{" "}
            — ni entre páginas, ni entre visitas. Los registros no se pueden asociar a una persona
            ni relacionar dos clics entre sí: son un recuento agregado por herramienta y recorrido.
          </li>
        </ul>
      </SeccionLegal>

      <SeccionLegal titulo="3. Con qué finalidad">
        <p>
          Los datos que introduces en el cuestionario se tratan con la única finalidad de calcular
          y mostrarte una recomendación de software adaptada a tu situación. La base legal es la
          ejecución de un servicio solicitado expresamente por ti (art. 6.1.b RGPD) en el momento
          en que completas el cuestionario.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="4. Con quién compartimos datos">
        <p>
          No vendemos ni cedemos datos a terceros con fines comerciales. Cuando decides pulsar
          &quot;Ir al proveedor&quot; desde una ficha, sales de Molnip hacia el sitio web de ese
          proveedor, que a partir de ese momento trata tus datos según su propia política de
          privacidad, ajena a Molnip.
        </p>
        <p>
          Usamos los siguientes proveedores como encargados del tratamiento para el
          funcionamiento técnico del sitio: Vercel Inc. (alojamiento y ejecución de la aplicación).
          Si en el futuro activamos el enriquecimiento de las recomendaciones mediante inteligencia
          artificial (hoy desactivado), las respuestas del cuestionario se procesarían también a
          través de la API de Google (Gemini), bajo sus propias condiciones — esta página se
          actualizaría en ese momento.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="5. Cuánto tiempo conservamos los datos">
        <p>
          Las respuestas del cuestionario no se almacenan tras calcular la recomendación. El
          progreso guardado en tu navegador desaparece al cerrar la pestaña o, como muy tarde, al
          borrar los datos de navegación. Los registros técnicos del servidor se conservan el
          tiempo mínimo necesario según la configuración de nuestro proveedor de alojamiento.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="6. Tus derechos">
        <p>
          Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación
          del tratamiento y portabilidad escribiendo a{" "}
          <DatoPendiente>hola@molnip.com</DatoPendiente>. También tienes derecho a presentar una
          reclamación ante la Agencia Española de Protección de Datos (aepd.es) si consideras que
          el tratamiento no se ajusta a la normativa.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="7. Cambios en esta política">
        <p>
          Si Molnip incorpora nuevas funcionalidades que impliquen tratar más datos personales
          (por ejemplo, cuentas de usuario, un boletín, o analítica), actualizaremos esta página
          antes de activarlas.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="Revisión de este documento">
        <p>
          Este documento describe con exactitud cómo funciona Molnip hoy. La medición de clics
          descrita arriba es agregada y anónima por construcción: no se recogen cookies, direcciones
          IP ni identificadores, de modo que no hay datos que puedan referirse a una persona
          identificada o identificable.
        </p>
        <p className="mt-3">
          Si en el futuro se ampliara el seguimiento de forma relevante —por ejemplo, midiendo
          recorridos individuales, incorporando herramientas de analítica de terceros o cualquier
          identificador persistente—, este documento deberá revisarse por un profesional antes de
          activar ese cambio.
        </p>
      </SeccionLegal>
    </DocumentoLegal>
  );
}
