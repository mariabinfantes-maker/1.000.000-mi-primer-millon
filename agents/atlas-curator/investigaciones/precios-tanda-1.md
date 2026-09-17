# Precios y plan gratuito — tanda 1 de 3 (2026-09-17)

**La investigó la propietaria** por el canal externo, con el prompt de reglas
estrictas, contra las páginas oficiales de precios. 22 herramientas.

Se guarda literal el resultado que importa: **dónde la ficha del catálogo no
cuadra con lo que dice el fabricante en su propia web.**

## El resultado, y no es cómodo

Las 22 se pudieron abrir, contando el reintento de las dos que fallaron. **De
las 20 contrastables, 11 tienen algún dato mal** — la mitad justa de la tanda.

| Herramienta | Lo que dice su web oficial | Lo que dice nuestra ficha |
|---|---|---|
| **Close** | $9 usuario/mes anual ($19 mensual) | **$49/usuario/mes** |
| **Descript** | $16 / $24 por persona/mes | $12/usuario/mes |
| **Copy.ai** | $24/mes anual ($29 mensual) | $36/mes anual |
| **GanttPRO** | $7 usuario/mes anual | $9.99/usuario/mes |
| **Agiled** | $24/mes facturado anualmente | $15/mes |
| **Beautiful.ai** | $14.50/mes anual | 12$/mes anual |
| **EngageBay** | desde $12.74 | 11,95$ |
| **Bitrix24** | gratis **1-2 usuarios**; US$49 por **organización** | gratis **usuarios ilimitados**; **49€** |
| **Asana** | $10.99 por usuario/mes | **10,99 €** |
| **ClickUp Brain** | tiene plan gratuito | `tienePlanGratuito: false` |
| **Freshsales** | $9 usuario/mes; **sin plan gratuito** | $15/usuario/mes; `tienePlanGratuito: true` |

### Los tres que más daño hacen

1. **Close: $49 frente a $9.** Cinco veces más caro en la ficha. A alguien con
   presupuesto ajustado le apartamos una herramienta que sí podía pagar.
2. **Bitrix24: «usuarios ilimitados» en el plan gratuito.** Son **1 o 2**. Y el
   precio de pago es **por organización**, no por usuario, que es una
   diferencia enorme para un equipo de cinco.
3. **Asana en euros cuando cobra en dólares.** El número coincide por
   casualidad; la moneda no. Y ninguna ficha guarda moneda como dato: va
   dentro del texto del precio.

## Lo que esto dice del catálogo

Es una muestra del 34 % del catálogo, elegida por orden alfabético y no por
sospecha. **Si esta proporción se mantiene, unas treinta y cinco de las 65
fichas tienen algún dato de precio o de plan mal.**

No invalida lo verificado en F2: las capacidades siguen comprobadas con su
cita. Lo que falla es exactamente lo que no se volvió a mirar — los campos
descriptivos de la ficha. La línea está donde se dijo: **lo que hacen está
comprobado; el precio que se lee en la tarjeta, no.**

## Lo que NO se ha hecho

*(Esto era cierto al escribir el informe. La propietaria autorizó después
aplicar la tanda, y las 22 fichas están corregidas y selladas. Se deja escrito
en vez de borrarlo, porque el orden importa: primero se enseñó, después se
autorizó, y sólo entonces se tocó el catálogo.)*

No se ha corregido ninguna ficha. Faltan las tandas 2 y 3, y corregir es un
cambio de datos del catálogo que decide la propietaria.

## Calidad de la entrega, para saber cuánto fiarse

Buena. Declaró qué URL abrió de verdad en cada caso —y en tres no era la que
se le dio—, distinguió prueba gratuita de plan gratuito sin que se le
escapara ninguna, y dijo «no consta» catorce veces en vez de rellenar.

Mención aparte: en **Copper** leyó «Start free, no credit card required» y aun
así marcó el plan gratuito como **no consta**, porque esa frase es un botón de
prueba y no un plan. Esa es exactamente la disciplina que faltaba en la
entrega de septiembre.

## Dos cosas distintas que no hay que mezclar

Lo señaló la propietaria al leer este informe, y tenía razón:

> **«No consta» es información. «No he podido abrirla» no lo es.**

- **NO CONSTA** significa que la página se abrió, se leyó entera y no lo dice.
  Eso es un hecho sobre el fabricante, y se escribe.
- **NO HE PODIDO ABRIRLA** no dice nada de la herramienta: dice que el canal
  falló. Archivarlo junto a lo anterior lo disfraza de resultado.

**Regla, desde ahora:** lo que no se pudo abrir vuelve a la cola con otra
ruta. No se queda en un informe como si fuera un hallazgo.

### Información de verdad que falta (la página lo calla)

- **ActiveCampaign** y **Gamma**: precio de entrada no consta en su página.
- **Agile CRM, EngageBay, Grammarly, ClickUp Brain**: el precio aparece sin
  decir si es mensual o anual.
- **Descript**: enseña dos cifras y no dice cuál es cuál.

### Las dos que no abrieron: reintentadas y resueltas

Se reintentaron empezando por la página principal del fabricante, y las dos
salieron a la primera. **El problema eran las direcciones, no los sitios** —
las dos las había escrito el mismo modelo que escribió las fichas, igual que
pasó con las de afiliación.

- **Capsule CRM**: el enlace «Pricing» de su propia web lleva a
  `capsulecrm.com/signup/`, no a `/pricing/`, que es lo que guarda la ficha en
  `urlPrecios`. Plan gratuito **confirmado**, y ahora con sus límites: 250
  contactos, 2 usuarios, 1 tablero y 1 embudo. Su precio de pago no consta en
  esa página.
- **Freshsales**: está en `freshworks.com/crm/pricing/`, no en
  `/crm/sales/pricing/`. Y trae dos datos que no cuadran.

## El hallazgo más grave de la tanda: Freshsales no tiene plan gratuito

| | Su web oficial | Nuestra ficha |
|---|---|---|
| Plan gratuito | **NO** — prueba de 21 días | `tienePlanGratuito: true` |
| Precio de entrada | $9 por usuario/mes anual | $15/usuario/mes |

**Esto es peor que un precio mal, y conviene entender por qué.**

`tienePlanGratuito` **no es un texto que se enseñe: es un dato que el motor
usa**. Está en `criterios.ts`, y cuando alguien dice que necesita empezar
gratis, decide quién sube y quién baja. Un precio equivocado se lee y se
sufre; una bandera equivocada **cambia la recomendación sin que nadie lo vea**.

Con Freshsales, a quien pide algo gratuito le estamos ofreciendo una prueba de
21 días como si fuera un plan. Es exactamente la confusión que el prompt
obligaba a distinguir, y que el catálogo original no distinguió.

**38 de las 65 fichas declaran plan gratuito.** De las 20 que se han podido
comprobar en esta tanda, **2 estaban mal**. Si esa proporción se mantiene, hay
unas cuatro banderas falsas repartidas por el catálogo, moviendo
recomendaciones en silencio.

### Información de verdad que falta (la página lo calla)

- **ActiveCampaign**, **Gamma** y **Capsule CRM**: el precio de entrada no
  consta en su página.
