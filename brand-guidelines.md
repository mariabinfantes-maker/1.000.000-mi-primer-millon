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

## 7. Lo que queda pendiente de decisión

| Dónde | Qué | Por qué no se ha tocado |
|---|---|---|
| `app/resultado/[token]/opengraph-image.tsx` | `#f4c15c`, un dorado fuera de paleta en la imagen que se ve al compartir un resultado en redes | Cambiarlo movería el color de esa imagen. Necesita decisión de la propietaria |

---

## 8. Documentos relacionados

- **`ATLAS.md`** → «MOLNIP VISUAL v1 — referencia oficial y obligatoria»:
  tipografía, forma, botones, cabecera, medidas, responsive, imágenes y
  movimiento, y las cinco líneas congeladas.
- **`app/globals.css`** → los tokens. La fuente de verdad.
- **`lib/marca/paleta.ts`** → los mismos valores para lo que no lee CSS.
