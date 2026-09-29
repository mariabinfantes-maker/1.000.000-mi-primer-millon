# Encargo único: las 8 que corté mal

Ocho herramientas que salieron del barrido del 28 y quedaron fuera. Cinco de
ellas se cortaron porque «el cliente elige profesional» salió `no_encontrado`,
y eso NO es motivo de descarte: es que no lo encontramos. Tres no verificaron
nada porque su documentación no se pudo abrir.

Este encargo pide **todo lo que hace falta para meterlas en el catálogo y para
que sus capacidades cuenten como verificadas**: la ficha entera, las ocho
capacidades con prueba, el plan de cada una, el idioma y el precio.

Copia todo lo que va debajo de la línea.

---
Eres un investigador. Necesito meter en un catálogo español de herramientas 8 programas de gestión de citas. Todo tiene que salir de la web oficial del fabricante, abierta por ti.

**Es un encargo único: no habrá segunda ronda.** Si algo no lo puedes comprobar, ponlo a `null` o al estado «no consta» y dime dónde miraste. **Eso es una respuesta válida y me sirve.** Lo que no me sirve es tener que volver a pedírtelo.

## Las 8

```
1. Clinic Cloud   https://clinic-cloud.com/      clínicas y centros médicos (España)
2. DriCloud       https://dricloud.com/          consultas y clínicas (en español)
3. Koibox         https://koibox.cloud/          peluquerías y estética (España)
4. flowww         https://www.flowww.es/         medicina estética y belleza (España)
5. TutorBird      https://www.tutorbird.com/     tutores y academias
6. QVET           https://qvet.net/              clínicas veterinarias (España)
7. Gesden G5      https://www.infomedsoftware.com/   clínicas dentales (España)
8. Treatwell      https://www.treatwell.es/partners/ peluquería y estética
```

### Lo que YA está comprobado — no lo repitas

| | Agenda por profesional | Precio más bajo |
|---|---|---|
| Clinic Cloud | ✔ «dispones de agendas personalizadas para cada profesional» | ✔ 29 € al mes + IVA (plan Mini) |
| DriCloud | ✔ «Cada profesional decide sus horarios y tipos de cita disponibles online» | ✔ 42 €/mes con IVA, anual (plan ESENCIAL, un profesional) |
| Koibox | ✔ ficha del empleado con su horario | ✔ 0 €/mes (plan Free, un usuario) |
| flowww | ✔ «visual por doctor e información sobre la cita» | ✔ 59 €/mes (licencia Boss, sin IVA) |
| TutorBird | ✔ «Set individual tutor availability…» | ✔ 16,95 $/mes (un tutor) |
| QVET | — nada | — nada |
| Gesden G5 | — nada | — nada |
| Treatwell | — nada | — nada |

De las cinco primeras **da por buenos la agenda y el precio** y dedica el esfuerzo al resto. De QVET, Gesden G5 y Treatwell hace falta todo: en su día la página de cita online de Gesden quedó bloqueada, QVET no publica precio y los artículos de ayuda de Treatwell daban error. **Inténtalo otra vez; si vuelve a fallar, dímelo con esas palabras.**

---

## PARTE A — Las ocho capacidades, una por una

Estas ocho, **todas, en las ocho herramientas**. Ninguna se salta. Si de una no encuentras nada, se responde igual con «no consta» y dónde miraste. *(Se fija la lista entera de antemano a propósito: si se va eligiendo sobre la marcha, la lista se estrecha justo donde la prueba incomoda.)*

1. **`cap.per_resource_booking_calendar` — Agenda por profesional o recurso.** Agenda separada por profesional, sala, sillón o máquina, con sus horarios y sus servicios. *(Ya está en las cinco de arriba.)*
2. **`cap.online_self_service_booking` — Reserva online por la propia persona.** Que el cliente coja hora solo, por internet, sin llamar y a cualquier hora.
3. **`cap.customer_appointment_reminders` — Recordatorios automáticos.** Avisar al cliente antes de su cita, por el canal que sea, sin que nadie llame. **Dime el canal (SMS, correo, WhatsApp) y si se paga aparte.**
4. **`cap.booking_cancellation_and_rescheduling` — Cancelar y cambiar la cita.** Anularla o moverla liberando el hueco. **Hacen falta las dos cosas**: si sólo se puede cancelar, dilo así.
5. **`cap.capacity_and_time_slots` — Aforo, turnos y franjas.** Cuánta gente cabe y cuándo: duración del hueco, plazas, turnos, descansos.
6. **`cap.no_show_and_deposits` — Ausencias y depósitos.** Señal previa, política de cancelación, penalización, aviso de reincidencia.
7. **`cap.booking_waitlist` — Lista de espera.** Apuntar a quien no encontró hueco **y avisarle** cuando se libera. Una lista que el personal repasa a mano no cuenta.
8. **`cap.embeddable_booking_widget` — Insertar la reserva en tu propia web.** Que el sistema de reserva se meta en la web del negocio, con su aspecto y sin salir de su dominio. **Un botón que lleva a otra página no cuenta.**

### Y la pregunta que dejó a cinco de éstas fuera

Dentro de `cap.per_resource_booking_calendar` necesito una cosa concreta: **¿puede el CLIENTE elegir con qué profesional va, al reservar él mismo?** No vale que el negocio asigne. Tiene que elegir quien reserva.

Búscala en el recorrido de reserva online, en la ayuda sobre «reserva online» o «cita online», y en las capturas de la página de reservas. **De Clinic Cloud, mira además su integración con Doctoralia**, porque su reserva online va por ahí.

Tres respuestas posibles: **lo hace** (con cita), **no consta** (dónde miraste), **no lo hace** (sólo si el fabricante lo dice con esas palabras).

### Cómo se responde cada capacidad

**`estado`** — uno de tres:
- `verificado` — lo leíste, con cita literal.
- `desconocido` — buscaste y no hay prueba bastante. **No significa que no lo tenga.** Obliga a decir qué buscaste y dónde.
- `descartado` — **el fabricante dice que NO lo hace**, con esas palabras. Lleva cita igual.

**`profundidad`** — obligatoria sólo si es `verificado`, y una de estas cuatro:
- `nativa` — es el producto, o una parte central de él.
- `modulo` — existe dentro de una suite más amplia, a veces como módulo que se contrata aparte.
- `integracion` — **sólo funciona conectando otra herramienta.** Entonces dime cuál en `integraCon`. *(Clinic Cloud con Doctoralia es probablemente este caso.)*
- `no_disponible` — hay prueba de que NO lo hace.

**El plan va aparte de la capacidad, y esto es importante.** Son dos certezas distintas:
- `planEstado: "verificado"` sólo si tu cita **nombra el plan**. Entonces `planMinimo` lleva el plan más barato donde la función existe de verdad, **con el nombre que le da el fabricante**.
- `planEstado: "desconocido"` si sabes que lo hace pero no en qué plan. **Entonces `planMinimo` va a `null`.** Nombrar un plan sin prueba es afirmarlo.

**`confianza`** — `alta`, `media` o `baja`. **Sólo puede ser `alta` si la fuente es de primera mano**: página oficial, documentación, tarifa oficial o prueba directa. Una comparativa, un directorio o una reseña, por buena que parezca, **nunca** sostiene `alta`.

**`tipo` de cada fuente** — uno de: `pagina_oficial`, `documentacion`, `tarifa_oficial`, `prueba_directa`, `nota_de_version`, `fuente_secundaria`.

**Una portada no sirve como fuente de una función concreta.** La dirección tiene que ser la página donde lo pone.

---

## PARTE B — El idioma, separado en dos

No basta con «está en español». Necesito **dos respuestas independientes**, porque no van siempre juntas:

- **`interfaz`** — las pantallas que usa el negocio, en qué idiomas están.
- **`soporte`** — en qué idiomas atienden.

Cada una: `verificado` con la lista de idiomas (`["es","en"]`) y su cita, o `desconocido` diciendo qué buscaste.

**Y ojo con una trampa que ya nos pasó:** hay herramientas cuya página de reservas del cliente está en español pero cuya gestión sigue en inglés. **Son cosas distintas. Dímelo si las ves separadas.** (TutorBird y Treatwell son las candidatas a esto.)

---

## PARTE C — La ficha de catálogo

De las ocho, todo esto:

**`categoriaId`** — elige UNA de esta lista, tal cual:
`reservas-citas`, `clinicas-salud`, `formacion-academias`, `agenda-planificacion`, `plataformas-todo-en-uno`, `marketing-email`, `crm`.

**`descripcion`** — Dos o tres frases que entienda alguien que no sabe de software. Sin tecnicismos y sin lenguaje de folleto.

**`problemasQueResuelve`** — Tres o cuatro, **en las palabras del cliente, en primera persona**. Así: «Pierdo citas porque no cojo el teléfono a tiempo». No así: «Optimización de la gestión de citas».

**`casosDeUso`** — Tres o cuatro ejemplos concretos. «Una clínica con cuatro fisios deja que el paciente elija con quién va».

**`idealPara`** — Una frase: qué tipo de negocio la usa.

**`segmentosIdeales`** — Tramos de plantilla del CLIENTE, exactamente de esta lista: `"1-10"`, `"11-50"`, `"51-200"`, `"200+"`. Puede ser más de uno. **No opines: sácalo de sus planes** — cuántos profesionales o usuarios incluye cada plan y hasta dónde llega el mayor. Con la cita. Si no publican números, dilo.

**`industriasIdeales`** — Sectores en español y minúsculas: `["clínicas dentales", "fisioterapia"]`.

**`noRecomendadaPara`** — Una frase. **No es un defecto: es para quién NO está pensada.** «No está pensada para quien necesita facturación con VeriFactu».

**`casosNoRecomendados`** — **Esto NO son sectores excluidos.** Es con qué se va a dar de bruces alguien que SÍ es su cliente: topes de plan, una licencia por cada centro, funciones anunciadas y no disponibles, cargo por cada profesional añadido, países donde no funciona, puesta en marcha que se paga aparte.

**`funcionesPrincipales`** — Entre cinco y ocho, las que la definen.

**`integraciones`** e **`integracionesPrincipales`** — Con qué se conecta, por nombre. Si publica un directorio, dime cuántas hay.

**`precioInicial`** — Texto claro, con moneda y con lo que incluye: «Desde 29 € al mes + IVA, plan Mini». **Dime siempre qué moneda estás viendo y NO conviertas nada.**

**`modeloDePrecio`** — Una o varias, tal cual: `freemium`, `suscripcion_mensual`, `suscripcion_anual`, `pago_unico`, `por_usuario`, `a_medida`.

**`tienePlanGratuito`** — `true` sólo si hay plan gratuito **permanente**. **Una prueba de 15 o 30 días no lo es.** Si la tarifa habla de prueba pero no dice nada de plan permanente, `null`, no `false`.

**`tieneApiPublica`**, **`tieneAppMovil`** — `true`, `false` o `null`.

**`ventajas`** — Tres o cuatro. **Con hechos, no con adjetivos.** «Cobra la señal al reservar» sí. «Muy potente» no.

**`inconvenientes`** — Tres o cuatro. **No es una lista de defectos: es lo que hay que tener en cuenta.** «Los SMS se pagan aparte». «El plan de entrada incluye un solo usuario».

**`informacionEmpresa`** — País de origen, año de fundación, tamaño aproximado. `null` lo que no conste.

**`urlPrecios`** — La dirección de su tarifa.

### Las siete valoraciones

De 1 a 10. **Sólo pon número donde puedas justificarlo con algo que hayas leído. Donde no, `null`.**

- **`nivelTecnicoRequerido`** — 1 es apta sin conocimientos técnicos, 10 exige equipo técnico. Con hechos: si hay que migrar datos, instalar algo, contratar implantación.
- **`facilidadImplementacion`** — cuántos pasos para empezar, si hay puesta en marcha de pago, si hay que importar historiales.
- **`fiabilidad`** — **sólo** si publican página de estado, histórico de caídas o compromiso de disponibilidad. Si no, `null`.
- **`atencionAlCliente`** — según canales y en qué plan: chat, teléfono, correo, horario, si atienden en español.
- **`facilidadDeUso`**, **`calidad`**, **`escalabilidad`** — **casi siempre `null`**. Ningún fabricante publica que su producto es un 7. Ponlos sólo si encuentras la nota desglosada de G2 o Capterra para ese aspecto, y di de dónde.

**`metodologiaValoracion`** — En qué te basaste, herramienta por herramienta. Ejemplo: *«Nivel técnico e implantación, de su guía de puesta en marcha. Atención al cliente, de su página de soporte. Los demás quedan sin valorar.»*

**Prohibido escribir «miles de opiniones verificadas en G2 y Capterra» o cualquier frase parecida.** Es justo la frase que estamos quitando del catálogo.

---

## Las normas

- **Abre las páginas.** Si no la abriste, no la cites.
- **Sólo vale la palabra del fabricante:** su web, su documentación, su centro de ayuda, su tarifa. **No valen** blogs ajenos, comparadores, directorios ni reseñas. Si el único sitio donde aparece algo es el blog del propio fabricante, vale, **pero dímelo**.
- **Cada dato que afirme algo lleva cita literal y dirección.** Sin cita, `null` o `desconocido`.
- **Lo que no encuentres, `null`.** Un `null` honrado vale más que un dato verosímil. **No lo rellenes con algo razonable.**
- **Nunca escribas que no lo tiene** salvo que el fabricante lo diga con esas palabras.
- Si una página no carga, pide iniciar sesión, o es un PDF que no puedes leer, **dilo**. «No pude abrirla» no es «no lo tiene».
- **No juzgues.** Nada de rankings ni «es la mejor». Si algo no encaja, se dice **para quién está pensada y para quién no**.
- **Nada de afiliación**: ni la investigues ni la menciones.
- **Escribe en español**, salvo las citas, que van en su idioma original.

## Dos avisos, por experiencia con estas webs

**No me des una dirección que no hayas abierto.** Ya me dieron cuatro juegos de direcciones de un centro de ayuda que no existían, con citas que sonaban perfectas. Los identificadores de artículo hay que sacarlos navegando.

Por eso cada cita lleva dos pruebas de que estuviste allí: el **título exacto de la página** y **una frase de al lado** sin relación con lo que busco.

**Y algunas webs pintan sus tarifas con JavaScript**, u ofrecen monedas distintas según desde dónde entres. Si ves nombres de plan sin cifras, es eso: dímelo. **Di siempre qué moneda ves y no conviertas.**

## Cómo quiero la respuesta

Ve de dos en dos o de tres en tres para no atragantarte, pero **no pares hasta las 8**. Al final de cada tanda, sólo este JSON:

```json
{
  "fecha": "AAAA-MM-DD",
  "herramientas": [
    {
      "id": "clinic-cloud",
      "nombre": "Clinic Cloud",
      "paginaOficial": "https://clinic-cloud.com/",
      "urlPrecios": "https://clinic-cloud.com/tarifas",
      "categoriaId": "clinicas-salud",

      "descripcion": "...",
      "problemasQueResuelve": ["..."],
      "casosDeUso": ["..."],
      "idealPara": "...",
      "segmentosIdeales": ["1-10"],
      "porQueEseTamano": "Cita de la tarifa.",
      "industriasIdeales": ["..."],
      "noRecomendadaPara": "...",
      "casosNoRecomendados": ["..."],
      "funcionesPrincipales": ["..."],
      "integraciones": ["..."],
      "integracionesPrincipales": ["..."],

      "precioInicial": "Desde 29 € al mes + IVA, plan Mini",
      "moneda": "EUR",
      "modeloDePrecio": ["suscripcion_mensual"],
      "tienePlanGratuito": null,
      "citaDelPrecio": "...",

      "tieneApiPublica": null,
      "tieneAppMovil": true,

      "puntuaciones": {
        "nivelTecnicoRequerido": 3,
        "facilidadImplementacion": null,
        "fiabilidad": null,
        "atencionAlCliente": 6,
        "facilidadDeUso": null,
        "calidad": null,
        "escalabilidad": null
      },
      "metodologiaValoracion": "...",

      "ventajas": ["..."],
      "inconvenientes": ["..."],
      "informacionEmpresa": { "paisOrigen": "España", "anioFundacion": null, "tamanoAproximado": null },

      "idioma": {
        "interfaz": { "estado": "verificado", "idiomas": ["es"], "cita": "...", "url": "..." },
        "soporte":  { "estado": "desconocido", "nota": "Qué buscaste y dónde." }
      },

      "capacidades": [
        {
          "capacidadId": "cap.online_self_service_booking",
          "estado": "verificado",
          "profundidad": "integracion",
          "integraCon": "Doctoralia",
          "planEstado": "desconocido",
          "planMinimo": null,
          "confianza": "alta",
          "nota": "Límites que cambian la decisión.",
          "fuentes": [
            {
              "tipo": "documentacion",
              "url": "https://...",
              "cita": "frase literal",
              "tituloDeLaPagina": "el título exacto",
              "fraseDeAlLado": "otra frase de esa página, sin relación"
            }
          ]
        }
      ],

      "eligeElClienteConQuienVa": {
        "estado": "verificado",
        "cita": "...",
        "url": "...",
        "tituloDeLaPagina": "...",
        "fraseDeAlLado": "...",
        "dondeMiraste": "Si es no consta: las direcciones que abriste."
      },

      "paginasQueAbriste": ["https://..."],
      "paginasQueNoSeAbrieron": ["https://... — motivo"],
      "loQueNoPudeComprobar": "Qué falta y por qué."
    }
  ]
}
```

Las ocho capacidades tienen que aparecer todas en las ocho herramientas, aunque sea con `desconocido`.
