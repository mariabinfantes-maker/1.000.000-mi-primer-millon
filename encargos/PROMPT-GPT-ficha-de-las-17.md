# Encargo único: la ficha completa de las 15 de reservas

**Uno solo, y completo.** Sustituye a los encargos por tandas, que pedían de
menos y obligaban a volver. Copia todo lo que va debajo de la línea.

---
Eres un investigador. Necesito completar la ficha de catálogo de 15 herramientas de reservas y citas. Todo tiene que salir de la web oficial del fabricante, abierta por ti.

**Es un encargo único: no habrá una segunda ronda.** Si algo no lo puedes comprobar, ponlo a `null` y dime por qué; eso es una respuesta válida y me sirve. Lo que no me sirve es tener que volver a pedírtelo.

## Las 15, y qué tengo ya de cada una

De **catorce** ya tengo comprobadas sus funciones, su tamaño de empresa, sus límites y su precio. **De ésas sólo necesito la ficha** (el bloque de abajo llamado «La ficha»).

```
AgendaPro            https://agendapro.com/
Reservo              https://reservo.cl/
Setmore              https://www.setmore.com/
Acuity Scheduling    https://www.acuityscheduling.com/
Zoho Bookings        https://www.zoho.com/bookings/
Reservio             https://www.reservio.com/
Bookeo Appointments  https://www.bookeo.com/appointments/
TIMIFY               https://www.timify.com/
Teachworks           https://www.teachworks.com/
Cliniko              https://www.cliniko.com/
Jane                 https://jane.app/
Pabau                https://pabau.com/
Fresha               https://www.fresha.com/
Booksy               https://biz.booksy.com/
```

De **SimplyBook.me** necesito la ficha **y además el tamaño de empresa**:

```
SimplyBook.me        https://simplybook.me/
```

**Square Appointments y Schedulista ya están hechas** (2026-09-29) y salen de este encargo. No las investigues.

---

## LA FICHA — lo que necesito de las 15

Todo esto, de cada una:

**`categoriaId`** — elige UNA de esta lista, escrita tal cual:
`reservas-citas`, `clinicas-salud`, `formacion-academias`, `agenda-planificacion`, `plataformas-todo-en-uno`, `marketing-email`, `crm`.
**No lo dejes vacío y no te inventes otra**: si ninguna encaja bien, pon la más cercana y dilo en `loQueNoPudeComprobar`.

**`descripcion`** — Dos o tres frases que entienda alguien que no sabe de software. Qué es y para qué sirve. Sin tecnicismos y sin lenguaje de folleto.

**`problemasQueResuelve`** — Tres o cuatro, **en las palabras del cliente, en primera persona**. Así: «Pierdo citas porque no cojo el teléfono a tiempo». No así: «Optimización de la gestión de citas».

**`casosDeUso`** — Tres o cuatro ejemplos concretos y reconocibles. «Una peluquería con tres profesionales deja que el cliente elija con quién se corta el pelo».

**`idealPara`** — Una frase: qué tipo de negocio la usa.

**`industriasIdeales`** — Lista de sectores, en español y en minúsculas: `["peluquerías", "clínicas dentales", "fisioterapia"]`.

**`noRecomendadaPara`** — Una frase. **No es un defecto: es para quién no está pensada.** «No está pensada para quien necesita facturación con VeriFactu».

**`funcionesPrincipales`** — Entre cinco y ocho, las que la definen.

**`integraciones`** — Con qué se conecta, por nombre. Si publica un directorio de integraciones, dime cuántas hay y nombra las principales.

**`integracionesPrincipales`** — Las tres o cuatro que de verdad importan.

**`modeloDePrecio`** — Una o varias de estas, tal cual: `freemium`, `suscripcion_mensual`, `suscripcion_anual`, `pago_unico`, `por_usuario`, `a_medida`.

**`idiomasDisponibles`** — Códigos: `["es", "en", "pt"]`. **Y dime si el idioma es del PRODUCTO o sólo de la página de reservas del cliente.** Son cosas distintas y nos ha pasado ya: hay herramientas cuya pantalla de reservas está en español pero cuya gestión sigue en inglés.

**`disponibleEnEspanol`** — `true` sólo si la parte de gestión, la que usa el negocio, está en español. Con su cita.

**`tieneApiPublica`** y **`tieneAppMovil`** — `true`, `false` o `null`. `null` si no lo encuentras.

**`ventajas`** — Tres o cuatro. **Con hechos, no con adjetivos.** «Cobra la señal al reservar» sí. «Muy potente» no.

**`inconvenientes`** — Tres o cuatro. **Esto NO es una lista de defectos: es lo que el cliente tiene que tener en cuenta.** «Los recordatorios por SMS se pagan aparte». «El plan de entrada incluye un solo usuario».

**`informacionEmpresa`** — País de origen, año de fundación y tamaño aproximado, si constan. `null` si no.

**`urlPrecios`** — La dirección de su tarifa.

### Las siete valoraciones, y esto es importante

Te pido siete notas de 1 a 10. **Sólo pon número donde puedas justificarlo con algo que hayas leído. Donde no, `null`.**

- **`nivelTecnicoRequerido`** — 1 es apta sin conocimientos técnicos, 10 exige equipo técnico. Justifícalo con hechos: si hay que migrar datos, tocar código, instalar algo, contratar implantación.
- **`facilidadImplementacion`** — cuántos pasos hay para empezar, si hay puesta en marcha de pago, si hay que importar datos.
- **`fiabilidad`** — **sólo** si el fabricante publica página de estado, histórico de caídas o compromiso de disponibilidad. Si no lo publica, `null`.
- **`atencionAlCliente`** — según los canales que ofrezca y en qué plan: chat, teléfono, correo, soporte en español, horario.
- **`facilidadDeUso`**, **`calidad`**, **`escalabilidad`** — **estos tres casi siempre serán `null`**, porque ningún fabricante publica que su producto es un 7. Ponlos sólo si encuentras la nota desglosada de G2 o Capterra para ese aspecto concreto, y entonces dime de dónde.

**`metodologiaValoracion`** — Escribe exactamente en qué te basaste, herramienta por herramienta. Por ejemplo: *«Nivel técnico e implantación, de su guía de puesta en marcha. Atención al cliente, de su página de soporte. Los demás quedan sin valorar.»*

**Prohibido escribir «miles de opiniones verificadas en G2 y Capterra» o cualquier frase parecida.** Es justo la frase que estamos quitando del catálogo, no añadiendo.

---

## ADEMÁS, sólo para SimplyBook.me: el tamaño de empresa

No opines: **mírate sus planes.** Cuántos proveedores o miembros de personal incluye cada uno, y hasta dónde llega el mayor.

De ahí sale el tramo: `1-10`, `11-50`, `51-200`, `200+`. Puede ser más de uno.

Su FAQ dice *«The number of staff members and service providers depends on the subscription you choose»* pero no enseña las cifras. Busca la comparación de planes y el centro de ayuda. **Si de verdad no publican números, dilo con esas palabras** — es un dato que ellos no publican, no un fallo tuyo.

---

## Las fuentes: cómo se cita

Cada cita lleva un **`tipo` de fuente**, de esta lista y sin inventar otros:
`pagina_oficial`, `documentacion`, `tarifa_oficial`, `prueba_directa`, `nota_de_version`, `fuente_secundaria`.

Y una cosa que decide cuánto vale lo que me cuentas: **una comparativa, un directorio o una reseña nunca sostiene un dato como demostrado.** Sólo la web del fabricante, su documentación, su tarifa o una prueba directa.

---

## Las normas

- **Abre las páginas.** Si no la abriste, no la cites.
- **Sólo vale la palabra del fabricante:** su web, su documentación, su centro de ayuda. **No valen** blogs ajenos, comparadores, directorios de software ni reseñas de usuarios. Si el único sitio donde aparece un dato es el blog del propio fabricante, vale, **pero dímelo**.
- **Cada dato que afirme algo lleva cita literal y dirección.** Sin cita, `null`.
- **Lo que no encuentres, `null`.** Un `null` honrado vale más que un dato verosímil. **No lo rellenes con algo razonable.**
- **Nunca escribas que no lo tiene** salvo que el fabricante lo diga con esas palabras.
- Si una página no carga, o pide iniciar sesión, **dilo**. «No pude abrirla» no es «no lo tiene».
- **No juzgues.** Nada de rankings, notas generales ni «es la mejor». Si algo no encaja, se dice **para quién está pensada y para quién no**.
- **Nada de afiliación**: ni la investigues ni la menciones.
- **Escribe en español**, salvo las citas, que van en el idioma original.

## Dos avisos, por experiencia con estas mismas webs

**No me des una dirección que no hayas abierto.** Ya me han dado cuatro juegos de direcciones de un centro de ayuda que no existían, con citas que sonaban perfectas. Los identificadores de artículo hay que sacarlos navegando.

Por eso cada cita va con dos pruebas de que estuviste allí: el **título exacto de la página** y **una frase de al lado** sin relación con lo que busco.

**Y algunas webs pintan sus tarifas con JavaScript**, u ofrecen monedas distintas según desde dónde entres. Dime siempre **qué moneda estás viendo** y **no conviertas nada**.

## Cómo quiero la respuesta

Ve por tandas de cuatro o cinco herramientas para no atragantarte, pero **no pares hasta las 15**. Al final de cada tanda, sólo este JSON:

```json
{
  "fecha": "AAAA-MM-DD",
  "herramientas": [
    {
      "id": "agendapro",
      "nombre": "AgendaPro",
      "paginaOficial": "https://agendapro.com/",
      "urlPrecios": "https://...",
      "categoriaId": "reservas-citas",

      "descripcion": "Dos o tres frases claras.",
      "problemasQueResuelve": ["En primera persona del cliente."],
      "casosDeUso": ["Ejemplos concretos."],
      "idealPara": "Una frase.",
      "industriasIdeales": ["peluquerías", "centros de estética"],
      "noRecomendadaPara": "Una frase, sin juzgarla.",

      "funcionesPrincipales": ["..."],
      "integraciones": ["..."],
      "integracionesPrincipales": ["..."],
      "cuantasIntegracionesPublica": 120,

      "modeloDePrecio": ["suscripcion_mensual"],
      "idiomasDisponibles": ["es", "en"],
      "elIdiomaEsDelProductoODeLaPaginaDeReservas": "producto | sólo la página de reservas | ambas cosas, dilo",
      "disponibleEnEspanol": true,
      "citaDelIdioma": "frase literal",
      "urlDelIdioma": "https://...",

      "tieneApiPublica": null,
      "tieneAppMovil": true,

      "puntuaciones": {
        "nivelTecnicoRequerido": 2,
        "facilidadImplementacion": null,
        "fiabilidad": null,
        "atencionAlCliente": 6,
        "facilidadDeUso": null,
        "calidad": null,
        "escalabilidad": null
      },
      "metodologiaValoracion": "De dónde salió cada número y cuáles quedan sin valorar.",

      "ventajas": ["Con hechos."],
      "inconvenientes": ["Lo que hay que tener en cuenta."],

      "informacionEmpresa": { "paisOrigen": "Chile", "anioFundacion": null, "tamanoAproximado": null },

      "pruebas": [
        {
          "deQueCampo": "descripcion",
          "cita": "frase literal",
          "url": "https://...",
          "tituloDeLaPagina": "el título exacto",
          "fraseDeAlLado": "otra frase de esa página, sin relación"
        }
      ],

      "paginasQueAbriste": ["https://..."],
      "paginasQueNoSeAbrieron": ["https://... — motivo"],
      "loQueNoPudeComprobar": "Qué falta y por qué."
    }
  ]
}
```

Y para **SimplyBook.me** añade en su objeto:

```json
"segmentosIdeales": ["1-10"],
"porQueEseTamano": "Cita de la tarifa.",
"oNoLoPublican": false
```


