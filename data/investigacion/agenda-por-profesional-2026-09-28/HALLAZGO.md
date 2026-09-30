# Que el paciente elija dentista: qué hemos encontrado

**28 de septiembre de 2026.** Salió de la pantalla del asesor: una clínica con
varios dentistas dice «el paciente elige profesional» y Molnip contesta que no
lo tiene confirmado en ninguna. Antes de seguir puliendo cómo se dice eso,
tocaba usar lo que ya teníamos guardado.

## 1. El cero no era de las herramientas: era nuestro

`cap.per_resource_booking_calendar` —«agenda separada por profesional, sala,
sillón o máquina»— se había preguntado a **64 de las 65** fichas. Las 64
salieron **«desconocido»**. Parecía un dato sobre el mercado.

No lo era. Las notas de septiembre dicen dónde se miró: **la página oficial y
la página de precios**. Para una agenda por profesional ése es el sitio
equivocado — eso se explica en la documentación o en la página de la función,
no en la portada. El cero medía dónde habíamos mirado.

Se repitió la consulta en las **9** del catálogo que sí tienen reserva por
internet demostrada (Agile CRM, Agiled, EngageBay, HoneyBook, Keap, Motion,
Nutshell, Pipedrive, Reclaim.ai), esta vez contra su documentación. Ninguna lo
demuestra.

## 2. Y hay una razón de fondo: el catálogo no tiene agendas

Las 65 herramientas son, enteras:

| Categoría | Cuántas |
|---|---|
| Asistentes de IA | 18 |
| Plataformas todo-en-uno | 17 |
| CRM | 15 |
| Gestión de proyectos | 15 |

**Ni un solo sistema de reservas con agenda de varios profesionales.** El
catálogo se armó para quien vende y hace seguimiento de clientes, no para quien
da citas. La clínica con varios dentistas no es un caso raro que se nos escapó:
es un tipo de negocio que el catálogo no cubre.

## 3. Ampliando la búsqueda

Se miraron **12 herramientas de fuera del catálogo** —Calendly, Cal.com, Acuity
Scheduling, SimplyBook.me, Setmore, Square Appointments, Zoho Bookings, Fresha,
Booksy, TIMIFY, Reservio y Doctoralia— leyendo su documentación página a
página. Regla de siempre: «sí» sólo con cita literal.

**Demostrado del todo — dos:**

- **Doctoralia** (Docplanner, española). Su documentación de integraciones dice
  que **«Simple operations on the calendar belonging to the address»** y
  **«List of free slots for the address within specified date range»**, y su
  ruta para reservar es
  `/facilities/{facility_id}/doctors/{doctor_id}/addresses/{address_id}/slots/{start}/book`.
  Es decir: el calendario cuelga de una dirección, la dirección de un doctor y
  el doctor de un centro. **Cada profesional tiene su agenda en cada sitio
  donde pasa consulta, y la reserva se hace contra ese profesional.** Y se lee
  igual en el producto: en la ficha de un dentista concreto pone **«Este
  especialista no ofrece reserva online en esta dirección»** — la reserva es
  del especialista, no del centro. Dos lecturas distintas que dicen lo mismo.

  Ojo con qué es: un directorio de pacientes con agenda. Encaja con consultas
  y clínicas; no con una peluquería ni con un taller.

- **SimplyBook.me.** Agenda por profesional: «You can set regular schedule for
  providers in Manage -> Service Providers». Que el cliente elija: «Si no tiene
  la intención de permitir que los clientes reserven con un proveedor
  específico, siempre puede llamarlo "Proveedor 1/2/3/4"».

**Demostrado a medias — una:**

- **Setmore.** Que el cliente elija: «Each staff profile includes a Booking Page
  link, allowing customers to schedule appointments with specific team
  members». La agenda separada no la hemos encontrado todavía.

Las demás quedan en «no lo hemos encontrado» o en «no hemos podido mirar».

### Lo que costó llegar a Doctoralia, porque importa

La primera pasada la dejó en «no lo hemos encontrado» con **1 de 10 páginas
abiertas**. Eso no era un resultado: era no haber mirado, escrito como si
fuera un hallazgo. Al insistir salieron dos cosas:

- **`pro.doctoralia.es` nos bloquea entero.** Cero de siete páginas abiertas en
  tres rondas. Toda su parte comercial y de ayuda es inalcanzable desde aquí.
- **El bloque de reserva de `www.doctoralia.es` no se dibuja para un lector
  automático.** Sale el mismo texto —«Este centro aún no ofrece la reserva
  online de cita»— en todas las fichas, tengan la reserva activada o no. Si nos
  hubiéramos fiado de eso, habríamos escrito que las clínicas españolas de
  Doctoralia no tienen reserva online. Sería falso.

La evidencia acabó saliendo de su documentación de integraciones, que sí se
abre. **La conclusión que hay que quedarse: cuando una herramienta sale a cero
y sus páginas no se abrieron, el cero es nuestro.**

## 4. El límite de esta pasada, dicho claro

De **132 páginas** que se intentaron abrir, **sólo se abrieron 35**. Desde este
entorno la única salida a internet es el lector de Gemini, y falla mucho: de
Acuity no se abrió ni una de nueve.

Por eso el resultado distingue tres cosas y no dos:

- **verificado** — la página se abrió y lo dice, con su cita.
- **desconocido** — la página se abrió y no lo dice. No lo hemos encontrado.
- **sin_mirar** — ninguna página se abrió. No hemos mirado.

Ninguna de las dos últimas significa que la herramienta no lo tenga. Acuity,
Fresha, Booksy o TIMIFY pueden hacerlo perfectamente; lo que tenemos es que
no lo hemos leído. Doctoralia es la prueba: estuvo en ese montón hasta que
insistimos.

## 5. Lo que decide la propietaria

Hoy podemos contestarle a la clínica con **dos** herramientas demostradas, y
una de ellas —Doctoralia— es española y está pensada justo para consultas. Y tres es consecuencia de que haya tres buenas, nunca un objetivo que
rellenar.

Queda por decidir, y no se decide aquí:

1. **Si entran al catálogo** herramientas de reservas. Son de fuera de las 65 y
   abrir una categoría nueva es decisión de producto.
2. **Si se repite la pasada** sobre Acuity, Fresha, Booksy, TIMIFY y Reservio
   hasta tener sus páginas leídas de verdad. Cada pasada cuesta
   dinero real.
3. **Si se vuelven a mirar las 65** para las capacidades donde sólo se leyó la
   portada y la de precios. El mismo problema del punto 1 afecta a más
   capacidades que ésta.

La afiliación no se ha mirado ni se menciona, según lo acordado el 17 de
septiembre.
