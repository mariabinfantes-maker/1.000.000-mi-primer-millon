# Las cinco tarifas que el catálogo no podía demostrar

**29 de septiembre de 2026.** `npm run examen-catalogo` dejó a cinco fichas sin
pasar el examen de entrada, todas por lo mismo: precio escrito, sin la página
que se abrió ni el día que se abrió.

## Tres no fallaban: fallaba el examen

**Notion AI, Odoo y Zoho CRM ya tenían el precio demostrado** desde el 21 de
septiembre, en `planesComprobados`: su URL, su fecha y la cita de cada plan.
El examen sólo miraba `preciosComprobados` y no veía el otro campo, que además
es más completo.

Corregido: vale cualquiera de los dos. **El fallo era del examen, no de las
fichas** — el mismo patrón de siempre, medir el sitio equivocado y contarlo
como un defecto del dato.

## Dos siguen sin poder demostrarse, y ahora sabemos por qué

**Zoho One y Zoho Projects.** Sus páginas de tarifas se abren, pero **los
importes se cargan con JavaScript** y no existen para un lector automático:
salen los nombres de los planes —«Standard/user/month»— sin la cifra. Se
intentó dos veces, y también la versión española.

Es el mismo problema que el bloque de reservas de Doctoralia. **La página se
abre y aun así no hemos podido leer el dato**, que no es lo mismo que el dato
no exista.

Para demostrar esas dos tarifas hace falta un navegador de verdad, o mirarlas
a mano.

## Lo que sí se leyó de nuevo

Aunque ya no hiciera falta para el examen, la lectura de hoy trae los importes
al día de Notion AI y Odoo, en dólares:

- **Notion AI** — Free 0 $, Plus 10 $, Business 20 $, Enterprise a consultar,
  todos por miembro y mes.
- **Odoo** — One App Free 0 $; Standard 31,10 $ al mes o 24,90 $ pagando el
  año; Custom 61,10 $ o 49,00 $ al año. Por usuario y mes.

Las fichas guardan hoy euros con fecha del 21 de septiembre. **No se tocan**:
cambiar la moneda de una ficha es una decisión de producto —la propietaria fijó
el 2026-09-21 que se prefiere el euro cuando alguna lectura lo consiguió—, y
las mismas páginas sirven tarifas distintas según desde dónde se entre.

## Cómo queda el catálogo

| | |
|---|---|
| Pasan el examen | **62** de 65 |
| Les falta algo | **2** — Zoho One y Zoho Projects, por lo dicho |
| Apartada por decisión | **1** — Teachable |
