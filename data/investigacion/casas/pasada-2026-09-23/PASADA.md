# La pasada del 23 de septiembre de 2026

Una sola pasada, 52 llamadas, contra las páginas oficiales. Cada «sí» lleva
cita literal y la URL donde se leyó. **382 respuestas guardadas.**

## La firma electrónica: 22 candidatas, no 65

No se preguntó a las 65. Se preguntó a las que por lógica podían tenerla, y
la lógica salió de los datos, no de una corazonada. Entraba quien cumpliera
alguna de estas tres:

- su página ya declara firma o gestión documental
- F2 le había verificado presupuestos —firmar el presupuesto es el paso
  siguiente—
- su propia ficha nombra firmar

**A las otras 44 no se les preguntó, y eso no es un dato sobre ellas.** Queda
como «sin preguntar», que es distinto de «no lo tiene». De Krisp, que quita el
ruido de una llamada, no vamos a gastar una comprobación en la firma.

### Resultado: 2 de 22

| | Cita |
|---|---|
| **Agiled** | «Built-in e-signing with legally binding signatures» |
| **Nutshell** | «Create, send, track, and get signatures on quotes, invoices and contracts in your CRM» |

Las otras 20 quedan en **no consta**: Agile CRM, Bitrix24, Canva, ClickUp,
Copper, Gamma, HoneyBook, Insightly, Motion, Nifty, noCRM.io, Odoo, Pipedrive,
Productive, Salesmate, Vtiger CRM, Zoho CRM, Zoho One, Zoho Projects.

**No consta no es que no firmen.** De varias de ellas se leyó sólo la portada,
y una portada no enseña todo lo que hay dentro. Es el dato que tenemos hoy.

## Lo demás que se preguntó en la misma pasada

**Atención al cliente: de 3 a 14.** Once herramientas demostraron 21
capacidades. Agile CRM enseña tickets, centro de ayuda, respuestas guardadas y
encuestas; EngageBay, tickets, chat en la web, respuestas guardadas y
asistente automático; Salesmate, bandeja compartida, tickets y encuestas.

**Inventario y operaciones: de 0 a 1.** Sólo Bitrix24, con existencias y
almacén. La casa deja de estar vacía, y sigue siendo la más pobre.

**Las 7 que estaban sólo por su portada: quedan 3.** ClickUp Brain demostró
seis capacidades de IA; Taskade, una; Teachable y Thinkific demostraron
impartir y seguir cursos. Siguen sin comprobar Hotmart en comercio, Systeme.io
en marketing y Zoho One en CRM.

## El reparto, después

| Casa | Antes | Ahora |
|---|---:|---:|
| Atención al cliente | 3 | **14** |
| Firma electrónica y gestión documental | 7 | **9** |
| Inventario y operaciones | 0 | **1** |
| Software sectorial | 2 | 2 *(ya con capacidades demostradas)* |
| Asistentes de IA y productividad | 22 | 22 *(2 dejan de ser sólo portada)* |

Sólo por su portada: de 7 a 3.

## Lo que falta, por orden de lo que más cambia

Herramientas que **declaran** un servicio y F2 aún no lo ha comprobado:

| Casa | Declaran sin comprobar | Pares nunca preguntados |
|---|---:|---:|
| Asistentes de IA y productividad | 37 | 744 |
| Marketing y email | 17 | 497 |
| Reservas y citas | 14 | 476 |
| Firma y gestión documental | 13 | 321 |
| Atención al cliente | 10 | 344 |
| CRM y ventas | 8 | 535 |
| Gestión de proyectos | 8 | 559 |
| Facturación y contabilidad | 8 | **1.234** |
| Recursos humanos | 8 | 516 |
| Creación web y hosting | 8 | 251 |
| Comercio electrónico | 7 | 567 |
| Inventario y operaciones | 6 | **1.029** |
| Automatización e integraciones | 5 | 125 |
| Software sectorial | 1 | 378 |

Las dos columnas son dos trabajos distintos. La primera son **150
comprobaciones dirigidas**: la herramienta ya dice que lo hace y sólo falta el
recibo. La segunda son **7.576 pares que nadie ha preguntado nunca**, y ahí es
donde están las casas pobres: facturación e inventario suman 2.263.

Quién falta en cada casa está en `pendiente.json`.

## Esto no toca `registros.json`

Las 382 respuestas viven aquí, con su cita y su URL. Incorporarlas al registro
canónico de F2 pasa por su conversor y su validación, y es un cambio de datos:
lo autoriza la propietaria.

## Los archivos

- `resultados.json` — las 382 respuestas: herramienta, capacidad, estado,
  cita, URL.
- `pendiente.json` — qué falta por casa, y quién.
- `cola.json` — a quién se preguntó y por qué.
- `pasada.mjs` — cómo se hizo.
- Un archivo por llamada, tal cual respondió, con las URLs que se abrieron.
