# Las 16 que faltan — encargo único y completo

La lista entera de lo que queda del barrido de reservas. Sustituye a
`PROMPT-GPT-las-seis-que-quedan.md`, a `PROMPT-GPT-las-tres-y-las-nueve.md` y a
`PROMPT-GPT-lo-facil-que-es.md`, que pedían estos mismos datos a trozos y por
eso ninguna de las 16 está completa.

Lo que sabe cada una está sacado del repositorio, campo por campo, no de
memoria. Cuatro cosas no las tiene ninguna —curva de aprendizaje, el idioma
partido en gestión y soporte, la cita del precio, y la ficha escrita— y son
exactamente las que hacen falta para entrar y para que el motor las coloque.

Copia todo lo que va debajo de la línea.

---
## Tu papel

Eres un investigador documental. Trabajas para un catálogo español de herramientas digitales que aconseja a autónomos y pequeñas empresas —peluqueras, fisios, dentistas, veterinarios— que **no saben de software** y que van a decidir una compra con lo que tú escribas.

**El peor resultado no es un hueco: es un dato verosímil que no comprobaste.** Un hueco se ve y se rellena otro día. Un dato inventado se publica y alguien paga por él.

**No vendes ni opinas: recoges lo que el fabricante dice de sí mismo, con la página delante, y anotas dónde lo leíste.**

## Lo que haces bien y quiero que repitas

- Abriste el **JavaScript de la calculadora de Bookitit** cuando la tarifa no daba cifras.
- Dejaste el precio de Pabau en `null` diciendo *«no afirmo que no lo publiquen: no conseguí visualizar esas cifras»*.
- Dejaste el tamaño de Booksy en `null` negándote a deducir «ilimitado» de que se pueda pagar por más empleados.
- Avisaste de que la tarifa de Zoho **redirigía a otra versión sin cifras al reabrirla**. Nadie te lo pidió y era lo importante.
- **En Koibox entregaste las ocho capacidades, la curva y las notas de una sola vez.** Entró directa. Eso es exactamente lo que quiero dieciséis veces más.

## Lo único que sigue fallando

**`pendientes` ha vuelto vacío sin serlo cinco veces seguidas, la última ayer: entregaste una de siete y lo mandaste vacío.** Lleva **los ids que NO has hecho**. Entregar cinco de dieciséis está bien; decir que son dieciséis, no: me hace contar como terminado lo que no lo está.

**Ve herramienta por herramienta y cierra cada una antes de seguir.** Una ficha a medias parece hecha, y eso es peor que no empezarla.

## Cómo te tienes que comportar

- **Abre las páginas. Siempre.** Lo que no abriste, no existe para este encargo.
- **Cada afirmación lleva cita literal y dirección**, con el **título exacto de la página** y **una frase de al lado** sin relación con lo que busco.
- **Sólo vale la palabra del fabricante**: su web, documentación, ayuda, tarifa. Si el único sitio es su propio blog o una nota de prensa, vale, **pero márcalo `fuente_secundaria`**.
- **Lo que no encuentres, `null`, y di dónde miraste.**
- **Nunca escribas que no lo tiene** salvo que el fabricante lo diga con esas palabras.
- **No juzgues.** Nada de rankings ni «es la mejor».
- **No me preguntes a mitad.** Opción conservadora, sigue, y anótalo.
- **Fuera del JSON no escribas nada.**
- **Nada de afiliación.**
- **Escribe en español**, salvo las citas.

---

# LAS 16, Y QUÉ SE SABE YA DE CADA UNA

**Esto es la lista completa. No hay una tanda siguiente: lo que no venga aquí, no viene.**

**No repitas lo que lleva «✔».** Y mira las direcciones: las que se abrieron te ahorran trabajo, las que fallaron te dicen por dónde no ir — y algunas fallaron por el lector, no porque no existan, así que reinténtalas.

**Cuatro cosas no las tiene NINGUNA de las 16, y son justo las que deciden si entra:**

1. **`curvaDeAprendizaje`** — cero de dieciséis. Nunca se pidió.
2. **`idioma` en dos partes** —gestión y soporte por separado—. Lo que hay es un solo idioma «del producto», que no distingue el panel de la página de reservas.
3. **`citaDelPrecio`** — hay precios en ocho, pero sin las cifras copiadas como recibo.
4. **La ficha entera** —descripción, problemas, casos, ventajas, inconvenientes— salvo en Pabau y Fresha.

---

### DriCloud — https://dricloud.com/   `dricloud`  
**✔ Agenda por profesional** («Cada profesional decide sus horarios y tipos de cita disponibles online»)  
**✔ Precio: 42 € /mes impuestos incluidos facturado anualmente (510 € al año), 2 meses **  
**Falta la pregunta clave: ¿puede el cliente elegir con quién va?** No se encontró. Búscala otra vez.  
Abiertas: `/precios/` · `/cita-medica-online/` · `/agenda-clinica/`

### flowww — https://www.flowww.es/   `flowww`  
**✔ Agenda por profesional** («Una agenda especializada en negocios de medicina estética, belleza y salud con visual por docto»)  
**✔ Precio: 59€* /mes, 590€* /año**  
**Falta la pregunta clave: ¿puede el cliente elegir con quién va?** No se encontró. Búscala otra vez.  
Abiertas: `/flowww-saas` · `/flowww-book` · `/precios`

### Reservo — https://reservo.cl/   `reservo`  
**Es directorio público Y programa de gestión. Me interesa el PROGRAMA DE GESTIÓN, no el directorio.**  
**✔ Agenda por profesional** («Esta función permite asignar un horario calendarizado a un profesional»)  
**✔ El cliente elige profesional** («Una vez que el paciente/cliente seleccione el profesional y fecha de su atención»)  
Capacidades ya verificadas, **no las repitas**: `cap.online_self_service_booking` · `cap.customer_appointment_reminders` · `cap.booking_cancellation_and_rescheduling` · `cap.capacity_and_time_slots` · `cap.no_show_and_deposits` · `cap.embeddable_booking_widget`  
Abiertas: `/reservo/es/articles/2898003-crear-agenda-profesional` · `/reservo/es/articles/5676625-reserva-online-multiprecios` · `/reservo/es/articles/4275576-como-crear-la-reserva-online` · `/reservo/es/articles/12261185-como-configurar-el-portal-de-agendamiento`  
No abrieron, **reinténtalo**: `https://reservo.cl/` · `https://reservo.cl/planes` · `https://agendamiento.reservo.cl/es/`

### QVET — https://qvet.net/   `qvet`  
**De ésta no hay NADA comprobado: ni agenda, ni precio, ni si el cliente elige.**  
**Falta la pregunta clave: ¿puede el cliente elegir con quién va?** No se encontró. Búscala otra vez.  
Abiertas: `/caracteristicas-de-qvet/` · `/soporte-y-formacion/`

### Gesden G5 — https://www.infomedsoftware.com/   `gesden-g5`  
**De ésta no hay NADA comprobado: ni agenda, ni precio, ni si el cliente elige.**  
**Falta la pregunta clave: ¿puede el cliente elegir con quién va?** No se encontró. Búscala otra vez.  
Abiertas: `/` · `/software/gesden/gesden-g5/` · `/wp-content/themes/softwareinfomed/_pdfs/es/gesden-g5_funcionalidades_agenda.pdf`  
No abrieron, **reinténtalo**: `https://www.infomedsoftware.com/software/gesden/` · `https://www.infomedsoftware.com/software/gesden/gesden-g5/cita-online-g5/`

### Setmore — https://www.setmore.com/   `setmore`  
**✔ Agenda por profesional** («Each staff profile comes with a calendar and individual Booking Page link.»)  
**✔ El cliente elige profesional** («Select a service and provider»)  
**✔ Precio: $0 user / mo**  
Capacidades ya verificadas, **no las repitas**: `cap.online_self_service_booking` · `cap.customer_appointment_reminders` · `cap.booking_cancellation_and_rescheduling` · `cap.capacity_and_time_slots` · `cap.no_show_and_deposits` · `cap.embeddable_booking_widget`  
Abiertas: `/features/staff-scheduling` · `/en/articles/12570746-how-to-test-your-setmore-booking-flow` · `/pricing` · `/en/articles/491010-change-your-setmore-account-language`

### Acuity Scheduling — https://www.acuityscheduling.com/   `acuity-scheduling`  
**✔ Agenda por profesional** («If you have multiple staff members or locations, you can create individual calendars for them.»)  
**✔ El cliente elige profesional** («If you have more than one calendar, clients choose a calendar.»)  
**✔ Precio: $16/ month**  
Capacidades ya verificadas, **no las repitas**: `cap.online_self_service_booking` · `cap.customer_appointment_reminders` · `cap.booking_cancellation_and_rescheduling` · `cap.capacity_and_time_slots` · `cap.no_show_and_deposits` · `cap.booking_waitlist` · `cap.embeddable_booking_widget`  
Abiertas: `/hc/en-us/articles/16676883635725-Managing-availability-and-calendars` · `/hc/en-us/articles/16676869573645-How-clients-book-appointments` · `/signup.php` · `/pricing`

### SimplyBook.me — https://simplybook.me/   `simplybook-me`  
**Es directorio público Y programa de gestión. Me interesa el PROGRAMA DE GESTIÓN, no el directorio.**  
**✔ Agenda por profesional** («You can set regular schedule for providers in Manage -> Service Providers»)  
**✔ El cliente elige profesional** («user should be allowed to select Any provider option or choose provider manually.»)  
**✔ Precio: The Free plan includes 50 bookings, 1 custom feature, and 1 provider at $0 **  
Capacidades ya verificadas, **no las repitas**: `cap.online_self_service_booking` · `cap.customer_appointment_reminders` · `cap.booking_cancellation_and_rescheduling` · `cap.capacity_and_time_slots` · `cap.no_show_and_deposits` · `cap.booking_waitlist` · `cap.embeddable_booking_widget`  
Abiertas: `/index.php?title=Adding_services,_providers_and_availability(new_interface)/en` · `/en/booking-system-features` · `/wiki/User_API_guide` · `/en/pricing` · `/en/booking-page`

### Zoho Bookings — https://www.zoho.com/bookings/   `zoho-bookings`  
**✔ Agenda por profesional** («Select the checkbox Customize working hours to edit staff working hours.»)  
**✔ El cliente elige profesional** («When this setting is 'Enabled', it allows the customers to choose their preferred staff from th»)  
Capacidades ya verificadas, **no las repitas**: `cap.online_self_service_booking` · `cap.customer_appointment_reminders` · `cap.booking_cancellation_and_rescheduling` · `cap.capacity_and_time_slots` · `cap.embeddable_booking_widget`  
Abiertas: `/portal/en/kb/bookings/staff/staff-properties/articles/staff-working-hours` · `/portal/en/kb/bookings/workspace/articles/bookings-policies-and-preferences` · `/bookings/pricing.html` · `/de/bookings/pricing.html?sredirect=true` · `/es-xl/bookings/pricing.html`

### Reservio — https://www.reservio.com/   `reservio`  
**Es directorio público Y programa de gestión. Me interesa el PROGRAMA DE GESTIÓN, no el directorio.**  
**✔ Agenda por profesional** («Specific time slots can be set up in the individual staff member's settings using custom bookin»)  
**✔ El cliente elige profesional** («o elija un miembro del personal favorito al que desee acudir (y seleccione el servicio en el se»)  
**✔ Precio: Free**  
Capacidades ya verificadas, **no las repitas**: `cap.online_self_service_booking` · `cap.customer_appointment_reminders` · `cap.capacity_and_time_slots` · `cap.no_show_and_deposits` · `cap.embeddable_booking_widget`  
Abiertas: `/en/articles/6534441-time-slots-for-bookings` · `/en/articles/8512930-how-to-make-bookings-on-reservio` · `/es/articles/5645234-como-crear-una-reserva-a-traves-del-sitio-web-de-reservas-como-cliente` · `/pricing` · `/en/articles/15190264-how-to-add-your-business-to-the-reservio-marketplace`

### Bookeo Appointments — https://www.bookeo.com/appointments/   `bookeo`  
**✔ Agenda por profesional** («It also supports different working hours for each staff member»)  
**✔ El cliente elige profesional** («lets clients choose their preferred staff member»)  
**✔ Precio: € 10,95 EUR/month**  
Capacidades ya verificadas, **no las repitas**: `cap.online_self_service_booking` · `cap.customer_appointment_reminders` · `cap.booking_cancellation_and_rescheduling` · `cap.capacity_and_time_slots` · `cap.no_show_and_deposits` · `cap.booking_waitlist` · `cap.embeddable_booking_widget`  
Abiertas: `/appointments/features/advanced-scheduling/` · `/appointments/salon-scheduling-software/` · `/appointments/pricing/`

### Teachworks — https://www.teachworks.com/   `teachworks`  
**✔ Agenda por profesional** («In addition to the main calendar, Teachworks also offers a Teacher Calendar and a Location Cale»)  
**✔ El cliente elige profesional** («Next, they can choose the teacher/tutor they want to book.»)  
Capacidades ya verificadas, **no las repitas**: `cap.online_self_service_booking` · `cap.customer_appointment_reminders` · `cap.capacity_and_time_slots` · `cap.embeddable_booking_widget`  
Abiertas: `/2019/08/8-features-to-speed-up-music-lesson-scheduling/` · `/2024/08/teachworks-website-booking-plugin-part-1-adding-your-first-booking-option/` · `/pricing` · `/teachworks3-0`

### TutorBird — https://www.tutorbird.com/   `tutorbird`  
**✔ Agenda por profesional** («Set individual tutor availability for new student bookings/consultations directly through your »)  
**✔ Precio: $16.95/month**  
**Falta la pregunta clave: ¿puede el cliente elegir con quién va?** No se encontró. Búscala otra vez.  
Abiertas: `/` · `/have-it-your-way/` · `/public-self-booking/` · `/pricing/`  
No abrieron, **reinténtalo**: `https://www.tutorbird.com/features/`

### Pabau — https://pabau.com/   `pabau`  
**✔ Agenda por profesional** («The Schedule page displays all staff members on the left, with dates across the top.»)  
**✔ El cliente elige profesional** («If applicable, you can also choose your preferred practitioner before proceeding to the calenda»)  
Capacidades ya verificadas, **no las repitas**: `cap.online_self_service_booking` · `cap.customer_appointment_reminders` · `cap.booking_cancellation_and_rescheduling` · `cap.capacity_and_time_slots` · `cap.no_show_and_deposits` · `cap.booking_waitlist`  
Abiertas: `/en/pabau2/how-to-create-a-shift-in-the-scheduler` · `/en/pabau2/how-to-book-an-appointment-via-the-client-portal` · `/pricing/`

### Fresha — https://www.fresha.com/   `fresha`  
**Es directorio público Y programa de gestión. Me interesa el PROGRAMA DE GESTIÓN, no el directorio.**  
**✔ Agenda por profesional** («Scheduled shifts are edited individually for each team member, giving you full control over eac»)  
**✔ El cliente elige profesional** («Clients can explore and select their preferred professional during the booking process»)  
Capacidades ya verificadas, **no las repitas**: `cap.online_self_service_booking` · `cap.customer_appointment_reminders` · `cap.booking_cancellation_and_rescheduling` · `cap.capacity_and_time_slots` · `cap.no_show_and_deposits` · `cap.booking_waitlist` · `cap.embeddable_booking_widget`  
Abiertas: `/help-center/knowledge-base/calendar/252-schedule-and-update-team-shifts` · `/blog/searchable-professional-profiles` · `/pricing`

### Treatwell — https://www.treatwell.es/partners/   `treatwell`  
**Es directorio público Y programa de gestión. Me interesa el PROGRAMA DE GESTIÓN, no el directorio.**  
**De ésta no hay NADA comprobado: ni agenda, ni precio, ni si el cliente elige.**  
**Falta la pregunta clave: ¿puede el cliente elegir con quién va?** No se encontró. Búscala otra vez.  
Abiertas: `/partners/` · `/partners/precios/` · `/partners/soluciones/software-de-gestion-para-salones/`  
No abrieron, **reinténtalo**: `https://support-expert.treatwell.com/en/articles/572314-how-do-i-add-a-new-` · `https://support-expert.treatwell.com/en/articles/16201261-show-an-employee-` · `https://partnercare.treatwell.com/s/?language=es` · `https://help.treatwell.pro/es/`

---

# PARTE A — Las ocho capacidades

Las ocho, en las dieciséis herramientas. **Ninguna se salta.** Si de una no encuentras nada, se responde igual con `desconocido` y dónde miraste. *(La lista se fija entera de antemano a propósito: eligiendo sobre la marcha se estrecha justo donde la prueba incomoda.)*

1. **`cap.per_resource_booking_calendar` — Agenda por profesional o recurso.** Agenda separada por profesional, sala, sillón o máquina, con sus horarios y servicios. *(Ya está verificada en 13 de las 16 — mira el ✔ de cada una.)*
   **Aunque ya esté comprobada, devuélvela igual en la lista.** Si la das por sabida, la lista viene con siete objetos en vez de ocho y parece que falta una.
2. **`cap.online_self_service_booking` — Reserva online por la propia persona.** El cliente coge hora solo, sin llamar, a cualquier hora.
3. **`cap.customer_appointment_reminders` — Recordatorios automáticos.** **Dime el canal** (SMS, correo, WhatsApp) y **si se paga aparte**.
4. **`cap.booking_cancellation_and_rescheduling` — Cancelar y cambiar la cita**, el cliente por su cuenta. **Hacen falta las dos**: si sólo cancela, dilo así.
5. **`cap.capacity_and_time_slots` — Aforo, turnos y franjas.** Duración del hueco, plazas, descansos.
6. **`cap.no_show_and_deposits` — Ausencias y depósitos.** Señal al reservar, política de cancelación, penalización.
7. **`cap.booking_waitlist` — Lista de espera.** Se apunta **y le avisan** al liberarse. Una lista que repasa el personal a mano no cuenta.
8. **`cap.embeddable_booking_widget` — Insertar la reserva en tu propia web.** Con tu aspecto y sin salir de tu dominio. **Un botón que lleva a otra página no cuenta.**

### Y la pregunta que dejó a seis de éstas fuera

Dentro de la primera: **¿puede el CLIENTE elegir con qué profesional va, al reservar él mismo?** No vale que el negocio asigne.

Búscala en el recorrido de reserva, en la ayuda sobre «reserva online» o «cita online», y en las capturas. Tres respuestas: **lo hace** (con cita), **no consta** (dónde miraste), **no lo hace** (sólo si lo dicen con esas palabras).

### Cómo se responde cada capacidad

**`estado`**: `verificado` (lo leíste, con cita) · `desconocido` (buscaste y no hay prueba — **no significa que no lo tenga**, y obliga a decir dónde miraste) · `descartado` (**el fabricante dice que NO**, con cita igual).

**Son esas tres palabras y ninguna más.** No escribas `no_consta`: no existe en el esquema y hay que traducirlo a mano. Lo que quieres decir es `desconocido` — «buscado y no encontrado», que no da por supuesto que falte.

**`profundidad`**, obligatoria si es `verificado`: `nativa` (es el producto) · `modulo` (dentro de una suite, a veces aparte) · `integracion` (**sólo conectando otra herramienta** — di cuál en `integraCon`) · `no_disponible`.

**El plan va aparte de la capacidad.** `planEstado: "verificado"` **sólo si tu cita nombra el plan**; entonces `planMinimo` lleva ese nombre. Si sabes que lo hace pero no en qué plan, `planEstado: "desconocido"` y **`planMinimo: null`**. Nombrar un plan sin prueba es afirmarlo.

**`confianza`**: `alta` **sólo con fuente de primera mano** — `pagina_oficial`, `documentacion`, `tarifa_oficial`, `prueba_directa`. Una comparativa o una reseña, nunca.

**`tipo` de fuente**, sin inventar otros: `pagina_oficial`, `documentacion`, `tarifa_oficial`, `prueba_directa`, `nota_de_version`, `fuente_secundaria`.

**Una portada no sirve como fuente de una función concreta.**

---

# PARTE B — Tamaño, límites, precio e idioma

**`segmentosIdeales`** — De esta lista: `"1-10"`, `"11-50"`, `"51-200"`, `"200+"`. Puede ser más de uno. **No opines: sácalo de sus planes** —cuántos profesionales o usuarios incluye cada uno y hasta dónde llega el mayor—, con la cita.

**Éste es el campo que dejó fuera a la última herramienta que investigaste, y no fue culpa tuya.** Su tarifa publicaba agendas y no usuarios, te negaste con razón a convertir «agendas ilimitadas» en «usuarios ilimitados», y sin tamaño no entra: es obligatorio y con él decide el motor si le sirve a una autónoma sola o a un centro de treinta.

Así que, **si la tarifa no lo dice, búscalo en otra parte antes de rendirte**: las condiciones de contratación, las preguntas frecuentes, la ayuda sobre crear usuarios, la página de precios de cada plan por separado, o cualquier sitio donde digan cuántas personas pueden entrar. Y si después de mirar ahí sigue sin constar, **dilo con esas palabras y dime en qué páginas miraste** — no lo deduzcas de otra unidad.

**`limites`** — **No son sectores excluidos.** Es con qué se da de bruces alguien que SÍ es su cliente: topes de plan, **una licencia por cada centro**, funciones anunciadas y no disponibles, cargo por profesional añadido, países donde no funciona, puesta en marcha aparte.

**`precioInicial`** — El plan más barato de verdad, con lo que incluye. **Dime la moneda que ves y NO conviertas nada.** Si la tarifa no enseña cifras es JavaScript: busca el fichero del selector.

**`citaDelPrecio` no es opcional y no es cualquier frase de la página de tarifas: son las cifras.** Es el recibo que se publica debajo del precio, y lo que se enseña a quien pregunte de dónde sale. Así, tal cual: `«0€/mes […] 15€*/mes […] 30€*/mes»`. El título y la frase de al lado van aparte y no sirven de recibo.

**Y si la misma página te da una moneda distinta según cuándo la abras, dilo.** Ya ha pasado: una tarifa que leída un día decía CAD y otro USD, con la misma cifra. Es un dato, no un estorbo.
**`tienePlanGratuito`** — `true` sólo si es **permanente**. Una prueba de 15 o 30 días NO lo es. Si sólo hay prueba, `null`, no `false`.
**Y una excepción que aprendimos con Jane:** si la tarifa enseña **la tabla entera de planes y ninguno está a cero**, o dicen con sus palabras que no hay plan gratuito, entonces sí es `false` — y me pones la cita. `false` sin tabla completa ni cita, no.

**`idioma`, en dos respuestas separadas**, porque no van juntas:
- **`interfaz`** — las pantallas que usa el negocio.
- **`soporte`** — en qué idiomas atienden.

Cada una `verificado` con la lista y su cita, o `desconocido` diciendo qué buscaste. **Hay herramientas cuya página de reservas está en español y cuya gestión sigue en inglés.** Son cosas distintas.

---

# PARTE C — La ficha

**`categoriaId`** — UNA de esta lista, tal cual: `reservas-citas`, `clinicas-salud`, `formacion-academias`, `agenda-planificacion`, `plataformas-todo-en-uno`, `marketing-email`, `crm`.

**`descripcion`** — Dos o tres frases que entienda alguien que no sabe de software. Sin tecnicismos ni folleto.

**`problemasQueResuelve`** — Tres o cuatro, **en las palabras del cliente, en primera persona**: «Pierdo citas porque no cojo el teléfono a tiempo». No: «Optimización de la gestión de citas».

**`casosDeUso`** — Tres o cuatro ejemplos concretos.

**`idealPara`** — Una frase: qué tipo de negocio la usa.
**`industriasIdeales`** — Sectores en español y minúsculas.
**`noRecomendadaPara`** — Una frase. **No es un defecto: es para quién NO está pensada.** Si no consta, `null`.
**No lo rellenes con un límite de plan.** «No está pensada para quien necesite más de tres CIFs» no es eso: eso es un límite y va en `limites`.

**`funcionesPrincipales`** — Entre cinco y ocho.
**`integraciones`** e **`integracionesPrincipales`** — Por nombre. Si publica un directorio, di cuántas hay **y que es el contador del directorio**.

**`modeloDePrecio`** — Una o varias, sin inventar otras: `freemium`, `suscripcion_mensual`, `suscripcion_anual`, `pago_unico`, `por_usuario`, `a_medida`. Si cobran de otra forma —por centro, por transacción, por tramos—, elige la más cercana **y dilo en `notaDelPrecio`**.

**`ventajas`** — Tres o cuatro, **con hechos, no adjetivos**.
**`inconvenientes`** — Tres o cuatro. **No es una lista de defectos: es lo que hay que tener en cuenta.**

**`metodologiaValoracion`** — En qué te basaste.
**Prohibido «miles de opiniones verificadas en G2 y Capterra» o parecido.**

**`tieneApiPublica`**, **`tieneAppMovil`** — `true`, `false` o `null`. **`false` sólo con cita.**
**`informacionEmpresa`** — País, año, tamaño. `null` lo que no conste. **El domicilio social de las condiciones de contratación NO es prueba del país de origen.**

---

# PARTE D — Lo fácil que es de manejar

**Sin estos campos, una herramienta entra en el catálogo y no sale recomendada nunca.** Está medido: Koibox pasó de no poder colocarse a 38,8 puntos, y lo que cambió fue esto.

**`curvaDeAprendizaje`** — Exactamente una de estas cuatro palabras: `muy_facil`, `facil`, `media`, `dificil`. No por intuición: de lo que publiquen sobre cuánto se tarda en empezar —**cuántos pasos tiene su guía de primeros pasos**, si hace falta formación, si la formación se paga, si hay que migrar datos y quién lo hace—.
- `muy_facil`: te registras y empiezas.
- `facil`: unos pocos pasos guiados, con ayuda escrita.
- `media`: hay que configurar servicios, horarios o personal antes de usarla.
- `dificil`: hace falta implantación, migración asistida o formación obligatoria.

**`facilidadDeUso`** de 1 a 10 — **De la nota de «Ease of Use» de G2 o Capterra**, que se mide sobre reseñas reales. Dame la nota, su escala, **cuántas reseñas la sostienen** y la dirección. Multiplica por 2 para pasarla a 10 y dilo. Es `fuente_secundaria`.

**Antes de dar una por no reseñada, mira las fichas de otros países.** Koibox no aparecía en la española y tenía **18 reseñas en `capterra.ie`**. Prueba `capterra.es`, `capterra.ie`, `capterra.co.uk`, `capterra.com` y `g2.com` antes de responder `null`. Y si al final es `null`, **dime qué fichas miraste una por una**.
No uses la nota general en lugar de la de facilidad de uso: son distintas.

**Y si Capterra o G2 te devuelven un error de tipo de contenido, no es que la página no exista.** Vuelve a intentarlo o entra por el buscador del propio sitio.

**`nivelTecnicoRequerido`** de 1 a 10 — 1 cualquiera puede, 10 hace falta alguien técnico. Con hechos: ¿hay que **tocar código**? ¿configurar un **dominio**? ¿**instalar** algo? ¿hay cosas que **tiene que hacer el fabricante por ti**? Eso último cuenta.

**`facilidadImplementacion`** de 1 a 10 — ¿cobran la **puesta en marcha**? ¿es **obligatoria** una demo? ¿**importan tus datos**? ¿publican un tiempo de puesta en marcha?

**`atencionAlCliente`** de 1 a 10 — canales, **en qué plan** está cada uno, horario, si atienden en español.

**`fiabilidad`** de 1 a 10 — **sólo** con página de estado pública, histórico de incidencias o compromiso con cifra. Si no, `null`.

**`calidad`** y **`escalabilidad`** — **casi siempre `null`**. Sólo con nota desglosada de G2 o Capterra.

**De cada nota, dime en una línea qué la sostiene.**

---

## Cómo quiero la respuesta

**Nada fuera del JSON.** Ve de dos en dos, y **no pares hasta las 16**.

```json
{
  "fecha": "AAAA-MM-DD",
  "herramientas": [
    {
      "id": "dricloud",
      "nombre": "DriCloud",
      "paginaOficial": "https://dricloud.com/",
      "urlPrecios": "https://dricloud.com/precios/",
      "categoriaId": "clinicas-salud",

      "descripcion": "...",
      "problemasQueResuelve": ["..."], "casosDeUso": ["..."],
      "idealPara": "...", "industriasIdeales": ["..."], "noRecomendadaPara": null,
      "funcionesPrincipales": ["..."],
      "integraciones": ["..."], "integracionesPrincipales": ["..."],
      "cuantasIntegracionesPublica": null,
      "ventajas": ["..."], "inconvenientes": ["..."],
      "metodologiaValoracion": "...",
      "tieneApiPublica": null, "tieneAppMovil": null,
      "informacionEmpresa": { "paisOrigen": null, "anioFundacion": null, "tamanoAproximado": null },

      "segmentosIdeales": ["1-10"],
      "porQueEseTamano": "Cita de la tarifa con el número de usuarios.",
      "oNoLoPublican": false,
      "limites": [{ "texto": "Qué topa.", "cita": "...", "url": "..." }],

      "precioInicial": "...", "moneda": "EUR",
      "modeloDePrecio": ["suscripcion_mensual"], "notaDelPrecio": null,
      "tienePlanGratuito": null,
      "citaDelPrecio": "Las cifras, tal cual salen.", "urlDelPrecio": "...",

      "idioma": {
        "interfaz": { "estado": "verificado", "idiomas": ["es"], "cita": "...", "url": "..." },
        "soporte":  { "estado": "desconocido", "nota": "Qué buscaste y dónde." }
      },

      "curvaDeAprendizaje": "facil",
      "porQueEsaCurva": "Pasos de su guía, si hay formación, si hay migración.",
      "puntuaciones": {
        "facilidadDeUso": null, "nivelTecnicoRequerido": 3,
        "facilidadImplementacion": 7, "atencionAlCliente": null,
        "fiabilidad": null, "calidad": null, "escalabilidad": null
      },
      "porQueCadaNota": {
        "facilidadDeUso": "Fichas miradas: capterra.es, capterra.ie, capterra.co.uk, g2.com — resultado de cada una.",
        "nivelTecnicoRequerido": "Qué hechos lo sostienen.",
        "facilidadImplementacion": "Qué hechos lo sostienen.",
        "atencionAlCliente": "Canales, plan y horario.",
        "fiabilidad": "Qué buscaste y dónde."
      },

      "capacidades": [
        {
          "capacidadId": "cap.online_self_service_booking",
          "estado": "verificado", "profundidad": "nativa", "integraCon": null,
          "planEstado": "desconocido", "planMinimo": null, "confianza": "alta",
          "nota": "Límites que cambian la decisión.",
          "fuentes": [{ "tipo": "documentacion", "url": "https://...", "cita": "...",
            "tituloDeLaPagina": "...", "fraseDeAlLado": "..." }]
        }
      ],

      "eligeElClienteConQuienVa": {
        "estado": "verificado", "cita": "...", "url": "...",
        "tituloDeLaPagina": "...", "fraseDeAlLado": "...",
        "dondeMiraste": "Si es no consta: las direcciones que abriste."
      },

      "paginasQueAbriste": ["https://..."],
      "paginasQueNoSeAbrieron": ["https://... — motivo"],
      "loQueNoPudeComprobar": "Qué falta y por qué."
    }
  ],
  "pendientes": ["los ids que NO has hecho"]
}
```

Los dieciséis ids, tal cual, **y son los que tiene que llevar `pendientes` mientras no estén hechos**:

`dricloud` · `flowww` · `reservo` · `qvet` · `gesden-g5` · `setmore` · `acuity-scheduling` · `simplybook-me` · `zoho-bookings` · `reservio` · `bookeo` · `teachworks` · `tutorbird` · `pabau` · `fresha` · `treatwell`

### Antes de enviar

- **¿`pendientes` lleva los ids que no has hecho?** Es lo único que ha fallado cinco veces. **Con dieciséis es seguro que no acabas en una tanda: eso no es un problema, ocultarlo sí.**
- ¿Hay **ocho** objetos en `capacidades` de cada herramienta, aunque siete sean `desconocido`?
- ¿Has escrito `no_consta` en algún sitio? Cámbialo por `desconocido`.
- ¿`citaDelPrecio` lleva cifras, o te has quedado con una frase cualquiera de la página de tarifas?
- ¿Cada `verificado` lleva `profundidad` y una fuente con cita, título y frase de al lado?
- ¿Algún `planMinimo` con nombre y `planEstado: "desconocido"`? Mal: o lo demuestras, o va a `null`.
- ¿Alguna `confianza: "alta"` sostenida por un comparador? Mal: baja a `media`.
- ¿`curvaDeAprendizaje` es una de las cuatro palabras, o `null`?
- ¿Algún `facilidadDeUso: null` sin decir qué fichas de qué países miraste?
- ¿Algún `tienePlanGratuito: true` que sea una prueba de 30 días? Mal.
- ¿Algún `tienePlanGratuito: false` sin la tabla completa de planes o sin cita? A `null`.
- ¿Has convertido alguna moneda? No se convierte.
- ¿Has escrito algo fuera del JSON? Quítalo.
