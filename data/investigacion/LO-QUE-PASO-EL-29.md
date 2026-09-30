# 2026-09-29 — lo que se hizo y lo que se aprendió

**Para qué sirve esto.** Para que mañana nadie tenga que reconstruirlo, ni
vuelva a preguntar si algo se hizo. No es una crónica: es lo que hace falta
saber para seguir.

**Cómo se lee.** Lo que decidió la propietaria va con sus palabras. Lo demás
es mío. No se le atribuye a ella lo que no dijo.

---

## El resultado

**El catálogo pasa de 65 a 76.** Entran once, todas de reservas y citas:

BEWE · Bookitit · AgendaPro · Cliniko · Archivex · Schedulista · Nubimed ·
ViDay · TIMIFY · Booksy · Square Appointments

Con ellas, **89 registros de capacidad nuevos**, todos con cita y dirección.
De 3.921 a 3.954 tras la limpieza; de 904 a 937 verificados.

## Lo que decidió la propietaria

- **«Sube las 6 al catálogo.»** Autorización de promoción, registrada en
  `data/historial-aprobaciones.json`.
- **«Archivex y Hive son distintas, súbela.»** Anula el aviso de
  casi-duplicado del Curador. La justificación queda escrita entera.
- **Cómo cobra Schedulista va a su ficha, no a una advertencia.** De ahí su
  cuarto inconveniente: «Se cobra por TRAMOS de usuarios, no por usuario
  suelto».
- **El motor no se toca.** Sobre la idea de que un hueco no reste: *«esto es
  lo que no quiero que pase, que luego se presta a confusiones»*. Una
  herramienta difícil y una sin investigar no pueden acabar en el mismo
  sitio.
- **«No me vuelvas atrás.»** Y con razón: el catálogo no carece de
  investigación de curva de aprendizaje; lo que faltaba era ponerlo en orden.

## Lo que decidí yo, para que conste

- Derivar `industriasIdeales` de `paraQuienEstaPensada`, que ya estaba leído
  del 28. **No es investigación nueva**; la frase original se conserva al
  lado de cada lista en `sectores-derivados-2026-09-29/`.
- Derivar `noRecomendadaPara` invirtiendo esa misma frase, aplicando la regla
  que ella dio el 28. Sólo donde la frase nombra un ámbito cerrado.
- Poner `profundidad: "nativa"` por convención en 49 registros donde la
  investigación no la preguntó, sólo si la herramienta es de reservas o
  clínicas y la capacidad es una de las ocho. **Va marcado
  `profundidadEsConvencion: true`** para poder revisarlo sin reinvestigar.
- **No poner `el-dinero`** en los `problemasIds` de AgendaPro ni Cliniko,
  aunque lleven caja y facturación: no había ninguna herramienta etiquetada,
  ponerlo cambiaba lo que recomienda el motor, y partir «dinero» en sus
  piezas es el siguiente paso del acuerdo de rumbo. Quedan como candidatas.

## Lo que se midió y hay que tener delante

**Las herramientas nuevas entran y no salen recomendadas.** No es una
impresión: con una peluquera de 1-10 empleados en España, Bookitit saca 4,3
puntos y Agiled 39,8. Las seis se puntúan y ninguna llega al top 3; a una
peluquera le salen diagramas de Gantt.

**Por qué.** Un campo vacío no vale cero puntos: **vale como un cero sobre
diez**, el peor valor posible. Bookitit gana +36 en los cuatro criterios que
miden si le sirve a esa persona —tamaño, industria, adaptación al sector,
funciones avanzadas— y pierde 33 en tres que leen campos vacíos.

**Y no se arregla rellenando.** Medido: aplicar la curva, el nivel técnico y
la facilidad de implantación deja la puntuación **exactamente igual**, 4,3.
Porque:

- **`facilidadImplementacion` no es un criterio del motor.** Cero apariciones
  en `agents/atlas-advisor/criterios.ts`.
- **`curvaDeAprendizaje` y `nivelTecnicoRequerido` sólo puntúan si el usuario
  contestó** su tolerancia y el nivel técnico de su equipo.
- **Lo único que mueve es `facilidadDeUso`**, que aparece tres veces: en su
  criterio y detrás de `calidadEnLaTarea` y `facilidadEnSuEspecialidad` en
  `criteriosRuta.ts`.

**Y `facilidadDeUso` depende de tener reseñas en G2 o Capterra.** Bookitit no
tiene ninguna, en ninguna ficha regional. Una herramienta española pequeña no
las tiene. Está sin resolver y es una decisión de producto.

## Los fallos míos que costaron tiempo, y su lección

1. **Corté 8 de las 30 candidatas** porque «el cliente elige profesional»
   salió `no_encontrado`. Eso es «no lo encontramos», no «no lo tiene». Cinco
   de las ocho tenían agenda y precio verificados.
   → **No se descarta por no haber encontrado.**

2. **Guardé el barrido del 28 sin `paginasQueAbriste` ni
   `paginasQueNoSeAbrieron`**: 130 direcciones tiradas. Se recuperaron del
   registro de la conversación en media búsqueda. Entre ellas, el PDF de
   Gesden G5 y los cuatro dominios reales de la ayuda de Treatwell, que
   después busqué con Gemini sin encontrarlos.
   → **Lo crudo se guarda entero, antes que el resumen.**

3. **Mis encargos pedían de menos.** Tres rondas para las 17 porque daba por
   hecho que la ficha existía. Y el recibo del precio no termina una ficha:
   hace pasar el examen de entrada, pero el validador exige once campos más.
   → **Se miden las dos puertas, no una.**

4. **Dos rellenos en el constructor de borradores**, heredados sin mirar qué
   producían: `noRecomendadaPara ?? limites[0]` copiaba un límite en un campo
   que significa otra cosa —ViDay salía con «No está pensada para… el plan
   Empresa incluye tres CIFs»—, y `disponibleEnEspanol` se deducía de la
   lista de idiomas, poniendo `true` en Schedulista, que se gestiona en
   inglés.
   → **Un `??` que rellena es un relleno. Mirar qué produce.**

5. **El archivador leía el resumen de las tandas, no el crudo**, y dejaba
   fuera 89 capacidades demostradas. El resumen sólo guardó los ids.
   → **Leer siempre el crudo.**

6. **Cambié 329 registros que no eran míos** al poner los `problemasIds`:
   planes verificados de las 65 de antes, pasados a desconocido en bloque.
   Revertido con git al verlo en las pruebas.
   → **Un cambio masivo se mira antes de escribirlo.**

7. **Seis encargos, 1.657 líneas, las mismas reglas copiadas a mano.** «No
   conviertas la moneda» acabó en uno solo de los seis.
   → De ahí sale **`encargos/LAS-REGLAS.md`**: se escribe una vez y cada
   encargo es ese archivo más media página de tarea.

## Lo que queda, con nombre

**Jane** — le falta `tienePlanGratuito`. La investigación lo dejó en `null`
tras mirarlo. No se rellena.

**Diecinueve esperando a GPT**, con los encargos ya escritos:

- `PROMPT-GPT-las-tres-y-las-nueve.md` — 3 precios (Teachworks, Fresha,
  Zoho Bookings ya hecho) y 9 fichas.
- `PROMPT-GPT-las-8-cortadas.md` — las ocho, completo, con las direcciones
  que ya se abrieron y las que fallaron.
- `PROMPT-GPT-lo-facil-que-es.md` — las notas de manejo de once fichas.

**Y las deudas viejas, sin tocar:** 43 fichas publican que sus notas salen de
«miles de opiniones verificadas en G2 y Capterra», y nadie agregó nada. La
tarjeta pública sigue diciendo «DESVENTAJAS» a dos columnas. Nada está
desplegado.
