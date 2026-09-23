# Las 65 herramientas, casa por casa

**23 de septiembre de 2026.** Se leyeron las páginas oficiales de las 65
herramientas activas del catálogo (portada y precios) y se cruzó lo que dicen
con lo que F2 dejó verificado. Ninguna respuesta salió de memoria: las 65
tienen al menos una página leída de verdad, y cada servicio que se le atribuye
a una herramienta lleva la frase literal que lo sostiene.

**Esto no toca ninguna ficha.** Es investigación: nadie ha asignado todavía
categorías en `data/herramientas/`. Eso cambia lo que hace el motor y lo
decide la propietaria.

## Los tres niveles, y por qué no basta con uno

La primera pasada daba **una media de 5 casas por herramienta**, con 58 de 65
en «automatización» y 54 en «IA». Eso no es su servicio: es su folleto. Tener
API no es ofrecer automatización, y un botón de «redactar con IA» no convierte
un CRM en una herramienta de contenido.

Así que cada herramienta entra en una casa por uno de tres motivos, y no pesan
lo mismo:

- **Es su oficio.** Es por lo que existe y por lo que la gente la conoce. Lo
  dice su propia portada.
- **Lo hace.** F2 verificó capacidades suyas de ese dominio, con fuente y
  fecha. No es su oficio, pero está comprobado que lo hace.
- **Lo trae.** Su página lo anuncia y F2 no lo ha comprobado todavía. Es una
  pista para investigar, **no un dato**. Nada debería mostrarse a un cliente
  apoyado sólo en esto.

## El recuento

| Casa | Es su oficio | Lo hace | Lo trae | Total |
|---|---:|---:|---:|---:|
| CRM y ventas | 24 | 4 | 8 | 36 |
| Gestión de proyectos | 17 | 13 | 8 | 38 |
| IA y contenido | 15 | 7 | 37 | 59 |
| Facturación y contabilidad | **0** | 17 | 8 | 25 |
| Reservas y citas | 1 | 8 | 14 | 23 |
| Atención al cliente | **0** | 3 | 21 | 24 |
| Comercio electrónico | 1 | 3 | 7 | 11 |
| Automatización e integraciones | **0** | 60 | 5 | 65 |
| Marketing y email | 5 | 10 | 17 | 32 |
| Recursos humanos | **0** | 3 | 8 | 11 |
| Inventario y operaciones | **0** | **0** | 7 | 7 |
| Creación web y hosting | **0** | 6 | 8 | 14 |
| Firma y gestión documental | **0** | 7 | 15 | 22 |
| Software sectorial | 2 | 0 | 1 | 3 |

## Lo que dice esta tabla

**El catálogo son tres casas y media.** 56 de las 65 tienen su oficio en CRM,
gestión de proyectos o IA. Las otras once casas se llenan con herramientas que
vienen de esas tres y de paso hacen algo más.

**Cinco casas no tienen dueño y una está vacía.** Facturación, atención al
cliente, recursos humanos, creación web y firma documental no tienen ni una
sola herramienta cuyo oficio sea eso. **Inventario y operaciones no tiene
nada**: ni oficio, ni una capacidad verificada. Hoy esa puerta se abre a una
habitación vacía.

**Facturación es el agujero que más va a doler.** Diecisiete herramientas
facturan de verdad —verificado—, pero ninguna es un programa de facturación.
Son CRMs y gestores de proyectos que emiten facturas. Para una autónoma
española que pregunta por facturar, eso no es lo mismo, y es exactamente lo
que se vio en el caso de la peluquera.

**«Automatización e integraciones» no es una casa.** Entran las 65. Sesenta
tienen capacidades verificadas ahí porque *conectar con otras apps* lo hace
todo el mundo. Nadie sale de casa a buscar «una herramienta de integraciones»:
sale a buscar que su agenda hable con su facturación. Debería ser un filtro
dentro de las demás casas, no una puerta propia.

**Dos dominios del vocabulario se quedaron sin casa, a propósito:**
`seguridad` y `comunicacion-interna`. Meter `seguridad` en «firma y gestión
documental» subía esa casa de 7 a 50 herramientas, porque tener doble factor
no es ofrecer gestión documental. Son atributos que cruzan todas las casas, no
servicios que alguien vaya a buscar. Queda apuntado por si la propietaria lo
ve de otro modo.

## Lo que falta

Lo siguiente es **ordenar dentro de cada casa, de más lejana a más cercana**,
con facilidad de uso e interfaz entre los criterios. Eso no está hecho aquí a
propósito: el orden es un paso aparte y sus criterios ya están decididos.

Y las columnas «lo trae» son deuda: 37 herramientas dicen hacer IA y 21 dicen
dar atención al cliente sin que F2 lo haya comprobado. Mientras no se
compruebe, no se enseña.

## Los archivos

- `declarado.json` — lo que dice cada herramienta de sí misma, con la cita
  literal de cada servicio y qué páginas se leyeron.
- `asignacion.json` — el cruce: casa, nivel, cuántas capacidades verificadas y
  la cita.
- `crudo/` — las 65 respuestas tal cual salieron, con las URLs que se
  abrieron y si cada una respondió.
- `cruce.mjs` — cómo se calculó. Se vuelve a ejecutar tal cual.
