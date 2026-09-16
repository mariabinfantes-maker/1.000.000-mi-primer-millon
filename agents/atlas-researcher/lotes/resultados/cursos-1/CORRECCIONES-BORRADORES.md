# Correcciones propuestas para los tres borradores

**Preparadas, no aplicadas.** Los borradores de `borradores/` se conservan
tal cual los escribió el modelo, como evidencia de lo que devolvió. Esto es
lo que habría que cambiarles antes de aprobarlos, y por qué.

Tres categorías, y conviene no mezclarlas:

- **CORREGIR** — hay una cita que demuestra que el borrador está mal.
- **PENDIENTE** — el borrador afirma algo que nadie ha demostrado. No se
  sustituye por otra afirmación: se marca como no sabido.
- **DECIDE LA PROPIETARIA** — el dato cambia lo que Molnip recomienda y la
  elección no es técnica.

## Thinkific

| Campo | Borrador | Propuesta | Por qué |
|---|---|---|---|
| `tienePlanGratuito` | `true` | **CORREGIR a `false`** | «No, instead, you can explore the whole platform with a 30-day free trial.» Es la propia página respondiendo a la pregunta. |
| `precioInicial` | «Plan gratuito limitado disponible. Planes de pago desde 36$/mes (facturación anual).» | **CORREGIR a** «Desde 40 $/mes con facturación anual; 54 $/mes con facturación mensual (plan Basic). Sin plan gratuito: prueba de 30 días.» | El «36 $» no aparece en ninguna fuente. Los importes vienen de la tarjeta del plan Basic, volcada de la tabla: **pendiente de comprobar en la página**. |
| `precioRecomendadoPymes` | «Plan Start a 74$/mes (facturación anual)…» | **CORREGIR a** «Plan Start: 82 $/mes con facturación anual, 109 $/mes mensual.» | El «74 $» tampoco aparece. Mismo volcado de tabla, misma cautela. |
| `idiomasDisponibles` | seis idiomas | **PENDIENTE** | Lo verificado —45 idiomas, con español— es la interfaz **que ve el alumno**. En qué idioma trabaja quien administra no consta. Son dos cosas distintas y este campo lo usa el motor para puntuar el encaje con **el negocio**. |
| `disponibleEnEspanol` | `true` | **DECIDE LA PROPIETARIA** | Mismo motivo. Ponerlo a `false` sería tan poco demostrado como dejarlo a `true`. |
| afiliación: comisión | «30% recurrente de por vida por cada usuario referido» | **AMPLIAR:** añadir «los planes Plus pagan 150 USD al mes en lugar del 30 %» | «Plus plans will receive a recurring commission of $150 per month instead of the 30%.» |
| afiliación: pago | «Mensual» | **CORREGIR a** «El día 13 de cada mes, tras una retención de 30 días» | «Following the 30-day hold, payments are verified at the end of the month and paid out on the 13th of the month». |
| afiliación: aprobación | `true` | **PENDIENTE** | Ninguna frase dice que haya aprobación previa obligatoria. |
| afiliación: cookie y plataforma | 90 días, PartnerStack | **Se confirman** | Citas literales en su página de afiliados. |

## Teachable

| Campo | Borrador | Propuesta | Por qué |
|---|---|---|---|
| `tienePlanGratuito` | `true` | **CORREGIR a `false`** | «Teachable is a paid service that includes a 7-day free trial». |
| `precioInicial` | «Desde 0$/mes (Plan Gratuito con comisión por venta)» | **CORREGIR a** «Desde 29 $/mes con facturación anual, 39 $/mes mensual (plan Starter), con un 7,5 % de comisión por venta en ese plan.» | La tabla de planes de junio de 2025, volcada: pendiente de comprobar. El 7,5 % sí tiene su propia cita. |
| `precioRecomendadoPymes` | «Plan Pro a $119/mes…» | **CORREGIR a** «Plan Builder: 69 $/mes con facturación anual, 89 $/mes mensual, sin comisión por venta.» | **El plan Pro ya no existe**: «Starting on June 15, 2025, Teachable retired their Basic, Pro, and Pro+ plans». El borrador recomendaba un plan retirado. |
| `idiomasDisponibles` | `["Inglés"]` | **Se mantiene, con nota** | Para quien administra es correcto: «the admin experience is not translated». Lo que el borrador no decía es que el alumno sí puede ver la tienda en once idiomas, español incluido. Es un dato distinto y no va en este campo. |
| `disponibleEnEspanol` | `false` | **Se mantiene** | Por lo mismo. |
| afiliación: plataforma | Impact | **CORREGIR a** PartnerStack | «PartnerStack is the trusted platform we use to manage our affiliate program.» |
| afiliación: comisión | «Hasta 30% de comisión recurrente» | **CORREGIR a** «30 % recurrente durante el primer año por cada venta referida» | «You'll earn 30% recurring commission for a full year on every sale you refer.» No es de por vida, y el borrador omitía el plazo. |
| afiliación: pago | «Mensual» | **PENDIENTE** | Su página no publica método ni frecuencia. |
| afiliación: cookie y aprobación | 30 días, sí | **Se confirman** | Citas literales. |

## Hotmart

| Campo | Borrador | Propuesta | Por qué |
|---|---|---|---|
| `precioInicial` | «Sin cuota mensual (9,90% + comisión por transacción realizada)» | **PENDIENTE** | La comisión está en conflicto sin resolver: una fuente dice porcentaje por tramo de volumen, otra dice 9,90 % fijo más una cuota por venta. No se elige la que mejor esté citada. |
| `precioRecomendadoPymes` | «cobro de un 9,9% + 0,50 € aprox. por cada venta» | **PENDIENTE** | Lo mismo, y además «aprox.» es una estimación, no un dato. |
| `tienePlanGratuito` | `true` | **DECIDE LA PROPIETARIA** | Es cierto que no hay cuota mensual, pero la única cita viene de la portada, que no sostiene una condición concreta. Y hay un problema de fondo: llamar «plan gratuito» a algo que se lleva cerca del 10 % de cada venta pone a Hotmart al lado de las gratuitas de verdad cuando alguien filtra por presupuesto. **Mi recomendación: mantenerlo en `true` sólo si `precioInicial` empieza por la comisión, no por el «sin cuota mensual».** |
| `idiomasDisponibles` | `["es","pt","en","fr","de","it"]` | **CORREGIR a** `["es","pt","en"]` | La fuente oficial lista inglés, portugués de Brasil y español. Francés, alemán e italiano no aparecen en ninguna. |
| `disponibleEnEspanol` | `true` | **Se mantiene** | El soporte en español tiene cita propia y el centro de ayuda está en español. |
| afiliación: todo el registro | programa activo, hasta 80 %, cookie configurable, pago a petición | **CORREGIR a: no consta** | Ese registro describe **otra cosa**: el mercado donde se promocionan los productos de los creadores, con la comisión que fija cada creador. No es cobrar por recomendar Hotmart. Dos consultas a su dominio oficial no encontraron ningún programa que pague por eso. |
| afiliación: `confidenceLevel` | `high` | **CORREGIR a bajo** | Estaba en «alto» describiendo el programa equivocado. |

## La consecuencia de la última fila

Con la reforma del Researcher, una afiliación que **no consta** no descarta
la herramienta: la deja esperando la decisión de la propietaria
(`npm run autorizar-afiliacion`). Hotmart entra por ahí. Las otras dos
tienen programa confirmado con cita.

Dicho sin rodeos: **Hotmart es la que mejor encaja con el caso de la
formadora** —sin cuota mensual, en español, cobra y entrega— y es la única
de las tres por la que Molnip no cobraría nada. La política dice que eso no
cambia el resultado. Lo apunto para que la decisión se tome viéndolo.
