# Modelo de Negocio de Molnip v1.0

**Registrada:** 2026-08-25, junto con `ARQUITECTURA-AGENTES.md`, como parte
de la misma decisión oficial (11 agentes, Atlas Revenue recuperado).

Este documento distingue, para cada fuente de ingreso, si es **real y
activa hoy**, **construida pero sin activar**, o **solo planificada, sin
diseño ni código**. Ninguna cifra ni mecánica de las fuentes planificadas
está decidida todavía — este documento no inventa precios, porcentajes ni
plazos que nadie ha aprobado.

## Principio rector — el muro entre ranking y dinero

Ninguna fuente de ingreso, presente o futura, puede influir en qué
herramienta se recomienda ni en qué orden. Esto no es una aspiración: es
una barrera estructural ya construida en el código, y que se extiende
explícitamente a cada fuente nueva que se incorpore a este documento:

- **Atlas Advisor** (el motor que calcula el ranking) solo recibe el
  catálogo público y las respuestas del usuario — nunca `AffiliateData` ni
  `EstrategiaAfiliacion`. No es un descuido evitar pasárselo: el tipo de
  dato ni siquiera llega a esa parte del código.
- **`priorizador.ts`** (Affiliate Manager) ordena por Puntuación Atlas,
  nunca por comisión, y deliberadamente no combina ambas en una cifra
  única — la comisión se muestra tal cual se investigó, para que la
  decisión de negocio la tome una persona, nunca un algoritmo.
- **Atlas Revenue**, en cuanto se diseñe, hereda esta misma restricción
  como su límite más importante: analiza y optimiza el modelo económico,
  nunca el ranking ni la relación operativa con un proveedor.

## Fuentes de ingreso

### 1. Afiliación — real y activa

El único ingreso real de Molnip hoy. Cuando un usuario llega a un
proveedor a través de un enlace de Molnip, algunos proveedores pagan una
comisión — que sale de su presupuesto de marketing, nunca del bolsillo del
usuario.

- **Agente propietario (gestión operativa):** Atlas Affiliate Manager.
- **Quién decide si un programa es fiable antes de aceptarlo:** Atlas
  Researcher, durante la investigación de cada herramienta — requisito
  obligatorio para entrar al catálogo.
- **Estado:** en producción. Selección de enlace en cada clic real
  (`seleccionarEnlace.ts`), detección de comisión perdida y solicitudes
  estancadas (`consistencia.ts`), priorización de próximas solicitudes
  (`priorizador.ts`).
- **Carencias conocidas para escalar a ~100 herramientas:** ya auditadas
  por separado (sin capacidad de escritura propia, sin detección de
  cobertura total, sin requisitos estructurados, sin borrador de
  solicitud, sin operación por lotes) — no se repiten aquí.

### 2. SEO / tráfico orgánico — habilitador, no ingreso directo

El SEO no genera ingreso por sí mismo: genera las visitas que hacen posible
que las demás fuentes (afiliación hoy; publicidad, patrocinios o Premium en
el futuro) tengan algo que monetizar. Tratarlo como una fuente de ingreso
independiente sería confundir la causa con el efecto.

- **Agente propietario:** Atlas Generador de Contenido.
- **Estado:** Capa 1 completa en producción (metadatos, sitemap, JSON-LD,
  comparaciones, alternativas, estructura de blog con un primer post real).
  Biblioteca de contenido todavía pequeña — crecerá con el tiempo.
- **Relación con Growth:** el tráfico que este agente genere es
  precisamente lo que Atlas Growth (agente 8, sin diseñar) necesitaría
  medir para aportar valor real — construirlo antes sería medir ruido,
  como ya señala `ATLAS.md`.

### 3. Email — habilitador de retención, no ingreso directo

Igual que el SEO: la lista de contactos captada (Brevo) no es en sí misma
un ingreso, es el canal que permite recuperar visitantes, anunciar
contenido nuevo, y en el futuro, cualquier campaña relacionada con
Premium, patrocinios o publicidad seleccionada.

- **Infraestructura:** `lib/email/` — fuera de `agents/`, es
  infraestructura compartida (mismo patrón que `agents/compartido/`), no
  un agente en sí misma.
- **Estado:** en producción (Brevo activado, captación confirmada
  funcionando de extremo a extremo).
- **Capacidad ya construida y lista para reutilizar:**
  `enviarTransaccional()` en el contrato `ProveedorEmail` — un envío
  genérico, sin acoplar a la plantilla de bienvenida, pensado
  explícitamente para automatizaciones futuras (formulario de contacto,
  lista de espera, notificaciones) sin escribir un adaptador nuevo.

### 4. Publicidad seleccionada — planificada, sin diseñar

Sin código, sin diseño, sin decisión sobre qué se anunciaría, con qué
criterio editorial se seleccionaría, ni cómo se garantizaría el mismo
cortafuegos que ya protege al ranking de la afiliación. Cualquier diseño
futuro de esta fuente debe partir del principio rector de este documento
como requisito no negociable, no como algo a decidir después.

- **Preguntas abiertas, sin responder todavía:** ¿quién puede anunciarse
  (solo herramientas ya investigadas y aprobadas por Researcher, o
  cualquiera)? ¿Se marca visualmente como publicidad, de forma clara para
  el usuario? ¿Puede un anuncio aparecer para una herramienta con
  puntuación baja?

### 5. Patrocinios — planificada, sin diseñar

Sin código, sin diseño. Misma exigencia que publicidad seleccionada:
cualquier acuerdo de patrocinio debe quedar fuera del cálculo del ranking,
sin excepción, desde el primer diseño.

### 6. Premium — planificada, sin diseñar

Sin código, sin diseño. Nota estructural importante para cuando se diseñe:
Molnip hoy **no tiene sistema de cuentas de usuario** ("Sin cuentas, sin
recoger tus datos" es, de hecho, un argumento de confianza ya publicado en
`/sobre`) — cualquier diseño de Premium implica primero una decisión de
producto sobre si eso cambia, que no se ha tomado y no se da por sentada
aquí.

### 7. Servicios futuros — abierto

Sin definir. Se deja como categoría explícita para no forzar prematuramente
ninguna idea concreta (formación, consultoría, listados destacados u otros)
en un cajón ya cerrado.

## Cómo encajan los agentes en este modelo

| Fuente de ingreso | Agente(s) relacionado(s) | Rol |
|---|---|---|
| Afiliación | Affiliate Manager (gestión operativa) · Researcher (filtro de calidad de entrada) | Real, activo |
| SEO / tráfico orgánico | Generador de Contenido | Habilitador |
| Email | *(infraestructura compartida, no un agente)* | Habilitador |
| Publicidad seleccionada | — | Sin diseñar |
| Patrocinios | — | Sin diseñar |
| Premium | — | Sin diseñar |
| Servicios futuros | — | Sin definir |
| *(todas las anteriores, en conjunto)* | **Atlas Revenue** | Análisis y optimización cruzada — solo lectura, nunca gestión operativa ni ranking |

## El papel de Atlas Revenue en este modelo

Revenue no es una fuente de ingreso más en la tabla de arriba — es el
agente que, una vez diseñado, mira **todas las filas a la vez**. Hoy, con
una sola fuente real (afiliación), esa mirada cruzada no tiene todavía
nada que cruzar: los mismos datos que Revenue analizaría ya están expuestos
por `informe-afiliacion` de Affiliate Manager. El valor real de Revenue
aparece cuando exista una segunda fuente de ingreso activa — momento en el
que reportar el conjunto, no cada canal por separado, empieza a aportar
algo que hoy no existe. Esta lectura es una recomendación para el plan de
sprints, no una decisión ya tomada.
