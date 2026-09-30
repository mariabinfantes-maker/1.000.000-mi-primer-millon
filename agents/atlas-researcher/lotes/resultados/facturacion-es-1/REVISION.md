# Revisión de los cinco borradores — 2026-09-17

**Veredicto: ninguna de las cinco se promueve todavía.**

## Lo primero, y es lo más importante

**No hay citas. No hay nada que revisar cita a cita.**

Los cinco borradores no contienen ni una sola frase literal de ninguna página.
Lo que traen es una lista de direcciones y esto:

```json
{ "confianza": "alta", "advertencias": [] }
```

Es decir: **el propio pipeline se pone un sobresaliente a sí mismo** y declara
que no hay nada que advertir, sobre un texto que nadie ha comprobado. Eso no
es un fallo de este lote: es cómo está hecho el Researcher. Las fichas que
produce son **el modelo hablando**, no evidencia.

La evidencia de verdad es otra cosa y vive en otro sitio: F2, con
`url_context` y prueba de descarga, que es lo que exige que la cita esté en la
página antes de aceptarla.

## Lo segundo, y es una prueba, no una sospecha

La propietaria investigó la afiliación de estas mismas cinco **abriendo las
páginas reales**. Eso nos ha dado, sin buscarlo, un control independiente
contra el que contrastar al modelo. No coincide:

| | Dirección que el borrador declara como fuente | Lo que ella encontró |
|---|---|---|
| Quipu | `getquipu.com/programa-de-afiliados` | `getquipu.com/es/referral` |
| Billin | `billin.net/afiliados/` | `billin.net/afiliacion/` |
| FacturaDirecta | `facturadirecta.com/afiliados` | **No hay afiliación pública.** Sólo `/partner/`, que es reventa |

Las tres direcciones están listadas como **fuentes consultadas**. La tercera
no describe lo que el borrador da por hecho que describe.

**Conclusión:** el modelo produce direcciones plausibles que no existen o no
dicen lo que parece. Si la propietaria no llega a mirar, esto entra al
catálogo como bueno.

## Defectos estructurales, comprobados contra el repositorio

| | Categoría inventada | Sin `problemasIds` | Sin `logoUrl` |
|---|---|---|---|
| Quipu | `facturacion`, `gestion-financiera` | sí | sí |
| Anfix | — | sí | sí |
| Billin | `facturacion` | sí | sí |
| FacturaDirecta | `facturacion`, `contabilidad` | sí | sí |
| Contasimple | `facturacion`, `contabilidad` | sí | sí |

- **`facturacion` no existe.** La categoría real se llama
  `facturacion-contabilidad`. Tampoco existen `gestion-financiera` ni
  `contabilidad`. Cuatro de las cinco se la inventaron — y encima el lote les
  pasaba `plataformas-todo-en-uno` como categoría de partida.
- **Sin `problemasIds` no salen por ninguna puerta de objetivo.** Es
  exactamente el mismo defecto que la suite cazó en el lote de cursos.

## Datos que tienen la forma exacta de lo que ya no nos creemos

Sin fuente comprobable, en los cinco borradores: puntuaciones de Capterra,
Trustpilot y Google Play con número de reseñas al detalle; año de fundación;
tamaño de la empresa; precios; planes recomendados; y la afirmación de cumplir
Veri*Factu y TicketBAI.

Es la misma forma que tenían las 62 fichas originales, que hoy no usamos como
verdad. **Aceptarlas sería repetir el error que ya nos costó el catálogo.**

## Un dato que ya sabemos que está mal

El borrador llama **Billin** a secas. La propietaria comprobó en la web oficial
que la marca actual es **TS Facturas**, con el dominio billin.net. El modelo no
lo sabe.

## Lo que sí se salva

**La identidad y el país.** Los cinco nombres existen, los cinco dominios
oficiales parecen correctos, los cinco son españoles y `disponibilidadGeografica`
dice `["ES"]` — las primeras fichas del catálogo con país real. Eso es lo que
el lote vino a averiguar, y lo averiguó.

## Una nota que no esperaba encontrar

La categoría **`facturacion-contabilidad` ya existe** en `data/categorias.json`,
con estado `pendiente` y **cero herramientas**. Lleva ahí esperando desde antes
de esta conversación. Estas cinco serían las primeras. Abrirla al público es
una decisión de la propietaria, no una consecuencia automática de promover.

## Qué haría ahora

**No promover ninguna, y separar las dos cosas que el Researcher mezcla:**

1. **Entrar al catálogo diciendo poco.** Nombre, dominio oficial, país, idioma
   y categoría `facturacion-contabilidad`. Eso es verdad comprobable y útil.
2. **Que las capacidades las ponga F2**, con `url_context` y prueba de
   descarga, que es el único canal que exige que la cita esté en la página.
3. **Tirar del borrador todo lo que afirma sin prueba**: reputación, año,
   tamaño, ventajas, inconvenientes, y sobre todo Veri*Factu.

Es lo que ya dijimos hoy con otras palabras: **entrar al catálogo es barato;
prometer es caro.**
