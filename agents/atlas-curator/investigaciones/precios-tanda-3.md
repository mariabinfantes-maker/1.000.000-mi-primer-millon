# Precios y plan gratuito — tanda 3 (2026-09-17). **Falló.**

25 herramientas pedidas: las 21 que faltaban, más Odoo, noCRM.io, Notion AI y
Copy.ai que volvían de tandas anteriores.

**Sirvieron 2.** No es una tanda con muchos «no consta»: es una tanda que no
leyó las páginas.

## Cómo se sabe que no las leyó

Veinte fichas volvieron con **el precio en NO CONSTA y la moneda en USD a la
vez**. No se puede saber en qué moneda está un precio que no se ha visto.

Y hay una pista mejor todavía, que ya estaba delante en la tanda 2: **noCRM.io
devolvió «X€»**. Eso no es un precio raro ni una página rota: es la
**plantilla sin rellenar**. El precio de esa página lo escribe JavaScript
cuando se abre en un navegador de verdad, y el canal se quedó con el hueco.

Lo mismo explica las otras diecinueve, sólo que ahí el hueco venía vacío en
vez de con una «X». La moneda sí estaba en el HTML —por eso salió USD, y EUR
en Zenkit, que es europea— pero las cifras no.

**Conclusión: el canal no puede leer tablas de precios que se pintan con
JavaScript.** Y ésas son casi todas las de este grupo.

## Por qué estos veinte NO CONSTA no se escriben

La regla de la propietaria sigue en pie: **«no consta» es información**. Pero
esa regla da por supuesto que la página se ha leído. Aquí no se ha leído.

Escribir veinte «su web no publica el precio» sería peor que no tener el dato:
sería falso sobre veinte fabricantes. Zoho, Wrike, Todoist o Teamwork publican
sus precios con toda claridad. **Un fallo del canal disfrazado de hallazgo es
exactamente lo que la tanda 1 prohibió**, sólo que allí venía etiquetado como
«no he podido abrirla» y aquí viene etiquetado como «no consta».

## Lo que sí se ha aplicado

- **Smartsheet** — completa y sellada. Prueba de **30 días** («30 days free, no
  credit card required») y precio **$9/miembro/mes anual, $12 mensual**, que
  confirma lo que ya decía la ficha. Su página ofrece trece monedas; se leyó
  en USD.
- **Productive** — sólo el plan gratuito: **prueba de 14 días**, citada y sin
  ambigüedad. Pasa de «no tiene nada gratis» a tenerlo, y su puntuación sube
  de 92 a 95. **Su precio NO se ha tocado ni sellado**: «$10/mes; 10 usuarios»
  no dice si son $10 por usuario o $10 por diez, y esa diferencia es de diez
  veces.

## Lo que se confirma sin cambiar nada

- **noCRM.io**: la prueba de 15 días vuelve a salir igual, y añade que son 30
  si das los datos de pago. Su precio sigue sin leerse. Sigue sin sellar.
- **Notion AI**: sigue en libras, y ahora se sabe **por qué**: la página tiene
  selector de país y el canal la abre desde Reino Unido. Sigue sin sellar.
  Esta entrega dice «plan gratuito indefinido» donde la tanda 2 dijo «la IA
  está limitada a una prueba». La ficha es de **Notion AI**, no de Notion, así
  que se mantiene la lectura de la tanda 2, que es la que mira al producto que
  vendemos.

## Lo que vuelve a la cola: 24

Las 19 que se quedaron en blanco, más Copy.ai (que además se abrió en
`/pricing` y no en `/prices`), más noCRM.io y Notion AI por su precio, más el
precio de Productive. **Y Odoo, que falla por segunda vez** — ésa ya no es la
dirección: es que el canal no puede con ese sitio.

## Lo que hay que cambiar en el método, no en el prompt

Pedir «lee mejor» no va a funcionar: el canal no ve lo que no se ha pintado.
Las salidas que quedan son distintas de las de antes:

1. **Que mire la página de ayuda del fabricante**, no la de precios. Los
   precios en los centros de ayuda suelen estar escritos en texto plano.
2. **Que mire la página de registro o de compra**, donde el precio va en el
   formulario.
3. **Que diga «PLANTILLA SIN RELLENAR»** cuando vea un hueco o una «X», en vez
   de llamarlo «no consta». Es un tercer estado, y hasta hoy no existía.
4. **Selector de país en euros** para las que localizan, como Notion.

## Estado del catálogo

42 de 65 fichas con el precio comprobado en la web del fabricante. La tanda 3
sumó **una**.
