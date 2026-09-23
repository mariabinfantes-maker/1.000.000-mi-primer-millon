# El reparto, con nuestros criterios

**23 de septiembre de 2026.** El reparto anterior (`CASAS.md`) usaba el
criterio del fabricante: qué dice su página que hace, y en qué dominio del
vocabulario cae. Esto lo rehace con los nuestros.

## Los tres criterios, y de dónde salen

**Quiénes somos.** No afirmamos lo que no hemos comprobado. La columna «lo
trae» del reparto anterior —37 herramientas que dicen hacer IA, 21 que dicen
dar atención al cliente— **no coloca a nadie en ninguna casa**. Es el folleto
del fabricante hablando por nosotros. *(«No consta» no se convierte en un
dato.)*

**De qué servimos.** No servimos para decir «esta herramienta toca el tema».
Servimos para decir si le resuelve el problema. Así que una herramienta entra
donde **cubre entera una necesidad** —todos sus imprescindibles, verificados—,
no donde roza el dominio. *(«Primero que sirva, después que encaje.»)*

**A quién asesoramos.** Una autónoma o un negocio pequeño, en español. El
precio, el idioma y la curva **se anotan, no filtran**: una herramienta cara o
sin español no es mala, es que no está pensada para quien pregunta.
*(«No somos jueces.»)*

## Lo que cambia al aplicarlos

| | por dominio | por necesidad cubierta |
|---|---:|---:|
| Casas/puertas llenas | 13 de 14 | 6 de 6 |
| Necesidades sin nadie | — | **33 de 61** |
| Herramientas sin sitio | 0 | 1 |

Por dominio todo salía lleno. Preguntando si de verdad cubren la necesidad,
**más de la mitad de las necesidades no las cubre nadie.**

## Las 6 puertas

| Puerta | Necesidades | Con alguien | Sin nadie | Herramientas |
|---|---:|---:|---:|---:|
| Vender más | 13 | 7 | 6 | 32 |
| Controlar el dinero | 15 | 4 | **11** | 26 |
| Que no se me pierda nada | 20 | 6 | **14** | 34 |
| Cuidar al cliente que ya tengo | 6 | 2 | 4 | 5 |
| Crear y publicar contenido | 7 | 6 | 1 | 19 |
| Ganar tiempo | 7 | 6 | 1 | 59 |

## El hallazgo, que no es el precio

El precio no es el problema: la entrada mediana son **11 € al mes** y 64 de 65
tienen plan gratuito. El idioma algo más —**24 de 65 sin español
confirmado**—. El problema es **qué necesidades cubre el catálogo**.

**Lo que sí está cubierto:**

- Que las herramientas que uso hablen entre sí — 55
- Ver de un vistazo cómo va el negocio — 31
- Tener claro qué hay que hacer hoy — 29
- Que lo repetitivo se haga solo — 28
- Hacer seguimiento y no olvidarme de nadie — 21
- Saber cuánto tiempo echo en cada cosa — 17

**Lo que no cubre nadie:**

- Cumplir con la factura electrónica obligatoria
- Los impuestos, sin sustos
- Llevar la contabilidad
- Saber en qué se me va el dinero
- Ver si llego a fin de mes antes de que llegue
- Tener la agenda bajo control
- Que los clientes vuelvan
- Cobrar en el mostrador o en la mesa
- Organizar turnos, fichajes y vacaciones
- Saber qué tengo y qué me falta
- Que me encuentren cuando me buscan
- Que las preguntas de siempre se respondan solas

Las dos listas describen a dos personas distintas. **La primera es un equipo
pequeño que ya trabaja con varias herramientas y quiere integrarlas. La
segunda es una autónoma española.** El catálogo está montado para la primera.

Por eso la puerta «Ganar tiempo» tiene 59 herramientas y «Cuidar al cliente
que ya tengo» tiene 5. No es que unas puertas sean mejores: es que el catálogo
responde a las preguntas de un tipo de negocio y no a las del otro.

Y por eso en el caso de la peluquera no había una buena respuesta. No fue
mala suerte con el ejemplo.

## Las 15 categorías y las 6 puertas

Las 15 categorías de `data/categorias.json` son **tipos de producto**: «CRM»,
«Gestión de proyectos», «Automatización e integraciones». Eso es el idioma del
fabricante. Una peluquera no entra buscando un CRM: entra diciendo «pierdo
citas». Además hoy las 65 herramientas viven sólo en 4 de las 15
(todo-en-uno 17, CRM 15, proyectos 15, IA 18).

Las 6 puertas están escritas desde la necesidad, sin mencionar ninguna
herramienta, y aguantan la prueba que puso la propietaria: **si se cambia el
catálogo entero, las puertas siguen teniendo sentido.** Las 15 categorías no:
si se va el último CRM, la categoría «CRM» se queda vacía y sin significado.

**Esto no decide nada.** Las 15 categorías no se borran ni se apagan. Queda
escrito cuál de las dos estructuras sobrevive a los tres criterios, y decide
la propietaria.

## Los archivos

- `distribucion.json` — cada puerta, sus herramientas, qué necesidades cubre
  cada una, precio de entrada, español y curva.
- `porNecesidad.json` — las 61 necesidades, quién cubre cada una, y las que
  no cubre nadie.
- `criterios.mjs` — cómo se calculó. Se vuelve a ejecutar tal cual.
