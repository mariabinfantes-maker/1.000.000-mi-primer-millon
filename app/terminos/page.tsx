import type { Metadata } from "next";
import { metadataTerminos } from "@/agents/atlas-generador-contenido/metadatos";
import DocumentoLegal, { SeccionLegal, DatoPendiente } from "@/components/ui/DocumentoLegal";

export const metadata: Metadata = metadataTerminos();

export default function TerminosPage() {
  return (
    <DocumentoLegal titulo="Términos y condiciones" actualizado="18 de agosto de 2026">
      <SeccionLegal titulo="1. Objeto">
        <p>
          Estos términos regulan el acceso y uso de molnip.com (&quot;Molnip&quot;), un servicio
          gratuito para el usuario que recomienda herramientas de software para empresas a partir
          de sus respuestas a un cuestionario. El uso de Molnip implica la aceptación de estos
          términos, del{" "}
          <a href="/aviso-legal" className="font-semibold text-brand-600 transition hover:text-brand-800">
            aviso legal
          </a>{" "}
          y de la{" "}
          <a href="/privacidad" className="font-semibold text-brand-600 transition hover:text-brand-800">
            política de privacidad
          </a>
          .
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="2. Naturaleza de las recomendaciones">
        <p>
          Las recomendaciones de Molnip se calculan cruzando tus respuestas con criterios
          objetivos de encaje sobre un catálogo de herramientas investigado editorialmente. No
          constituyen asesoramiento profesional, legal, fiscal ni financiero, y no garantizan que
          la herramienta recomendada vaya a resolver tu problema concreto: son un punto de partida
          informado, no una decisión tomada por nosotros en tu lugar.
        </p>
        <p>
          Los precios, funcionalidades y condiciones de cada herramienta mostrados en Molnip
          pueden quedar desactualizados respecto a lo que el proveedor ofrece en el momento en que
          los consultas. Verifica siempre las condiciones actuales directamente en el sitio del
          proveedor antes de contratar.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="3. Modelo de afiliación">
        <p>
          Molnip participa en programas de afiliación con algunos proveedores de su catálogo:
          podemos recibir una comisión cuando contratas un servicio tras llegar a través de un
          enlace de Molnip, sin coste adicional para ti. Esta comisión no influye en qué
          herramienta te recomendamos ni en el orden en que aparece: el motor que calcula las
          recomendaciones no tiene acceso a qué proveedores pagan comisión.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="4. Uso aceptable">
        <p>
          Te comprometes a usar Molnip conforme a la ley, la buena fe y estos términos, y a no
          utilizar el sitio de forma que pueda dañar, sobrecargar o deteriorar su funcionamiento,
          ni con fines fraudulentos o para extraer de forma automatizada y masiva su contenido
          (scraping) sin autorización.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="5. Propiedad intelectual">
        <p>
          Los contenidos de Molnip — valoraciones, comparativas, textos, diseño, marca y código —
          están protegidos por derechos de propiedad intelectual e industrial. Los nombres y
          marcas de terceros mencionados pertenecen a sus respectivos titulares y se citan a
          efectos informativos.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="6. Limitación de responsabilidad">
        <p>
          Molnip no es parte de ningún contrato entre el usuario y el proveedor de software
          recomendado, y no responde por el servicio que preste ese proveedor, sus precios reales,
          disponibilidad o soporte. Molnip no garantiza la disponibilidad continua e
          ininterrumpida del sitio, aunque pone medios razonables para ello.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="7. Modificación de estos términos">
        <p>
          Podemos actualizar estos términos para reflejar cambios en el servicio o en la
          normativa aplicable. La versión vigente es siempre la publicada en esta página, con la
          fecha de la última actualización indicada arriba.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="8. Ley aplicable y jurisdicción">
        <p>
          Estos términos se rigen por la legislación española. Para cualquier controversia, las
          partes se someten a los juzgados y tribunales que correspondan conforme a la normativa
          de protección de consumidores aplicable.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="9. Contacto">
        <p>
          Para cualquier consulta sobre estos términos, puedes escribir a{" "}
          <DatoPendiente>hola@molnip.com</DatoPendiente>.
        </p>
      </SeccionLegal>
    </DocumentoLegal>
  );
}
