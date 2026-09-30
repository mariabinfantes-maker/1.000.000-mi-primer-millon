# Las 8 que se cortaron mal — 2026-09-29

## Por qué existe esta carpeta

El barrido del 28 encontró 30 herramientas y se siguió con 22. Las 8 que
faltaban se cortaron porque «el cliente elige profesional» salió
`no_encontrado`. Eso es «no lo hemos encontrado», no «no lo tiene», y
descartar por ahí es justo lo que las reglas prohíben. Cinco de las 8 tenían
agenda por profesional y precio verificados con cita.

## Por qué con Gemini y no con la herramienta normal de leer páginas

La política de red de este contenedor deja salir a **un solo sitio**:
`generativelanguage.googleapis.com`. `WebFetch` sobre `treatwell.es` devuelve
`EGRESS_BLOCKED`. Gemini no es una preferencia: es la única puerta a la web
desde aquí. No sustituye al trabajo encargado a GPT, que está saliendo mejor;
es lo que se puede hacer mientras.

## El fallo que hay que saber antes de usar nada de aquí

**36 de las 62 direcciones de la primera búsqueda no eran direcciones**, sino
envoltorios `vertexaisearch.cloud.google.com/grounding-api-redirect/…`. Gemini
leyó el contenido a través de ellos, pero como cita no valen: caducan y la
propietaria no puede abrirlos. **Una prueba que no se puede enseñar no es una
prueba.**

Treatwell salió entera sobre esos envoltorios y NO se da por buena, por
llamativa que sea (8 de 9 capacidades). `reales.mjs` vuelve a pedirlas
prohibiendo ese dominio.

## Lo que sí se sostiene sobre dirección real

**Koibox: el cliente elige profesional.** Su portada, `https://koibox.cloud/`:

> «Tus clientes podrán agendar, consultar la disponibilidad de su estilista
> favorito y reservar 24/7 sin barreras.»

Una de las cinco cortadas mal, y demuestra que el corte lo estaba.

## Los pases, en orden

1. `buscar.mjs` — 56 búsquedas de direcciones. **Aquí está el fallo de los
   envoltorios**: no prohibía ese dominio.
2. `leer.mjs` — 62 páginas, una llamada cada una. 50 abiertas, 12 no.
3. `refuerzo.mjs` — otras consultas para las que volvieron casi vacías, y las
   tres candidatas que nadie había mirado.
4. `reales.mjs` — el arreglo: las direcciones otra vez, con el dominio de
   Google prohibido.

Lo crudo, en `crudo/`, antes que ningún resumen.
