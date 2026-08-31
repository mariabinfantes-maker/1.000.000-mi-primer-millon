import type { ClicsPorPantalla, ClicsPorRuta } from "@/agents/atlas-revenue/tipos";
import FormularioIngreso from "./FormularioIngreso";
import AvisoEsquema from "./AvisoEsquema";
import { formatearImporte, proporcionDeClicsPerdidos, type FilaRevenue, type ResumenRevenue } from "@/agents/atlas-revenue/informe";

/**
 * Atlas Revenue — la pantalla.
 *
 * Componente de servidor: solo pinta lo que ya calculó el agente. No consulta
 * nada, no decide nada y, deliberadamente, **no muestra comisiones**: mezclar
 * "cuánto paga" con "cuánto se recomienda" en la misma tabla es el primer paso
 * para empezar a recomendar por lo primero. Las comisiones viven en Affiliate
 * Manager, que es donde se gestionan.
 */

function Cifra({ etiqueta, valor, matiz }: { etiqueta: string; valor: string; matiz?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 ring-1 ring-black/[0.02]">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{etiqueta}</p>
      <p className="mt-1 font-display text-2xl font-bold text-slate-900">{valor}</p>
      {matiz && <p className="mt-1 text-sm text-slate-500">{matiz}</p>}
    </div>
  );
}

export default function PanelIngresos({
  filas,
  resumen,
  rutas,
  pantallas,
  nombres,
  sinConexion = false,
}: {
  filas: FilaRevenue[];
  resumen?: ResumenRevenue;
  rutas: ClicsPorRuta[];
  pantallas: ClicsPorPantalla[];
  nombres: Record<string, string>;
  sinConexion?: boolean;
}) {
  const perdidos = resumen ? proporcionDeClicsPerdidos(resumen) : undefined;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Ingresos y clics</h1>
        <p className="mt-1 text-sm text-slate-600">
          Medición agregada y anónima: qué herramienta se pulsó, desde qué recorrido y cuándo. Sin
          cookies, sin IP y sin nada que identifique a una persona.
        </p>
      </div>

      {sinConexion && <AvisoEsquema />}

      {resumen && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Cifra etiqueta="Clics salientes" valor={String(resumen.clicsTotales)} matiz={`${resumen.herramientasConClics} herramienta(s)`} />
          <Cifra etiqueta="Por enlace propio" valor={String(resumen.clicsPorAfiliado)} matiz="Pueden generar comisión" />
          <Cifra
            etiqueta="Sin enlace propio"
            valor={String(resumen.clicsPerdidos)}
            matiz={perdidos !== undefined ? `${Math.round(perdidos * 100)}% del tráfico, sin alta` : "Todavía sin datos"}
          />
          <Cifra etiqueta="Ingresos confirmados" valor={formatearImporte(resumen.importeCentimos)} matiz={`${resumen.conversiones} conversión(es)`} />
        </div>
      )}

      {filas.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
          Todavía no hay ningún clic registrado. Aparecerán aquí en cuanto alguien pulse
          &quot;Ir al proveedor&quot;.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 ring-1 ring-black/[0.02]">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Herramienta</th>
                <th className="px-4 py-3">Clics</th>
                <th className="px-4 py-3">Con enlace propio</th>
                <th className="px-4 py-3">Sin enlace</th>
                <th className="px-4 py-3">Conversiones</th>
                <th className="px-4 py-3">Ingresos</th>
                <th className="px-4 py-3">Conversión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filas.map((f) => (
                <tr key={f.herramientaId}>
                  <td className="px-4 py-3 font-semibold text-slate-800">{nombres[f.herramientaId] ?? f.herramientaId}</td>
                  <td className="px-4 py-3 tabular-nums">{f.clics}</td>
                  <td className="px-4 py-3 tabular-nums">{f.clicsPorAfiliado}</td>
                  <td className="px-4 py-3 tabular-nums text-amber-700">{f.clicsPerdidos}</td>
                  <td className="px-4 py-3 tabular-nums">{f.conversiones}</td>
                  <td className="px-4 py-3 tabular-nums">{formatearImporte(f.importeCentimos, f.moneda)}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-500">
                    {f.tasaConversion === undefined ? "—" : `${(f.tasaConversion * 100).toFixed(1)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormularioIngreso herramientas={Object.entries(nombres).map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre))} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-lg font-bold text-slate-900">Por recorrido de entrada</h2>
          <p className="mt-1 text-sm text-slate-600">Desde qué objetivo, categoría o subtipo llegó quien pulsó.</p>
          <ul className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white">
            {rutas.length === 0 && <li className="px-4 py-3 text-sm text-slate-500">Sin datos todavía.</li>}
            {rutas.map((r) => (
              <li key={r.rutaOrigen} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-slate-700">{r.rutaOrigen}</span>
                <span className="font-semibold tabular-nums text-slate-900">{r.total}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-slate-900">Por pantalla</h2>
          <p className="mt-1 text-sm text-slate-600">Resultado, comparación o ficha.</p>
          <ul className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white">
            {pantallas.length === 0 && <li className="px-4 py-3 text-sm text-slate-500">Sin datos todavía.</li>}
            {pantallas.map((p) => (
              <li key={p.origen} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-slate-700">{p.origen}</span>
                <span className="font-semibold tabular-nums text-slate-900">{p.total}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
