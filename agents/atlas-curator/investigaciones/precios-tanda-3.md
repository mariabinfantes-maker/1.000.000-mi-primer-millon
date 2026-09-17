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

---

# La repesca (2026-09-17). **Funcionó.**

Se pidieron las 24 con la escalera de cuatro caminos y el tercer estado
—**PLANTILLA SIN RELLENAR**— que no existía antes. **Salieron 15.**

El tercer estado es lo que arregló la tanda. Ya no hubo veinte «no consta»
falsos: hubo cinco plantillas declaradas como lo que eran, cuatro páginas que
no abrieron, y quince datos con cita.

## Selladas: 12

| Herramienta | Lo que dice su web | Lo que decía la ficha |
|---|---|---|
| **Scoro** | **15 €**/usuario/mes, mínimo 5 | **$37**/usuario/mes |
| **Salesflare** | **$39**/usuario/mes | **$49**/usuario/mes |
| **TeamGantt** | $24/mes o $240/año | $19/usuario/mes |
| **Synthesia** | $29/mes | $18 anual / $22 mensual |
| **Reclaim.ai** | $10/plaza/mes | $8/usuario/mes anual |
| **Taskade** | gratis **2 usuarios**, 3 apps | gratis **5 miembros** |
| **Zenkit** | 8 €/plaza/mes | 9 €/usuario/mes |
| Salesmate | $23/usuario/mes | igual |
| Teachable | $29 anual / $39 mensual | igual |
| Thinkific | $40 anual / $54 mensual | igual |
| Vtiger CRM | gratis 10 usuarios, $12 anual | igual |
| Systeme.io | gratis sin caducidad, $17/mes | sólo tenía el gratis |

**Scoro es el peor error de las tres tandas después de Close:** 37 dólares
frente a 15 euros. Más del doble, y en la moneda equivocada.

**Cuatro fichas decían que no había nada gratis** y son pruebas: Salesflare
(30 días), Salesmate (15), Scoro (14), Teachable (7), Thinkific (30). Cinco
puntuaciones se movieron: Salesflare 95→98, Salesmate 94→97, Scoro 90→93,
Teachable 86→89, Thinkific 93→96.

**Zenkit se sella a medias, y a propósito.** Su precio se leyó en euros y con
región Unión Europea, así que va. Su clase de plan NO: la cita era «Zenkit
**typically** offers a free trial period of 14 days», y eso no es el
fabricante hablando de su producto, es alguien resumiéndolo. Se queda sin
clase.

## Clase sin precio: 3

**Todoist**, **Zoho Projects** y **Odoo** dieron su plan gratuito con cita y
límites, pero el precio no. Se les pone la clase —los tres indefinidos— y el
precio se queda **intacto y sin sellar**.

**Odoo abrió por fin**, a la tercera, por el camino del registro y desde
España en euros. Pero el precio que trajo (11,90 €/mes «por TODAS las apps»)
venía de la página principal, no de la dirección que declaró. Un precio leído
en un sitio distinto del que se apunta no se puede sellar: sellar es poder
volver a mirarlo.

## Lo que se salvó por mirarlo dos veces: Notion AI

La repesca consiguió por fin los euros: **9,50 € por miembro/mes**, con el
selector puesto en la Unión Europea. **Y no se ha escrito.**

Porque ese precio es el del plan **Plus de Notion**, no el de **Notion AI**.
Se sabe porque la tanda 2 leyó la misma página en libras y ahí estaba
desglosado: «Plus £8.50», «Business £16.50», y Notion AI completo en Business.
9,50 € es la conversión de £8,50 — el plan, no el complemento.

Nuestra ficha es de Notion AI. Escribir 9,50 € habría sido cambiar un dato sin
comprobar por otro dato equivocado, y habría parecido un acierto.

Lo que sí queda confirmado por segunda vez, con cita: en el plan gratuito de
Notion, **la IA es una prueba limitada**, no viene incluida.

## Lo que sigue sin salir: 9

| | Qué pasó |
|---|---|
| **Wrike**, **Zoho CRM**, **Zoho One**, **Teamwork.com** | No abrieron. Teamwork devolvió **503** |
| **Streak**, **Todoist**, **Zoho Projects** | Plantilla sin rellenar en el precio |
| **noCRM.io** | Sigue devolviendo «X€». Tercera vez |
| **Productive** | «$10/mes» sin decir si es por usuario o por cuenta |
| **Copy.ai** | Su página de precios no dice si el gratis es indefinido o prueba |
| **Notion AI** | Falta el precio del complemento, no el del plan |

Cuatro de ellas —Wrike, los dos Zoho y Teamwork— son **fallos de apertura, no
de lectura**. Eso ya no lo arregla ningún prompt.

## Estado del catálogo

- **54 de 65 fichas con el precio comprobado** en la web del fabricante.
  Empezamos la jornada en 22.
- **63 declaran plan gratuito**, y **56 dicen ya de qué clase es**: 28
  indefinido, 28 prueba.
- Quedan **7 fichas sin clase**, que es lo único que bloquea repesar el plan
  gratuito con decimales: Copy.ai, Hotmart, Zenkit, Streak, Teamwork.com,
  Wrike y los Zoho que no abrieron.
