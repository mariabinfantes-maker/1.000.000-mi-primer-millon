import type { Metadata } from "next";
import { metadataAvisoLegal } from "@/agents/atlas-generador-contenido/metadatos";
import DocumentoLegal, { SeccionLegal, DatoPendiente } from "@/components/ui/DocumentoLegal";

export const metadata: Metadata = metadataAvisoLegal();

/**
 * Aviso legal (art. 10 LSSI-CE): identifica al titular del sitio y fija
 * las condiciones básicas de acceso. Los datos de identidad (razón
 * social/nombre, NIF, domicilio, registro si aplica) están marcados con
 * <DatoPendiente> a propósito — son datos reales del negocio que no
 * corresponde inventar; hay que rellenarlos antes de publicar esta página.
 */
export default function AvisoLegalPage() {
  return (
    <DocumentoLegal titulo="Aviso legal" actualizado="18 de agosto de 2026">
      <SeccionLegal titulo="1. Identificación del titular">
        <p>
          En cumplimiento del deber de información recogido en el artículo 10 de la Ley 34/2002,
          de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico
          (LSSI-CE), se informa de los siguientes datos: el sitio web molnip.com (en adelante,
          &quot;Molnip&quot;) es titularidad de <DatoPendiente>[nombre o razón social del titular]</DatoPendiente>,
          con NIF/CIF <DatoPendiente>[NIF/CIF]</DatoPendiente>, domicilio en{" "}
          <DatoPendiente>[domicilio completo]</DatoPendiente>{" "}
          <DatoPendiente>[y, si aplica, datos de inscripción en el Registro Mercantil]</DatoPendiente>, y dirección de
          contacto <DatoPendiente>hola@molnip.com</DatoPendiente>.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="2. Objeto">
        <p>
          Molnip es un servicio gratuito para el usuario que analiza sus respuestas a un
          cuestionario y recomienda herramientas de software para empresas, a partir de un
          catálogo investigado y valorado editorialmente. Molnip no vende software ni actúa como
          intermediario en ninguna compra: se limita a recomendar y, cuando el usuario decide
          visitar la web de un proveedor, a enlazar hacia ella.
        </p>
        <p>
          Molnip participa en programas de afiliación con algunos de los proveedores de su
          catálogo: puede recibir una comisión cuando un usuario contrata un servicio tras llegar
          a través de un enlace de Molnip, sin coste adicional para el usuario. Este modelo se
          explica con más detalle en la página{" "}
          <a href="/sobre" className="font-semibold text-brand-600 transition hover:text-brand-800">
            Sobre Molnip
          </a>
          .
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="3. Condiciones de acceso y uso">
        <p>
          El acceso a Molnip es gratuito y no requiere registro previo. El uso del sitio atribuye
          la condición de usuario y supone la aceptación de este aviso legal, de los{" "}
          <a href="/terminos" className="font-semibold text-brand-600 transition hover:text-brand-800">
            términos y condiciones
          </a>{" "}
          y de la{" "}
          <a href="/privacidad" className="font-semibold text-brand-600 transition hover:text-brand-800">
            política de privacidad
          </a>
          .
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="4. Propiedad intelectual e industrial">
        <p>
          Los contenidos de Molnip — textos, valoraciones, comparativas, diseño, código, marca y
          logotipo — son propiedad de <DatoPendiente>[titular]</DatoPendiente> o se utilizan con la
          autorización correspondiente, y están protegidos por la normativa de propiedad
          intelectual e industrial. No está permitida su reproducción, distribución o
          transformación sin autorización expresa, salvo cita con enlace a la fuente original.
        </p>
        <p>
          Los nombres, marcas y logotipos de los proveedores de software mencionados en Molnip
          pertenecen a sus respectivos titulares y se citan a efectos meramente informativos y
          comparativos.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="5. Exclusión de responsabilidad">
        <p>
          Las recomendaciones de Molnip se basan en criterios objetivos y en información pública
          o verificada de cada proveedor, pero no constituyen asesoramiento profesional,
          contractual ni de ningún tipo, y no garantizan un resultado concreto para el negocio del
          usuario. La decisión final de contratar cualquier herramienta es responsabilidad
          exclusiva del usuario, que debe verificar por su cuenta las condiciones, precios y
          funcionalidades actuales directamente con cada proveedor antes de contratar.
        </p>
        <p>
          Molnip no es parte de ningún contrato entre el usuario y el proveedor de software, y no
          asume responsabilidad por el servicio prestado por terceros ni por el contenido de sus
          sitios web, a los que Molnip únicamente enlaza.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="6. Legislación aplicable y jurisdicción">
        <p>
          Este aviso legal se rige por la legislación española. Para cualquier controversia
          derivada del acceso o uso de Molnip, las partes se someten a los juzgados y tribunales
          que correspondan conforme a la normativa de protección de consumidores aplicable.
        </p>
      </SeccionLegal>
    </DocumentoLegal>
  );
}
