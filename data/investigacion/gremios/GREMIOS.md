# A quién podemos servir hoy

**24 de septiembre de 2026.** La propietaria preguntó a cuántos gremios hemos
decidido servir. La respuesta fue: **a ninguno — esa lista no existe.** Lo
único que había era un campo libre en las fichas, `industriasIdeales`, con
**131 etiquetas distintas para 65 herramientas** («Servicios Profesionales»,
«Servicios profesionales» y «servicios profesionales» son tres entradas), y
apuntando todas al mismo sitio: Tecnología 21, Consultoría 17, Marketing 15,
Startups 7. Ni una peluquería.

Esto es el material para decidir esa lista. **No decide nada.**

## Cómo se ha medido

Quince gremios candidatos, cada uno con **diez necesidades suyas** de las 61
del vocabulario, elegidas por lo que la necesidad dice con sus propias
palabras. El reparto está escrito en `gremios.json` para que se pueda
corregir de un vistazo: es criterio, no cálculo.

De cada necesidad se mira lo que el proyecto ya sabe distinguir:

- **Cubierta** — alguna herramienta demuestra todos sus imprescindibles.
- **Sin catálogo** — se le preguntó a medio catálogo o más y no consta. Aquí
  sí falta herramienta y hay que salir a buscarla.
- **Sin preguntar** — nadie ha mirado. Eso no es un hueco: es deuda nuestra.

## El recuento

| Gremio | Cubiertas | Sin catálogo | Sin preguntar |
|---|---:|---:|---:|
| Agencia de marketing y consultoría | **10/10** | 0 | 0 |
| Diseño, foto y vídeo por cuenta propia | **10/10** | 0 | 0 |
| Reformas y construcción | 9/10 | 0 | 1 |
| Entrenamiento personal y coaching | 8/10 | 0 | 2 |
| Academia y formación | 7/10 | 0 | 3 |
| Asesoría, gestoría y despacho | 6/10 | 0 | 4 |
| Fontanería, electricidad e instalación | 6/10 | 0 | 4 |
| Transporte y reparto | 6/10 | 0 | 4 |
| Inmobiliaria y alquiler | 5/10 | 0 | 5 |
| Obrador y taller artesano | 5/10 | 0 | 5 |
| Restaurante y bar | 5/10 | 0 | 5 |
| Taller mecánico | 5/10 | 0 | 5 |
| Tienda y comercio minorista | 5/10 | 0 | 5 |
| Peluquería y estética | 4/10 | 0 | 6 |
| Clínica: fisio, dental, psicología | 3/10 | 0 | 7 |

## El hallazgo: la columna del medio está a cero

**En los quince gremios, «sin catálogo» es 0.** Ni una sola necesidad se ha
preguntado a medio catálogo y ha salido vacía.

Todo lo que falta está sin preguntar. Y no por poco:

| Bloquea a | Necesidad | Preguntada a |
|---:|---|---:|
| 9 gremios | Que los clientes vuelvan | 17 de 65 |
| 7 | Tener la agenda bajo control | 13 de 65 |
| 6 | Tener junto todo lo de cada cliente o caso | 8 de 65 |
| 5 | Cuidar mis máquinas y mis vehículos | 7 de 65 |
| 5 | Organizar turnos, fichajes y vacaciones | 8 de 65 |
| 5 | Cumplir con la factura electrónica obligatoria | 7 de 65 |
| 5 | Que me encuentren cuando me buscan | 7 de 65 |
| 5 | Cobrar en el mostrador o en la mesa | 7 de 65 |
| 1 | Cumplir con la protección de datos | **0 de 65** |

**Ocho necesidades bloquean a los quince gremios**, y a ninguna se le ha
preguntado a más de 17 herramientas de 65.

Lo que esto significa, dicho sin adornos: **no sabemos que nos falte
catálogo. Sabemos que no hemos mirado.** Decirle hoy a un restaurante «esto
no te lo cubrimos» sería falso; lo cierto es «no lo hemos comprobado».

Y hay prueba de que mirar funciona: en la pasada dirigida se preguntó por
existencias y compras a siete herramientas, y salieron tres y dos. Nadie
había mirado antes.

## Dos gremios ya servidos del todo

**Agencia** y **creativo por cuenta propia** están a 10 de 10. No hace falta
nada más para atenderlos mañana.

Y no es casualidad: son los gremios para los que está escrito el catálogo.
Coincide con lo que dicen las etiquetas de las fichas y con lo que salió al
medir las necesidades. Lo que el catálogo sabe hacer y a quién sabe atender
son la misma cosa.

## Lo que hay que decidir, y lo que no

**No hace falta decidir** si salir a buscar herramientas nuevas: todavía no
sabemos que haga falta.

**Hace falta decidir** dos cosas, y las dos son de la propietaria:

1. **La lista de gremios.** Estos quince son una propuesta. Sobra o falta lo
   que ella diga.
2. **Por dónde se empieza a preguntar.** Las ocho necesidades de la tabla
   cuestan unas 400 comprobaciones dirigidas —el mismo arnés de las 150 de
   ayer— y desbloquean a los quince gremios a la vez. Preguntar sólo por «que
   los clientes vuelvan» y «la agenda» ya toca a doce de los quince.

## Los archivos

- `gremios.json` — los quince gremios y sus necesidades. Es lo que hay que
  corregir si el reparto no cuadra.
- `medicion.json` — el resultado por gremio y por necesidad.
- `../../verificacion/investigacion-casas/gremios.mjs` — cómo se calculó.
