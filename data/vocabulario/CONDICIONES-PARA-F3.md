# Lo que hay que cerrar antes de que F3 conecte el vocabulario al motor

F1 dejó el vocabulario como dato y nadie lo lee todavía. Mientras siga así, lo
que hay aquí abajo no puede hacer daño: ninguna de estas guardas protege nada
que esté en producción.

**F3 cambia eso.** En cuanto el motor filtre por capacidad, la guarda de
términos reservados pasa a ser lo único que impide que un mismo criterio cuente
dos veces —una como capacidad y otra como restricción—, que es exactamente el
fallo que llevó a definir `cap.field_job_capture` como «fotos, firma y sin
cobertura» mientras el diseño decía que la conexión vivía en
`req.offline_capable`.

Las dos primeras son **obligatorias antes de F3**, por decisión de la
propietaria el 2026-09-03. Las demás quedan anotadas y no abren sprint.

---

## Obligatorio · A · `normalizar` no normaliza espacios ni puntuación

`normalizar()` en `repositorio.ts` baja a minúsculas y quita tildes, pero no
toca los espacios. El cotejo es `includes` literal, así que cualquier carácter
metido entre las palabras de un término reservado apaga la guarda:

```
"funciona sin  cobertura."       → sin errores   (doble espacio)
"funciona sin\ncobertura."       → sin errores   (salto de línea)
"funciona sin\tcobertura."       → sin errores
"funciona sin cobertura."   → sin errores   (espacio duro)
"funciona sin-cobertura."        → sin errores
"funciona off-line."             → sin errores
"datos de​salud"            → sin errores   (ancho cero)
```

Lo que lo hace obligatorio no es el ataque deliberado: es que **el doble
espacio y el salto de línea se producen tecleando**. Una redacción descuidada
desactiva la comprobación para ese término y nadie se entera.

**Arreglo:** colapsar `[\s ​-‍]+` a un solo espacio dentro de
`normalizar`, aplicándolo a los dos lados de la comparación.

## Obligatorio · B · Las declaraciones duplicadas no se validan

`erroresDeMenciones()` busca la declaración con `declaradas.find(...)`, que
devuelve la primera y se olvida del resto. Las siguientes no pasan por ningún
control:

```jsonc
"noEs": "Funciona sin cobertura, ver req.offline_capable.",
"mencionesDeclaradas": [
  { "termino": "sin cobertura", "remiteA": "req.offline_capable" },   // válida
  { "termino": "SIN COBERTURA", "remiteA": "req.no_existe" },         // pasa
  { "termino": "sin cobertura", "remiteA": "cap.la_propia" }          // pasa
]
```

Cero errores: una declaración que apunta a un identificador inexistente,
ausente del texto y que remite a la propia capacidad se cuela con sólo ir
detrás de una válida. Invirtiendo el orden sí falla, lo que confirma la causa.

Esto **contradice lo que dice el mensaje del commit `5a8445c`** («y si sobra,
falla»). Queda escrito aquí para que no se pierda esa corrección.

**Arreglo:** recorrer todas las declaraciones que casen con el término, o
rechazar de entrada que un `termino` aparezca dos veces en la misma capacidad.

---

## Anotado, sin sprint

**C · `remiteA` se comprueba como subcadena cruda de `noEs`.** Hoy inofensivo:
ninguno de los 154 identificadores emitidos es prefijo de otro. Un futuro
`req.offline_capable_full` abriría el hueco. Las reglas de nombrado no lo
impiden.

**D · Falso positivo con un identificador capitalizado.**
`sinIdentificadores()` corre antes de `normalizar()` y su expresión sólo cubre
minúsculas, así que `"Ver Req.offline_capable"` sobrevive al borrado, se pasa a
minúsculas después y se delata a sí mismo. Con el identificador bien escrito no
ocurre, y hay prueba de ello.

**E · Código sin uso.** `sinIdentificadores` se exporta y nadie la llama desde
fuera. `normalizar` duplica `agents/atlas-advisor/utilidades.ts::normalizar`
(misma implementación menos el `.trim()`); el aislamiento de F1 justificaba no
compartirla, pero a partir de F3 ya no.

---

## Lo que esta guarda NO hace, y conviene saberlo

Desde `5a8445c` el permiso para nombrar un término reservado **se declara, no
se deduce**. Eso cerró dos huecos que ninguna regla léxica podía cerrar, pero
tiene una consecuencia que hay que decir en voz alta:

> La guarda ya no demuestra que una mención sea una frontera legítima. Obliga a
> escribirla como dato y delega la valoración en quien revise el diff.

Comprobado ejecutando: una apropiación acompañada de su propia declaración pasa
las pruebas. El nombre de la prueba —«ninguna capacidad se apropia de lo que es
una restricción»— promete más de lo que el código demuestra.

Se buscó un apriete automático —exigir que, cuando `remiteA` sea una capacidad,
ésa lleve la restricción en `restriccionesTipicas`— y **no sirve**: se cumple
igual en el caso legítimo (`cap.clinical_record`) que en el falso
(`cap.point_of_sale`). La defensa real es la revisión humana del diff.
