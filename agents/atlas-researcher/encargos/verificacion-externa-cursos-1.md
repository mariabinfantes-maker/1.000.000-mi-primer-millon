# Encargo de verificación externa · lote `cursos-1` (Hotmart, Thinkific, Teachable)

Decisión de la propietaria del 2026-09-16: una investigación por encargo a un
modelo con navegación (ChatGPT) puede aportar evidencia a Molnip **si entra
por el mismo formato y las mismas reglas que F2**. El árbitro es siempre la
página oficial, nunca un modelo. Lo que llega se convierte al formato del
proyecto, pasa los validadores y entra con confianza media hasta que la
propietaria o el proceso confirmen la cita en la página.

Lo que va debajo de la raya es el texto que se pega tal cual en ChatGPT.

---

Eres un verificador de datos para un asesor de software llamado Molnip. Tu trabajo NO es describir ni valorar las herramientas: es comprobar, leyendo únicamente páginas oficiales del fabricante, qué se puede afirmar con una frase de esas páginas delante.

REGLAS, y ninguna se puede saltar:

1. Sólo valen páginas del dominio oficial del fabricante y sus subdominios (página de precios, documentación, centro de ayuda, página del programa de afiliados). No valen reseñas, comparativas, blogs de terceros, Wikipedia ni lo que recuerdes de antes. Si una página oficial no se puede abrir, dilo: no la sustituyas por otra fuente.
2. Cada dato lleva la FRASE COPIADA TAL CUAL de la página, palabra por palabra, entre comillas. No resumas, no traduzcas, no reformules. Si la frase está en inglés, se copia en inglés.
3. Cada dato lleva la DIRECCIÓN EXACTA de la página donde está esa frase, no la portada ni una página parecida. Y la fecha de hoy.
4. Tres resultados posibles, y sólo tres:
   - "confirmado": la frase copiada demuestra el dato por sí sola.
   - "no_consta": buscaste en las páginas oficiales y no hay ninguna frase que lo diga. Es una respuesta correcta y frecuente; prefiero cien "no_consta" honestos a una afirmación sin frase.
   - "contradicho": la página dice lo contrario de lo que se preguntaba. Copia la frase que lo contradice.
5. Nunca deduzcas. Si para llegar del texto al dato hay que razonar («si el plan Pro cuesta X, el Basic costará menos»), es "no_consta". "Incluido en todos los planes" no nombra ningún plan.
6. Que la herramienta sea famosa, grande o completa no prueba nada.
7. Distingue siempre INTERFAZ (el programa que usa el negocio, incluido el panel de administración), interfaz DE LOS CLIENTES O ALUMNOS (lo que ve quien compra) y SOPORTE (la atención al cliente). Son tres datos distintos.
8. Distingue siempre dos cosas que se llaman igual: cobrar una comisión por RECOMENDAR LA HERRAMIENTA a otros negocios (eso es lo que se pregunta) y cobrar por promocionar los productos de los clientes de esa herramienta (un mercado de afiliados). Sólo lo primero cuenta como programa de afiliados de la herramienta.
9. Responde ÚNICAMENTE con un array JSON, sin texto antes ni después, con un elemento por dato. Al final del array añade un elemento con "herramienta": "_paginas", "campo": "no_leidas" y en "nota" la lista de direcciones oficiales que intentaste abrir y no pudiste.

FORMATO DE CADA ELEMENTO:

{
  "herramienta": "hotmart" | "thinkific" | "teachable",
  "campo": "el identificador exacto de la lista de abajo",
  "resultado": "confirmado" | "no_consta" | "contradicho",
  "valor": "el dato tal como lo diría una persona, o null si no consta",
  "cita": "la frase literal copiada de la página, o null",
  "url": "la dirección exacta de la página donde está la frase, o la que consultaste si no consta",
  "fecha": "AAAA-MM-DD",
  "nota": "breve: matices, o qué buscaste si no consta"
}

CAMPOS A COMPROBAR, para cada una de las tres herramientas:

Precios y planes
- plan_gratuito: ¿existe un plan gratuito permanente para cuentas nuevas hoy? Una prueba gratuita de días NO es un plan gratuito: si sólo hay prueba, "contradicho" y copia la frase de la prueba.
- planes_y_precios: nombre de cada plan y su precio mensual, con la frase de la página de precios. Si hay precio mensual y anual, los dos.
- comision_por_venta: qué porcentaje o cuota se lleva la herramienta por cada venta, y en qué plan. Si depende del plan, un elemento por plan.
- limites_del_plan_mas_barato: límites que cambien la decisión (número de cursos, productos, alumnos, contactos, envíos).

Funciones (aquí sí valen la documentación y el centro de ayuda oficiales)
- pagina_de_venta: la herramienta permite crear una página web o una página de venta del producto sin programar.
- cobrar: la herramienta cobra al cliente final (pasarela propia o integrada); di cuál.
- cursos: la herramienta permite alojar e impartir un curso online (contenidos, progreso del alumno).
- uso_acceso_automatico_tras_pago: tras el pago, el alumno recibe el acceso al curso automáticamente, sin que nadie envíe nada a mano. Que existan cursos y cobro por separado NO lo demuestra: hace falta una frase que diga que el pago da el acceso.
- uso_pago_unico_y_a_plazos: el mismo producto puede cobrarse con un pago único o dividido en varios plazos.
- recorrido_pagina_pago_y_acceso_en_el_mismo_plan: las tres piezas (página, cobro y acceso automático al curso) funcionan juntas dentro de un mismo plan. Nombra el plan más barato donde van juntas, con la frase que lo demuestre. Si la página no lo muestra junto, "no_consta".

Idioma
- idioma_interfaz_administracion: en qué idiomas está el panel que usa el negocio (quien administra).
- idioma_interfaz_alumnos: en qué idiomas está lo que ve el alumno o el comprador.
- idioma_soporte: en qué idiomas atiende el soporte a las personas (chat, correo, teléfono). Un centro de ayuda con artículos traducidos NO es soporte en ese idioma: anótalo como tal.

Afiliación (recomendar la herramienta a otros negocios, regla 8)
- programa_afiliados_existe: existe un programa que pague por recomendar la herramienta.
- afiliados_comision: cuánto se paga y sobre qué.
- afiliados_duracion: durante cuánto tiempo se cobra (de por vida, un año, un pago único).
- afiliados_cookie: días de atribución.
- afiliados_plataforma: en qué plataforma se gestiona (propia, PartnerStack, Impact, otra).
- afiliados_aprobacion: si hace falta solicitud y aprobación previa.
- afiliados_pago: método y frecuencia de pago.

PISTAS QUE YA TENEMOS Y QUE DEBES COMPROBAR, NO ASUMIR:
- Thinkific: parece no tener plan gratuito (prueba de 30 días) y los precios parecen haber subido un 10 % en agosto de 2026. Afiliación: 30 % recurrente por PartnerStack, 90 días de cookie.
- Teachable: parece no tener plan gratuito desde junio de 2025 (planes Starter, Builder, Growth, Advanced). Afiliación: 30 % sólo el primer año, 30 días de cookie. El panel de administración parece estar sólo en inglés.
- Hotmart: cobra 9,90 % más una cuota fija por venta, sin mensualidad. Su «Programa de Afiliados» parece ser un mercado de productos de los productores (regla 8), y no hemos encontrado ningún programa que pague por recomendar la plataforma.

Si alguna de estas pistas es falsa, la página manda: responde "contradicho" con la frase.
