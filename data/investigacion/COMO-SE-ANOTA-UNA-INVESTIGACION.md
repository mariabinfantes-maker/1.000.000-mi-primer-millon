# Cómo se anota una investigación

**Regla de la propietaria, 29 de septiembre de 2026.**

> «Vamos a poner exactamente cómo se han investigado, claramente y con el
> contexto, que luego dejas notas que nadie entiende.»

Nace de dos días perdidos en lo mismo: una y otra vez se dijo «esto no está
investigado» o «no tiene fuente» sobre trabajo que **sí se hizo**, sólo porque
no estaba escrito cómo. Y el coste no es simétrico: al que llega sin memoria no
le cuesta nada decir que algo está sin investigar. A quien lo investigó le
cuesta meses.

Todo lo que se guarde en `data/investigacion/` lleva estas siete cosas. No son
burocracia: cada una nació de un fallo concreto de estos dos días.

---

## 1. Quién miró

El nombre del modelo o de la persona, y con qué herramienta. No «se
investigó»: **quién**.

> *Nació de*: las 62 fichas que dicen «agregación de miles de opiniones
> verificadas en G2 y Capterra». Alguien fue a G2 y apuntó las cifras —están
> en las fichas—, pero como no se escribió quién ni cómo, durante meses se dio
> por inventado.

## 2. Cuándo

La fecha. Un precio de hace un año no es falso: es viejo, y hay que poder
distinguirlo.

## 3. Qué se preguntó, con las palabras exactas

El encargo entero, copiado. No un resumen.

> *Nació de*: `cap.per_resource_booking_calendar` salió «desconocido» en 64 de
> 65 fichas. Parecía un dato sobre el mercado. Al leer el encargo se vio que
> sólo se habían mirado la portada y la página de precios — el sitio
> equivocado para una agenda. **El cero medía dónde miramos.**

## 4. Qué páginas se intentaron y cuáles se abrieron DE VERDAD

Las dos listas, separadas. Una dirección intentada no es una dirección leída.

> *Nació de*: de 132 páginas que se intentaron abrir en la búsqueda de agendas,
> sólo se abrieron 35. De Acuity no se abrió ni una de nueve, y se contó como
> «no lo hemos encontrado».

## 5. La cita literal, y de qué página sale

Copiada tal cual. Sin cita no se escribe el dato.

## 6. Qué NO se pudo comprobar, y por qué

Con el motivo concreto: la página no cargó, los importes se dibujan con
JavaScript, el dominio nos bloquea.

> *Nació de*: Zoho publica sus tarifas con JavaScript y un lector automático ve
> «Standard/user/month» sin la cifra. Y `pro.doctoralia.es` nos bloquea entero.
> En los dos casos, «no pudimos leerlo» se estaba convirtiendo en «no lo
> tiene».

## 7. Si lo abrimos nosotros, o nos lo contó otro

**La distinción que faltaba.** Dos valores:

- **`comprobado`** — abrimos esa página y leímos esa frase.
- **`lo_dice_otro`** — nos lo dijo un buscador, o un modelo, y no hemos podido
  abrir la página nosotros. **Vale menos, y tiene que verse que vale menos.**

> *Nació de*: buscando la profundidad de `teachable/cap.payment_collection` se
> obtuvieron cuatro juegos de direcciones de su centro de ayuda, con citas que
> sonaban perfectas. **Ninguna dirección existía.** Y la página alemana de Zoho
> que publicaba los euros ya estaba caída. Las dos veces estuve a punto de
> escribir un dato apoyado en una página que nunca abrí.

---

## Las tres frases que no significan lo mismo

Se confunden a diario y de ahí sale casi todo el daño:

| Se escribe | Significa |
|---|---|
| **No lo tiene** | El fabricante lo dice. Va con su cita. |
| **No lo hemos encontrado** | Abrimos la página y no lo decía. **No dice nada del producto.** |
| **No hemos podido mirar** | No conseguimos abrir ninguna página. **No dice nada del producto.** |

Las dos últimas nunca se resumen como la primera.

---

## Y una que es de quien escribe, no del formato

**Lo que falta es un dato que no fuimos a buscar, no un defecto de la
herramienta.** Se escribe así, siempre. «Molnip avisa; no dicta sentencia.»

---

## 8. Lo crudo se guarda ANTES que el resumen

**Añadido el 2026-09-29, el mismo día, después de volver a fallar.**

Un resumen es una opinión sobre qué importaba. Lo crudo no opina.

De las tres tandas de las diecisiete herramientas de reservas guardé mi propio
resumen y tiré, sin darme cuenta, **la cita literal, la dirección, el título de
la página y la frase de al lado de cada capacidad**. Cerca de cien pruebas.
Conservé sólo los identificadores —`cap.online_self_service_booking`—, que es
justo la parte que no demuestra nada.

Lo mismo con la ficha completa de las cinco españolas: llegó el 28, la usé para
medir y **no la escribí en ningún sitio**. Se recuperó de la conversación.

> **«Se hace y tú la dejas perder.»**

Por eso:

- La respuesta llega → **se guarda tal cual, en `crudo/`, antes de mirarla**.
- Después, si hace falta, se escribe el resumen al lado. **El resumen nunca
  sustituye a lo crudo.**
- Y cada carpeta `crudo/` lleva un `LEEME.md` que dice de dónde salió.

Lo que se recuperó así el 2026-09-29, de esta misma conversación:

| | |
|---|---|
| Las tres tandas de las 17 | 127 citas con su dirección, título y frase de al lado |
| Las capacidades de las cinco españolas | 35 citas |
| La ficha completa de las cinco | 27 campos por herramienta |
| Teachable: capacidades y profundidad | 15 citas |

No se perdió nada porque la conversación seguía abierta. **La próxima vez
puede no estarlo.**
