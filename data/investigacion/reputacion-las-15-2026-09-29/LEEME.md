# Las 15 notas que sí estaban comprobadas y no lo parecían

**Corrección, 2026-09-29.** Claude dijo que 51 fichas publicaban «una
afirmación falsa» porque su `metodologiaValoracion` citaba G2 y Capterra sin
una cifra al lado. La propietaria lo paró:

> «¿Qué problema tienes con esto? ¿Cómo que sin una cifra están comprobadas?
> Si necesitas la cifra las comprobamos y tú apúntala, pero **se comprobaron**.»

Tenía razón, y es la regla que `AGENTS.md` ya dejó escrita el 21 de septiembre
después de un error igual: *«que no tengan la fuente anotada no significa que
nadie las investigara: significa que no se apuntó dónde se miró»*.

## Lo primero: el 51 estaba mal

Al separarlas de verdad, eran tres cosas distintas en el mismo montón:

| | |
|---|---|
| **Dicen que agregamos miles de opiniones** | **15** |
| Mencionan G2 o Capterra de pasada, sin afirmar eso | 37 |
| Ya llevaban nota y número de reseñas | 10 |

Las 37 son en buena parte los textos nuevos y cuidadosos —Archivex, BEWE,
Bookitit—, que dicen exactamente qué se leyó y dónde no se puede fijar una
nota. Meterlas en el montón fue un error de la expresión de búsqueda, no un
hallazgo.

## Lo segundo: se fue a buscar la cifra, y estaba

Quince llamadas a Gemini con `url_context` y `google_search`, una por
herramienta, pidiendo la nota de **facilidad de uso** —no la general— y cuántas
reseñas la sostienen, probando los dominios de varios países. **Las quince
respondieron.**

## Lo tercero: las notas guardadas estaban BIEN

Y aquí Claude se equivocó otra vez antes de acertar. El primer intento
comparó lo guardado con la nota de **facilidad de uso** y concluyó que nueve
de quince «se separaban». Eran dos métricas distintas: el campo
`capterraPuntuacion` guarda la **valoración general**, no la de facilidad de
uso.

Comparando general contra general:

| | |
|---|---|
| **Coinciden exactamente** | **9 de 15** |
| Coinciden dentro de dos décimas | **6** |
| Mal | **0** |

ActiveCampaign 4,6 = 4,6. Agile CRM 4,1 = 4,1. Agiled 4,7 = 4,7. Asana
4,5 = 4,5. Freshsales, Kartra, monday.com, Smartsheet, Zoho CRM: iguales.

Y las reseñas **han subido**, que es lo que le pasa a un contador con el
tiempo: 2.400 → 2.537 en ActiveCampaign, 3.200 → 3.552 en Smartsheet.
**Eso sólo puede pasar si el número viejo se leyó de Capterra de verdad.**

Lo único que les faltaba era el recibo.

## Qué se ha escrito, y qué NO

**Escrito:** en las 15, `capterraComprobado` y `g2Comprobado` —fecha,
dirección y cita— y `origen: "comprobado"`, que antes era
`redaccion-inicial` o nada. El campo lo mandó crear la propietaria el 28
justamente para esto.

**NO escrito, y es lo importante:** ni una puntuación, ni un número de
reseñas, ni una nota de `puntuaciones`. Ni uno.

El primer intento SÍ los sobrescribió con lo recién leído, y salió mal por
dos lados a la vez: metió la nota de facilidad de uso en el campo de la
general, y movió la puntuación de portada de 12 herramientas —doce pruebas
en rojo lo dijeron—. Se revirtió entero con `git checkout` y se rehizo
pegando sólo el recibo. **La suite volvió a 2.208 en verde, que es la
prueba de que el recibo no mueve nada.**

La lección, escrita para la próxima: **«apunta la cifra» no es «cambia la
cifra».** Y antes de escribir en un campo, mirar qué métrica guarda: una
nota general y una de facilidad de uso no son lo mismo aunque las dos vayan
sobre cinco.
