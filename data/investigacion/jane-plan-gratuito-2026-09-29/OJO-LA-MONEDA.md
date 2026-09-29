# Jane: la misma página, dos monedas

**No se arregle poniendo las dos iguales.** La contradicción está en la página,
no en nosotros, y taparla sería peor.

La ficha dice `precioInicial: "CAD $54 / month"`. El recibo del precio dice
`"USD $54 / month"`. Las dos son lecturas literales de
`https://jane.app/pricing`, hechas el mismo día por dos lectores distintos:

- **GPT, el 28**, leyó `CAD $54 / month`. Y no se lo calló: escribió en
  `loQueNoSePudoComprobar` que «la moneda de la última consulta de precios es
  CAD, dólares canadienses». Lo marcó a propósito.
- **Gemini, el 29**, leyó `USD $54 / month` en la misma dirección.

Jane es canadiense y su tarifa cambia de moneda según desde dónde se abra. La
cifra es la misma, 54; lo que cambia es el símbolo.

**Qué NO hacer:** igualar una a la otra para que la ficha quede limpia. Eso
sería elegir una moneda sin prueba y borrar el aviso que GPT dejó escrito.

**Qué falta para cerrarlo:** una lectura desde España que diga qué moneda ve un
cliente español, que es el único que nos importa. Mientras no la haya, la ficha
enseña lo que se leyó, con su contradicción a la vista.

*(Quedan sin campo en el esquema `notaDelPrecio` y `limites`. Si algún día se
añaden, éste es el primer sitio donde hacen falta.)*
