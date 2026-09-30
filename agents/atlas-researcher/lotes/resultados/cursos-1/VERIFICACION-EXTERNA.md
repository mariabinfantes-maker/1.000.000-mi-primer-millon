# Verificación externa del lote `cursos-1` — resultado de pasarla por los validadores

**Estado: nada promovido, nada escrito en `data/verificacion/`.** Esto es el
resultado de una comprobación, no un cambio.

Origen: encargo `agents/atlas-researcher/encargos/verificacion-externa-cursos-1.md`,
respondido por ChatGPT el 2026-09-16. El JSON tal cual está en
`verificacion-externa.json`; la salida de los validadores, en
`verificacion-externa-informe.txt`; lo convertido a formato F2, en
`verificacion-externa-convertida.json`.

## Dos filtros

**1. Las reglas del encargo.** 68 datos: 45 «confirmado», 21 «no consta», 2
«contradicho». 32 incumplimientos, repartidos en 17 campos. Ninguna
dirección está fuera del dominio oficial y ninguna fecha es inválida: el
método se respetó. Lo que falla es otra cosa, y es siempre lo mismo.

**2. Los validadores reales de F2.** Lo convertible —9 registros de
capacidad con 6 usos, 3 recorridos y 3 registros de idioma— pasa
`erroresDeRegistro`, `erroresDeRecorrido` y `erroresDeIdioma` **sin un solo
error**. Entra con `confianza: "media"`, no alta: la cita la aporta un
tercero y nadie de Molnip la ha visto en la página.

## El patrón de fallo, que es uno solo

La cita se copia de una **celda de tabla** y el **valor dice más que la
cita**. «$39/mo» como cita y «39 USD/mes o 29 con facturación anual» como
valor; «5 products» y un valor con cinco límites; «Transaction Fee» y un
valor con cuatro porcentajes. Once de los treinta y dos incumplimientos son
eso. No es mentira: es que la frase no sostiene sola lo que se afirma, que
es justo lo que la regla de citas breves de F2 existe para frenar. Se
resuelve pidiendo la fila entera con su encabezado, no un fragmento.

## Lo que sí sirve tal cual (24 campos)

Los seis **usos** del recorrido A están demostrados en las tres
herramientas con cita larga y documentación oficial: acceso automático al
curso tras el pago, y pago único o a plazos. Es exactamente lo que el lote
de Gemini iba a buscar, y llega sin gastar una llamada. Además: las tres
crean página sin programar, las tres cobran, dos alojan cursos con cita
larga, el programa de afiliados de Thinkific y de Teachable con su
plataforma y su cookie, y los idiomas de la interfaz de alumnos de
Teachable.

## Los tres recorridos quedan «no consta»

Ninguna página demuestra las tres piezas juntas en un plan nombrado. Es la
respuesta correcta, y coincide con lo que el caso 9 de la etapa 0 ya decía.

## Lo que corrige de los borradores, confirmado

- **Thinkific no tiene plan gratuito.** Cita que responde a la pregunta:
  «No, instead, you can explore the whole platform with a 30-day free trial.»
- **Teachable no tiene plan gratuito**: «Teachable is a paid service that
  includes a 7-day free trial». La garantía de 30 días que añade el valor no
  está en esa frase.
- **Teachable gestiona su programa con PartnerStack**, no con Impact como
  decía el borrador. Corrobora que los enlaces de su página de precios
  llevan parámetros de PartnerStack.
- **Hotmart no tiene programa por recomendar la plataforma**: «no consta»,
  igual que concluimos aquí. La distinción con el mercado de productos de
  terceros la hizo bien.

## Lo que queda en conflicto y no se toca

**La comisión de Hotmart.** La verificación anterior dio 9,90 % más 0,50 €
por venta (o 0,10 € si el producto cuesta 15 € o menos), del artículo de
tarifas del centro de ayuda. Ésta da tramos por volumen anual: 9,9 % hasta
9,9 K €, hasta 8,4 % de 10 K a 99 K, hasta 6,9 % de 100 K a 999 K. Las dos
citas vienen de páginas distintas y **el artículo de tarifas es una de las
tres páginas que esta verificación declara no haber podido leer**. Pueden
ser compatibles —porcentaje por tramo y cuota fija por precio— pero nadie lo
ha demostrado. Además, el «1,00 €» que afirma el valor no aparece en
ninguna cita. **Queda desconocido.**

**El plan gratuito de Hotmart** se apoya en la portada. Una portada no
sostiene una función ni un plan concreto (regla de F2 del 2026-09-07).
Queda pendiente.

## Qué hacer con esto

Los 24 campos aptos pueden entrar como confianza media en cuanto la
propietaria lo autorice. Los 17 a revisar necesitan una segunda vuelta
pidiendo la fila entera con su encabezado de columna, que no cuesta nada.
Lo que esto NO sustituye: el lote `usos-1` de los siete CRM y Systeme.io,
que es otro recorrido y otras herramientas.

---

# Segunda vuelta (2026-09-16)

Encargo `verificacion-externa-cursos-1-segunda-vuelta.md`: sólo los 17
campos que no pasaron, pidiendo la fila entera con su encabezado de columna
en vez de la celda suelta. JSON en `verificacion-externa-2.json`.

**Resultado: 20 de 23 datos pasan limpios.** El patrón de la primera vuelta
está corregido: las citas ahora traen la tarjeta del plan entera («### Basic
… $54/mo … Billed monthly … $40/mo … Billed annually») o la tabla completa
con sus encabezados. Y donde la página no dejaba copiar la fila de forma
fiel, bajó la afirmación en vez de forzarla: los límites de Thinkific pasan
de cinco cifras a «cursos ilimitados», los de Teachable a «no consta».

**El conflicto de Hotmart, resuelto como debía.** Ahora son dos
afirmaciones separadas: los porcentajes por tramo de facturación, con la
tabla citada de la página de precios; y la cuota fija, **«no consta»**
porque el artículo de tarifas sigue sin poder leerse. Ya no hay dos fuentes
mezcladas en una sola frase, y el «1,00 €» inventado desapareció.

## Lo que queda fuera, y por qué

- **El plan gratuito de Hotmart** sigue citado desde la portada. Se
  mantuvo la cita y se argumentó en la nota, pero la regla es nuestra y no
  cambia: una portada no sostiene una condición concreta. **Pendiente.**
- **`teachable/cursos`**: la cita sigue siendo «Student progress reports»,
  una fila de la tabla de planes. Revisada a mano, con el criterio escrito
  en `verificacion-externa-convertida.json`: demuestra el seguimiento del
  progreso, **no** que la herramienta aloje e imparta el curso. Por eso
  `cap.training_lms` de Teachable se aparta, y con ella su uso: un uso no
  puede demostrarse sobre una capacidad que no está demostrada.
- **`teachable/comision_por_venta`**: la cita de esta vuelta demuestra el
  0 % de Builder, Growth y Advanced; la de la primera vuelta demostraba el
  7,5 % de Starter. Cada una sostiene la mitad, y juntas están completas:
  se guardan como dos afirmaciones, no como una.

## Lo que este canal ha producido, fusionadas las dos vueltas

Convertido a formato F2 y pasado por los validadores reales: **0 errores**.

- **8 registros de capacidad** con confianza media: página, cobro y cursos
  en Hotmart y Thinkific; página y cobro en Teachable.
- **5 usos demostrados de 5**: el acceso automático al curso tras el pago
  en Hotmart y Thinkific, y el pago único o a plazos en las tres.
- **3 recorridos «no consta»**: ninguna página demuestra las tres piezas
  juntas en un plan nombrado. Es la respuesta correcta.
- **Idioma**: la interfaz del panel que usa el negocio no consta en
  ninguna de las tres. El soporte, sólo en Hotmart. La interfaz que ve el
  alumno sí consta, pero **no se guarda como idioma de la herramienta**:
  que la tienda se vea en español no dice en qué idioma trabaja quien
  administra, y confundirlas es el error que el borrador de Teachable ya
  cometió al revés.

**Coste: cero llamadas a Gemini.** El lote `usos-1` de Systeme.io y los seis
CRM sigue siendo otro recorrido y sigue pendiente de autorización.
