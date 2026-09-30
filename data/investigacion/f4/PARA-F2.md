# Cómo entra esto en F2: incorporando, no repitiendo

**Condición de la propietaria, 2026-09-22:** *«pasar por F2 debería significar
incorporar y validar las pruebas guardadas, consultando únicamente lo que
falte. No repetir toda la búsqueda.»*

Nace de un coste real: el 22 de septiembre se gastaron **unas quince llamadas
repitiendo trabajo que ya estaba hecho y guardado** en este mismo lote. Fresha,
Booksy y SimplyBook.me se volvieron a investigar desde cero sin mirar antes
`respuestas/`.

## El orden, y no es negociable

1. **Leer `correcciones.json` primero.** Catorce campos de este lote dicen `si`
   y no lo sostienen. Leer `respuestas/` sin aplicar las correcciones es leer
   datos falsos. La puerta buena es `lectura.ts`.
2. **Incorporar lo que ya tiene cita, URL y fecha.** Está en
   `expedientes/citas-2026-09-22.json`, una entrada por afirmación. Eso no se
   vuelve a preguntar: se valida contra las reglas de `data/verificacion` y se
   convierte en registro.
3. **Consultar SÓLO lo que la lista `noConsta` de cada expediente declara.** Si
   algo no está en esa lista, ya está contestado.
4. **Lo que no se reconfirme hoy NO se borra.** Una cita de septiembre sigue
   valiendo mientras no haya un motivo escrito para retirarla, y ese motivo va
   a `correcciones.json` con su fecha. No reconfirmar no es desmentir.

## Lo que hay que comprobar al incorporar, y no se puede saltar

- **La frescura.** Las citas del 11 de septiembre tienen once días. Las páginas
  de precios cambian; las de funciones, menos. `proximaRevision` se calcula
  como en el resto de F2: seis meses si la cita nombra plan, doce si no.
- **El dominio.** Cada cita tiene que venir del dominio oficial de su
  herramienta. Hay una prueba que lo exige en los expedientes, y `repositorio.ts`
  lo vuelve a exigir al validar.
- **La certeza del plan aparte de la certeza de la capacidad.** Es la regla de
  F2 desde el 2026-09-09: que una capacidad esté demostrada no demuestra en qué
  plan está.

## Lo que NO hace este directorio

No crea fichas, no toca el catálogo, no entra en `data/verificacion` y el motor
no lo lee. Son pruebas guardadas y ordenadas para que una persona decida.
