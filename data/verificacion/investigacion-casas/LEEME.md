# Los scripts del reparto por casas

Viven aquí y no en `data/investigacion/casas/`, donde están sus resultados,
por una razón concreta: **leen el vocabulario**, y sólo `data/vocabulario` y
`data/verificacion` pueden hacerlo. La lista de autorizados está congelada a
propósito —ampliarla «tiene que ser una decisión, no un descuido»— así que
se movió el código en lugar de tocar la guarda.

Y encajan aquí de verdad: `pasada.mjs`, `dirigidas.mjs` y `prof.mjs` son
trabajo de verificación —produjeron los 1.688 registros del 23-09-2026—, y
`construir.mjs` es el que los convirtió al esquema de F2.

| | qué hace |
|---|---|
| `pasada.mjs` | la primera pasada: firma electrónica y casas pobres |
| `dirigidas.mjs` | las 150 comprobaciones dirigidas |
| `prof.mjs` | la profundidad de cada capacidad demostrada |
| `construir.mjs` | convierte las respuestas en registros de F2 |
| `leer.mjs` | lee y resume las respuestas |
| `reparto2.mjs` | el reparto: qué cubre cada herramienta en cada casa |
| `cruce.mjs`, `criterios.mjs` | los dos repartos anteriores, conservados |

Los resultados, los recibos y los informes siguen en
`data/investigacion/casas/`.
