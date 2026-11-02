# Informe: qué le falta a Molnip para lanzarse y traer tráfico

**Fecha:** 2 de noviembre de 2026. **Lo pidió la propietaria** con este objetivo: *«Lo primero es
mover tráfico»*, unas 30.000 visitas al mes desde las búsquedas, con las 90
herramientas que ya tenemos. Los enlaces de afiliado vienen después, por
etapas. El inglés queda para la etapa 2.

**Qué es este documento.** Es un informe: no decide nada ni ha cambiado
código ni datos. Donde dice «propongo» es propuesta mía; las decisiones van
en el apartado 7.

**Cómo se ha hecho.** Revisé el código y construí la web en local, que es la
misma versión que hay en producción (`d864fbb`). Después leí las páginas
como las ve Google y probé el asesor con la IA encendida. El proxy de esta
sesión no deja abrir molnip.com, así que **no he podido ver cuántas páginas
tiene Google indexadas**. Eso se mira en Search Console (apartado 4).

---

## Resumen

1. **Google ya conoce Molnip** y la describe, pero describe el cuestionario
   antiguo. El asesor nuevo está oculto para Google y nadie llega a él.
2. **Casi todo lo que falta para lanzar ya está en el plan de cierre** que
   aprobaste el 3 de octubre: faltan los bloques 3 a 6. No hace falta un
   plan nuevo.
3. **Hay un riesgo grande que no estaba en el radar:** 2.472 páginas de
   comparación «X contra Y» abiertas a Google, con notas («90/100») y
   ganadores («gana ActiveCampaign»). Chocan con la regla de que Molnip no
   pone nota, y Google puede tomarlas por contenido hecho en serie.
4. **Hoy no se mide ninguna visita.** Sin eso no sabremos si llegamos a
   30.000 ni qué páginas funcionan.
5. **Lanzar es barato:** según mi estimación, entre 30 y 110 $ al mes con
   30.000 visitas si 1 de cada 10 usa el asesor. El coste de verdad es el
   trabajo.

---

## 1. Lo que hay hoy

### Lo que puede leer Google

El mapa del sitio que se envía a Google tiene **2.690 páginas**:

| Tipo de página | Cuántas | Cómo están |
|---|---|---|
| Comparaciones «X vs Y» | 2.472 | Abiertas a Google. Con notas y ganadores (ver 2.B). |
| Ficha de cada herramienta | 90 | Abiertas. Contenido bueno —usos reales, precio comprobado con fecha—, pero con «93/100 Puntuación Molnip», «Ventajas/Desventajas». |
| «Alternativas a X» | 90 | Abiertas. «Ordenadas por Puntuación Molnip». |
| Categorías y subtipos | 22 | Abiertas. Con notas («95/100», «Mejor ajuste para ti») y algún precio copiado en inglés («The Free plan includes 50 bookings…»). |
| Problemas («conseguir clientes»…) | 6 | Abiertas. |
| Blog | 2 artículos | Abiertos. |
| Portada y páginas legales | 8 | Abiertas. |

Además:

- **`/asesor` no está en el mapa** y lleva `noindex`, así que Google no la
  lee. Así se decidió mientras estaba en prueba.
- **`/herramientas`, el catálogo completo, tampoco está en el mapa.** Google
  puede encontrarla por los enlaces, pero no se le señala. Su título sale
  duplicado: «Todas las herramientas | Molnip | Molnip».
- **No hay páginas por oficio** («programa para peluquerías», «software
  para fisioterapeutas»). Son justo las búsquedas en las que Molnip puede
  ganar, y el asesor ya organiza el catálogo por oficios: sirve a 8 de 15.

### Lo que dice Google de Molnip (captura de la propietaria, 2 de noviembre)

> «Molnip es un servicio gratuito en español que recomienda software… El
> usuario responde a una serie de preguntas… La plataforma… sugiere
> herramientas de un catálogo investigado y valorado editorialmente.»

La última frase sale de `app/aviso-legal/page.tsx`. La repiten
`app/terminos/page.tsx` («investigado editorialmente») y las páginas de
subtipo («nuestra valoración editorial»). **Contradice dos cosas:** que
Molnip no opina ni pone nota (regla del 21 de septiembre), y que las 62
fichas iniciales nunca se comprobaron contra fuentes reales.

### El asesor, probado hoy

Ver la sección de ATLAS del 2 de noviembre: tres fallos con «soy peluquera
y pierdo citas», y «No tengo nada que proponerte» con WhatsApp y con hotel.

### Lo técnico

Está sano. Pasan las 2.310 pruebas automáticas y las 61 de navegador, los
tipos están bien y la web se construye sin errores.

---

## 2. Qué falta para lanzar

### A. El asesor y la web: el plan de cierre, bloques 3 a 6

Ya estaba aprobado el 3 de octubre. Los bloques 1 y 2 están cerrados.

| Bloque | Qué es | Tamaño |
|---|---|---|
| 3. Que el consejo tenga salida | Hoy «Ver Koibox» abre la ficha, pero no lleva a la web de la herramienta ni cuenta el clic. Hay que llevar a la herramienta y registrar el clic con origen «asesor». La pieza ya existe (`/herramienta/[id]/ir`). | Pequeño |
| 4. Que lo que se ve no afirme lo que no sabemos | Quitar de las páginas públicas el «Español» sin recibo, la nota sin fuente, Capterra, «Desventajas» y la frase de la comisión. **Propongo que el bloque incluya las 2.472 comparaciones y las frases de «valorado editorialmente».** | Grande |
| 5. La portada lleva al asesor | Con la maqueta del paso intermedio aprobada antes. Y quitar el `noindex` de `/asesor`. | Mediano |
| 6. Prueba completa en producción | Unas diez frases reales desde tu móvil, de la portada al clic. | Pequeño |

Además, antes de abrir la puerta a desconocidos:

- **El rediseño de los empates grandes.** Era lo siguiente que habíamos
  acordado. Sin él, la peluquera ve primero dos CRM por orden alfabético.
- **Los tres fallos de la peluquera** (ATLAS, 2 de noviembre).
- **Que el asesor entienda los casos más comunes.** Con WhatsApp sigue sin
  entender. Esto es el bloque 6: las frases reales dirán cuáles faltan.

### B. Lo que ve Google

1. **Las 2.472 comparaciones.** Son el 92 % de lo que Google puede leer. Hoy
   dicen «Comparativa objetiva», ponen «90/100 frente a 58/100» y declaran
   ganadores, a veces sin motivo: en «facilidad de uso» las dos dicen «Sin
   diferencia destacable aquí» y aun así «gana ActiveCampaign». Además,
   Google castiga el contenido hecho en serie, y una web nueva con 2.472
   páginas casi iguales es lo que busca castigar.
   ~~Propongo apagarlas todas para Google~~. **Sustituido el mismo 2 de
   noviembre** por la estrategia que aprobó la propietaria. Ella preguntó:
   *«¿no podemos seleccionar unas cuantas y no ocultarlas todas, porque
   así nos va trayendo tráfico?»*. Lo aprobado:
   - **Arreglar la plantilla**, que es una sola para las 2.472: sin notas
     ni ganadores, sólo datos comprobados uno al lado del otro.
   - **Dejar visibles unas 40 parejas elegidas** y ocultar el resto sin
     borrarlo.
   - **No tocar las que Search Console diga que ya traen visitas.**

   Ver ATLAS, «LA ESTRATEGIA DE TRÁFICO APROBADA».
2. **Las frases de «valorado editorialmente»** en aviso legal, términos y
   subtipos, porque Google las repite.
3. **`/herramientas` al mapa del sitio**, y su título sin el «Molnip»
   repetido.
4. **Los precios copiados en inglés** que aparecen en páginas en español.

### C. Medir

- **Hoy no se cuenta ninguna visita.** Se registran los clics hacia las
  herramientas (en la base de datos Neon), pero no cuánta gente entra ni
  por qué página. Hace falta una analítica de visitas. Hay opciones
  gratuitas o muy baratas y respetuosas con la privacidad, como la de
  Vercel.
- **Google Search Console.** Es gratis y es la única forma de saber qué
  buscó la gente para llegar, cuántas páginas tiene Google y si hay
  errores. Hace falta tu acceso al dominio para darla de alta. Si ya la
  tienes, es lo primero que conviene mirar.
- **Los clics desde el asesor**, con el bloque 3.

### D. Que la IA no se dispare

- **La ruta del asesor no tiene límite de consultas.** Con tráfico, alguien
  podría mandar miles de mensajes y la factura de Gemini subiría. Propongo
  un límite por persona y por hora.
- **Una alerta de presupuesto en Google**, para que avise si el gasto pasa
  de una cifra.

---

## 3. Cuánto cuesta

### En dinero

Medido hoy: **cada vez que el asesor lee lo que escribe alguien** gasta
unos 2.500 tokens de entrada y entre 700 y 2.200 de salida. La salida
incluye lo que el modelo «piensa». El modelo es `gemini-3.6-flash`. Los
botones no gastan IA; sólo lo escrito. **Esto se midió en la primera
lectura de una conversación.** Las siguientes llevan el caso entero y
pueden gastar algo más.

**Los precios del modelo no los he podido comprobar en la página oficial**,
porque esta sesión no deja abrirla. Según varias webs que los recopilan,
hoy cuesta 0,75 $ por millón de tokens de entrada y 3,75 $ por millón de
salida. **Una de ellas dice que sube al doble el 1 de enero de 2027.**
Conviene confirmarlo en ai.google.dev/gemini-api/docs/pricing.

| | Precio actual | Si sube al doble |
|---|---|---|
| Una lectura | 0,5 a 1 céntimo | 1 a 2 céntimos |
| Una conversación (1 a 3 lecturas) | 0,5 a 3 céntimos | 1 a 6 céntimos |

Con 30.000 visitas al mes, depende de cuánta gente use el asesor:

| Supuesto | Conversaciones | IA al mes, precio actual | Si sube al doble |
|---|---|---|---|
| 1 de cada 10 visitas | 3.000 | 15 – 90 $ | 30 – 180 $ |
| 1 de cada 3 visitas | 10.000 | 50 – 300 $ | 100 – 600 $ |

El resto del coste:

| Concepto | Coste aproximado |
|---|---|
| Vercel (alojamiento) | El plan gratuito es para uso no comercial. Con afiliación hará falta el de pago, unos 20 $ al mes. No he comprobado qué plan tiene hoy la cuenta. |
| Neon (base de datos de clics y suscriptores) | Probablemente basta el plan gratuito con este tráfico. |
| Dominio molnip.com | Ya comprado; unos 10–15 € al año. |
| Search Console | Gratis. |
| Analítica de visitas | Gratis o pocos euros al mes. |

**Total estimado con 30.000 visitas, si 1 de cada 10 usa el asesor:
entre 30 y 110 $ al mes** (IA más Vercel). Si lo usa 1 de cada 3 y el
precio sube al doble, hasta unos 600 $. Por eso hace falta el límite de
consultas y la alerta de presupuesto (apartado 2.D). Con 1.000 o 2.000
visitas, que es lo realista los primeros meses, son pocos euros.

### En trabajo

Es la parte cara. Por orden:

1. **Bloque 3** (salida y clic) y **medir** (analítica y Search Console):
   pequeños.
2. **Empates grandes** y **fallos de la peluquera**: medianos.
3. **Bloque 4 ampliado** (lo que se ve y las comparaciones): grande, porque
   toca muchas páginas, aunque sea desconectar y no rehacer.
4. **Bloque 5** (portada → asesor): mediano. Antes necesita tu aprobación
   de la maqueta del paso intermedio.
5. **Bloque 6** (prueba): pequeño, pero sólo puedes hacerlo tú.

Después del lanzamiento viene **el contenido**, que es lo que trae las
visitas (apartado 4). Eso es trabajo continuo, no un bloque.

---

## 4. Plan de tráfico por etapas

**Aviso:** no tengo herramientas de volumen de búsqueda, así que las cifras
son estimaciones por experiencia general, no medidas. Search Console dará
las de verdad a las pocas semanas.

**Dónde puede ganar Molnip.** No en «CRM» a secas, que dominan webs como
Capterra, G2 o HubSpot. Sí en las búsquedas concretas en español, por
oficio y por problema, en los seis países: «programa de citas para
peluquería», «software para clínica de fisioterapia», «Verifactu
autónomos», «cómo dejar de perder citas». Cada una trae poco, pero juntas
suman. Y es donde lo nuestro vale: un asesor en español que dice si la
herramienta está en español y qué cuesta empezar.

| Etapa | Qué se hace | Visitas al mes (estimación) |
|---|---|---|
| 0. Preparar (1–2 meses) | Bloques 3 a 6, comparaciones desconectadas, analítica y Search Console | Lo que ya llegue hoy |
| 1. Primeras páginas buenas (meses 2–4) | Páginas por oficio para los 8 que servimos. Unos 10–20 artículos que respondan búsquedas reales. | Cientos a 2.000 |
| 2. Crecer con datos (meses 4–9) | Ampliar lo que Search Console diga que funciona, y unas pocas comparaciones con datos comprobados de las parejas que la gente busque de verdad | 2.000 a 10.000 |
| 3. Escala (meses 9–18) | Más oficios, más casos y enlaces desde otras webs | 10.000 a 30.000 |

**Lo que no hay que hacer:** generar cientos de páginas con IA de golpe.
Así nacieron las 62 fichas sin comprobar, y así funcionan las 2.472
comparaciones. Cada página nueva debe decir sólo lo que podemos sostener.

**Afiliación.** Sigue aparcada, como decidiste el 17 de septiembre. Pero
desde el primer día **se cuentan los clics que enviamos a cada
herramienta**. Con esa cifra podrás ir a ellos cuando toque («te mando X
personas al mes»), en vez de esperar a que te encuentren.

---

## 5. Qué medir para saber si la idea funciona

| Pregunta | Cómo se mide |
|---|---|
| ¿Llega gente? | Visitas al mes (analítica) |
| ¿Qué buscan? | Búsquedas que traen visitas (Search Console) |
| ¿El asesor les ayuda? | Cuántas conversaciones acaban en un consejo, y cuántas en «No tengo nada que proponerte» |
| ¿Les sirve? | Clics hacia la web de la herramienta, por origen (asesor, ficha, categoría) |
| ¿Qué no entendemos? | Las frases que el asesor no supo leer, para mejorarlo |

**Ojo con la privacidad.** Guardar lo que escribe la gente exige avisarlo
en la política de privacidad. Si se guarda, que sea sin datos personales.

---

## 6. Inglés: etapa 2

Decidido por la propietaria el 2 de noviembre: *«déjalo como etapa 2»*.

- **Por qué después:**
  - En inglés la competencia en Google es mucho mayor.
  - Se pierde lo que nos distingue (un asesor en tu idioma que te dice si
    la herramienta está en español).
  - Habría que hacer en inglés el asesor, las 61 necesidades, las
    preguntas, las fichas y los precios, y nada de eso está comprobado aún
    en español.
- **Qué costaría:** en dinero, casi lo mismo que el español. En trabajo,
  rehacer en inglés el vocabulario y las fichas, y comprobarlos.
- **Cuándo tendría sentido:** cuando el español funcione, y si Search
  Console muestra búsquedas en inglés que ya llegan.
- **No se pierde nada por esperar:** el inglés puede ir en `molnip.com/en`
  sin tocar el español ni lo que Google ya conoce.

---

## 7. Decisiones que te tocan

1. ~~**Las 2.472 comparaciones**~~: **decidido el 2 de noviembre.** Se
   arregla la plantilla, quedan visibles unas 40 elegidas y se respeta lo
   que ya traiga visitas. Ver 2.B.
2. **¿El bloque 4 incluye las comparaciones** y las frases de «valorado
   editorialmente»?
3. **El orden:** ¿empates grandes antes del bloque 3, o al revés?
4. **La maqueta del paso intermedio** del bloque 5, que sigue sin aprobar.
5. **Analítica de visitas:** cuál, y si se guarda lo que escribe la gente
   en el asesor.
6. **Search Console:** la propietaria no sabe si la tiene (2 de
   noviembre). Es el paso 0 de la estrategia.
7. **El límite de consultas y la alerta de presupuesto** de Gemini: qué
   cifra.

## 8. Lo que no he podido comprobar

- Cuántas páginas tiene Google indexadas: hay que mirarlo en Search
  Console.
- El precio oficial de Gemini, porque no puedo abrir la página de Google.
- El plan contratado hoy en Vercel y en Neon.
- Los volúmenes de búsqueda reales.
