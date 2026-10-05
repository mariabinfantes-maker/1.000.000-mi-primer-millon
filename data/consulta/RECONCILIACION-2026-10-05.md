# Reconciliación: lo investigado → lo guardado → lo que usa el asesor

**Fecha:** 2026-10-05. **Quién:** Claude, en la sesión de trabajo con la
propietaria. **Qué es:** un diagnóstico. **No decide nada**: no cambia ninguna
ficha, ningún dato, el motor ni el esquema, y no se ha investigado nada nuevo.
Todo sale de lo que ya existe en el proyecto.

**Por qué existe.** Se dijo de DriCloud que «no tenemos guardado si ofrece una
prueba gratuita». Sí estaba guardado: la entrega del 30 de septiembre decía
*«La demostración gratuita no es un plan»*. Al pasar a la ficha se copió el
«no» y se perdió el porqué. La propietaria pidió, antes de tocar el esquema o
el motor, saber *«qué conocimiento ya existe dentro de Molnip y qué parte de
ese conocimiento no está llegando al sitio donde debería utilizarse»*. Y
distinguir *«entre datos que el producto necesita para decidir, evidencia que
necesitamos conservar para justificar esos datos y documentación de
investigación que sólo necesitamos poder consultar»*.

**Cómo se hizo.** Con la consulta `npm run que-sabemos -- <id>`
(`data/consulta/queSabemos.ts`), que enlaza cada archivo de
`data/investigacion/` con su herramienta por `id`, `herramientaId`, nombre o
nombre del archivo. El diagnóstico usa exactamente esa misma función. Los
números en bruto están en `data/consulta/reconciliacion-2026-10-05/`.

---

## 1. Cobertura: las 90 tienen investigación localizable

Antes dije que «sólo 24 de 90» tenían entrega enlazable. **Era un error de
búsqueda mío**: miré un único tipo de objeto. Con todas las formas de enlace,
**las 90 herramientas tienen al menos una entrega de investigación con
campos**.

| Fuentes por herramienta (carpetas de investigación distintas) | 2 | 3 | 4 | 5 | 6 o más |
|---|---|---|---|---|---|
| Herramientas | 17 | 45 | 10 | 13 | 5 |

Pero no todas tienen la misma clase de investigación:

- **25 herramientas tienen una investigación de perfil completa** (precio,
  plan gratuito, tamaño, curva, idioma, límites…): las que entraron entre el
  28 y el 30 de septiembre, casi todas de reservas, citas y clínicas.
- **Las 65 originales tienen investigación de capacidades y de casas**, no de
  perfil. Sus datos de perfil —plan gratuito, curva, tamaño, idiomas— son los
  de la primera redacción, más lo que se comprobó después con fuente en la
  propia ficha (precios, planes, tipo de plan gratuito).

**Tipos de fuente interna que existen hoy:**

| Fuente | Dónde | Herramientas |
|---|---|---|
| Ficha | `data/herramientas/<id>.json` | 90 |
| Borrador (mismo formato que la ficha) | `data/borradores/herramientas/` | 28 |
| Capacidades verificadas con cita | `data/verificacion/registros.json` | 90 |
| Precio comprobado con fecha y página | ficha · `preciosComprobados` | 87 |
| Planes comprobados con cita | ficha · `planesComprobados` | 57 |
| Tipo de plan gratuito comprobado | ficha · `tipoPlanGratuito` | 62 |
| Idioma con recibo | ficha · `idiomaComprobado` | 2 |
| Entregas de investigación | `data/investigacion/**` (764 archivos) | 90 |
| Documentos `.md` que la nombran | `data/investigacion/**/*.md` | 60 |

`data/verificacion/idiomas.json` existe y está vacío.

## 2. Qué lee el asesor para decidir

De la **ficha**: `tienePlanGratuito` (desempate), `curvaDeAprendizaje`
(desempate), `disponibleEnEspanol` e `idiomaComprobado` (desempate por idioma),
`planesComprobados` (importe comparable para el desempate por precio, y la
cifra corta), y para enseñar: `precioInicial`, `preciosComprobados`,
`urlPrecios`, `logoUrl`, `nombre`.

De las **capacidades** (`registros.json`): si está verificada (cubre o no),
la profundidad (`no_disponible` no cuenta), el plan (`planEstado`, para «A
tener en cuenta») y las capacidades de apoyo demostradas («Además incluye»).

**No lee** `tipoPlanGratuito`, `pruebaGratuitaDias`, `idiomasDisponibles`,
`segmentosIdeales`, `tipoProducto`, ni nada de las entregas de investigación.

## 3. Campos de la investigación que no tienen sitio en la ficha

En cuántas herramientas hay dato. Clasificación **propuesta** en las tres
clases que pidió la propietaria; **no está aprobada**.

**a) Podrían ser datos que el producto necesita para decidir**

| Campo | Herramientas | Qué es |
|---|---|---|
| `precioMasBajo` / `precio` | 25 / 17 | Precio de entrada con cita, moneda y página |
| `limites` | 23 | Límites por plan con cita (calendarios, usuarios, recargos) |
| `idiomaDelProducto`, `idioma` (interfaz / página de cliente) | 25 / 7 | Idioma con estado y cita |
| `esDirectorioOProgramaPropio` | 25 | Si es un programa de gestión o un directorio |
| `moneda` | 9 | Moneda de la tarifa |
| `cuantasIntegracionesPublica` | 5 | Número de integraciones que publica |
| `hayPlanGratuitoPermanente` | 2 | Gratis para siempre o no |

**b) Evidencia que justifica un dato que ya está en la ficha**

| Campo | Herramientas | Justifica |
|---|---|---|
| `porQueEseTamano`, `fuenteDelTamano`, `dondeBusqueElTamano` | 24 | `segmentosIdeales` |
| `citaPlanGratuito`, `urlPlanGratuito`, `fundamentoPlanGratuito`, `ojoConElGratuito` | 20 | `tienePlanGratuito` |
| `porQueEsaCurva` | 12 | `curvaDeAprendizaje` |
| `porQueCadaNota` | 12 | `puntuaciones` |
| `citaDelPrecio`, `urlDelPrecio`, `notaDelPrecio` | 9 | `precioInicial` |
| `pruebas` | 18 | Varios campos de la ficha, con su cita |
| `fraseOriginal`, `deDondeSale`, `porQueEsaFrase` | 25 | `industriasIdeales`, `noRecomendadaPara` |
| `elIdiomaEsDelProductoODeLaPaginaDeReservas`, `citaDelIdioma` | 7 | Idioma |

**c) Documentación de la investigación, para poder consultarla**

`paginasQueAbriste` (25), `paginasQueNoSeAbrieron` (15),
`loQueNoPudeComprobar` / `loQueNoSePudoComprobar` (25), `noConsta` (13),
`oNoLoPublican` (11), `paraQuienEstaPensada` y `paraQuienNoEstaPensada` (25),
y los volcados de páginas (`texto`, `urls`, `leidas`, `recuperada`).

**Las capacidades sí llegaron.** Ninguna capacidad que una entrega dé por
verificada falta o está sin verificar en `registros.json`, y no hay ninguna
profundidad distinta. Esa capa está reconciliada.

## 4. Los siete datos clave, comparados

**Plan gratuito.** La ficha dice que sí en 72 y que no en 18; el tipo está
comprobado en 62 (32 indefinido, 30 de prueba) y falta en 10 que dicen tenerlo.
**En 9 de las 18 que dicen «no», la investigación documenta una prueba
gratuita**: Acuity Scheduling (7 días), Archivex (7 días), Bookeo (30 días),
Bookitit, Booksy, flowww (10 días), Schedulista (15 días), Teachworks (21 días)
y ViDay. La regla de la propietaria del 17 de septiembre dice que *«una prueba
de una semana también es un plan gratuito»*, y en otras 30 fichas se aplicó así.
En estas 9 la investigación la apuntó como «no es un plan permanente» y la
ficha se quedó en `false`. En Jane y Pabau la investigación dice expresamente
que no hay prueba: ahí el «no» es correcto.

**Precio.** 57 fichas tienen planes comprobados, que es lo que el desempate
por precio puede comparar. **De las 33 que no, 20 tienen en la investigación
un precio con cita, moneda y página** que no llegó a `planesComprobados`.

**Tamaño de empresa.** Las 24 investigaciones de perfil traen el porqué del
tamaño; ninguna ficha lo guarda. El motor no usa el tamaño.

**Curva de aprendizaje.** 76 fichas la tienen. 12 traen en la investigación
el porqué (`porQueEsaCurva`), que la ficha no guarda. El porqué de las 64
restantes no está en ninguna parte del proyecto.

**Límites.** 23 herramientas tienen límites con cita en la investigación. La
ficha no tiene campo para ellos y el motor no los usa.

**Profundidad.** Reconciliada: la de las entregas coincide con `registros.json`.

**Idioma.** Dos huecos distintos:

- Para **4 herramientas (Booksy, Jane, Pabau y Timify)** la lista de idiomas
  investigada **sí llegó a la ficha**, a `idiomasDisponibles` (incluye el
  español), pero **el motor no lee ese campo**: lee `disponibleEnEspanol`, que
  en esas cuatro está vacío, así que para el motor siguen «sin confirmar». Las
  entregas traen matices: la lista de Booksy es de 2022, la de Jane separa
  personal y pacientes.
- Para **10 herramientas** la investigación trae idioma con cita (interfaz o
  página de reservas) y la ficha no guarda el recibo (`idiomaComprobado` sólo
  existe en Koibox y Schedulista).

## 5. Diferencias entre la ficha y la investigación — sin decidir cuál vale

| Herramienta | Dato | Ficha | Investigación |
|---|---|---|---|
| Acuity, Archivex, Bookeo, Bookitit, Booksy, flowww, Schedulista, Teachworks, ViDay | Plan gratuito | no | prueba gratuita documentada |
| Cliniko | Plan gratuito | sí | *«NO es un plan gratuito general: sólo para entidades benéficas registradas o instituciones educativas. Un negocio normal paga.»* |
| Bookitit | Precio | desde 15,90 €/mes | desde 16,90 € al mes + IVA (29-09) |
| Zoho Bookings | Precio | en dólares | en euros (29-09) |
| AgendaPro | Tamaño | 1-10 y 11-50 | 1-10 |
| Pabau | Tamaño | 1-10 a 200+ | 1-10 y 11-50 |
| Bookitit | Curva | sin dato | fácil (29-09) |
| Schedulista | Idioma | sin español (recibo del 29-09) | `["es","en"]` en la búsqueda del 28-09 |

El campo `espanol` de `casas/distribucion.json` **no es investigación**: es
una copia calculada de la ficha (coincide en los 175 casos), y no se ha
contado como diferencia.

## 6. ¿Decide el asesor con información incompleta?

Simulado **en memoria**, sin tocar ningún archivo, sobre los 1.891 casos de
una y dos necesidades: qué cambiaría si el dato de la investigación hubiera
llegado al campo que lee el motor.

| Escenario | Casos que cambian | Cambia la recomendada | Qué cambia |
|---|---|---|---|
| Las 9 pruebas gratuitas cuentan como plan gratuito | 83 | 0 | el motivo y el tamaño de los empates |
| Cliniko sin plan gratuito para un negocio normal | 0 | 0 | — |
| El español de Booksy, Jane, Pabau y Timify leído | 80 | 0 | el motivo y el tamaño de los empates |

**En ningún caso cambia la herramienta recomendada. Sí cambia el motivo que
Molnip da, y ese motivo hoy no se sostiene.** El caso de la clínica dental:

- **Hoy dice:** *«Empezaría por Koibox porque, entre las que están en
  español, es la única con plan gratuito.»*
- **Con la prueba gratuita contada:** Archivex (7 días) y Bookitit también
  tienen algo gratis, así que Koibox deja de ser «la única». Seguiría siendo
  la recomendada, pero por la curva: *«Me inclino por Koibox: de las que
  quedan, es la que tenemos valorada como más sencilla para empezar.»* Y ViDay
  entraría entre las alternativas.

Además, **los empates cambian de tamaño** (por ejemplo, «Que puedan reservar
sin llamarme» pasa de 6 a 10 empatadas con la prueba contada). Esto toca
directamente el problema de los empates grandes: rediseñar el desempate con
estos datos sin reconciliar daría resultados distintos de los que darían los
datos completos.

El **precio** no se ha simulado: el desempate por precio sólo actúa si todas
las candidatas tienen importe comparable, y hoy casi nunca pasa. Pero 20
herramientas tienen el precio con cita en la investigación y no en
`planesComprobados`, así que hoy no podrían entrar en esa comparación aunque
se pudiera hacer.

## 7. Lo que este diagnóstico no ha hecho

- No ha cambiado ninguna ficha, ningún dato ni el motor.
- No ha decidido qué fuente vale cuando no coinciden.
- No ha investigado nada fuera del proyecto.
- La clasificación de los campos en a), b) y c) es una propuesta para decidir.
- La búsqueda de «prueba gratuita» se hizo por palabras en los textos de las
  entregas; se revisaron a mano las 11 que salieron, y Jane y Pabau se
  descartaron porque dicen lo contrario.
