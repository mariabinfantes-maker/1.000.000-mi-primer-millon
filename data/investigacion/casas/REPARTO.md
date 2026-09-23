# El reparto

**23 de septiembre de 2026.** Las 15 casas, y cada herramienta en **todas las
que sirve**. Si sirve a ventas está en ventas; si además sirve a vídeo, está
también en vídeo. No hay que elegir una.

Hoy cada ficha tiene **una sola** `categoriaId`, y por eso las 65 viven en 4
casas de las 15. Con este reparto cada herramienta está en **3,3 casas de
media**, y la que más, en 10.

| Casa | Hoy | Está | Por comprobar |
|---|---:|---:|---:|
| Plataformas todo en uno | 17 | 6 | — |
| CRM y ventas | 15 | 28 | 8 |
| Gestión de proyectos | 15 | 30 | 8 |
| Asistentes de IA y productividad | 18 | 22 | 37 |
| Facturación y contabilidad | 0 | 17 | 8 |
| Reservas y citas | 0 | 9 | 14 |
| Atención al cliente | 0 | 3 | 21 |
| Comercio electrónico | 0 | 4 | 7 |
| Automatización e integraciones | 0 | 60 | 5 |
| Marketing y email | 0 | 15 | 17 |
| Recursos humanos | 0 | 3 | 8 |
| Inventario y operaciones | 0 | **0** | 7 |
| Creación web y hosting | 0 | 6 | 8 |
| Firma electrónica y gestión documental | 0 | 7 | 15 |
| Software sectorial | 0 | 2 | 1 |

## Cuándo está una herramienta en una casa

**Está** si sirve a esa casa y lo sabemos: F2 verificó alguna capacidad suya
de ese tema, o esa casa es su oficio —lo que la herramienta es— según su
propia portada. Un CRM está en la casa de CRM.

**Por comprobar** si su página lo anuncia y F2 todavía no lo ha mirado. No es
que no sirva: es que aún no lo sabemos. Son **164 comprobaciones pendientes**,
y hasta hacerlas esas herramientas no se enseñan en esa casa.

**Todo en uno** no se decide a ojo: entra quien sirve a seis casas o más. Hoy
son seis —Agiled, Bitrix24, HoneyBook, HubSpot, Keap y Nutshell— frente a las
17 que hay marcadas así en las fichas.

## Lo que queda visto

**Inventario y operaciones está vacía**, y las siete «por comprobar» son la
única vía para llenarla.

**Atención al cliente tiene 3 y 21 por comprobar.** Es la casa donde más
diferencia va a hacer terminar la verificación.

**Automatización e integraciones tiene 60 de 65.** Conectar con otras apps lo
hace casi todo el mundo, así que esa casa no distingue nada. Funciona mejor
como filtro dentro de las demás que como puerta propia. Queda apuntado; no se
cambia nada.

## Nada de esto está aplicado

Las fichas de `data/herramientas/` siguen con su `categoriaId` única. Pasar de
una casa a varias cambia el esquema y lo que hace el motor, y eso lo autoriza
la propietaria.

## Los archivos

- `reparto.json` — cada herramienta, en qué casas está, cuáles tiene por
  comprobar y en cuál está hoy.
- `reparto.mjs` — cómo se calculó. Se vuelve a ejecutar tal cual.
- `declarado.json` y `crudo/` — lo que dice cada página oficial, con cita y
  las URLs que se abrieron.
