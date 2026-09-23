# El reparto

**Propuesta.** No cambia ninguna ficha ni ninguna recomendación.

Las 15 casas, y cada herramienta en todas las que puede ayudar. Si sirve a
ventas está en ventas; si además sirve a vídeo, está también en vídeo. Primero
existe la estructura, después se coloca cada solución donde puede ayudar.

## Estar en una casa no dice «sirve». Dice qué cubre

*(Regla de la propietaria, 2026-09-23.)* Que F2 verificara algo del tema no
basta. Cada herramienta entra con **la lista de lo que cubre ahí**, en
palabras, y con lo que **no hemos comprobado** todavía.

El ejemplo que lo motivó: en «Firma electrónica y gestión documental», crear
documentos no demuestra que se puedan firmar.

> **Canva** — cubre: edición a varias manos, plantillas de documento.
> Sin comprobar: archivos y carpetas, buscar en todo lo guardado, versiones y
> cambios, espacio de conocimiento interno, **firma electrónica**.

Puede estar en la casa. Lo que no puede es dar a entender que firma.

**Sin comprobar nunca significa «no lo hace».** Significa que no lo hemos
mirado. Mientras no se mire, no se enseña como si lo hiciera.

**Y esa casa destapó un defecto.** La capacidad `cap.electronic_signature`
existe, pero vive en el dominio `presupuestos` —firmar un presupuesto— y **no
se le ha preguntado a ninguna de las 65**. Por eso ninguna podía demostrar lo
que el nombre de la casa promete. Queda incorporada a la casa, donde sale
«sin comprobar» para las siete, que es la verdad.

## El recuento

| Casa | Está | De ellas, sólo por su portada |
|---|---:|---:|
| Plataformas todo en uno | — | *(sin regla, ver abajo)* |
| CRM y ventas | 28 | 1 |
| Gestión de proyectos | 30 | 0 |
| Asistentes de IA y productividad | 22 | 2 |
| Facturación y contabilidad | 17 | 0 |
| Reservas y citas | 9 | 0 |
| Atención al cliente | 3 | 0 |
| Comercio electrónico | 4 | 1 |
| Automatización e integraciones | 60 | 0 |
| Marketing y email | 15 | 1 |
| Recursos humanos | 3 | 0 |
| Inventario y operaciones | 0 | 0 |
| Creación web y hosting | 6 | 0 |
| Firma electrónica y gestión documental | 7 | 0 |
| Software sectorial | 2 | 2 |

Hoy cada ficha tiene **una sola** categoría, y por eso las 65 viven en 4 casas
de las 15.

**«Sólo por su portada»** son las que entran porque esa casa es su oficio
—lo que la herramienta es— sin que F2 haya verificado aún ninguna capacidad
suya ahí. Son 8 en total. Entran, pero no pueden decir qué cubren hasta que se
comprueben.

## «Todo en uno» se queda sin regla, a propósito

*(Regla de la propietaria, 2026-09-23.)* La regla anterior —«seis casas o
más»— era un umbral inventado. No medía si una herramienta es una suite
integrada: **medía cuántas capacidades suyas hemos investigado**. Una
herramienta muy verificada subía sola, y una poco verificada no entraba
aunque fuera una suite.

No se sustituye por otro número. La casa sigue existiendo y hoy no se llena
por cálculo: hace falta un criterio de lo que es una suite integrada —que los
módulos compartan de verdad los datos—, y eso no está verificado.

## Inventario y operaciones está vacía, y eso no la invalida

**La casa existe porque responde a una necesidad, no porque el catálogo la
cubra.** Llenarla no depende sólo de las siete comprobaciones pendientes:
también se llena **incorporando herramientas nuevas**. Que hoy no tengamos
ninguna es un dato sobre el catálogo, no sobre la casa.

## Los archivos

- `reparto.json` — cada herramienta, en qué casas está, qué cubre en cada una,
  qué queda sin comprobar y si entra sólo por su portada.
- `reparto2.mjs` — cómo se calculó. Se vuelve a ejecutar tal cual.
- `declarado.json` y `crudo/` — lo que dice cada página oficial, con cita y
  las URLs que se abrieron.
