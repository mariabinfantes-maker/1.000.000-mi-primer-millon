# Volcados en bruto — evidencia sin procesar

**Esto es evidencia en bruto. No es catálogo, no son fichas, y no son
resultados verificados.** Es la capa de debajo de `../respuestas/`: lo que el
modelo devolvió, entero y sin tocar.

Son las **71 respuestas HTTP completas** de las llamadas a `gemini-3.6-flash`
con lectura de URL (`url_context`) durante la etapa 2 de F4, los días **11 y 12
de septiembre de 2026**.

## Sin modificar, y se puede comprobar

Se copiaron **byte a byte** desde el cuaderno temporal de la sesión. No se ha
reformateado, reindentado ni corregido nada — ni siquiera los ocho ficheros que
no son JSON válido.

`manifiesto.json` guarda el **sha256 y el tamaño de cada uno**. Si alguna vez
hay duda sobre si un fichero se tocó, se recalcula y se compara.

## Qué hay dentro

| Prefijo | Qué fue | Ficheros |
|---|---|---|
| `r-` | Etapa 2, pasada funcional | 30 |
| `rc-` | Investigación comercial (afiliación y referidos) | 21 |
| `rf-` | Recuperación acotada de lo que faltaba | 16 |
| `ri-` | Comprobación de idioma del producto | 4 |

**63 son respuestas válidas. 8 no lo son**: contienen el texto plano
`upstream request failed`. Son los cortes del proxy del entorno, y **se
guardan a propósito**: que una llamada se cayera es un hecho de la
investigación, no un hueco. Sin ellos, alguien podría leer más adelante que
esas páginas «no decían nada», cuando lo cierto es que **nunca se llegaron a
leer**.

## Para qué sirve esto y no `../respuestas/`

Los ficheros de `../respuestas/` son la lectura ya extraída: los campos y sus
citas. Estos de aquí conservan lo que allí se pierde:

- **`urlContextMetadata`** — qué URL se pidió, **cuál se recuperó de verdad** y
  con qué estado. Es lo que demuestra, por ejemplo, que todas las URL de
  `bewe.io` acabaron sirviendo contenido de `bewe.ai`.
- **`finishReason`** — si la respuesta terminó o se cortó.
- **`usageMetadata`** — el gasto de tokens, incluido el de razonamiento. Es el
  rastro de por qué hubo que bajar `thinkingBudget` a 1024 y pasar a una sola
  URL por llamada.
- **El texto completo del modelo**, no sólo el JSON que se logró extraer de él.

## Lo que sigue valiendo

Todo lo del `README.md` del directorio padre: las tres certezas (`si`,
`no_consta`, y que **no hay ni un solo «no disponible demostrado»**), las
salvedades conocidas, y la regla de que si alguna de estas herramientas entra
algún día al catálogo **se vuelve a verificar por el camino de F2/F3** — esto
no lo sustituye.

Ninguno de estos ficheros contiene credenciales: la clave la inyectaba el proxy
del entorno, y los cuerpos de petición nunca se guardaron.
