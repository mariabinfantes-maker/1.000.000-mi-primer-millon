import type { Metadata } from "next";
import Link from "next/link";
import { getHerramientas, getTodasLasCategorias } from "@/data/repositorio";
import { esSuite } from "@/data/taxonomia";
import { ordenarPorPuntuacionAtlas } from "@/lib/vistaRecomendacion";
import { calcularPuntuacionAtlas } from "@/lib/puntuacionAtlas";
import CatalogoCompleto from "@/components/CatalogoCompleto";
import type { FilaDeCatalogo } from "@/lib/catalogoCompleto";
import Boton from "@/components/ui/Boton";

export const metadata: Metadata = {
  title: "Todas las herramientas | Molnip",
  description:
    "El catálogo entero de Molnip, para mirarlo y elegir por tu cuenta: plataformas todo en uno y herramientas especializadas, con su precio y su idioma.",
};

/**
 * El catálogo entero, visible y filtrable.
 *
 * Nace de una decisión de la propietaria (2026-09-17): «hace falta que el
 * cliente pueda ver todas las herramientas […] especializadas o todo en uno y
 * que pueda verlas y elegir, aunque nosotros le informamos y acompañamos».
 *
 * Es un DERECHO DEL CLIENTE, no la respuesta de Molnip. La respuesta sigue
 * siendo el diagnóstico: tres herramientas con su explicación, cuando se ha
 * entendido la necesidad. Por eso aquí no hay «la mejor opción», ni posición
 * destacada, ni nada que se parezca a un ranking con premio — sólo el orden
 * por Puntuación Atlas, que es el mismo que ya se ve en cada ficha, y los
 * filtros necesarios para encontrar algo entre sesenta y cinco.
 *
 * Molnip no se convierte en un directorio por tener esta página. Se
 * convertiría en uno el día que ésta fuera la puerta principal.
 */
export default function TodasLasHerramientasPage() {
  const herramientas = ordenarPorPuntuacionAtlas(getHerramientas());
  const nombrePorCategoria = new Map(getTodasLasCategorias().map((c) => [c.id, c.nombre]));

  const filas: FilaDeCatalogo[] = herramientas.map((herramienta) => ({
    id: herramienta.id,
    nombre: herramienta.nombre,
    descripcion: herramienta.descripcion,
    categoriaId: herramienta.categoriaId,
    categoriaNombre: nombrePorCategoria.get(herramienta.categoriaId) ?? herramienta.categoriaId,
    esTodoEnUno: esSuite(herramienta),
    precioInicial: herramienta.precioInicial,
    tienePlanGratuito: herramienta.tienePlanGratuito,
    disponibleEnEspanol: herramienta.disponibleEnEspanol ?? false,
    puntuacionAtlas: calcularPuntuacionAtlas(herramienta)?.puntuacion ?? null,
  }));

  // Sólo las categorías que de verdad tienen algo: un filtro que siempre
  // devuelve cero no es un filtro, es una trampa.
  const categorias = [...new Set(filas.map((f) => f.categoriaId))]
    .map((id) => ({ id, nombre: nombrePorCategoria.get(id) ?? id }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Todas las herramientas
      </h1>

      <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">
        Éste es el catálogo entero, para que lo mires tú. Puedes filtrar por plataformas todo en uno o
        herramientas especializadas, por lo que hacen, por idioma y por si tienen plan gratuito.
      </p>

      <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
        No están ordenadas por lo que te conviene: eso no lo sabemos hasta que nos cuentes qué necesitas.
        Si prefieres que te acompañemos, el diagnóstico te devuelve tres, explicadas.
      </p>

      <div className="mt-6">
        <Boton href="/libre/cuestionario" variante="secundario">
          Que me acompañe Molnip
        </Boton>
      </div>

      <div className="mt-10">
        <CatalogoCompleto filas={filas} categorias={categorias} />
      </div>

      <p className="mt-10 text-sm leading-relaxed text-slate-500">
        ¿Echas en falta alguna?{" "}
        <Link href="/sobre" className="font-medium text-brand-600 underline-offset-4 hover:underline">
          Cuéntanoslo
        </Link>
        : el catálogo no está cerrado.
      </p>
    </div>
  );
}
