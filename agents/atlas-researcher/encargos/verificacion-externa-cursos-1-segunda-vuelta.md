# Encargo de verificación externa · lote `cursos-1`, segunda vuelta

Sólo los 17 campos que no pasaron los validadores en la primera vuelta, más
el conflicto de la comisión de Hotmart. **Los 24 campos que sí pasaron no se
vuelven a preguntar**: ya están, y repetirlos sólo añade ruido.

Un solo fallo explica casi todos: la cita se copió de una **celda** de tabla
(«$39/mo», «5 products», «Transaction Fee») y el valor afirmaba números que
esa celda no contiene. Por eso esta vuelta pide **la fila entera con su
encabezado de columna**, que es lo único que sitúa un dato en un plan.

Lo que va debajo de la raya es el texto que se pega tal cual en ChatGPT.

---

Segunda vuelta de la verificación de Molnip. Ya hiciste la primera y 24 campos pasaron; ésos NO se vuelven a preguntar. Aquí sólo están los que no pasaron, y en casi todos el motivo fue el mismo, así que empiezo por ahí.

EL FALLO A CORREGIR. En una tabla de precios o de funciones, una celda suelta no demuestra nada: «$39/mo» no dice de qué plan es, y «5 products» no dice a qué columna pertenece. Necesito la FILA ENTERA CON SU ENCABEZADO DE COLUMNA, copiada tal cual, junta en una sola cita. Por ejemplo: «Starter — $39/mo billed monthly, $29/mo billed annually» o «Published courses — Basic: Unlimited». Si en la página la fila y el encabezado están separados y no puedes copiarlos juntos de forma fiel, dilo: eso es "no_consta".

Y la regla que se incumplió once veces: EL VALOR NO PUEDE CONTENER NINGÚN NÚMERO QUE NO ESTÉ EN LA CITA. Si la cita dice 39 y el valor dice 39 y 29, falta media cita. Copia las dos cifras o afirma sólo una.

Todo lo demás sigue igual que en la primera vuelta: sólo páginas del dominio oficial del fabricante y sus subdominios, la dirección exacta donde está la frase, la frase copiada palabra por palabra sin traducir ni resumir, la fecha, y los tres resultados posibles ("confirmado", "no_consta", "contradicho"). Nunca deduzcas. Responde ÚNICAMENTE con un array JSON en el mismo formato de la primera vuelta:

{ "herramienta": "...", "campo": "...", "resultado": "...", "valor": "...", "cita": "...", "url": "...", "fecha": "AAAA-MM-DD", "nota": "..." }

CAMPOS A REHACER, con lo que falló en cada uno:

Thinkific
1. planes_y_precios — citaste «Basic $54/mo Billed monthly», «Start $109/mo» y «Grow $219/mo», y los valores añadían 40, 82 y 164 USD anuales que esas citas no contienen. Copia, por cada plan, la fila entera con el precio mensual Y el anual juntos, tal como aparecen.
2. comision_por_venta — la cita era «Transaction Fee», dos palabras, y el valor afirmaba 5 %, 2 %, 1 % y 0,5 %. Copia la fila con el encabezado de cada plan. Y aclara en el mismo elemento si esa tarifa se aplica sólo al usar una pasarela de terceros o también con Thinkific Payments: es la diferencia entre pagar y no pagar.
3. limites_del_plan_mas_barato — la cita era «Published courses Unlimited» y el valor añadía 10.000 estudiantes, 1 administrador, 100 GB y dos límites más. Copia la fila de cada límite con el encabezado de la columna Basic, o afirma sólo el que la cita sostenga.
4. idioma_interfaz_alumnos — la cita era «Spanish Mexican», dos palabras sueltas. Copia la frase o el fragmento de lista donde se vea que es una lista de idiomas de la interfaz, con el español dentro.
5. afiliados_comision — la cita decía «30% lifetime recurring commission» y el valor añadía los 150 USD del plan Plus. Copia la frase que dice lo de Plus, o quítalo del valor.
6. afiliados_duracion — la cita era la palabra «lifetime». Copia la frase entera donde aparece.
7. afiliados_pago — la cita hablaba de PayPal y Stripe, y el valor añadía el día 13 y una retención de 30 días. Copia la frase que dice cuándo se paga.
8. Además, comprueba una cosa que aquí no podemos: las citas de la cookie de 90 días, de PartnerStack y del método de pago las diste todas en https://www.thinkific.com/pricing/ … perdón, en https://www.thinkific.com/affiliates/. Confirma que esas tres frases están EN ESA PÁGINA y no en un artículo del centro de ayuda. Si están en el centro de ayuda, corrige la dirección: importa cuál es la página, no sólo que la frase exista.

Teachable
9. planes_y_precios — citaste «$39/mo», «$89/mo» y «$189/mo», seis y siete caracteres, y los valores añadían 29, 69 y 139 anuales. Fila entera con encabezado, mensual y anual juntos, por cada plan.
10. planes_y_precios (Custom) — lo marcaste "no_consta" pero pusiste un valor. Un "no consta" va con el valor en null. Corrígelo.
11. comision_por_venta — la cita sostiene el 7,5 % de Starter, pero el valor añadía el 0 % de Builder y Growth. Copia la frase o la fila que diga el 0 %, o afirma sólo Starter.
12. limites_del_plan_mas_barato — la cita era «5 products». Fila con el encabezado Starter.
13. cursos — la cita era «Student progress reports», el nombre de una fila de tabla. Copia una frase de la documentación que diga que se alojan e imparten cursos con su contenido, o la fila entera con su encabezado.
14. afiliados_duracion — la cita era «one year (per sale)». Copia la frase entera.
15. afiliados_cookie — la cita era «With a 30-day cookie». Copia la frase entera donde aparece.
16. plan_gratuito — la corrección es buena y la cita la sostiene: sólo sobra la garantía de devolución de 30 días, que esa frase no dice. O la citas aparte, o la quitas del valor.

Hotmart
17. plan_gratuito — lo citaste desde la portada (hotmart.com/es). Una portada no demuestra una condición concreta. Busca la frase en la página de precios o en el centro de ayuda.
18. idioma_soporte — la cita dice «Soporte en español por email y por chat 24/7» y el valor dice lo mismo, pero el 24/7 quedó fuera al compararlo. Vuelve a darlo con la frase completa y, si la página lo dice, si ese soporte es para todos los vendedores o sólo a partir de cierto volumen.
19. comision_por_venta — AQUÍ HAY UN CONFLICTO Y ES LO MÁS IMPORTANTE DE ESTA VUELTA. Tú diste tramos por volumen de ventas anual: 9,9 % hasta 9,9 K €, hasta 8,4 % de 10 K a 99 K, hasta 6,9 % de 100 K a 999 K, citando hotmart.com/es/precios. Otra fuente oficial, el artículo de tarifas del centro de ayuda, dice algo distinto: 9,90 % más 0,50 € por venta si el producto cuesta más de 15 €, o más 0,10 € si cuesta 15 € o menos. Tú declaraste ese artículo entre las páginas que no pudiste leer. Además, tu valor afirmaba «más 1,00 €», y esa cifra no aparece en ninguna cita.

    Necesito saber si las dos cosas son compatibles —un porcentaje que baja por volumen MÁS una cuota fija que depende del precio del producto— o si una de las dos está desactualizada. Inténtalo otra vez con el artículo de tarifas (https://help.hotmart.com/es/article/208298448/) y con la página de precios, y devuelve DOS elementos separados: uno para el porcentaje y otro para la cuota fija, cada uno con su cita y su dirección. Si sigues sin poder abrir el artículo, dilo: "no_consta" con la nota de que no se pudo leer. No mezcles las dos fuentes en una sola afirmación.

Al final del array, el mismo elemento de siempre con "herramienta": "_paginas", "campo": "no_leidas" y la lista de direcciones oficiales que intentaste abrir y no pudiste.
