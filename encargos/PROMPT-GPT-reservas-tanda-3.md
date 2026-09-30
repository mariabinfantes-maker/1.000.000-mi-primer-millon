# Encargo para GPT — tercera tanda de las 17 de reservas

Guardado aquí porque la propietaria tuvo que cambiar de chat y el encargo se
quedó en el anterior. **Es autónomo: no hace falta nada de conversaciones
previas.** Para las tandas siguientes se cambia sólo la lista de herramientas.

Copia todo lo que va debajo de la línea. Necesita navegación activada.

---
Eres un investigador. Estoy completando las fichas de unas herramientas de reservas y citas para un catálogo. Todo tiene que salir de la web oficial del fabricante, abierta por ti.

## Las cinco de esta tanda

Cliniko · https://www.cliniko.com/
Jane · https://jane.app/
Pabau · https://pabau.com/
Fresha · https://www.fresha.com/
Booksy · https://biz.booksy.com/

## Dato 1 — Siete funciones, una por una

De cada herramienta, si hace cada una de estas siete. **Ya tengo comprobadas la agenda por profesional y que el cliente elija con quién, así que ésas no hacen falta.**

- `cap.online_self_service_booking` — **Reserva online por la propia persona.** El cliente reserva él solo desde internet, sin llamar ni escribir.
- `cap.customer_appointment_reminders` — **Recordatorios automáticos.** Avisar al cliente de una cita ya reservada, por SMS, correo o WhatsApp.
- `cap.booking_cancellation_and_rescheduling` — **Cancelar y cambiar la cita.** El cliente lo hace él mismo, sin llamar.
- `cap.capacity_and_time_slots` — **Aforo, turnos y franjas.** Cuántas personas caben en una sesión, duración de cada hueco, descansos entre citas.
- `cap.no_show_and_deposits` — **Ausencias y depósitos.** Cobrar una señal al reservar, o penalizar al que no aparece.
- `cap.booking_waitlist` — **Lista de espera.** Si no hay hueco, el cliente se apunta y le avisan cuando se libere.
- `cap.embeddable_booking_widget` — **Insertar la reserva en tu propia web.** Un trozo de código para poner el calendario en la web del negocio, en vez de mandar al cliente a otra página.

**Tres estados, y sólo tres:**

- `verificado` — lo leíste en la página, con cita literal.
- `no_consta` — abriste páginas y no lo encontraste. **No significa que no lo tenga.**
- `descartado` — **el fabricante dice que NO lo tiene**, con esas palabras. Lleva cita igual.

**No deduzcas.** Un recordatorio no es una lista de espera. Cobrar por internet no es cobrar una señal al reservar. Tener página de reservas propia no es poder insertarla en la web del negocio.

## Dato 2 — Para cuántas personas está pensada

No opines: **mírate sus planes.** Cuántos usuarios o profesionales incluye cada uno, y hasta dónde llega el mayor.

De ahí sale el tramo: `1-10`, `11-50`, `51-200`, `200+`. Puede ser más de uno.

Cómo se razona: si el plan pequeño trae un usuario, el mediano cinco y el grande diez, es `1-10` y nada más. Si el mayor no pone tope, puede llegar más arriba.

**Dime siempre en qué te basaste**, con la cita de la tarifa.

## Dato 3 — Qué límite tiene, aunque seas su cliente

Esto **no** es qué sectores excluye. Preguntado así se contesta «no encontré ninguna exclusión expresa», y eso no sirve.

Es **con qué se va a dar de bruces alguien que SÍ es su cliente**. Ejemplos reales de otras herramientas:

- «Cada centro necesita su propia licencia» — una clínica con dos sedes paga dos veces. Y es para clínicas.
- «El plan gratuito está limitado a cuatro usuarios»
- «La lista de espera sólo está en los planes Standard o Premium»
- «La licencia se contrata por sede y el precio depende de cuántos recursos tenga»
- «VeriFactu figura anunciado como próximamente» — una función que aún no está.

Busca en la tarifa, en las condiciones y en el centro de ayuda: topes de plan, licencias por sede, funciones anunciadas y no disponibles, límites de reservas al mes, cargos por persona adicional, permanencias, países donde no funciona.

Si de verdad no encuentras ninguno, ponlo a `null` y dime dónde buscaste.

## Dato 4 — Plan gratuito y precios

- ¿Tiene **plan gratuito permanente**? Sí o no, con su cita. **Una prueba de 15 o 30 días no es un plan gratuito.**
- **Necesito el precio de Pabau y de Fresha**, que no lo tengo.
- De **Fresha** ya vi «19.95» para Independent y «14.95 por miembro» para Team, pero con el símbolo `$` sin identificar. **Dime la moneda** y si Team tiene un mínimo de miembros facturables.
- De **Cliniko**: su plan gratuito parece ser sólo para entidades benéficas y educativas. Confírmalo con su cita, y dime el precio para un negocio normal.

## Dos encargos sueltos de la tanda anterior

**Reservio** — https://www.reservio.com/ — me falta el tamaño de empresa. Se me dijo que su documentación habla de personas, pequeñas empresas y empresas en crecimiento, pero sin números. Insiste:

- ¿Cuántos miembros del personal admite cada plan? Mira la **comparación de planes**, no sólo la descripción.
- Su plan Enterprise dice que el precio varía según el número de calendarios. ¿Hay un máximo, o no hay tope?
- En su centro de ayuda (`help.reservio.com`), busca artículos sobre añadir personal o sobre límites de usuarios por plan.

Si después de eso sigue sin publicar cifras, dilo con esas palabras. **Es un dato que ellos no publican, no un fallo tuyo.**

**Reservo** — https://reservo.cl/ — me falta el precio. Sus páginas comerciales devolvieron contenido vacío: `reservo.cl`, `reservo.cl/homepage/cl/default/` y `reservo.cl/us/`. Prueba otras vías:

- Su centro de ayuda en `intercom.help/reservo` sí se abre. Busca si algún artículo menciona los importes de los planes.
- Ya tengo de ahí que una agenda adicional cuesta **10.000 + IVA al mes**, en pesos chilenos. Eso da la moneda, pero no el precio de entrada.
- ¿Hay alguna página de planes que sí cargue?

Si no lo consigues, dilo. **Mejor sin demostrar que inventado.**

## Las normas

- **Abre las páginas.** Si no la abriste, no la cites.
- **Sólo vale la palabra del fabricante:** su web, su documentación, su centro de ayuda. **No valen** blogs ajenos, comparadores, directorios de software ni reseñas de usuarios.
- **Cada «sí» lleva cita literal y dirección.** Sin cita, `no_consta`.
- **Lo que no encuentres, `null`.** Un `null` honrado vale más que un dato verosímil.
- **Nunca escribas que no lo tiene** salvo que el fabricante lo diga con esas palabras. Entonces es `descartado`, con su cita.
- Si una página no carga, o pide iniciar sesión, **dilo**. «No pude abrirla» no es «no lo tiene».
- **No juzgues.** Nada de rankings, notas ni «es la mejor». Si algo no encaja, se dice **para quién está pensada y para quién no**.
- **Nada de afiliación**: ni la investigues ni la menciones.

## Un aviso, por experiencia

Ya me han dado direcciones de centros de ayuda que **no existían**, con citas que sonaban perfectas. Los identificadores de artículo hay que sacarlos navegando, no de memoria.

Por eso cada cita va con dos pruebas de que estuviste allí: el **título exacto de la página** y **una frase de al lado** que no tenga nada que ver con lo que busco.

Y otro: **algunas webs pintan sus tarifas con JavaScript.** Si ves los nombres de los planes sin cifras, dilo; no estimes.

## Cómo quiero la respuesta

Primero dos líneas: cuántas completaste y qué te bloqueó.

Después, **sólo este JSON**, sin nada alrededor:

```json
{
  "fecha": "2026-09-29",
  "herramientas": [
    {
      "id": "cliniko",
      "capacidades": [
        {
          "id": "cap.online_self_service_booking",
          "estado": "verificado",
          "cita": "frase literal de la página",
          "url": "https://...",
          "tituloDeLaPagina": "el título exacto",
          "fraseDeAlLado": "otra frase de esa misma página, sin relación con lo que busco"
        },
        {
          "id": "cap.booking_waitlist",
          "estado": "no_consta",
          "cita": null, "url": null, "tituloDeLaPagina": null, "fraseDeAlLado": null
        }
      ],
      "segmentosIdeales": ["1-10"],
      "porQueEseTamano": "Cita de la tarifa en la que te basaste.",
      "limites": [
        { "texto": "En una frase, qué topa.", "cita": "frase literal", "url": "https://..." }
      ],
      "tienePlanGratuito": false,
      "citaPlanGratuito": "Lo que dice la página, o null",
      "urlPlanGratuito": "https://...",
      "precio": {
        "necesario": true,
        "precioInicial": "Desde X al mes",
        "moneda": "EUR | USD | otra",
        "cita": "frase literal de la tarifa",
        "url": "https://..."
      },
      "paginasQueAbriste": ["https://..."],
      "paginasQueNoSeAbrieron": ["https://... — motivo"],
      "loQueNoPudeComprobar": "Qué te falta y por qué."
    }
  ],
  "reservio": {
    "segmentosIdeales": ["1-10"],
    "porQueEseTamano": "...",
    "oNoLoPublican": false,
    "paginasQueAbriste": ["https://..."]
  },
  "reservo": {
    "precioInicial": "...",
    "moneda": "CLP",
    "cita": "...",
    "url": "https://...",
    "oNoSePudo": false,
    "paginasQueNoSeAbrieron": ["https://..."]
  }
}
```

Las siete capacidades tienen que aparecer todas en cada herramienta, aunque sea con `no_consta`. En `precio`, pon `"necesario": true` sólo en Pabau, Fresha y Cliniko.
