# El reparto, aplicado a las fichas

**23 de septiembre de 2026.**

## Qué se escribió

El campo ya existía: **`categoriasSecundarias`**, creado «para que una suite
pueda aparecer donde legítimamente compite sin tener que falsear su categoría
principal — y para que ninguna herramienta se declare "todo en uno" solo para
salir en más sitios». No hizo falta tocar el esquema.

**39 fichas cambiaron, con 52 casas añadidas.** Venían 12 fichas con el campo
puesto, todas suites.

| Casa pública | Herramientas |
|---|---:|
| Asistentes de IA y productividad | 43 |
| Gestión de proyectos | 38 |
| CRM y ventas | 35 |
| Plataformas todo en uno | 18 |

## Sólo se escribieron las casas abiertas

**Once de las quince casas están en `estado: "pendiente"`**, no publicadas. Y
hay una guarda que exige que toda categoría secundaria apunte a una categoría
pública. Meter ahí las pendientes habría sido **publicarlas por la puerta de
atrás**, y abrir una casa es una decisión de la propietaria.

Así que el reparto de esas once queda escrito y listo en
`pendiente-de-abrir.json`, sin tocar las fichas:

| Casa, aún cerrada | Le entrarían |
|---|---:|
| Automatización e integraciones | 65 |
| Marketing y email | 22 |
| Atención al cliente | 22 |
| Facturación y contabilidad | 21 |
| Firma electrónica y gestión documental | 16 |
| Reservas y citas | 11 |
| Creación web y hosting | 11 |
| Recursos humanos | 9 |
| Comercio electrónico | 8 |
| Inventario y operaciones | 4 |
| Software sectorial | 2 |

**Sobre «Automatización e integraciones»: le entrarían las 65.** Es cierto
—conectar con otras apps lo hace casi todo el mundo— y por eso no distingue
nada: quien entre ahí verá el catálogo entero. Funciona mejor como filtro
dentro de las demás casas que como puerta propia. Queda dicho; no se cambia
nada.

## No se quitó nada

Dos secundarias que ya estaban y que el reparto no respalda con evidencia
—`Odoo → gestion-proyectos` y `Systeme.io → crm`— **se conservan**. Alguien
las decidió antes; no se borran.

Tampoco se tocó ninguna `categoriaId` principal, ni se añadió
`plataformas-todo-en-uno` a nadie: su regla se retiró por ser un umbral
inventado y no hay criterio que la sustituya.

## Un fallo que esto destapó

`generarParesComparacion` devolvía el par en el orden del catálogo mientras su
slug iba en orden alfabético. Coincidían por casualidad mientras las
categorías tenían pocas herramientas; al llenarlas dejaron de coincidir, y la
URL y la página discrepaban sobre cuál de las dos va primero. Corregido: el
par se ordena igual que su slug.
