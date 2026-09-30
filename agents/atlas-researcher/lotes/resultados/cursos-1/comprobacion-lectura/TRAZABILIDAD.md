# Comprobación de lectura de las cinco frases

Petición de la propietaria del 2026-09-16: las cinco frases que sobrevivieron
la revisión externa quedan **pendientes, no confirmadas**, hasta que el
proveedor del Researcher las lea él mismo y quede registrada la
trazabilidad.

**Tres llamadas, tope de seis.** Una por página: dos frases en la de precios
de Thinkific, dos en la de la pasarela de Hotmart, una en la de precios de
productos de Teachable. Coste: tres peticiones.

## Por qué esta comprobación vale y la anterior no

El proveedor devuelve, junto a la respuesta, **qué direcciones descargó de
verdad**. Ese dato no lo escribe el modelo: lo emite la herramienta de
lectura. Una cita cuya dirección no conste como descargada no vale, diga lo
que diga el texto. Es la misma regla que `convertir.ts` aplica a los 659
registros de F2, y es exactamente lo que el canal externo no puede dar.

Además, **la comparación literal la hace el script, no el modelo**. Se le
pidió que copiara lo que pone la página, no la frase que se le daba, y que
demostrara la lectura copiando la frase anterior, la posterior y el
encabezado de la sección. Sin contexto, «la he encontrado» no cuenta.

## Las cinco, con su trazabilidad

Las tres direcciones se descargaron con estado
`URL_RETRIEVAL_STATUS_SUCCESS`. Las cinco frases aparecen **carácter a
carácter**. El registro completo —dirección descargada, fecha, cita
localizada, fragmento anterior y posterior, sección, huella de la respuesta
cruda y de la cita— está en `trazabilidad.json`, y las tres respuestas
crudas quedan archivadas junto a él.

| Frase | Sección donde aparece | Qué se concluye |
|---|---|---|
| Thinkific, construir el sitio | «Is it easy to get started?» | **Capacidad demostrada.** La frase siguiente nombra una función con nombre propio, el Course Outline Generator |
| Thinkific, pasarela propia | «What payment gateways does Thinkific support?» | **Capacidad demostrada, profundidad nativa.** La frase es la respuesta a esa pregunta, y la siguiente dice que evita depender de terceros |
| Hotmart, pasarela | «¿Tienes dudas? ¡Te las aclaramos!» | **Capacidad demostrada.** Responde a cuál es la mejor pasarela para vender en España; la siguiente habla de métodos de pago españoles |
| Hotmart, acceso tras el pago | misma sección | **La frase existe y cumple la regla 7**, pero el uso **no se puede registrar**: cuelga de «impartir y seguir cursos», que para Hotmart sigue sin demostrarse |
| Teachable, cobra con Stripe | «Pricing currency and fees» | **Capacidad demostrada; profundidad sin resolver.** Es el contexto más flojo: lo anterior y lo posterior parecen elementos de una lista |

## El argumento más fuerte, y no es el mío

Dos proveedores distintos, en dos días de trabajo independientes, han
devuelto **la misma frase de 103 caracteres en español**, carácter a
carácter, y el segundo con su contexto alrededor. Eso es mucho más difícil
de explicar por invención que por lectura. La frase de Hotmart sobre el
acceso automático, que era la que más me escamaba porque parecía la
pregunta devuelta, es justamente la que sale reforzada.

También se aclara por qué mis búsquedas nunca devolvieron esas frases: son
páginas regionales y preguntas frecuentes, no la documentación que un
buscador prioriza.

## Una cita nueva que llegó sola

El contexto de la frase de Hotmart trajo la anterior:

> «La pasarela de Hotmart ya viene integrada de forma nativa con el área de
> miembros, el programa de afiliados y el dashboard.»

Con la misma prueba de descarga. **Resuelve la profundidad que le faltaba a
Hotmart cobrar**: la página dice «de forma nativa» con esas palabras. No
demuestra que Hotmart imparta cursos, ni desbloquea el uso.

## Lo que esto NO demuestra

Que la dirección se descargara no prueba que la frase salga de los bytes
descargados y no de la memoria del modelo. **Ese hueco lo tienen también los
659 registros de F2**, y se mitiga igual: exigiendo la descarga y revisando
las citas a mano. Estas cinco quedan **al mismo nivel que el resto de F2**,
ni por encima ni por debajo.

Dicho de otro modo: ya cumplen el mismo criterio que todo lo que Molnip da
hoy por verificado. **Si entran o no, lo decide la propietaria** (regla 9).
Nada se ha escrito en la verificación.
