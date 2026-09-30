# Precios y plan gratuito — tanda 2 de 3 (2026-09-17)

**La investigó la propietaria** por el canal externo, con el mismo prompt de
reglas estrictas, contra las páginas oficiales de precios. 22 herramientas, de
HeyGen a Pipedrive por orden alfabético.

A diferencia de la tanda 1, **ésta sí se ha aplicado al catálogo**: 21 fichas
corregidas. La tanda 1 también se aplicó en su momento, aunque su informe
todavía diga lo contrario en «Lo que NO se ha hecho».

## El resultado

Se abrieron 21 de 22. **De las 21, 20 tenían algún dato mal.** No es una
proporción peor que la de la tanda 1: es la misma verdad vista con más
resolución, porque ahora se mira también el tipo de plan gratuito, y ahí
fallaba casi todo.

### Precios que no cuadraban

| Herramienta | Su web oficial | Lo que decía la ficha |
|---|---|---|
| **Keap** | $299/mes | **$159/mes** |
| **Kartra** | $52 anual / $59 mensual | **$119/mes** |
| **Nifty** | $10 por miembro/mes | **$39/mes** |
| **Jasper** | $59 anual / $69 mensual | $39 anual / $49 mensual |
| **HoneyBook** | $29/mes anual | $16/mes |
| **Nutshell** | $13 por usuario/mes | $16/usuario/mes |
| **HubSpot** | **$7** por plaza/mes | **15 €** por asiento/mes |
| **Otter.ai** | $8,33 anual / $16,99 mensual | $10/usuario/mes anual |
| **Paymo** | $5,90 tres meses, luego $9,90 | $4,95/usuario/mes |
| **monday.com** | **$9** por plaza/mes | **9 €**, «mínimo 3 usuarios» |
| **Pipedrive** | **US$14** por puesto/mes | **14 €**/usuario/mes |
| **HeyGen** | $29/mes, $24 anual | $29/mes, sin la opción anual |
| **Hotmart** | **9,9 % + 1,00 € por venta aprobada** | «el importe exacto no está confirmado» |

Tres cosas que se repiten y conviene nombrar:

1. **Euros escritos donde el fabricante cobra dólares** — HubSpot, monday.com,
   Pipedrive. Es el mismo defecto que ya salió con Asana en la tanda 1. Ninguna
   ficha guarda la moneda como dato: va dentro del texto del precio, y por eso
   nadie la vigila.
2. **Keap y Kartra al revés de lo esperado.** Keap costaba casi el doble de lo
   que decíamos y Kartra menos de la mitad. Un precio mal no equivoca sólo
   hacia arriba: a Kartra la estábamos apartando de quien sí podía pagarla.
3. **Hotmart quedó resuelta.** La ficha llevaba un párrafo entero explicando
   que las dos fuentes no se habían podido contrastar. Su página de precios lo
   dice en una línea: 9,9 % más 1,00 € por venta aprobada.

### Plan gratuito: el hallazgo de fondo

**Doce fichas decían `tienePlanGratuito: false` y tenían una forma de empezar
gratis**: HoneyBook, Insightly, Jasper, Kartra, Keap, Less Annoying CRM,
Motion, Nimble, noCRM.io, Notion AI, Nutshell y Pipedrive. Todas son pruebas
gratuitas, no planes indefinidos.

Esto es la otra cara del caso Freshsales de la tanda 1, y por eso se resolvió
como se resolvió. Allí la ficha decía que había plan gratuito y era una prueba
de 21 días; la corrección fue quitar la bandera, y la propietaria la revocó:

> **«Es una cuestión de criterio; nadie dijo que el plan tiene que tener toda
> una vida gratis.»**

Con ese criterio, las doce estaban mal por el otro lado: decían «no hay nada
gratis» cuando sí lo hay. Ahora las 21 llevan **de qué clase es** y **cuánto
dura**, que es lo que de verdad le sirve a quien pregunta.

| Clase | Herramientas |
|---|---|
| **Indefinido** | HeyGen, Hive, HubSpot, monday.com, Nifty, Otter.ai, Paymo |
| **Prueba, con días** | HoneyBook y Less Annoying CRM (30), noCRM.io (15), Insightly, Nimble, Nutshell y Pipedrive (14), Jasper y Krisp (7) |
| **Prueba, sin duración publicada** | Keap, Motion, Notion AI |

**Krisp cambió de clase, no de bandera.** Su ficha decía plan gratuito y su web
dice «Free for 7 days»: sigue habiendo una forma de empezar gratis, pero es
una prueba de una semana, no lo que la tarjeta daba a entender.

## Lo que esto movió sin que se viera

`tienePlanGratuito` alimenta dos cosas a la vez, y esto vuelve a demostrarlo:
la recomendación (`criteriosRuta.ts`) y el orden del catálogo
(`calcularPuntuacionAtlas`). Doce banderas nuevas movieron doce puntuaciones:

HoneyBook 90→93 · Insightly 84→87 · Jasper 92→95 · Kartra 80→83 · Keap 81→84 ·
Less Annoying CRM 95→98 · Motion 86→89 · Nimble 89→92 · noCRM.io 92→95 ·
Notion AI 92→95 · Nutshell 90→93 · Pipedrive 90→93

### Y una pregunta que decide la propietaria, no yo

El criterio `precioFrenteAlValor` da **8 puntos planos** a cualquier ficha con
`tienePlanGratuito`, y escribe siempre la misma frase: «Puedes probarla a fondo
con su plan gratuito antes de pagar nada».

Eso se escribió cuando «plan gratuito» significaba *indefinido*. Ahora una
prueba de 7 días puntúa exactamente igual que un plan gratis para siempre.
**No lo he cambiado**, porque tocar cómo se puntúa mueve recomendaciones en
todo el catálogo y es una decisión de producto. Pero está ahí, y ya ha tenido
un efecto visible: Nimble adelantó a Salesflare en `captura-sola` por esos 8
puntos.

## Lo que la página calla (NO CONSTA — es información, y se guarda)

- **noCRM.io**: la página mostró **«X€»** en vez de una cifra. El precio de la
  ficha (12 €/usuario/mes) **se ha dejado como estaba y no se ha sellado como
  comprobado**: su plan gratuito sí, su precio no.
- **Hotmart**: no dice nada de plan gratuito. Su bandera se ha dejado como
  estaba: que la página no lo mencione no es que no exista.
- **Hive**, **Motion**, **Nifty**: dan la cifra sin decir si es mensual o anual.
- **HubSpot** ($7 y $20) y **Krisp** ($8 y $16): enseñan dos cifras sin decir
  cuál corresponde a cada modalidad. En los dos casos la ficha lo dice así,
  con las dos cifras y la duda incluida.
- **Keap**, **Motion**, **Notion AI**: no publican cuánto dura la prueba.

## El problema de método que hay que resolver antes de la tanda 3

**Notion AI devolvió los precios en LIBRAS** (£8,50 y £16,50). La página se
localiza por el país de quien la mira, y el canal miró desde otro sitio.

No se ha escrito ese precio en la ficha. Un cliente español no va a ver £8,50,
así que copiarlo sería cambiar un dato sin comprobar por otro dato sin
comprobar. La ficha conserva sus 8 € y **queda sin sellar**.

Esto no es un fallo de la entrega: es un límite del método. Cualquier
fabricante que localice precios nos va a dar la cifra del país desde el que se
mire, y hasta ahora no había forma de notarlo salvo por la moneda. **Para la
tanda 3, el prompt tiene que pedir también la moneda y el país que muestra la
página.**

## Direcciones mal guardadas (otras tres)

Como en la tanda 1, la `urlPrecios` de la ficha no era la real:

- **Kartra**: `kartra.com/plans-and-pricing/`, no `www.kartra.com/pricing/`.
- **Less Annoying CRM**: `lessannoyingcrm.com/pricing`, sin `www`.
- **Insightly**: `insightly.com/pricing-plans/?plan=crm`, no `/pricing/`.
- **Notion AI**: `notion.com/pricing`, no `notion.so/pricing`.

Van ya **siete** direcciones de precios mal escritas entre las dos tandas. Las
escribió el mismo modelo sin navegación que escribió las fichas.

## Lo que vuelve a la cola

**Odoo — NO HE PODIDO ABRIRLA.** No se ha tocado su ficha y no aparece como
hallazgo en ninguna tabla de arriba. Vuelve a pedirse empezando por la página
principal del fabricante, como se hizo con Capsule CRM y Freshsales en la
tanda 1, que salieron las dos a la primera.

## Estado

- 21 fichas corregidas; **19 selladas** con `preciosComprobados` del 17-09-2026
  y la dirección que se abrió de verdad.
- **noCRM.io** y **Notion AI** corregidas en el plan gratuito pero **sin
  sellar**: de esas dos no tenemos un precio comprobado.
- **Odoo**: sin tocar, en la cola.
- Quedan **21 herramientas** para la tanda 3: de Productive a Zoho Projects.

En el catálogo entero: **41 de 65 fichas con el precio comprobado en la web del
fabricante**, y 24 sin comprobar todavía. De las 57 que declaran plan gratuito,
**40 dicen ya de qué clase es** — 19 indefinido y 21 prueba.
