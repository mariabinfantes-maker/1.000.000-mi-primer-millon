# Identidad de marca de Molnip

**Documento oficial.** Aquí vive la identidad visual de Molnip: qué colores son
suyos, qué significa cada uno y cuáles no se tocan.

Lo que dice este documento manda. Que el código o cualquier otro fichero
indiquen otro valor no convierte ese valor en el correcto: significa que hay un
error que hay que corregir.

---

## 1. El color principal — congelado

# `#6E5FE4`

**Fijado por la propietaria el 2026-09-01. No se modifica sin su aprobación
explícita.**

Es el índigo-violeta de Molnip. De él salen:

| Dónde | Cómo se escribe |
|---|---|
| Botón principal | `bg-brand-600` |
| Botón fantasma, enlaces y antetítulos | `text-brand-600` |
| Etiqueta de marca | `bg-brand-600` |
| Texto destacado de la portada | `from-brand-600` |
| Mancha del hero (parada dominante) | `var(--color-brand-600)` |
| Barra de direcciones del navegador móvil | `COLOR_PRINCIPAL` |

**59 usos en 24 ficheros.** Cambiar este valor cambia la marca entera.

### Por qué está congelado

Ya se perdió una vez. La portada escribió el índigo **a mano** como `#4f46e5`
—el ancla anterior, retirada el 2026-08-17 cuando `335554b` la sustituyó por
`#6e5fe4`— en lugar de usar el token. Al no ser un token, el cambio de paleta
nunca le llegó, y la mancha del hero se quedó semanas con el violeta viejo:
más frío, más saturado, más oscuro. Nadie lo detectó porque ninguna prueba
miraba el **valor** de un color, solo su nombre.

Se corrigió el 2026-09-01 en `d006ad9`. Punto de retorno de aquella corrección:
la rama `respaldo-antes-violeta`.

### Cómo se cambiaría (si algún día se cambia)

1. Aprobación explícita de la propietaria, por escrito.
2. Cambiar `--color-brand-600` en `app/globals.css`.
3. Cambiar el valor esperado en `components/__tests__/colorDeMarca.test.ts`.
4. Actualizar este documento con la fecha y el motivo.

Si alguien cambia solo el paso 2, la prueba falla. Es deliberado.

---

## 2. Dónde viven los colores

**Fuente de verdad: `app/globals.css`.** Todos los colores de Molnip son
tokens declarados ahí. Ningún componente ni ninguna página escribe un color a
mano; si lo hace, la prueba falla.

Hay una única excepción técnica, y tiene su propio sitio:
**`lib/marca/paleta.ts`**. Existe porque algunas superficies no pueden leer
variables CSS:

- Las imágenes de OpenGraph y los iconos los dibuja Satori a un PNG en el
  servidor, fuera del navegador.
- `themeColor` de `app/layout.tsx` acaba dentro de una etiqueta `<meta>`.
- `app/global-error.tsx` tiene que poder pintarse aunque la hoja de estilos no
  haya cargado — es justo la pantalla que se ve cuando eso falla.

Esos ficheros importan de `lib/marca/paleta.ts`, y una prueba comprueba que
ese módulo y `globals.css` siguen diciendo lo mismo.

---

## 3. La paleta

### Índigo de marca — «Sistema Prisma, Variante B»

Escala propia, no la de Tailwind. Ancla en el 600.

| Tono | Valor | |
|---|---|---|
| 50 | `#f7f6fd` | |
| 100 | `#f5f3fe` | |
| 200 | `#ddd9fa` | |
| 300 | `#b5adf2` | |
| 400 | `#a49aef` | |
| 500 | `#8073e8` | |
| **600** | **`#6e5fe4`** | **← el color principal, congelado** |
| 700 | `#5849d0` | |
| 800 | `#3f2fb7` | |
| 900 | `#2e228c` | |
| 950 | `#1f1859` | |

### Dorado — «la opción elegida»

`gold-50` `#fbf4e4` · `100` `#f6ecd6` · `200` `#ead6ac` · `300` `#dcbd7e` ·
`400` `#d0aa5b` · **`500` `#c99a3d`** · `600` `#ad812e` · `700` `#8a6624`

Señala la respuesta: la herramienta recomendada, el dato verificado clave.
**Como mucho una vez por pantalla, y nunca de forma decorativa.**

### Neutra («slate») — con matiz violeta

Sustituye por completo al gris de Tailwind, del papel cálido a la tinta casi
negra: `50` `#faf9fc` · `100` `#f3f1f9` · `200` `#e7e3f5` · `300` `#d3cde8` ·
`400` `#a79fc9` · `500` `#8079a8` · `600` `#605892` · `700` `#4a4272` ·
`800` `#362f52` · `900` `#211d38` · `950` `#14121f`

### Fondo cálido de la portada

`--color-fondo-calido` `#fdfaf5`. Un crema, distinto del `slate-50` del resto
de la web: la portada se apoya sobre un suelo más cálido a propósito.

### Contorno de tarjeta

`--color-contorno`, negro al 2%. El hilo casi invisible que despega las
superficies blancas del fondo. Se escribe `ring-1 ring-contorno`.

---

## 4. Los colores con significado

Molnip tiene **dos** vocabularios de color con significado, y no se mezclan.
Confundirlos ya causó un error: cuatro estados del proceso de afiliación
estaban pintados con colores de mensaje, como si fueran lo mismo.

Un color de **mensaje** habla de lo que acaba de pasar en la pantalla y dura un
instante. Un color de **estado** dice en qué punto está una afiliación y dura
semanas. Si algún día cambia el verde de «guardado», «activa» no tiene por qué
cambiar con él.

### Mensajes (toda la web)

| Significado | Token |
|---|---|
| Éxito — algo salió bien, verificado o completado | `exito-*` |
| Atención — pide una decisión, pero nada está roto | `atencion-*` |
| Error — algo falló o está bloqueado | `error-*` |
| Información — contexto neutro, sin juicio | `info-*` |

### Estados del proceso de afiliación

Nombre funcional, dos tonos por estado (`fondo` para la píldora, `texto` para
lo que va escrito dentro). Los siete viven en
`components/admin/estadosAfiliacion.ts`:

`estado-pendiente-*` · `estado-preparada-*` · `estado-enviada-*` ·
`estado-aprobada-*` · `estado-activa-*` · `estado-rechazada-*` ·
`estado-seguimiento-*`

**No se añade un color ni un estado nuevo sin incorporarlo antes a la tabla que
le corresponda.**

---

## 5. Tema

**Molnip tiene únicamente tema claro.** Es una decisión consciente de la
propietaria, no un olvido: clases `dark:` en el proyecto, 0.

Añadir modo oscuro obligaría a rehacer la escala neutra entera. Es un sprint
propio, no un retoque, y necesita aprobación.

---

## 6. Las comprobaciones que sostienen esto

En `components/__tests__/`:

| Prueba | Falla si… |
|---|---|
| `colorDeMarca.test.ts` | el color principal deja de ser `#6E5FE4`, el módulo de paleta y `globals.css` dejan de coincidir, este documento deja de nombrar el color, o reaparece el índigo retirado |
| `vocabularioVisual.test.ts` | una página escribe un color a mano, aparece un color que el sistema no declara, aparece un radio fuera del vocabulario, un token de estado se escribe fuera de su módulo, o el valor de un token deja de coincidir con el tono del que dice salir |

Ninguna lleva lista de excepciones toleradas: están las dos vacías, y una
comprobación falla si alguien vuelve a llenarlas. Sin un sitio donde apuntar
una excepción, la única salida ante un color fuera del sistema es arreglarlo —
o pedir permiso para cambiar el sistema.

---

## 7. Pendiente de una futura revisión de branding

### `#f4c15c` — el dorado de la imagen compartida

En `app/resultado/[token]/opengraph-image.tsx` hay un dorado, `#f4c15c`, que
**no pertenece a la paleta**. Se usa para la puntuación en la imagen que se ve
al compartir un resultado en redes sociales. El dorado de marca es
`gold-500` `#c99a3d`.

**Decisión de la propietaria del 2026-09-01: se mantiene sin cambios por
ahora.** Queda anotado para **una futura revisión de branding**, junto con el
resto de la imagen compartida.

No es un descuido ni una excepción tolerada por comodidad: es el único color
de todo el proyecto fuera del sistema, está localizado en una línea, y la
prueba `vocabularioVisual.test.ts` lo tiene escrito con nombre y apellidos. Si
apareciera un segundo, la prueba fallaría.

Cuando llegue esa revisión, las opciones son: unificarlo con `gold-500`
—cambia el tono de esa imagen—, o incorporarlo a la paleta como un dorado
propio con su significado. Ninguna se toma sin aprobación.

---

## 8. Documentos relacionados

- **`ATLAS.md`** → «MOLNIP VISUAL v1 — referencia oficial y obligatoria»:
  tipografía, forma, botones, cabecera, medidas, responsive, imágenes y
  movimiento, y las cinco líneas congeladas.
- **`app/globals.css`** → los tokens. La fuente de verdad.
- **`lib/marca/paleta.ts`** → los mismos valores para lo que no lee CSS.

---

## 9. Prompt oficial de imagen de Molnip (v2)

**Aprobado por la propietaria el 2026-09-01.**

Existe porque sin una referencia fijada, cada imagen nueva se parece a la
anterior solo por casualidad. La fotografía de la portada se sustituyó cuatro
veces en dos días, las cuatro en commits marcados «WIP … (en revisión)».

**No hay un estilo común que valga para todo.** Molnip tiene cuatro módulos
independientes, y cada uno trae sus propias reglas completas. No se mezclan ni
se heredan entre sí.

### 9.0 Reglas de proceso (no son estilo)

Aplican a cualquier imagen, venga del módulo que venga.

#### El violeta oficial es una referencia, no una garantía

`#6E5FE4` es la referencia cromática oficial, pero **ningún generador devuelve
un código hexadecimal exacto**. Una imagen generada **se valida a ojo y
midiendo el matiz**; no se da por buena porque el prompt lo pidiera.

Criterio de aceptación: **matiz 247° ± 5°**, nunca por debajo de 242°, que es
donde empieza a leerse azul.

**Dónde se mide.** En una **zona violeta representativa y suficientemente
saturada del objeto**: la masa de color, no un punto cualquiera. **No se mide
en** sombras, reflejos y brillos especulares, zonas transparentes, ni bordes
suavizados — ahí el matiz se desvía por la propia física del render, y no dice
nada sobre el color de la pieza.

**El color exacto de la interfaz sigue saliendo del CSS**, de
`--color-brand-600`. Las imágenes acompañan a ese violeta; no lo definen ni lo
sustituyen.

#### Ninguna imagen entra directamente en producción

El orden es siempre este:

1. Se genera.
2. Se coloca en su sitio real y se enseña **en contexto, en móvil y en
   escritorio**.
3. La propietaria da su **aprobación explícita**.
4. Solo entonces se sustituye el archivo.

Sin el paso 3 no hay paso 4.

---

### 9.A Objetos de categoría

> Still life photograph of a single faceted indigo-violet gemstone, centred,
> with generous empty space around it. Warm off-white paper ground, seamless,
> no visible horizon. Soft directional key light from the upper left, single
> dominant source, gentle falloff. Short soft shadow anchoring the stone to
> the surface. Shallow depth of field: stone sharp, ground softly out of
> focus. Calm and precise, muted and premium, never glossy or commercial.
> Square 1:1.

**Color.** El violeta va **en la piedra, nunca en el fondo**. Referencia
`#6E5FE4`, matiz objetivo 247° ± 5°, medido como dice 9.0. Fondo crema cálido
entre `#e2d9d1` y `#efe1d6` (matiz 26–34°, luminosidad 82–89%).

**Encuadre.** La piedra ocupa entre el **35% y el 55%** del cuadro.

**Medidas.** 1:1, 1024×1024. Se muestra entre 64 y 288 px.

**Nunca:** fondo violeta u oscuro · azul cian o eléctrico · más de una piedra ·
encuadre macro · texto · reflejos duros o destellos · sombras largas.

**Coherencia sin repetición.** Se repiten: el suelo crema, la luz desde arriba
a la izquierda, la sombra corta, el objeto único con aire. Cambian: el corte,
el número de facetas, el ángulo, la proporción entre transparencia y color
saturado.

---

### 9.B Hero con persona

> Full-body cut-out photograph of one person, 35–55, working calmly with a
> tablet or laptop. Absorbed in the task, not posing, not looking at camera.
> Neutral to faintly positive expression. Natural unstyled clothing in muted
> neutrals — linen, cotton, oatmeal, olive, cream. Even soft lighting, no
> harsh shadows on the figure. Standing, three-quarter or side orientation.
> Transparent background, clean edges, no ground shadow.

**Color.** La persona **no aporta violeta**. El índigo lo pone el degradado de
la web detrás de ella, desde el CSS. Ropa en neutros apagados: si la ropa
compite en color con la mancha, la imagen está mal.

**Formato — obligatorio.** **PNG con transparencia real.** Altura mínima
**1600 px**, preferible **2048 px**. Proporción vertical aprobada **0,35** (la
de `molnip-owner-final.png`, 541×1531).

| Altura | Anchura correspondiente |
|---|---|
| 1600 px (mínimo) | ≈ 565 px |
| **2048 px (preferible)** | **≈ 724 px** |

**Comprobación obligatoria del recorte.** Antes de aceptar la imagen se mira
**sobre fondo claro y sobre fondo oscuro**. Sobre uno solo no se ven los
defectos: el halo blanco desaparece sobre blanco, y la contaminación de color
del fondo original desaparece sobre oscuro. Se busca:

- **halo** o borde luminoso alrededor de la silueta;
- **contaminación de color** del fondo del que se recortó, sobre todo en el
  pelo, los bordes de la ropa y entre los dedos;
- **bordes defectuosos**: dentados, con restos, o recortados de más.

**Nunca:** sonreír a cámara · posar · fondo de oficina · pantallas con
interfaces inventadas · logotipos en la ropa · sombra proyectada sobre el suelo
(la pone el CSS) · recorte con halo o bordes sucios · manos deformes o dedos de
más.

**Coherencia sin repetición.** Se repiten: la actitud concentrada y tranquila,
el vestuario neutro, el recorte limpio sobre transparencia, el cuerpo entero.
Cambian entre generaciones: edad, tono de piel, complexión, peinado, postura y
el dispositivo.

---

### 9.C Blog

> Still life photograph of two or three glass and crystal objects in quiet
> relation to each other. Warm off-white ground, seamless. Soft directional
> light from the upper left, short soft shadows. More negative space than a
> product shot. Editorial, calm, unhurried. Horizontal 16:9.

**Color.** Predominio del vidrio transparente y el crema. El índigo, si
aparece, en un solo objeto y a 247° ± 5°, medido como dice 9.0.

**Medidas.** 16:9, 1600×900.

**Nunca:** personas · texto · gráficos, flechas o iconos flotando · collages ·
más de tres objetos · fondos oscuros.

**Coherencia sin repetición.** Se repiten: el suelo crema, la luz, el aire
generoso. Cambia la composición: número de objetos, separación entre ellos,
altura de cámara, qué objeto está enfocado.

---

### 9.D Piezas de estado — módulo abierto

**Este módulo no está cerrado.** El lenguaje formal es el mismo que el de las
categorías —objeto único, suelo crema, luz suave desde arriba a la izquierda,
sombra corta, 1:1 a 1024×1024— pero **las metáforas son propuestas, no regla**:

| Estado | Metáfora propuesta | Situación |
|---|---|---|
| Error / 404 | vidrio agrietado | **propuesta, sin aprobar** |
| Vacío | piedra lisa y opaca | **propuesta, sin aprobar** |
| Resultado | cristal con una faceta dorada | **propuesta, sin aprobar** |
| Carga | luz atravesando el vidrio | **propuesta, sin aprobar** |

Ninguna se congela hasta ver ejemplos y recibir aprobación visual de la
propietaria.

Lo que sí está fijado desde ya:

- **El dorado es «la opción elegida»**: matiz 36–45°, **una sola faceta**,
  nunca más del **8%** del cuadro, nunca el sujeto.
- **Un objeto, una idea.** Si hacen falta dos objetos para explicar el estado,
  la metáfora no es buena.

**Nunca:** el dorado como sujeto · fondo violeta u oscuro · texto ·
iconografía convencional (equis, exclamaciones, engranajes).

---

### 9.E Estado del archivo existente

Auditoría del 2026-09-01 sobre las doce imágenes del proyecto. **Nada se ha
tocado**: ni se ha generado, ni sustituido, ni eliminado ninguna.

Siete de las diez piezas de marca representan bien la identidad aprobada:
`404-grieta`, `categoria-gema`, `comparador-gemas`, `cuestionario-formacion`,
`hero-formas`, `resultados-cristal` y `vacio-piedra`.

Estos **cuatro ficheros** quedan documentados:

| Fichero | Situación |
|---|---|
| `imagenes/marca/ficha-macro.png` | **Desviación pendiente.** Único fondo violeta oscuro (matiz 284°, luminosidad 42%) frente a nueve cremas; encuadre macro que llena el cuadro; dorado al 36,9%, sujeto en vez de acento. **No se regenera** |
| `imagenes/marca/cta-final-dorado.png` | **Desviación pendiente.** El dorado es el sujeto (10,3%), no el acento. Contradice la regla de «la opción elegida». **No se regenera** |
| `imagenes/marca/carga-luz.png` | **Desviación pendiente.** Violeta a matiz 231°, a 16° del oficial: el mismo error que tuvo la portada. **No se regenera** |
| `images/molnip-business-owner.png` | **Archivo huérfano.** 1.971 KB, sin usar en el código desde el 2026-08-24, cuando `5360620` lo sustituyó. **No se elimina ni se reutiliza**: queda documentado, pendiente de decisión de la propietaria |
