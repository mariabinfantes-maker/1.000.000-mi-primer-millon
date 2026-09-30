# Koibox, segunda entrega — 2026-09-29

Koibox ya había entrado al catálogo esta misma mañana con la primera entrega
de GPT. Ésta es una segunda pasada sobre la misma herramienta. **No repitió el
trabajo en balde: trajo tres cosas que la ficha no tenía, y destapó un fallo
del constructor que afectaba a las trece herramientas de hoy.**

## 1. El fallo del recibo del precio — era mío

La ficha de Koibox decía, como recibo de su precio:

> «Mailchimp, Brevo, Paypal y Stripe»

La dirección era la correcta (`koibox.cloud/pricing/`) y la fecha también. Lo
que enseñaba no demostraba ningún precio: era la cita de las **integraciones**.

**Por qué pasó.** El constructor cogía la primera prueba con
`tipo: "tarifa_oficial"`, y ese tipo no significa «la cita del precio»:
significa «algo que se leyó en la página de tarifas». En Koibox esa página
sirvió de prueba para las integraciones, y el recibo se quedó con esa frase.

GPT sí entrega el campo que hacía falta, `citaDelPrecio`, y en esta entrega
vale: `«0€/mes […] 15€*/mes […] 30€*/mes […] 40€*/mes […] 55€*/mes»`.

**Alcance del fallo**, medido sobre las trece de hoy:
- 3 tenían una cita que no enseñaba ningún precio (koibox, schedulista, timify)
- 6 no tenían cita ninguna
- 4 estaban bien por casualidad, porque su prueba de tarifa sí llevaba cifras

Corregido en `cli-borradores-reservas-2.ts`: ahora usa `citaDelPrecio` primero,
y sólo acepta la prueba de tarifa como reserva **si su cita menciona alguna
cifra o moneda**. Un recibo que no enseña un precio es peor que no tener
recibo, porque parece que sí.

Las 65 anteriores tienen la cita vacía. **No se ha tocado ninguna**: eso es de
otra sesión y no es esto.

## 2. Lo que la ficha no tenía y ahora sí

**Idioma de la gestión.** La ficha decía `["es"]`. Son cinco, y con prueba: el
artículo de soporte sobre cómo cambiar el idioma enseña el selector con
Español, Inglés, Português, Italiano y Francés.
`soporte.koibox.cloud/es/article/se-ha-puesto-el-programa-en-otro-idioma-como-puedo-cambiarlo-ld6pld/`

## 3. Lo que trajo y NO cabe en la ficha

**El esquema no tiene campo `limites` ni `notaDelPrecio`.** Se quedan aquí
escritos para no perderlos; añadir campos al esquema es otra decisión y no se
toma de paso.

Tres límites, los tres con cita:
1. **La API exige Platinum.** «La API requiere que tu centro tenga una
   suscripción al plan Platinum activa.» — `docs.koibox.cloud/intro/first-steps/`
2. **Redsys, desde Gold y sólo bancos españoles.** «Ésta funcionalidad está
   disponible a partir del plan Gold […] solo disponibles en bancos españoles»
   — `soporte.koibox.cloud/es/article/pasarela-de-pago-redsys-que-es-1n5ayib/`
3. **Renovación automática con 15 días de preaviso.** «con al menos quince (15)
   días naturales de antelación a la finalización del período de suscripción»
   — `koibox.cloud/terms-of-use/`

Y la nota del precio: los importes de pago **excluyen impuestos**; Free incluye
un usuario.

## 4. Los planes mínimos que GPT sí demostró y el archivador no guarda

GPT entregó `planEstado: "verificado"` con plan nombrado en tres capacidades:
reserva online → **Basic**, recordatorios → **Basic**, señales → **Gold**.

El archivador los guarda igualmente como `desconocido`, **a propósito**: el
esquema exige, para dar un plan por verificado, una fuente aparte con
`rol: "plan_consultado"` cuya cita nombre el plan. Aquí el plan sale de la
tabla de tarifas, no de la cita de la capacidad. **No es que GPT se equivoque:
es que la prueba que trae no es la que el esquema pide.** Queda anotado por si
se decide aflojar esa exigencia; no se afloja sola.

## 5. Tres capacidades que GPT NO pudo demostrar, y está bien que lo diga

- **Cancelar y cambiar cita**: encontró la cancelación, no el cambio de hora
  por el propio cliente. **Hacen falta las dos.**
- **Lista de espera**: la tarifa la anuncia en Gold, pero el procedimiento que
  describe la ayuda es que **el negocio** apunta al cliente, no el cliente solo.
- **Insertar la reserva en tu web**: la ayuda llama «widget» al apartado de
  enlaces. Un enlace no es un calendario incrustado.

GPT las devolvió como `no_consta`. **Ese estado no existe en el vocabulario**
—son `verificado`, `desconocido` y `descartado`—, y equivale a `desconocido`:
no se encontró prueba, que no es lo mismo que no tenerlo. Hay que corregirlo en
el encargo para que lo diga con la palabra del esquema.

## 6. Lo que GPT hizo bien y conviene no perder

- Se negó a deducir el país de origen del domicilio social que aparece en las
  condiciones de contratación.
- Avisó de que la ficha de Capterra que consiguió abrir es una versión
  recuperada y el contador de reseñas puede no ser el de hoy.
- Dijo que en los artículos cortos la «frase de al lado» sale del bloque de
  valoración porque no hay más texto ajeno al tema.
- **Y `pendientes: []` era verdad esta vez**, porque sólo se le pidió una.
