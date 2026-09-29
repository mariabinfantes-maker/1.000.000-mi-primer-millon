# Lo fácil que es de usar — 2026-09-29

## Qué se pedía

Las seis que entraron hoy no salen nunca recomendadas: el motor puntúa ocho
campos que tienen vacíos, y un hueco no vale cero puntos, vale como un cero
sobre diez. La propietaria descartó tocar el motor —tratar «no lo sabemos»
como «normalito» se presta a confusión— y se encargaron los datos.

Entregado: **Bookitit**. Faltan diez.

## Lo que se aprendió midiendo la respuesta, que vale más que la respuesta

### 1. Las herramientas españolas pequeñas no tienen reseñas

El encargo pedía la nota de «Ease of Use» de G2 o Capterra, que se mide sobre
reseñas reales. De Bookitit **no hay ninguna**: Capterra República Dominicana,
Capterra Australia y GetApp Irlanda dan cero opiniones; G2 y Capterra España
no abrieron.

No es un fallo de la búsqueda. Una herramienta española pequeña no tiene
reseñas en G2. Ese dato **no va a existir** para Bookitit, Archivex, ViDay ni
Nubimed, que son justo las que Molnip existe para encontrar.

### 2. Lo que sí se consiguió no mueve la puntuación. Nada.

Medido con una peluquera de 1-10 empleados en España:

| | Puntos |
|---|---|
| Bookitit hoy, con todo vacío | 4,3 |
| Con la curva, el nivel técnico y la implantación de esta entrega | **4,3** |
| Si además tuviera un 8 en facilidad de uso | 32,6 |
| Agiled, que hoy gana | 39,8 |

Idéntico, y el motivo es estructural:

- **`facilidadImplementacion` no es un criterio.** Cero apariciones en
  `agents/atlas-advisor/criterios.ts`. Se puede rellenar y no puntúa.
- **`curvaDeAprendizaje` y `nivelTecnicoRequerido` sólo puntúan si el usuario
  contestó** su tolerancia a la curva y el nivel técnico de su equipo. Sin esas
  respuestas valen 0 para todas por igual.
- **Lo único que mueve es `facilidadDeUso`**, y aparece tres veces: en su
  criterio, y detrás de `calidadEnLaTarea` y `facilidadEnSuEspecialidad` en
  `criteriosRuta.ts`.

### 3. La consecuencia

El motor puntúa sobre todo un campo que sólo existe si la herramienta tiene
reseñas en G2 o Capterra: productos internacionales grandes. Y Bookitit gana
+36 puntos en los cuatro criterios que miden si le sirve a la peluquera
—tamaño, industria, adaptación al sector, funciones avanzadas— y los pierde en
los que miden reputación internacional.

**«Primero que sirva, después que encaje»** dice la visión. Esto hace lo
contrario. Queda medido y sin tocar: es una decisión de producto.

## Sobre las notas que sí trajo

`nivelTecnicoRequerido: 3` y `facilidadImplementacion: 7` **no son cifras
publicadas**: la propia entrega las llama «estimación documental propia» y
escribe el baremo que usó, apoyado en citas. Es un tercer tipo de número, ni
publicado ni inventado. No se aplican a ninguna ficha sin que la propietaria
decida si ese tipo vale.

`curvaDeAprendizaje: "facil"` sí es lo que se pedía: una clasificación en
cuatro palabras a partir de hechos citados —el asistente tiene tres pasos, hay
tutoriales escritos y en vídeo, la importación es de citas por ICS y no una
migración completa—.

Lo crudo, en `crudo/`, antes que ningún resumen.
