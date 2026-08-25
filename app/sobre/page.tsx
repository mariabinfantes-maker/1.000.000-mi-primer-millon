import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Scale, ShieldCheck, Ban, GitBranch } from "lucide-react";
import { metadataSobre } from "@/agents/atlas-generador-contenido/metadatos";
import { getHerramientas, getCategorias } from "@/data/repositorio";
import RevelarAlScroll from "@/components/ui/RevelarAlScroll";

export const metadata: Metadata = metadataSobre();

const CRITERIOS = [
  { titulo: "Tamaño de empresa", descripcion: "Si está pensada de verdad para negocios de tu tamaño, no solo para grandes cuentas o solo para autónomos." },
  { titulo: "Sector", descripcion: "Si tiene experiencia real con empresas de tu industria, más allá de servir para cualquier cosa." },
  { titulo: "Facilidad de uso", descripcion: "Qué tan fácil es empezar a usarla en el día a día, sin depender de un equipo técnico." },
  { titulo: "Nivel técnico requerido", descripcion: "Cuánto conocimiento técnico exige de quien la va a operar de verdad." },
  { titulo: "Curva de aprendizaje", descripcion: "Cuánto cuesta arrancar con ella al principio, antes de sacarle partido." },
  { titulo: "Integraciones", descripcion: "Si conecta con las herramientas que ya usas, en vez de obligarte a migrar todo." },
  { titulo: "Idioma", descripcion: "Si está disponible en el idioma que necesitas tú o tus clientes." },
  { titulo: "Casos no recomendados", descripcion: "Si tu situación coincide con algún escenario en el que, con honestidad, no es la mejor opción." },
];

/**
 * P-08 (nueva): página de confianza — quiénes somos, cómo evaluamos, de
 * qué vivimos. Complementa a /agentes (el "cómo" mecánico, los tres
 * agentes) con el "por qué" — sin inventar equipo, testimonios ni cifras
 * que no existen. Los números de catálogo (herramientas, categorías) se
 * calculan de verdad, igual que en el resto del sitio: nunca una cifra de
 * autoridad decorativa.
 */
export default function SobrePage() {
  const totalHerramientas = getHerramientas().length;
  const totalCategorias = getCategorias().length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="relative lg:pr-40">
        <div className="absolute -top-2 -right-4 hidden h-32 w-32 overflow-hidden rounded-3xl shadow-premium-lg lg:block">
          <Image
            src="/imagenes/marca/hero-formas.png"
            alt="Un cristal facetado transparente con una faceta iluminada en dorado, junto a formas de vidrio esmerilado índigo"
            width={256}
            height={256}
            className="h-full w-full object-cover"
          />
        </div>

        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Sobre Molnip</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          No vendemos software. Vendemos acertar a la primera.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
          Elegir la herramienta equivocada cuesta meses de trabajo, dinero e integraciones a
          medio hacer. Molnip existe para que esa decisión se tome con criterio, no adivinando
          entre cientos de webs casi idénticas ni fiándose de un ranking que nadie sabe cómo se
          ha calculado.
        </p>
      </div>

      <section className="mt-16">
        <RevelarAlScroll>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">Cómo evaluamos</h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
            Cada recomendación se calcula cruzando lo que nos cuentas con criterios reales de
            encaje — nunca una lista fija ordenada de antemano. Estos son los que usamos hoy:
          </p>
        </RevelarAlScroll>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CRITERIOS.map((criterio, i) => (
            <RevelarAlScroll key={criterio.titulo} retrasoMs={i * 60}>
              <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-5 ring-1 ring-black/[0.02]">
                <h3 className="text-sm font-semibold text-slate-900">{criterio.titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{criterio.descripcion}</p>
              </div>
            </RevelarAlScroll>
          ))}
        </div>

        <RevelarAlScroll className="mt-6">
          <p className="text-sm leading-relaxed text-slate-500">
            Cada herramienta del catálogo pasa antes por una investigación con fuentes
            verificables (documentación oficial, reputación externa, datos de uso reales cuando
            existen) antes de entrar a formar parte de ninguna recomendación. Puedes ver el
            proceso completo, agente por agente, en{" "}
            <Link href="/#como-funciona" className="font-semibold text-brand-600 transition hover:text-brand-800">
              cómo trabaja Molnip
            </Link>
            .
          </p>
        </RevelarAlScroll>
      </section>

      <section className="mt-16 border-t border-slate-100 pt-16">
        <RevelarAlScroll>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            De qué vivimos, sin rodeos
          </h2>
        </RevelarAlScroll>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <RevelarAlScroll>
            <div className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-6 ring-1 ring-black/[0.02]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-100">
                <Scale className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="text-base font-semibold text-slate-900">Comisión del proveedor, nunca del usuario</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Cuando decides ir a un proveedor a través de Molnip, algunos nos pagan una
                comisión de afiliación. Ese dinero sale de su presupuesto de marketing, nunca del
                tuyo — no pagas más por llegar a través de nosotros, en muchos casos ni un
                céntimo más que yendo directo.
              </p>
            </div>
          </RevelarAlScroll>

          <RevelarAlScroll retrasoMs={80}>
            <div className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-6 ring-1 ring-black/[0.02]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-100">
                <Ban className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="text-base font-semibold text-slate-900">La comisión no compra el ranking</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                El motor que puntúa y ordena las recomendaciones nunca lee qué proveedores pagan
                comisión ni cuánto. Son dos sistemas separados a propósito, para que pagar más no
                signifique aparecer antes.
              </p>
            </div>
          </RevelarAlScroll>

          <RevelarAlScroll retrasoMs={160}>
            <div className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-6 ring-1 ring-black/[0.02]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-100">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="text-base font-semibold text-slate-900">Sin cuentas, sin recoger tus datos</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                No hace falta registrarse para usar Molnip. Tus respuestas al cuestionario viajan
                a nuestro motor solo para calcular tu recomendación, y no las guardamos en
                ningún sitio. Más detalles en nuestra{" "}
                <Link href="/privacidad" className="font-semibold text-brand-600 transition hover:text-brand-800">
                  política de privacidad
                </Link>
                .
              </p>
            </div>
          </RevelarAlScroll>

          <RevelarAlScroll retrasoMs={240}>
            <div className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-6 ring-1 ring-black/[0.02]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-100">
                <GitBranch className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="text-base font-semibold text-slate-900">Un catálogo que crece con criterio</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Hoy el catálogo tiene {totalHerramientas} herramientas investigadas en profundidad
                en {totalCategorias} categorías. Preferimos crecer despacio y con cada ficha bien
                contrastada, a publicar cientos de fichas superficiales.
              </p>
            </div>
          </RevelarAlScroll>
        </div>
      </section>

      <section className="mt-16 border-t border-slate-100 pt-16 text-center">
        <RevelarAlScroll>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            ¿Tienes dudas, o representas a un proveedor?
          </h2>
          <p className="mx-auto mt-3 max-w-xl leading-relaxed text-slate-600">
            Escríbenos a{" "}
            <a href="mailto:hola@molnip.com" className="font-semibold text-brand-600 transition hover:text-brand-800">
              hola@molnip.com
            </a>
            .
          </p>
        </RevelarAlScroll>
      </section>
    </div>
  );
}
