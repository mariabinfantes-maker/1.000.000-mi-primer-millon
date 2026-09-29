# Clinic Cloud: el único campo que la deja fuera

Todo lo demás está. El examen de entrada da cuatro comprobados y **un solo
error**:

```
✔ Sabemos qué hace: 5 capacidades verificadas con cita.
✔ Sabemos cuánto cuesta: comprobado el 2026-09-30.
✔ Sabemos en qué idiomas trabaja: es.
✔ Sabemos qué límite tiene, incluso para quien sí es su cliente.
✘ Falta para quién está pensada: tamaño.
```

## GPT no lo rellenó, y acertó

Dijo: *«No asigno tramos de personas: la tarifa publica agendas, pero no el
número de usuarios incluidos o máximo. La ayuda distingue usuarios y agendas y
permite asignar varias agendas a un usuario. Por tanto, no convierto agendas
ilimitadas en usuarios ilimitados.»*

Su respuesta parecía contradecirse —la cita decía `1 | 5 | Ilimitadas |
Ilimitadas` y el texto decía «una, tres, cinco y ilimitadas»—, así que se leyó
la tarifa otra vez, con dos preguntas distintas a Gemini.

**No había contradicción: son dos filas.**

> «Agendas | +10 EUR/ agenda extra hasta alcanzar el límite de cada plan. |
> 1 incluida | 3 incluidas | 5 incluidas | Ilimitadas / **Límite de agendas |
> 1 | 5 | Ilimitadas | Ilimitadas**»

Y las dos lecturas coinciden en lo importante: **`hayFilaDeUsuarios: false`**,
`soloHablaDeAgendas: true`. Esa tarifa no publica usuarios en ninguna parte.
GPT leyó bien y se negó bien.

## Por qué esto no se resuelve pidiéndoselo otra vez a GPT

Dos lectores independientes han leído la misma página y los dos dicen que el
dato no está. Volver a preguntar devuelve `null` otra vez.

## Y por qué no se puede dejar el campo vacío

`segmentosIdeales` es obligatorio en el validador **y** en el examen, y las 78
fichas del catálogo lo tienen. No es un formalismo: es el campo con el que el
motor decide si una herramienta le sirve a una autónoma sola o a una clínica de
treinta. Ponerlo vacío no es «enseñar el hueco»: es que la herramienta entre y
no se coloque nunca.

## Decide la propietaria

**A. Derivarlo de las agendas, y dejar escrito que es una derivación.**
Una agenda en una clínica es el calendario de un profesional, y el límite de
agendas topa cuántos profesionales se pueden citar por separado. Mini admite
1, Pro 5, Max y Enterprise sin tope. De ahí saldría `["1-10", "11-50"]`: lo de
abajo está demostrado por «1 incluida», y lo de arriba por «Ilimitadas». No se
sube a `51-200` ni a `200+` porque eso es escala de hospital y su propia
descripción habla de consultas y centros.

**B. Dejarla fuera hasta que el dato exista.** Queda el borrador escrito y los
cinco registros archivados; entra el día que alguien publique o pregunte cuántos
usuarios caben.

**Lo que recomienda Claude: A**, porque el número que se derivaría está
publicado, citado y es el que esa industria usa —las clínicas cuentan agendas,
no licencias—, y porque la alternativa deja fuera una ficha entera por un campo
que su fabricante expresa en otra unidad. Pero es una derivación, no una
lectura, y hoy ya se ha dicho dos veces que rellenar no se hace solo.

*(Si sale A, la frase que iría en la ficha: «Deriva del límite de agendas
publicado en su tarifa —1 en Mini, 5 en Pro, ilimitadas en Max y Enterprise—,
no de un número de usuarios, que no publican.»)*
