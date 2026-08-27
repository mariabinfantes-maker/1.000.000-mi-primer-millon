# ATLAS

> **Nota de marca (2026-08-06):** el nombre público del producto es
> **Molnip** (dominio molnip.com, ya comprado) — toda la interfaz visible
> para el usuario (título del sitio, metadatos, textos, JSON-LD) usa
> "Molnip". "Atlas" se mantiene como nombre técnico interno del proyecto:
> este documento, las carpetas (`agents/atlas-*`) y el código no se
> renombran por ahora, para minimizar riesgo mientras el foco está en el
> lanzamiento. Se decidirá más adelante si se hace también un rebranding
> interno completo.

## Qué es

Atlas (marca pública: Molnip) es un asesor inteligente que ayuda a las empresas a elegir la mejor tecnología para crecer.

No es un blog.
No es un directorio.

Empieza preguntando al usuario qué quiere mejorar y le recomienda las mejores soluciones.

## Objetivo del MVP

En menos de 60 segundos un usuario debe poder:

1. Elegir un problema.
2. Ver las mejores herramientas.
3. Compararlas.
4. Ir a la web oficial de la herramienta.

## Flujo

Inicio
↓
Seleccionar problema
↓
Seleccionar categoría
↓
Comparar herramientas
↓
Ir al proveedor

## Problemas iniciales

- Conseguir más clientes
- Automatizar tareas
- Ahorrar tiempo
- Organizar la empresa
- Mejorar la atención al cliente

## Tecnologías

- Next.js
- TypeScript
- Tailwind CSS

## Regla principal

Cada cambio debe hacer Atlas más útil para el usuario.

## Misión (a largo plazo)

La misión de Atlas no es ser una web de comparación de software. Es construir
un sistema inteligente que automatice, cada vez más, todo el ciclo de
descubrir, investigar, evaluar, comparar, documentar y recomendar software de
calidad.

El objetivo final es una plataforma con múltiples fuentes de ingresos
escalables: afiliados, publicidad, generación de leads, suscripciones y, más
adelante, productos y servicios propios.

Cada pieza nueva que se construya debe cumplir una o varias de estas
condiciones:

- Reducir trabajo manual.
- Hacer que Atlas sea más inteligente.
- Crear activos reutilizables.
- Mejorar la experiencia del usuario.
- Aumentar la capacidad de monetización.
- Facilitar la escalabilidad.

Si una propuesta no contribuye a esta misión, debe señalarse antes de
implementarla, no después.

## Hoja de ruta de agentes

**Registrada:** 2026-08-03. **Actualizada:** 2026-08-25 — la arquitectura
oficial pasó a 11 agentes (Atlas Revenue recuperado como agente 11); la
referencia canónica de nombres, estado, entradas/salidas, activación y
relaciones vive ahora en `ARQUITECTURA-AGENTES.md`. Esta sección se
conserva como registro histórico de cómo se fue decidiendo cada pieza —
en caso de discrepancia, `ARQUITECTURA-AGENTES.md` manda.

Visión completa del sistema, definida por el
producto. Antes de diseñar o implementar cualquier decisión de arquitectura
—nueva o sobre un agente ya existente— hay que contrastarla contra esta
hoja de ruta completa y señalar si dificulta el trabajo de algún agente
futuro, antes de implementar nada. La prioridad es una arquitectura limpia,
escalable y preparada para crecer durante años, no la pieza aislada que
toque construir hoy.

1. 🔎 **Atlas Researcher** — completado. Investiga herramientas offline, por
   lotes, con aprobación humana obligatoria antes de promoverlas al
   catálogo (`agents/atlas-researcher/`). También gestiona la estrategia de
   afiliación (`EstrategiaAfiliacion`).
2. ⭐ **Atlas Advisor** — nombre canónico desde 2026-08-25 (ver
   `ARQUITECTURA-AGENTES.md`); "Atlas Evaluador" era el nombre de producto
   usado aquí originalmente y se conserva solo como nombre de personaje en
   la capa de presentación pública (`lib/agentes.ts`), nunca como nombre de
   arquitectura. Construido bajo el nombre técnico "Atlas Advisor Capa 1"
   (`agents/atlas-advisor/`): motor determinista de 10
   criterios que puntúa el catálogo público en vivo, sin coste ni IA.
3. 🎯 **Atlas Recomendador** — completado. Es la "Capa 2 de Atlas Advisor"
   documentada más abajo (`agents/atlas-recomendador/`): explicación
   personalizada asistida por IA sobre el ranking que ya calculó Evaluador —
   nunca decide el ranking, solo lo explica. Apagada por defecto hasta
   activar `ATLAS_RECOMENDADOR_IA_ACTIVA` en producción.
4. 💰 **Atlas Affiliate Manager** — completado. Cierra el circuito entre
   "programa de afiliados aprobado" e "ingresos reales" (`agents/atlas-affiliate-manager/`).
5. 📈 **Atlas Growth** — sin diseñar. Necesita tráfico real y eventos de
   clic/conversión que medir; probablemente no aporta valor hasta que
   Generador de Contenido exista y genere ese tráfico.
6. ✍️ **Atlas Generador de Contenido** — Capa 1 completada. Genera contenido
   para atraer tráfico orgánico; es lo que le da a Growth algo que medir
   (`agents/atlas-generador-contenido/`). La Capa 2 (artículos con IA) sigue
   diferida — ver más abajo.
7. 💬 **Atlas Assistant** — sin diseñar. Previsiblemente una interfaz
   conversacional que reutiliza la salida de Evaluador/Recomendador, como
   alternativa al cuestionario estructurado.
8. 🔧 **Atlas Mantenimiento** — Capa 1 completada (`agents/atlas-mantenimiento/`):
   detecta, de forma determinista y sin coste, fichas y cuentas de afiliado
   que llevan mucho tiempo sin revisarse. La re-investigación asistida por
   IA (Capa 2) queda pospuesta — ver más abajo.
9. 🧠 **Atlas Orchestrator** — sin diseñar. Coordina cuándo se activa cada
   agente. Tiene sentido construirlo último, cuando ya existan agentes reales
   que orquestar.
10. 🗂️ **Atlas Curator** — décimo agente, Capa 1 completada el 2026-08-18.
    Gobierna la calidad **estructural** del catálogo a escala (duplicados,
    equilibrio de taxonomía, completitud editorial) — ver el detalle
    completo más abajo.

**Orden de implementación acordado para los cuatro agentes aún sin
construir:** Atlas Curator → Atlas Orchestrator → Atlas Growth → Atlas
Assistant. Justificación completa en el apartado de Atlas Curator más abajo
— en síntesis: Curator es el único prerrequisito de seguridad para la fase
de crecimiento del catálogo que empieza ahora, los otros tres mejoran una
fase que ya estará cerrada.

## Decisiones de arquitectura diferidas

Evoluciones previstas y aprobadas en principio, pero pospuestas a propósito
hasta que el contexto las justifique — para no olvidarlas ni reimplementarlas
en la dirección equivocada más adelante.

### Panel visual de revisión de borradores (Atlas Researcher)

**Registrada:** 2026-08-03 · **Estado:** pospuesta, no implementar todavía.

Mientras el volumen de herramientas investigadas sea manejable, la revisión
y aprobación de cada borrador se hace por CLI (`npm run generar-informe`,
`npm run aprobar-borrador`, `npm run promover-borrador`), a mano, una por una
— esto garantiza la calidad y la objetividad de Atlas mientras el volumen lo
permite.

Cuando el volumen de borradores pendientes convierta esa revisión manual en
un cuello de botella, se construirá un panel visual que permita revisar,
aprobar, rechazar, comentar y promover herramientas de forma rápida y segura
— manteniendo siempre la aprobación humana explícita antes de publicar
cualquier herramienta. Nunca promoción automática, ni con panel ni sin él.

No adelantar esta implementación antes de que el volumen de borradores lo
justifique de verdad.

### Atlas Recomendador (= Capa 2 de Atlas Advisor): completado

**Registrada:** 2026-08-03 · **Implementada:** 2026-08-06 · **Estado:** completado. A partir de ahora, solo corrección de errores.

Mismo agente que la hoja de ruta llama "Atlas Recomendador" — dos nombres
para la misma pieza (uno técnico: Advisor Capa 2; uno de producto:
Recomendador). Atlas Advisor (`agents/atlas-advisor/`) se queda como Capa 1
determinista y sin coste: el motor de criterios calcula el ranking y una
explicación de plantilla. Encima de eso, `agents/atlas-recomendador/`
reescribe esa explicación en prosa personalizada, sin tocar nunca el
ranking, cumpliendo el principio aprobado sin excepción:

- La IA **nunca** decide ni modifica el ranking — solo redacta una
  explicación sobre `puntuacionTotal` y `razones`, ya calculados por la
  Capa 1.
- La explicación **nunca** es genérica: el prompt (`prompt.ts`) inyecta el
  contexto concreto disponible en `RespuestasUsuario` (sector, tamaño,
  presupuesto, nivel técnico, etc.) y exige que se use — nunca una
  descripción intercambiable entre usuarios distintos.
- Si la IA falla, no está configurada, o la respuesta no es válida
  (`recomendador.ts`, `extraerExplicacionValidada`), el sistema devuelve
  siempre la explicación determinista de la Capa 1. Verificado en caliente
  con una clave inválida: la respuesta llega completa e idéntica a la
  determinista, sin ningún error visible para el usuario.

Piezas construidas:

- `agents/compartido/` — `ProveedorIA` y `crearProveedorGemini()`, movidos
  fuera de `atlas-researcher` (que fue quien los creó primero) para que
  cualquier agente que necesite IA los reutilice sin depender de un agente
  que no le corresponde.
- `agents/atlas-recomendador/prompt.ts` — construye el prompt a partir de la
  herramienta, los motivos ya calculados y el contexto real del usuario.
- `agents/atlas-recomendador/recomendador.ts` — `personalizarExplicacion()`
  y `personalizarRecomendaciones()`, con captura de errores y validación de
  la respuesta (longitud mínima/máxima) antes de aceptarla.
- `app/api/recomendaciones/route.ts` — sigue calculando siempre la Capa 1;
  solo intenta la Capa 2 si `ATLAS_RECOMENDADOR_IA_ACTIVA=true` (variable de
  entorno, **apagada por defecto**). A diferencia de Researcher (coste
  puntual, un lote a la vez), esta capa llamaría a la IA en cada
  cuestionario completado — coste continuo — de ahí el interruptor
  explícito en vez de activarse solo con que `GEMINI_API_KEY` exista.

Pendiente antes de activar en producción: configurar `GEMINI_API_KEY` y
`ATLAS_RECOMENDADOR_IA_ACTIVA=true` en el entorno real de despliegue — hasta
entonces, el sistema sigue funcionando con la Capa 1 determinista.

### Atlas Affiliate Manager: completado

**Registrada:** 2026-08-03 · **Estado:** completado. A partir de ahora, solo corrección de errores.

Segundo agente tras el Researcher, construido sobre la Capa 1 del Advisor:
cierra el circuito entre "tenemos un programa de afiliados aprobado" y "el
enlace real está en producción". `EstrategiaAfiliacion` (`data/esquemaInterno.ts`)
se migró al modelo `{ herramientaId, cuentas: CuentaAfiliado[] }`, cada
cuenta con sus propios `enlaces: EnlaceAfiliado[]` por país/idioma — pensado
desde el principio para varias cuentas por plataforma, varios enlaces por
segmento, y para crecer a cientos o miles de herramientas sin rediseño.

Piezas construidas (`agents/atlas-affiliate-manager/`):

- `seleccionarEnlace.ts` — `elegirEnlaceAfiliado()`, la única función que el
  redirect de producción (`app/herramienta/[id]/ir/page.tsx`) usa para
  decidir el destino del clic; cae a la URL pública oficial si no hay
  ninguna cuenta activa con enlace.
- `consistencia.ts` — `detectarCuentasActivasSinEnlace()` (bloquea
  `npm run verificar-datos` con exit 1: comisión que se pierde en silencio)
  y `detectarCuentasEstancadas()` (cuentas "pendiente" sin revisión reciente,
  solo informativo).
- `priorizador.ts` + `informe.ts` + `cli-informe-afiliacion.ts` —
  `npm run informe-afiliacion` genera un HTML autocontenido con el resumen
  por estado, ambos avisos de consistencia, y las cuentas "no_solicitado"
  ordenadas por Puntuación Atlas (nunca combinando comisión y puntuación en
  una cifra inventada: la comisión investigada es texto libre heterogéneo).

Quedan fuera de esta fase, a propósito:

- **Redacción asistida por IA de solicitudes de afiliación**: enviar
  información de negocio real a plataformas externas no debe automatizarse
  sin una decisión explícita y posterior a esta.
- **Integración con APIs de redes de afiliados** (comprobar el estado de una
  solicitud automáticamente): depende de qué plataformas se usen realmente;
  prematuro con el tamaño actual del catálogo.
- **Analítica de clics/conversión real** (territorio del futuro agente
  Growth): no tiene sentido sin tráfico real que medir.

### Atlas Mantenimiento: Capa 1 completada

**Registrada:** 2026-08-06 · **Estado:** Capa 1 completada. La Capa 2 (re-investigación
asistida por IA) queda pospuesta hasta que se apruebe explícitamente.

Con el catálogo ya en 18 herramientas y programas de afiliados reales
activos, nada avisaba de que una ficha o un programa de afiliados llevara
mucho tiempo sin comprobarse — el mismo tipo de riesgo silencioso que ya se
cerró con Affiliate Manager, pero para datos que se quedan obsoletos con el
tiempo en vez de un enlace que nunca se llegó a poner.

Capa 1: determinista, sin IA, sin coste — solo detecta y explica, nunca
modifica ningún dato:

- `agents/atlas-mantenimiento/frescura.ts` —
  `detectarHerramientasDesactualizadas()` (fichas activas sin revisar en más
  de 180 días) y `detectarCuentasActivasDesactualizadas()` (cuentas de
  afiliado "activo" sin comprobar en el mismo plazo — hueco que las
  comprobaciones de Affiliate Manager no cubrían, centradas en "activo sin
  enlace" y "pendiente estancada").
- `agents/atlas-mantenimiento/priorizacion.ts` — ordena los avisos por
  Puntuación Atlas, mismo criterio que `priorizador.ts` de Affiliate
  Manager: revisar antes lo que más se recomienda.
- `agents/atlas-mantenimiento/informe.ts` + `npm run informe-mantenimiento`
  — informe HTML de solo lectura, nunca bloquea `verificar-datos`.

Reutilización aplicada durante la implementación: `diasEntre()` (antes
solo en Affiliate Manager) y `escaparHtml()` (duplicada en Researcher y
Affiliate Manager) se movieron a `agents/compartido/` para que los tres
agentes usen la misma implementación.

Queda fuera de esta fase, a propósito: re-investigar automáticamente una
herramienta desactualizada con IA y aplicar el cambio. Es una Capa 2 con
coste por llamada (como el Recomendador) que además necesita su propio
flujo de aprobación humana para *actualizar* una ficha ya existente
(distinto de `promover.ts`, que solo promueve herramientas nuevas) — se
diseñará aparte cuando se apruebe explícitamente, nunca modificando el
catálogo sin revisión humana previa.

### Atlas Generador de Contenido: Capa 1 completada

**Registrada:** 2026-08-03 · **Estado:** Capa 1 completada. Capa 2 (artículos con IA) diferida.

Motor de crecimiento de Atlas: cierra el hecho de que, hasta esta fase, el
sitio no tenía ni una sola página indexable ni forma de que el tráfico
orgánico llegara a activar una comisión real. Reutiliza sistemáticamente
Researcher (catálogo público, `problemasIds`), Evaluador (`agents/atlas-advisor`,
Puntuación Atlas, `evaluarHerramienta`) y Affiliate Manager (todo enlace de
contenido pasa por `/herramienta/[id]/ir`, nunca directo a la web oficial)
— ningún módulo nuevo duplica su lógica ni toca datos internos de afiliación.

Piezas construidas (`agents/atlas-generador-contenido/`):

- **Fuente de datos de "problema" corregida antes de construir nada**:
  `data/problemas.json` real, `Herramienta.problemasIds`, sustituyendo un
  catálogo simulado heredado (`lib/data.ts`, eliminado) que nunca debió
  ser la base de una página indexable.
- **Landing de categoría y problema** (`app/categoria/[id]/page.tsx`,
  `app/problema/[id]/page.tsx`) — las URLs que antes no existían, con
  estado vacío honesto donde el catálogo real todavía no tiene ninguna
  herramienta que mostrar.
- **`metadatos.ts`** — título/descripción/OG reales por página; `noindex,
  follow` en las ~26 páginas de flujo (cuestionario/comparar/recomendación
  × 3 puertas de entrada, más `/ir`) — mejora de arquitectura con impacto a
  largo plazo, propuesta y aprobada antes de implementar.
- **Comparación par a par y alternativas** (`comparaciones.ts`,
  `alternativas.ts`) — `evaluarHerramienta` con perfil neutro, mismo
  `construirComparativa` que el comparador guiado; `TablaComparativa.tsx`
  extraído de `PantallaComparador.tsx` para no duplicar la tabla.
- **Sitemap dinámico y `robots.txt`** (`sitemap.ts`) — derivados del
  catálogo real; dominio de producción pendiente de configurar (ver
  "Pendiente antes de producción").
- **Datos estructurados JSON-LD** (`datosEstructurados.ts`) — solo
  identidad verificable; nunca `aggregateRating` ni precio (ver la
  decisión diferida justo debajo).

### AggregateRating y precio en los datos estructurados (Atlas Generador de Contenido)

**Registrada:** 2026-08-03 · **Estado:** pospuesta, no implementar todavía — ni siquiera de forma condicional.

`agents/atlas-generador-contenido/datosEstructurados.ts` genera JSON-LD
(schema.org/SoftwareApplication) para cada ficha de herramienta, pero solo
con identidad y descripción — nunca `aggregateRating` ni `offers`/precio,
tenga o no la herramienta plan gratuito o reputación investigada.

Motivo, para no repetir el error más adelante: usar la Puntuación Atlas
(un juicio editorial propio, no reseñas de usuarios) como `aggregateRating`
incumpliría las directrices de fragmentos enriquecidos de Google y
arriesgaría una sanción manual a todo el sitio, no solo a esa página.
`precioInicial` es texto libre y ambiguo ("Gratis / Desde 15€ mes...");
estructurar cualquier precio, aunque parezca un hecho simple (p. ej. "0"
para un plan gratuito), se trata como información no verificable a estos
efectos — decisión explícita del producto, no solo cautela técnica.

Cuando exista reputación de terceros verificable y bien atribuida
(`Herramienta.reputacion.g2Puntuacion`/`capterraPuntuacion`, con su fuente),
seguirá siendo una decisión aparte activar `aggregateRating` a partir de
esos datos — nunca de la Puntuación Atlas. No adelantar esta
implementación sin ese contexto y sin aprobación explícita.

### Atlas Curator: Capa 1 completada

**Registrada:** 2026-08-18 · **Estado:** décimo agente oficial, arquitectura
aprobada tras revisión completa del sistema de agentes, y Capa 1
implementada el mismo día. Prerrequisito antes de empezar a poblar el
catálogo a cientos o miles de herramientas: construir primero la fábrica,
después fabricar.

Gobierna la calidad **estructural** del catálogo a escala — un eje distinto
al de Atlas Mantenimiento, que gobierna su **frescura en el tiempo**
(`frescura.ts`: fichas y cuentas sin revisar en más de 180 días). Una
herramienta puede estar recién revisada y aun así ser un duplicado de otra
con distinto id, o tener una ficha con la mitad de los campos que sus
vecinas de categoría — ninguno de los dos es un problema de Mantenimiento,
y por eso no hay solapamiento entre ambos agentes.

**Responsabilidades:**

- **Duplicados y casi-duplicados** antes de promoción: hoy
  `promoverBorrador()` (`agents/atlas-researcher/promover.ts`) solo
  comprueba colisión exacta de `id` — dos lotes de Researcher investigando
  la misma herramienta bajo ids distintos pasarían sin ningún aviso.
- **Equilibrio de taxonomía**: categorías o problemas con un volumen
  desproporcionado de herramientas frente al resto, o categorías huérfanas.
- **Completitud editorial relativa**: `validarHerramienta()`
  (`data/repositorio.ts`) trata `reputacion`, `disponibleEnEspanol`,
  `tieneAppMovil`, `tieneApiPublica` y `facilidadImplementacion` como
  opcionales por diseño (para no romper las fichas históricas) — nada
  detecta hoy que a una ficha le falten campos que sus vecinas de categoría
  sí tienen.

Nunca fusiona, renombra ni recategoriza nada por su cuenta: detecta y avisa,
igual que Mantenimiento y `consistencia.ts` de Affiliate Manager. Toda
acción sobre lo detectado la aprueba una persona por CLI — mismo principio
sin excepción que rige `promover.ts`.

**Colaboración con los agentes existentes:**

- **Researcher:** se engancha justo antes de que `promoverBorrador()`
  escriba en `data/herramientas/` — una comprobación más junto a las que ya
  existen (esquema válido, categoría existente, id no repetido, regla de
  afiliados), no un agente paralelo.
- **Evaluador:** ninguna — Evaluador puntúa en vivo el catálogo tal cual
  está; Curator decide qué entra en ese catálogo, nunca cómo se puntúa.
- **Affiliate Manager:** ninguna directa; comparten patrón (informe HTML de
  solo lectura vía `npm run informe-*`), no dominio.
- **Mantenimiento:** cooperación por informe, no por código — si
  Mantenimiento activa su Capa 2 (re-investigación con IA), Curator es quien
  debería confirmar que la ficha re-investigada sigue sin duplicar otra.

**Momento del flujo** — dos puntos, cada uno reutilizando un patrón que ya
existe en el código, no uno nuevo. Ajuste sobre el diseño original al
implementarlo: el aviso de desequilibrio de categoría se pensó bloqueante
en promoción, pero bloquear una promoción legítima solo porque una
categoría ya concentra catálogo iría en contra de la propia fase de
crecimiento que Curator existe para destrabar — se implementó informativo,
igual que completitud editorial:

- **Bloqueante, en promoción** (solo casi-duplicados): mismo patrón que
  las comprobaciones ya dentro de `promover.ts`.
- **Informativo, periódico, sobre el catálogo completo** (equilibrio de
  taxonomía + completitud editorial): mismo patrón que
  `informe-mantenimiento` — HTML de solo lectura, nunca bloquea
  `verificar-datos`.

Piezas construidas (`agents/atlas-curator/`):

- `duplicados.ts` — `detectarCasiDuplicados()`: compara un candidato contra
  el catálogo existente por nombre normalizado, dominio de `paginaOficial`,
  o un nombre contenido en el otro. Enganchado como comprobación bloqueante
  más dentro de `promoverBorrador()` (`agents/atlas-researcher/promover.ts`).
- `equilibrio.ts` — `detectarEquilibrioCategorias()` /
  `detectarEquilibrioProblemas()`: huérfanas (0 herramientas activas) y
  concentración (>50% del catálogo activo en una sola categoría/problema,
  solo evaluada con 4+ herramientas activas para que la señal sea real, no
  trivial).
- `completitud.ts` — `detectarHuecosEditoriales()`: campos opcionales
  (`reputacion`, `disponibleEnEspanol`, `tieneAppMovil`, `tieneApiPublica`,
  `puntuaciones.facilidadImplementacion`) que le faltan a una ficha y sí
  tiene la mayoría de sus vecinas de la misma categoría — nunca compara
  entre categorías distintas.
- `informe.ts` + `npm run informe-curador` — informe HTML de solo lectura
  combinando equilibrio y completitud, mismo patrón que
  `cli-informe-mantenimiento.ts`. Verificado contra el catálogo real: hoy
  señala que "Plataformas todo en uno" concentra el 72% de las 18
  herramientas activas.

Queda fuera de esta fase, a propósito: cualquier acción automática sobre lo
detectado (fusionar, renombrar, recategorizar) — sigue requiriendo revisión
humana explícita, sin excepción.

**Orden de implementación acordado para los cuatro agentes pendientes** —
Curator → Orchestrator → Growth → Assistant — justificado desde negocio y
escalabilidad, no solo desde lo técnico:

- **Curator primero**: es la única de las cuatro piezas que cambia el coste
  de no construirla ahora — cada herramienta que entre al catálogo sin este
  filtro durante la fase de crecimiento se convierte en deuda que habrá que
  limpiar a mano más tarde, justo cuando menos margen habrá para pararse a
  limpiar. Prerrequisito de seguridad para la fase que empieza ahora, no una
  mejora sobre una fase ya cerrada.
- **Orchestrator después**: solo gana valor cuando hay varios procesos
  periódicos que de verdad merezca la pena coordinar. Hoy hay dos
  (`informe-afiliacion`, `informe-mantenimiento`); con Curator habría tres —
  ese es el umbral natural donde acordarse de ejecutarlos a mano empieza a
  ser un riesgo real, no antes.
- **Growth después**: no aporta señal fiable sin tráfico real, y tráfico
  real depende de que Generador de Contenido tenga algo sustancial que
  posicionar (razonamiento ya registrado en la hoja de ruta original).
  Construirlo antes sería medir ruido.
- **Assistant al final**: una puerta de entrada conversacional se percibe
  como más personal y autorizada que un formulario. Lanzarla mientras el
  catálogo puede tener duplicados silenciosos o fichas desiguales
  multiplica el riesgo reputacional justo en el canal que más confianza
  transmite — tiene sentido una vez el catálogo al que apunta ya está
  gobernado.

### Regla de calidad del catálogo: Puntuación mínima y verificación de afiliación condicionada

**Registrada y completada:** 2026-08-18 — aprobada al revisar en conjunto las
primeras seis incorporaciones reales del catálogo (Zoho CRM, Copper,
Insightly, Asana, Wrike, Smartsheet), la primera vez que `npm run
investigar-lote` corrió contra la API real de Gemini. Antes de esta regla,
`promoverBorrador()` (`agents/atlas-researcher/promover.ts`) solo exigía
programa de afiliados fiable (`confidenceLevel !== "low"`) — nada evaluaba
la calidad de la investigación pública en sí. **Ajustada** el mismo día,
tras aplicarla a esas seis herramientas: la primera versión exigía además
reputación externa (G2/Capterra ≥ 4.0) para tolerar una afiliación de
confianza media — se simplificó porque lo único que de verdad importaba
bloquear era que el programa de afiliados en sí no pudiera confirmarse,
no que algún dato secundario suyo (la comisión exacta, por ejemplo)
quedara con confianza media.

Regla acordada, en dos partes:

1. **Umbral general de calidad, sin excepción**: si la investigación tiene
   confianza "baja", trae alguna advertencia sin resolver, o la Puntuación
   Molnip (recalculada en el momento de promover, nunca la cifra
   almacenada en el borrador) no llega a **80/100**, la herramienta no se
   promueve — "dudas importantes sobre su calidad o incertidumbre alta en
   los datos".
2. **Si supera el punto 1**, solo bloquea por motivo de afiliación si el
   programa **no puede confirmarse** — `hasAffiliateProgram` falso o
   `confidenceLevel === "low"` (comprobación ya existente,
   `tieneProgramaDeAfiliadosFiable`, sin cambios). Si el programa existe y
   está confirmado pero algún dato **secundario** (comisión exacta,
   plataforma, duración de cookie...) queda con confianza "media", la
   herramienta se promueve igual — la cuenta de afiliado sembrada queda
   marcada `verificacionPendiente: true` para que Atlas Affiliate Manager
   la confirme antes de solicitar el programa o darla por lista para
   monetizar. No se exige ningún respaldo adicional (reputación externa u
   otro) para esto.

Piezas construidas:

- `agents/atlas-researcher/criteriosCalidad.ts` — `evaluarCriteriosDeCalidad()`,
  la función pura que decide las tres salidas posibles (bloquea / promueve
  normal / promueve con verificación pendiente).
- `data/esquemaInterno.ts` — `CuentaAfiliado.verificacionPendiente?: boolean`,
  campo aditivo; nunca se ha tocado el significado de `EstadoAfiliacion`
  (sigue describiendo la relación con el programa del tercero, no la
  confianza de la investigación).
- `promover.ts` engancha el nuevo criterio junto a las comprobaciones que
  ya existían (esquema, categoría, duplicados de Curator, regla de
  afiliados), y siembra `verificacionPendiente` + una observación legible
  en la cuenta inicial cuando aplica.
- `agents/atlas-affiliate-manager/consistencia.ts` —
  `detectarCuentasConVerificacionPendiente()`, mismo patrón que las demás
  comprobaciones del agente; surge en `informe-afiliacion` como su propia
  sección, la primera del informe (es lo más urgente de revisar de una
  herramienta recién promovida).

Aplicada retroactivamente a las 6 herramientas del primer lote real antes
de aprobarlas — resultado documentado en el propio hilo de revisión, no
aquí, porque depende de la decisión editorial de cada una, no de la
arquitectura.

### Historial de aprobaciones: auditoría interna de cada intento de promoción

**Registrada y completada:** 2026-08-18 — último paso pedido explícitamente
antes de promover cualquier herramienta al catálogo oficial: que quede
constancia auditable de por qué se aceptó o rechazó cada una, en cualquier
momento.

No reutiliza `decision.ts`: ese módulo guarda **una** decisión por id y la
**sobrescribe** en cada revisión — es el estado actual, nunca un
historial. Guardar ahí habría perdido el rastro de cualquier intento
anterior (p. ej. una herramienta rechazada por puntuación insuficiente, y
meses después aceptada tras volver a investigarla). Se diseñó un
mecanismo nuevo, deliberadamente simple: append-only, un único archivo
JSON (`data/historial-aprobaciones.json`, un array — no un directorio con
un archivo por intento, que habría exigido listar y ordenar por fecha
solo para leer "todo el historial").

Cada intento de promoción — aceptado o rechazado — añade un registro con
exactamente los seis campos pedidos: herramienta, fecha y hora (ISO 8601
completo, no solo la fecha), Puntuación Molnip (recalculada en el momento,
`null` si no se pudo calcular), estado de afiliación ("confirmada" /
"pendiente de verificar" / `null` si no llegó a evaluarse), observaciones
(notas editoriales de `decision.ts` + motivos técnicos del bloqueo, si los
hay) y aprobación explícita del CEO (si existía una decisión "aprobado"
registrada en el momento del intento — la aprobación humana que ya exige
todo el sistema, aquí etiquetada explícitamente como tal).

Piezas construidas (`agents/atlas-researcher/`):

- `historialAprobaciones.ts` — `registrarEnHistorial()` / `leerHistorialAprobaciones()`
  / `historialDeHerramienta()`.
- `promover.ts` registra un intento en los dos únicos puntos de salida
  (rechazo y éxito) — nunca en el caso de "id sin ningún borrador", que no
  es una decisión sobre nada.
- `informeHistorial.ts` + `npm run informe-historial` — informe HTML de
  solo lectura, más reciente primero, mismo patrón que
  `informe-mantenimiento`/`informe-curador`/`informe-afiliacion`.

### Promoción automática cuando no hay duda, conflicto o riesgo

**Registrada:** 2026-08-21 — el CEO delegó la aprobación de promoción para
el caso limpio, tras varias rondas de aprobar manualmente lotes que ya
cumplían sin excepción la política vigente. Sigue existiendo aprobación
explícita del CEO en todos los casos (el historial de aprobaciones sigue
registrando cada intento con ese campo) — lo que cambia es que, cuando el
caso es inequívoco, esa aprobación queda delegada por adelantado en esta
regla en vez de pedirse turno a turno.

Se promueve automáticamente, sin presentarla antes, una herramienta que
cumple **todo** lo siguiente:

- Pasa `evaluarCriteriosDeCalidad` con `ok: true` (confianza de
  investigación ≠ "baja", cero advertencias, Puntuación Molnip ≥ 80).
- `verificacionAfiliacionPendiente` es `false` — es decir, afiliación
  **confirmada** con confianza alta, no "pendiente de verificar".
- Atlas Curator no lanza ningún aviso de casi-duplicado (`avisosDuplicado`
  vacío) — si lanza alguno, aunque parezca un falso positivo evidente
  (p. ej. mismo dominio, producto distinto del mismo proveedor), se
  presenta al CEO en vez de aplicar la excepción por cuenta propia, salvo
  que el propio CEO ya haya autorizado ese caso concreto por adelantado.
- Está alineada con la categoría prioritaria de océano azul del momento
  (baja cobertura, alta intención de compra) — no se promueve solo porque
  pasa el gate técnico si no aporta valor estratégico al catálogo.

Cualquier otro caso — afiliación "pendiente de verificar", aviso de
Curator sin autorización previa, gate de calidad que falla por poco, o
cualquier duda editorial — se sigue presentando al CEO para su aprobación
explícita antes de tocar el catálogo real. Las descartadas automáticamente
por el prechequeo de afiliados (sin programa fiable) no se presentan como
candidatas, solo se reportan de forma transparente.

### Atlas Revenue: recuperado como agente 11 de la arquitectura

**Registrada:** 2026-08-18 · **Actualizada:** 2026-08-25 — decisión oficial
del proyecto: Atlas Revenue deja de estar descartado y se recupera como
agente futuro (agente 11 de 11, ver `ARQUITECTURA-AGENTES.md`), con una
separación de responsabilidad explícita frente a Affiliate Manager que
resuelve el solapamiento que motivó el descarte original: **Affiliate
Manager gestiona operativamente** programas, solicitudes, estados, enlaces
y comisiones; **Revenue analiza y optimiza el modelo económico completo**
(ver `MODELO-DE-NEGOCIO.md`), sin poder modificar nunca el orden objetivo
de las recomendaciones ni escribir en `EstrategiaAfiliacion`. Sigue sin
diseño detallado ni código — el razonamiento original sobre por qué
todavía es prematuro construirlo se conserva íntegro debajo, ahora como
condición de disparo recomendada en vez de descarte definitivo.

Evaluado originalmente en la misma revisión estratégica que aprobó Atlas
Curator, a propuesta de incorporar un agente de negocio dedicado
exclusivamente a la monetización y el crecimiento económico. Su descarte
original se basaba en un solapamiento real con Affiliate Manager que la
separación operativo/estratégico de arriba resuelve:

- **Affiliate Manager** ya cubre, de facto, la única fuente de ingresos real
  del producto hoy (afiliación): selección de enlace, consistencia,
  priorización de solicitudes por Puntuación Atlas.
- La regla ya establecida sin excepción en todo el sistema — la
  monetización **nunca** toca el ranking (Evaluador puntúa sin conocer
  comisiones; Recomendador nunca cambia el orden; `priorizador.ts` evita
  deliberadamente combinar comisión y puntuación en una cifra inventada) —
  elimina de raíz la única función que justificaría un agente de negocio
  transversal: optimizar el catálogo o las recomendaciones por ingreso.
- Sin esa función, lo único que le quedaría por hacer es *reporting cruzado
  entre fuentes de ingreso* — pero hoy solo existe una (afiliación). No hay
  nada que cruzar todavía. Misma razón por la que Atlas Growth sigue "sin
  diseñar": no aporta valor sin el objeto real sobre el que operar.

**Condición de disparo explícita:** se diseña Atlas Revenue cuando Molnip
tenga una segunda fuente de ingresos real (publicidad, generación de leads
o suscripciones) que necesite reporting cruzado con afiliación — nunca
antes, para no fabricar un agente sin responsabilidades reales.

### Plataformas todo en uno: categoría desarrollada a fondo

**Registrada:** 2026-08-21 — a petición explícita del CEO: no abrir una
categoría nueva sin antes desarrollar por completo la primera
("Plataformas todo en uno"), con datos estructurados de qué combina cada
suite y un modelo propio para decidir cuándo conviene una suite frente a
herramientas especializadas.

**Esquema — `ModuloSuite` / `Herramienta.modulosIncluidos`** (`data/esquema.ts`):
campo aditivo y opcional con vocabulario fijo (`crm`, `gestion_proyectos`,
`asistente_ia`, `facturacion`, `email_marketing`, `atencion_cliente`,
`embudos_de_venta`, `comercio_electronico`, `creador_de_sitios_web`,
`recursos_humanos`) — deliberadamente más amplio que `Categoria.id`, para
poder representar módulos (facturación, email marketing...) que Atlas
todavía no tiene como categoría propia. Se sincroniza solo con el resto del
esquema vía `camposEsquema.ts` (el mismo mecanismo — `Record<keyof
Herramienta, string>` — que ya obligaba a mantener actualizado ese archivo
al añadir cualquier campo nuevo).

**Clasificación de las 13 suites ya existentes** (`clasificarModulos.ts`,
mismo patrón que `prechequeoAfiliados.ts`): un prompt corto y acotado, no
el pipeline completo de investigación — reinvestigarlas enteras habría
reescrito campos ya revisados y aprobados por el CEO (puntuaciones,
ventajas, precios...) para rellenar un único campo nuevo. Aplicado a las
13, con 2 reintentos por sobrecarga temporal del proveedor.

**3 candidatas nuevas promovidas** (Kartra, Agiled, HoneyBook — afiliación
confirmada confianza alta) y **2 en espera** (Thryv, Vendasta — confianza
media, mismo criterio que el resto de la lista de espera de afiliación).
El campo `modulosIncluidos` ya se investiga automáticamente en cualquier
investigación futura, no solo en esta categoría.

**Modelo de comparación todo-en-uno vs. especializada — ACTIVADO en
producción (2026-08-21).** El CEO decidió explícitamente NO activar la
preselección automática de categoría: en su lugar, se añade una primera
pregunta al cuestionario (ver "Pregunta de preferencia de suite" más abajo)
para que sea el propio usuario quien elija, y el modelo solo decide por su
cuenta cuando el usuario no expresa una preferencia clara.

`agents/atlas-advisor/todoEnUnoVsEspecializada.ts` — función pura
`compararTodoEnUnoVsEspecializada(respuestas)` que devuelve
`"todo_en_uno"`, `"especializada"` o `"sin_senal_clara"`, con tres niveles
de prioridad, de más a menos explícito:

1. `categoriaId` — si el usuario ya entró por una categoría concreta (puerta
   "por categoría"), esa elección manda sin más.
2. `preferenciaSuite` — respuesta directa a la nueva pregunta del
   cuestionario (`"todo_en_uno"` o `"especializada"`; `undefined` si
   respondió "no tengo preferencia clara" o si la pregunta no se mostró).
3. Señales indirectas del perfil (sin elección explícita en los dos niveles
   anteriores): tamaño de empresa, presupuesto, capacidad técnica del
   equipo, si el motor detectó varios `problemaIdsCandidatos` a la vez, y
   frases sueltas en `notasAdicionales` ("demasiadas herramientas" vs.
   "quiero lo mejor en X").

Razonamiento de fondo: una suite gana en CONVENIENCIA (una suscripción, un
login) a costa de PROFUNDIDAD por módulo frente a un especialista — el
modelo no elige la mejor herramienta (eso ya lo hace `motor.ts`), decide
qué TIPO conviene priorizar.

**Cómo se usa el resultado — dos mecanismos distintos, a propósito:**

- **Elección explícita** (nivel 1 o 2 de la lista de arriba): FILTRO duro
  en `seleccionarCandidatas` (`motor.ts`), exactamente igual que ya hacía
  `categoriaId` — si el usuario dijo "todo en uno", se filtra a
  `categoriaId === "plataformas-todo-en-uno"`; si dijo "especializada", se
  excluye esa categoría. Nunca deja al usuario sin resultados: si el
  filtro vaciara el catálogo (todavía no hay herramientas de ese tipo para
  su situación), se ignora.
- **Señal indirecta** (nivel 3, sin elección explícita): criterio de
  PUNTUACIÓN más (`criterioTipoSuite` en `criterios.ts`, tope ±8 puntos,
  escala comparable al resto de criterios) — nunca un filtro. Es el mismo
  principio que ya regía todo el motor: "filtrar solo por elección
  explícita, puntuar el resto por señales" (ver el comentario de
  `seleccionarCandidatas`). Sin esta distinción, una simple suposición
  sobre presupuesto o tamaño de empresa podría dejar al usuario sin ver
  media categoría del catálogo por error.

**Pregunta de preferencia de suite** (`components/Cuestionario.tsx`):
nueva primera pregunta — "¿Prefieres una plataforma todo en uno o
herramientas especializadas?", con tres opciones ("Todo en uno",
"Herramientas especializadas", "No tengo preferencia clara") — que solo se
muestra cuando `!origen.categoriaIdPrefill`, es decir, cuando el usuario
NO entró ya por la puerta "por categoría" (si entró así, la categoría ya
está decidida y la pregunta sería redundante). El cuestionario pasa de 4 a
5 pasos en ese caso.

## Fase de lanzamiento: de catálogo a producto que factura

**Registrada:** 2026-08-21 — el CEO decidió pausar la ampliación del
catálogo (ya desarrollado a fondo: 56 herramientas, 4 categorías) y
centrar el trabajo en convertir Atlas en un producto lanzable, en este
orden explícito:

1. Sistema de captación de emails (infraestructura completa).
2. Integrar enlaces de afiliados en el flujo de recomendaciones + seguimiento de clics.
3. Mejorar la experiencia de la página de resultados (conversión, imagen premium).
4. Preparar la estructura del blog SEO (sin contenido todavía).

No ampliar el catálogo salvo que sea imprescindible para alguna de estas
fases. Cada fase se explica brevemente antes de implementarla.

### Fase 1: Sistema de captación de emails — completada

Proveedor elegido: **Brevo** (plan gratuito con automatizaciones de
bienvenida y gestión de listas). Arquitectura deliberadamente modular —
mismo patrón que `ProveedorIA` (`agents/compartido/proveedorIA.ts`) para
Gemini — para poder sustituir Brevo por otro proveedor sin tocar el resto
de la app:

- **`lib/email/proveedorEmail.ts`** — contrato `ProveedorEmail`
  (`suscribir` + `enviarBienvenida`, independientes a propósito: un fallo
  en la bienvenida no debe deshacer el alta ya hecha).
- **`lib/email/proveedores/brevo.ts`** — adaptador real: Contacts API para
  el alta (con `updateEnabled: true` y atributos `ORIGEN`/`CATEGORIA_ID`/
  `PROBLEMA_ID`, la base para segmentar campañas futuras) + Transactional
  Email API para la bienvenida, con el HTML en código
  (`plantillaBienvenida.ts`) en vez de una plantilla del panel de Brevo,
  para no depender de que la cuenta ya exista configurada a mano.
- **`lib/email/proveedores/simulado.ts`** + **`proveedorActivo.ts`** —
  mientras no exista `BREVO_API_KEY`, la app usa este proveedor de
  respaldo automáticamente (registra en el log del servidor, responde
  éxito): el sitio nunca se rompe ni bloquea por falta de configuración.
- **`app/api/suscribir/route.ts`** + **`lib/email/procesarSuscripcion.ts`**
  — validación (`validarSuscripcion.ts`: formato de email + honeypot
  anti-spam) separada de la orquestación, mismo patrón que
  `validarPropuesta` en Atlas Researcher.
- **`components/ui/FormularioSuscripcion.tsx`** — un único componente con
  dos variantes de copy: pie de página (todas las páginas) y página de
  resultados (momento de mayor intención). En resultados, envía la
  categoría de la herramienta top recomendada como atributo de
  segmentación.
- **Lead magnet real**: PDF "7 preguntas antes de elegir cualquier
  software para tu empresa" (`public/lead-magnets/`), con contenido
  propio y la identidad visual de Molnip — no un placeholder.

**Pendiente de activación** (ver sección siguiente): crear la cuenta de
Brevo y configurar `BREVO_API_KEY`, `BREVO_LIST_ID` y
`BREVO_SENDER_EMAIL` (remitente verificado, ej. hola@molnip.com). Hasta
entonces el proveedor simulado mantiene todo el flujo funcional para
desarrollo y pruebas.

### Fase 2: Enlaces de afiliados + seguimiento de clics — completada

**Hallazgo antes de construir nada:** la integración del enlace de
afiliado en el flujo de recomendaciones **ya existía por completo** —
`/herramienta/[id]/ir` ya resolvía `elegirEnlaceAfiliado()` con el
cortafuegos correcto (nunca expone comisión ni plataforma) y las 4 rutas
de salida del catálogo (tarjetas de resultado, tabla comparativa, ficha de
herramienta) ya enlazaban ahí. El trabajo real de esta fase se redujo a lo
que de verdad faltaba: el seguimiento de clics.

Mismo patrón modular que el email (`ProveedorAnalitica`, análogo a
`ProveedorIA`/`ProveedorEmail`):

- **`lib/analitica/proveedorAnalitica.ts`** — contrato
  `registrarClic(evento)`, nunca lanza (un fallo de seguimiento no debe
  impedir que el usuario llegue al proveedor).
- **`lib/analitica/proveedores/consola.ts`** — único proveedor real por
  ahora: una línea de log JSON estructurada por clic (`herramientaId`,
  `categoriaId`, `tipoEnlace` "afiliado"/"oficial", `origen`
  "resultado"/"comparar"/"ficha"). No es un placeholder como el simulado
  de email — es la decisión real mientras no exista un destino de
  analítica decidido (PostHog, un almacén propio...); cambiarlo es
  escribir un adaptador nuevo en `proveedorActivo.ts`, nada más.
- **`app/api/clic/route.ts`** — recibido vía `navigator.sendBeacon` desde
  `BotonIrAlProveedor.tsx` justo antes de navegar (entrega asíncrona sin
  bloquear ni arriesgarse a que un `fetch` normal se cancele a medias por
  el `unload` inminente).
- **Un único punto de instrumentación**: como las 4 rutas de salida ya
  convergían en `/herramienta/[id]/ir`, instrumentar esa página basta para
  medir clics de todo el catálogo. El origen se pasa como
  `?origen=resultado|comparar|ficha` desde cada sitio que enlaza ahí.

Como `priorizador.ts` (Affiliate Manager) ya usa la Puntuación Atlas como
"proxy razonable de cuánto se hace clic" por falta de datos reales — ver
su comentario —, estos datos reales podrían sustituir o complementar ese
proxy más adelante; no se ha tocado `priorizador.ts` en esta fase, no
formaba parte de lo pedido.

### Fase 3: experiencia de resultados — completada y CONGELADA (estable)

**Registrada:** 2026-08-21 — el CEO revisó el recorrido completo (caso de
ejemplo real, de resultados al clic de salida) y aprobó la fase sin
cambios adicionales. A partir de aquí, prioridad explícita: crecimiento y
captación de tráfico antes que seguir refinando una funcionalidad ya
madura. No tocar esta pantalla salvo que surja un motivo de peso — no es
zona de mejora continua por ahora.

**Hallazgo antes de construir nada:** Atlas ya investiga y guarda
reputación externa (G2/Capterra) de cada herramienta (`Herramienta.reputacion`,
`data/esquema.ts`) pero no se mostraba en ningún sitio del producto —
prueba social real, verificada, sin usar. Se incorpora como pieza central
de esta fase.

Cambios en `TarjetaHerramientaRecomendada.tsx` / `vistaRecomendacion.ts`:

- **`InsigniaReputacion.tsx`** + **`lib/reputacion.ts`** (lógica de
  selección, testeada aparte): muestra la fuente con más reseñas
  (G2 o Capterra) cuando existe: `★ 4.6 · G2 (170)`. Nunca inventa un
  dato — si no hay `reputacion`, no renderiza nada.
- **Badges de encaje rápido** (español / app móvil / API): solo se
  muestran los verdaderos, para no convertir la ausencia de un dato en
  una señal negativa.
- **CTA específico**: "Probar gratis" cuando `tienePlanGratuito`, si no
  "Ir a {nombre}" — más persuasivo y concreto que el genérico anterior
  "Ir al proveedor".
- **Franja de confianza** bajo la cabecera de resultados, específica de
  esta recomendación (no una repetición de las señales genéricas de la
  home): investigación real, comisión que nunca cambia el orden, datos
  revisados con regularidad.

**Decisión de accesibilidad/robustez — CSS puro, no `RevelarAlScroll`:**
la primera versión envolvía las tarjetas en `RevelarAlScroll`
(`IntersectionObserver`, ya usado en la home). Se descartó para esta
pantalla en concreto: es la que sostiene todo el negocio, y un fallo de
hidratación de JS o un observer que no llegara a disparar dejaría el
botón "Ir al proveedor" invisible. Se sustituyó por la clase CSS ya
existente `animar-entrada` (keyframe puro, sin JS) con
`animation-delay` escalonado por tarjeta — mismo efecto de cascada,
sin ninguna dependencia de JavaScript para que el contenido llegue a
verse.

Ningún elemento de urgencia falsa ni cifra inventada — coherente con la
regla de Atlas de no fabricar nunca una métrica.

### Fase 4: Blog SEO — completada (estructura)

**Registrada:** 2026-08-21. Alcance deliberadamente acotado: "preparar la
estructura del blog SEO, sin desarrollar todavía todo el contenido" — es
decir, el esquema, las rutas, la metadata y el sitemap quedan completos y
en producción, pero la biblioteca de artículos en sí es tarea futura, no
de esta fase. A partir de ahora la prioridad es crecimiento y captación de
tráfico, no seguir refinando el recorrido de resultados (Fase 3, congelada).

Antes de construir nada se revisó el Generador de Contenido ya existente
(`agents/atlas-generador-contenido/`) para encajar en su mismo patrón en
vez de inventar uno paralelo: metadata centralizada
(`metadatos.ts`/`construirMetadata`), JSON-LD por tipo de página
(`datosEstructurados.ts`) y una única fuente de verdad para el sitemap
(`generarEntradasSitemap`).

- **`data/esquema.ts`** — tipo `Post` (id/slug, título, resumen, cuerpo,
  fechaPublicacion, fechaUltimaRevision opcional, autor opcional,
  categoriaId/problemaId opcionales solo para enlazado interno) y
  `BloqueContenido` (`parrafo` / `subtitulo` / `lista`). El cuerpo del
  artículo es datos estructurados, nunca HTML libre — se renderiza sin
  `dangerouslySetInnerHTML`, misma disciplina de seguridad que el resto
  del esquema público.
- **`data/posts/*.json`** — un archivo por post, igual patrón que
  `data/herramientas/` (crece con el tiempo, cada uno se valida por
  separado), a diferencia de `categorias.json`/`problemas.json`, que son
  listas pequeñas y cerradas.
- **`data/repositorio.ts`** — `getPosts()`/`getPost(id)` +
  `validarPost()`, misma disciplina defensiva que `validarHerramienta()`.
  `getPosts()` devuelve `[]` de forma honesta si `data/posts/` no existe
  o está vacío — nunca rellena con contenido inventado.
- **`agents/atlas-generador-contenido/metadatos.ts`** —
  `metadataBlog()`/`metadataPost(post)`, mismo patrón `construirMetadata`
  que el resto de páginas de contenido (indexable, canonical, OG/Twitter).
- **`agents/atlas-generador-contenido/datosEstructurados.ts`** —
  `construirDatosEstructuradosPost()` (schema.org `BlogPosting`): solo
  `datePublished`/`dateModified` reales, autor como `Organization` — sin
  `aggregateRating` ni ningún dato no verificable, misma razón que la
  ficha de herramienta.
- **`app/blog/page.tsx`** (índice) y **`app/blog/[slug]/page.tsx`**
  (artículo) — el índice usa `EstadoVacio` si no hay posts; el artículo
  muestra herramientas relacionadas (mismo `TarjetaHerramientaRecomendada`
  de siempre) solo cuando el post declara `categoriaId` — enlazado interno
  real, no una recomendación personalizada disfrazada.
- **Sitemap** (`generarEntradasSitemap`) — `/blog` y cada `/blog/[id]`
  añadidos; **footer** (`app/layout.tsx`) — enlace "Blog" junto a "Sobre
  Molnip"/"Cómo funciona".
- **Post real de prueba**: "Plataforma todo en uno o herramientas
  especializadas: cómo decidir" — contenido genuino (la lógica del modelo
  de comparación construido en la fase anterior de catálogo), no relleno,
  para validar el pipeline completo (metadata, JSON-LD, sitemap, enlazado
  a la categoría "Plataformas todo en uno") con datos reales antes de
  escribir más artículos.

Verificado: `tsc --noEmit`, `vitest run` (419 tests), `next build
--webpack` (`/blog` estático, `/blog/[slug]` vía `generateStaticParams`),
`verificar-datos`, y revisión visual del índice y del artículo con el
servidor de desarrollo.

Tareas operativas, no de arquitectura — nada que implementar, solo
configurar antes de lanzar. Ninguna se ha resuelto con un valor inventado
en el código; todas quedan aquí para no olvidarlas.

### Brevo activado como proveedor oficial de email transaccional

**Registrada:** 2026-08-24 — el CEO confirmó que ya existe la cuenta de
Brevo y que `BREVO_API_KEY` está configurada en el entorno de producción
(Vercel). No hizo falta tocar `lib/email/proveedorActivo.ts`: ya
seleccionaba Brevo automáticamente en cuanto la variable existiera (ver
"Sistema de captación de emails" más arriba) — la infraestructura estaba
preparada para este momento desde que se construyó. Nota operativa: si
`BREVO_LIST_ID` o `BREVO_SENDER_EMAIL` todavía no están configuradas
también, `suscribir()`/`enviarBienvenida()` seguirán devolviendo un error
legible (capturado, sin romper el sitio) hasta que se añadan — ver pasos
1-3 más abajo, siguen aplicando igual si falta alguna.

1. Verificar un dominio/remitente de envío en Brevo (ej. hola@molnip.com)
   — necesario para que el email de bienvenida no caiga en spam.
2. Crear una lista de contactos para Molnip y anotar su id numérico.
3. Configurar en el entorno de despliegue (además de `BREVO_API_KEY`, ya
   hecho):
   - `BREVO_LIST_ID` — id numérico de la lista creada en el paso 2.
   - `BREVO_SENDER_EMAIL` — el remitente verificado en el paso 1.
   - `BREVO_SENDER_NOMBRE` — opcional, por defecto "Molnip".

**Preparado para futuras automatizaciones:** se añadió
`enviarTransaccional(email, asunto, html)` al contrato `ProveedorEmail`
(`lib/email/proveedorEmail.ts`) — un envío genérico, sin acoplar a la
plantilla de bienvenida. `enviarBienvenida` ahora es solo
`enviarTransaccional` con el asunto y el HTML del lead magnet ya fijados
(`lib/email/proveedores/brevo.ts`), eliminando la llamada a la API
transaccional duplicada que existía antes. Cualquier automatización
futura (formulario de contacto, lista de espera, registro de usuarios,
notificaciones) puede llamar a `obtenerProveedorEmail().enviarTransaccional(...)`
directamente, sin escribir un adaptador nuevo ni tocar la lógica de
selección de proveedor — la propia funcionalidad (formulario, flujo de
alta, etc.) queda para cuando se pida explícitamente, esto solo deja el
enganche listo.

### Borradores en espera de confirmación de afiliación

**Registrada:** 2026-08-21 — el CEO decidió explícitamente no promover
ninguna herramienta mientras su programa de afiliados tenga
`confidenceLevel: "medium"` (dato secundario, normalmente la comisión
exacta, sin confirmar), aunque el resto del gate de calidad pase limpio.
Prefiere un catálogo más pequeño pero de máxima confianza. Estas quedan
como borrador, sin decisión registrada, hasta que una nueva investigación
de su programa de afiliados confirme `confidenceLevel: "high"` — en ese
momento se promueven automáticamente sin volver a pedir aprobación (el
resto de la política delegada ya aplica sin cambios).

**Reverificadas 2026-08-21:** Hive y TeamGantt confirmaron afiliación
confianza alta y se promovieron. Runn dejó de tener programa de afiliados
fiable en la reinvestigación (antes medio, ahora ninguno) y pasa a
descartada definitivamente, no pendiente.

Lista viva (añadir/quitar según se investigue o se confirme cada una):

- **Float** (gestión de proyectos) — puntuación 91.
- **Backlog** (gestión de proyectos) — puntuación 92.
- **Thryv** (plataformas todo en uno) — puntuación 87.
- **Vendasta** (plataformas todo en uno) — puntuación 87.

### Dominio real del sitio

**Registrada:** 2026-08-03 (Atlas Generador de Contenido, sitemap dinámico) ·
**Actualizada:** 2026-08-06 — dominio decidido: **molnip.com** (ya comprado).

`app/sitemap.ts` y `app/robots.ts` necesitan URLs absolutas. Hasta que el
dominio de producción se configure en el entorno de despliegue,
`lib/urlBase.ts` usa `NEXT_PUBLIC_SITE_URL` con `http://localhost:3000` como
valor de repuesto — nunca un dominio hardcodeado. Antes de lanzar de verdad:
configurar `NEXT_PUBLIC_SITE_URL=https://molnip.com` en el entorno de
despliegue. Sin ese paso, el sitemap y `robots.txt` seguirán apuntando a
localhost y no servirán para que Google indexe el sitio.

### Activar Atlas Recomendador (Capa 2 de Advisor) en producción

**Registrada:** 2026-08-06 (Atlas Recomendador).

`app/api/recomendaciones/route.ts` solo llama a la IA si
`ATLAS_RECOMENDADOR_IA_ACTIVA=true` está configurada en el entorno — apagada
por defecto. Antes de encenderla en producción: configurar `GEMINI_API_KEY`
en el entorno de despliegue real (hasta ahora solo se ha usado en local, para
los lotes de Researcher) y decidir explícitamente el momento de activar el
interruptor, ya que a partir de ese momento cada cuestionario completado
supone una llamada real a la IA. Mientras tanto, Atlas sigue recomendando
con la Capa 1 determinista, sin coste.

## Taxonomía de dos ejes y evaluación por rutas separadas

**Registrada:** 2026-08-27. **Fusionada, desplegada y REVERTIDA el mismo día** — ver "Despliegue del sprint" y "Reversión" al final de esta sección.

Nace de una auditoría de solo lectura que encontró dos fallos de fondo: la
taxonomía mezclaba dos preguntas en un solo campo, y las plataformas todo en
uno competían contra las herramientas especializadas bajo la misma vara.

### Los dos ejes

`categoriaId` respondía a la vez a "¿qué hace?" y "¿es una suite?". Eso
obligaba a mentir en una de las dos: monday.com estaba archivada como
"plataformas todo en uno" y por tanto desaparecía de Gestión de proyectos,
que es donde la busca quien la busca.

Desde ahora son ejes independientes, en `data/taxonomia.ts`:

- **`categoriaId` + `categoriasSecundarias`** — qué hace la herramienta.
- **`tipoProducto`** (`"suite"` | `"especializada"`) — qué tipo de producto es.

Ambos campos son opcionales en el esquema por compatibilidad con las fichas
anteriores: cuando falta `tipoProducto`, `esSuite()` lo deduce de la categoría
histórica y Curator avisa de que se está deduciendo.

### Las 15 categorías: 4 públicas, 11 internas

`MARCO_CATEGORIAS_MINIMO` declara las 15 categorías que Molnip debe cubrir
para ser un comparador honesto de software para pymes. Es la lista de lo que
DEBERÍA haber, no de lo que hay — y por eso Curator puede detectar una
categoría ausente, algo imposible mirando solo el catálogo.

- **Públicas (4):** Plataformas todo en uno · CRM y ventas · Gestión de
  proyectos · IA y productividad.
- **Internas (11):** Facturación y contabilidad · Reservas y citas · Atención
  al cliente · Comercio electrónico · Automatización e integraciones ·
  Marketing y email · Recursos humanos · Inventario y operaciones · Creación
  web y hosting · Firma electrónica y gestión documental · Software sectorial.

Una categoría nueva nace con `estado: "pendiente"`: existe para que Curator la
mida y Researcher sepa qué investigar, pero **no tiene página, ni sitemap, ni
puerta de cuestionario**, y `/categoria/<id>` devuelve 404. Solo pasa a
pública cuando alcanza el mínimo de 3 alternativas verificadas — y ese paso lo
PROPONE Curator y lo DECIDE una persona; nunca ocurre solo. Publicar una
categoría con una herramienta no es un comparador, es un anuncio.

### Migración: 56 fichas, sin pérdidas

`npm run migrar-taxonomia` (`scripts/migrar-taxonomia.ts`), idempotente y con
recuento antes/después impreso:

```
ANTES    56 fichas · 0 con tipoProducto · 16 en plataformas-todo-en-uno
DESPUÉS  56 fichas · 56 con tipoProducto · 15 suites · 41 especializadas
         identificadores perdidos: ninguno
```

### Reclasificaciones, justificadas con los datos de cada ficha

- **Pipedrive → CRM especializado.** Su propia descripción la define como
  "plataforma CRM enfocada en la gestión visual del embudo de ventas", sus 5
  funciones principales son todas comerciales y declara un único objetivo. No
  era una plataforma todo en uno.
- **monday.com → Gestión de proyectos, `tipoProducto: "suite"`**, con
  "plataformas todo en uno" y "crm" como secundarias. Se describe como Work OS
  para procesos y proyectos; sus funciones centrales son tableros,
  Kanban/Gantt y automatizaciones. Su amplitud real (6 módulos) sí la hace
  suite, pero su función principal es la gestión de proyectos.

### Criterios distintos y normalizados por ruta

`criterioTipoSuite` se retiró: restaba hasta 8 puntos a cualquier herramienta
especializada cuando el perfil apuntaba a suite — la castigaba por lo que ES,
no por lo bien que resolvía el problema.

En su lugar, `agents/atlas-advisor/criteriosRuta.ts` define dos conjuntos:

- **Suite** — cobertura útil (solo los módulos que el usuario pidió), calidad
  conjunta, integración nativa, facilidad de administración, coste frente a
  contratar varias, escalabilidad, riesgo de dependencia (siempre resta) y
  relevancia al competir fuera de su categoría principal.
- **Especializada** — profundidad frente a sus iguales, calidad en la tarea,
  adaptación al sector, funciones avanzadas, integraciones con terceros,
  facilidad de uso, precio frente al valor y superioridad frente al módulo
  equivalente de una suite.

Los criterios comunes se suman en crudo (son idénticos para las dos rutas y
por tanto comparables). Los de ruta se normalizan con `normalizarRuta()`:
**−1..+1 centrado en cero**, dividiendo por el máximo de la ruta cuando suman
y por su mínimo cuando restan. Centrar en cero es lo que garantiza que una
herramienta neutra valga exactamente lo mismo siendo suite que siendo
especializada.

Cuando el usuario elige ruta, solo compiten candidatas de ese tipo. Cuando no
elige, compiten las dos y el motor devuelve `comparativaDeRutas` explicando el
beneficio Y el sacrificio de cada enfoque, en vez de penalizar uno.

### Tres sesgos encontrados al auditar monday.com

Descomponer su puntuación en las tres categorías donde aparece destapó tres
ventajas que no venían del mérito. Las tres correcciones son generales; no hay
ninguna excepción escrita para monday.com:

1. **`coberturaUtil` regalaba sus 14 puntos por "cubrir 1 de 1".** Al navegar
   por una categoría concreta solo hay una necesidad, así que cualquier suite
   que declarase ese módulo se llevaba el máximo del criterio por la mínima
   amplitud posible, justo cuando centralizar no aporta nada. Ahora exige
   consolidar al menos 2 necesidades, el mismo umbral que ya pedían
   `costeTotalFrenteAVarias` y `riesgoDependencia`.
2. **La normalización 0..1 repartía el rango entero.** Como las dos rutas
   tienen rangos asimétricos distintos (suite −50/+62, especializada −36/+80),
   una herramienta neutra valía 0,446 siendo suite y 0,310 siendo
   especializada: unos 5 puntos regalados por la forma del rango. Se detectó
   comparando monday.com y Asana, que tienen puntuaciones idénticas y aun así
   terminaban separadas por 3,4 puntos.
3. **`11 - nivelTecnicoRequerido`** convertía un 5 neutro en 6, medio punto de
   regalo a toda suite. Ahora es `10 - x`.

Resultado: monday.com pasa de ganar por 7,67 a ganar por 0,56 frente a Asana
en gestión de proyectos, y por 0,77 frente a Less Annoying CRM en CRM. **Sigue
ganando las tres, y debe seguir haciéndolo**: lo que queda son sus
puntuaciones reales de calidad, fiabilidad, facilidad y escalabilidad, y en
CRM además paga −2 por declarar menos funciones que los especialistas
nativos. Molnip no empeora una recomendación para repartir visibilidad.

### Ampliación de Curator

Se amplió el agente existente; no se creó otro. Sigue sin poder cambiar el
catálogo: lo único que escribe es su informe, y la detección de duplicados
sigue bloqueando la promoción.

- **`cobertura.ts`** — categorías vacías, insuficientes, preparadas (mínimo
  configurable de 3 alternativas), sobrerrepresentadas y ausentes del marco.
  Además dos colas de investigación para Researcher: por categoría (qué falta
  y cuánto) y por ficha (qué dato falta en cuál, con las comprobaciones
  concretas que dan la tarea por terminada).
- **`validez.ts`** — comprueba que los valores SIRVAN, no solo que existan.
  Distingue "inválido" (hay dato y no vale) de "pendiente" (falta y es
  opcional): la diferencia entre no saber algo y fingir saberlo.
- **`coherencia.ts`** — el contrapeso de la taxonomía nueva: como más
  categorías significan más visibilidad, comprueba que lo declarado se
  corresponda con lo que la propia ficha demuestra.

La vigencia NO se duplica: Curator se la pide a Atlas Mantenimiento, que es su
dueño (`frescura.ts`, umbral de 180 días). Dos umbrales serían dos verdades el
día que uno cambie.

### Deuda registrada y medible

`npm run informe-curador` al cierre del sprint:

```
categorías: 4 preparada(s) · 0 insuficiente(s) · 11 vacía(s) · 0 sobrerrepresentada(s) · 0 ausente(s)
1 incoherencia(s) de clasificación · 0 valor(es) inválido(s) · 66 dato(s) pendiente(s) de investigar
cola de Researcher: 11 categoría(s) · 67 tarea(s) de ficha (57 de prioridad alta)
```

- **Disponibilidad geográfica: las 56 fichas.** El campo
  `disponibilidadGeografica` se añadió al esquema y ninguna ficha lo tiene
  investigado. Es opcional a propósito: bloquear ahora todas las fichas
  públicas por un campo que antes no existía sería peor que la deuda. Cada
  ficha genera una tarea de **prioridad alta** con cinco comprobaciones fijas:
  disponibilidad en España, idioma español, facturación desde España o la UE,
  tratamiento de datos y documentación de RGPD, y limitaciones geográficas
  conocidas. No se rellena por inferencia.
- **Pipedrive: contradicción registrada, clasificación intacta.** Declara 5
  módulos y sus 5 funciones principales son exclusivamente comerciales. Queda
  como tarea de prioridad alta en la cola de Researcher. **Sigue clasificado
  como CRM especializado hasta obtener evidencia nueva**; no se han tocado sus
  módulos.
- **33 herramientas para las 11 categorías internas.** Tres por categoría, el
  mínimo para que comparar signifique algo. Es el trabajo real que queda para
  que Molnip cubra el mercado que dice cubrir.

### Decisiones de producto pendientes

- **monday.com en tres categorías.** Demostrado que gana por encaje real tras
  las tres correcciones, así que no se ha impuesto ningún límite de categorías
  secundarias — hacerlo habría empeorado la recomendación para repartir
  visibilidad. Queda como algo a vigilar si algún día se firma su afiliación,
  porque concentra visibilidad en un solo producto aunque el motor no sepa
  nada de afiliación.
- **Cuándo publicar cada categoría interna**, según vayan alcanzando el
  mínimo. Curator lo propone; la decisión es humana.
- **Si el mínimo de 3 alternativas debe subir** cuando crezca el catálogo. El
  umbral es configurable justo por eso.

### Verificación

663 pruebas en 81 ficheros antes del sprint; el sprint añade las suyas.
TypeScript, ESLint y build de producción limpios. Sin cambios en: portada,
resto de la web pública, Affiliate Manager, las 51 estrategias de afiliación,
Neon, Upstash, seguridad administrativa, historial, ni el piloto de las cinco
afiliaciones. Growth, Assistant, Orchestrator y Revenue siguen sin construir.

### Despliegue del sprint

**Autorizado expresamente por la propietaria el 2026-08-27.**

| | |
|---|---|
| Rama fusionada | `claude/curator-taxonomia-rutas` |
| Rama real de producción | **`claude/claude-md-docs-plkwnq`** — es la rama por defecto del repositorio, y Vercel despliega producción desde ella. No existe `main`, `master` ni `production`, y el repositorio no tiene `vercel.json` que fije otra. |
| Pull request | **#32** |
| Commit de fusión | **`0892a3d`** (producción venía de `24adc8c`) |
| Fecha | 2026-08-27 |
| Alcance del diff | 89 ficheros, +3.589 / −188 |

**Pruebas ejecutadas justo antes de fusionar**, todas correctas:

- 677 pruebas en 81 ficheros
- TypeScript sin errores
- ESLint sin avisos
- Build de producción sin errores
- Las 11 categorías internas devuelven 404 tanto en `/categoria/<id>` como en `/categoria/<id>/cuestionario`
- El sitemap contiene exactamente las 4 categorías públicas

Comprobado además, por `git diff` contra producción, que el sprint no toca
ninguno de los elementos protegidos: portada y sus imágenes, resto de la web
pública, Affiliate Manager, las 51 estrategias de afiliación, Neon, Upstash,
seguridad administrativa e historial.

**Verificación en producción: pendiente de ejecutar por la propietaria.** El
entorno desde el que se desarrolla no tiene acceso de red a molnip.com (ni por
`curl`, ni por proxy, ni por descarga de páginas), así que las comprobaciones
sobre el sitio ya publicado — portada intacta, las cuatro categorías públicas,
ninguna interna accesible ni indexable, diagnóstico, criterios separados,
Affiliate Manager, Neon, Upstash y registros de Vercel — las hace una persona
con un navegador. Este apartado se actualizará con el resultado real; **no se
da por verificado nada que no se haya comprobado.**

### Tareas que continúan pendientes tras el despliegue

Ninguna se resuelve con datos inventados; todas están registradas en la cola de
Curator (`npm run informe-curador`) y son contables:

1. **Pipedrive** — contradicción entre sus 5 módulos declarados y sus funciones
   exclusivamente comerciales. Prioridad alta. Sigue clasificado como CRM
   especializado hasta obtener evidencia nueva.
2. **56 comprobaciones de disponibilidad geográfica** — una por ficha,
   prioridad alta, cada una con las cinco preguntas que la dan por terminada:
   disponibilidad en España, idioma español, facturación desde España o la UE,
   tratamiento de datos y documentación de RGPD, y limitaciones geográficas
   conocidas.
3. **33 herramientas** para las 11 categorías internas (3 por categoría, el
   mínimo para que comparar signifique algo). Ninguna se publica hasta
   alcanzarlo.
4. **Vigilancia de la concentración de monday.com** — encabeza las tres
   categorías donde aparece. Está demostrado que gana por encaje real tras
   corregir los tres sesgos, y por eso no se le ha impuesto ningún límite de
   categorías secundarias. Queda como algo a vigilar si algún día se firma su
   afiliación.

### Reversión del despliegue

**El 2026-08-27, poco después del despliegue, la propietaria informó de que en
molnip.com "ningún botón funciona, no se abre nada".** Fallo crítico en
producción.

Siguiendo la condición acordada para este despliegue —revertir y explicar, no
improvisar arreglos sobre producción— se revirtió **únicamente** el merge del
sprint:

| | |
|---|---|
| Commit de reversión | `b5aef54` — revert de `0892a3d` |
| Alcance | Solo el código. Se conservó a propósito este registro en `ATLAS.md`, para no perder la historia de lo ocurrido |
| Comprobado tras revertir | El código queda byte a byte idéntico a `24adc8c`; build de producción y TypeScript limpios |

El sprint **no está perdido**: sigue íntegro en la rama
`claude/curator-taxonomia-rutas` y en la PR #32. Lo que falta es entender por
qué algo que pasaba 677 pruebas, TypeScript, ESLint y build —y que se verificó
página a página sobre un build de producción local— se comportó de otra forma
en el sitio publicado.

**Lección para el próximo intento:** ninguna de las comprobaciones automáticas
de este sprint pulsaba un botón. Se verificó que las páginas respondían 200,
que el sitemap era correcto y que las categorías internas daban 404, pero no
que la interfaz siguiera siendo interactiva. Un fallo de hidratación del
cliente no aparece en un `curl`, ni en una captura, ni en el build.

---

## Incidente del 2026-08-27: causa encontrada y resuelta

La pregunta que quedó abierta arriba —por qué una web que pasaba todas las
comprobaciones se comportó de otra forma en el sitio publicado— tiene
respuesta, y no era el sprint.

### Causa real: el navegador se quedaba con el HTML de un despliegue anterior

Next servía el HTML prerenderizado con `Cache-Control: s-maxage=31536000` y
**sin `max-age`**. Esa cabecera le dice al CDN cuánto guardar, pero no le dice
nada al navegador; ante ese silencio, el navegador aplica su propia caché
heurística y se queda el HTML durante horas.

Los archivos de JavaScript llevan un hash en el nombre, que cambia en cada
despliegue. Así que el HTML viejo pedía archivos que ya no existían en el
servidor. Y como los enlaces de Next (`<Link>`) interceptan la pulsación para
navegar por el cliente, el resultado era exactamente lo descrito: **la página
se pinta entera y perfecta, y ningún enlace lleva a ninguna parte, sin un solo
error visible.**

Eso explica también los dos detalles que parecían contradecirse:

- **"solo abrió de manera incógnito"** — la ventana de incógnito no tenía HTML
  guardado, así que pedía el actual y funcionaba.
- **"estos son inertes"** (las tarjetas de "Por qué Molnip" y "Así decide
  Molnip") — esas siete tarjetas nunca fueron pulsables. Se elevaban al pasar
  el ratón, así que parecían botones rotos. Dos síntomas distintos que se
  solapaban.

**El sprint de la PR #32 no tuvo nada que ver.** Se comprobó construyendo las
dos versiones —con y sin el sprint— y recorriendo ambas con un navegador real:
se comportaban igual.

### Qué se corrigió

| | |
|---|---|
| **Causa de raíz** | `next.config.ts` devuelve ahora `public, max-age=0, must-revalidate` en todo lo que no sea `/_next/static` ni `/_next/image`. El HTML revalida siempre y responde `304` gracias al ETag, así que no cuesta ancho de banda. Los archivos con hash siguen siendo `immutable`, como exige la documentación de Next (`headers.md`: "It cannot be overridden"). Medido: HTML `max-age=0, must-revalidate` → segunda petición `304`; chunk `max-age=31536000, immutable` |
| **Red de seguridad** | `lib/recuperacionDeVersion.ts` (lógica pura) + `components/RecuperacionDeVersion.tsx` (enlace con el navegador). Recarga **una sola vez por sesión** ante un fallo confirmado de carga de JavaScript propio. Nunca ante errores de API, validación, red o del propio código. Sin memoria en `sessionStorage` no recarga: antes un aviso que un bucle. No borra nada, así que lo escrito por la persona sobrevive. Si la recarga no lo resuelve, aparece un aviso con botón para actualizar a mano. Solo registra un texto fijo, sin URL ni datos de nadie |
| **Señales falsas** | Las siete tarjetas informativas de la portada ya no se elevan ni cambian de sombra o borde al pasar el ratón. Contenido y estructura intactos |

### Pruebas: la lección aplicada

La lección del apartado anterior era que ninguna comprobación pulsaba un botón.
Ahora sí:

| | |
|---|---|
| Unitarias | 696 en verde (82 archivos), 19 de ellas nuevas sobre el detector de versión y la regla de una sola recarga |
| TypeScript | Sin errores |
| ESLint | Sin avisos |
| Build de producción | Correcto |
| **E2E con navegador real** | **21 en verde** — `e2e/portada.spec.ts`, ejecutadas por Playwright contra el build de producción, no contra `next dev` |

Lo que cubren las 21 pruebas E2E: el botón principal de la portada; los cinco
cuestionarios y su destino real; las tres puertas de entrada y que cambian lo
que ofrecen; el avance del cuestionario; que las siete tarjetas informativas no
contienen enlaces ni fingen serlo; la recuperación ante un módulo y ante un
`<script>` que ya no existen —con el navegador fallando de verdad, no con
errores inventados—; que no hay bucle de recargas; que un error normal jamás
recarga; que los datos escritos sobreviven a la recarga; y el recorrido completo
en un contexto limpio, sin nada guardado.

**Cada prueba se comprobó al revés antes de darla por buena.** Reintroducir la
elevación en las tarjetas hace fallar exactamente las cuatro afectadas y deja
pasar las otras tres; desmontar el componente de recuperación hace fallar las
tres pruebas que lo cubren. Una prueba que no puede fallar no prueba nada — y
tres de las que se escribieron durante el diagnóstico daban falsos negativos
por buscar los elementos mal (las tres puertas son `role="tab"`, no
`role="button"`; Next monta su propio `role="alert"` invisible; y las tarjetas
se mueven al entrar en pantalla por la animación de scroll, no por el ratón).

### Configuración del runner

`@playwright/test` con el Chromium ya instalado en el entorno
(`playwright.config.ts`, `executablePath`), `npm run e2e` (build + pruebas) y
`npm run e2e:solo` (solo pruebas). Las pruebas de `e2e/` quedan excluidas de
vitest, que comparte extensión pero no motor.

### Registro del despliegue

| | |
|---|---|
| Commit de las tres correcciones | `87ad5ac` |
| Commit que restaura el sprint | `7b55234` |
| Rama de trabajo | `claude/recuperacion-cache` |
| Rama de producción | `claude/claude-md-docs-plkwnq` (por defecto del repositorio; no existe `main`) |

---

## Corrección al registro anterior: la causa real era otra

El apartado de arriba da por cerrada la investigación del 2026-08-27 con la
caché de HTML como causa. **Eso fue precipitado.** La corrección de la caché
es correcta y sigue en pie, pero no era lo que la propietaria estaba viendo.

Tras desplegarla, siguió informando: **"en el móvil aún no funciona"**. Y
después, la frase que resolvió el caso: **"esas tres tarjetas, empezar por
objetivo, explorar por categoría, son las que no están desplegando nada"**.

### La causa real

Las tres puertas de entrada de "¿Cómo quieres empezar?" no son enlaces: son
pestañas que cambian el contenido de debajo. En una pantalla ancha van en fila
y ese contenido cae justo debajo, a la vista. **En un móvil se apilan**, así
que lo que se abre queda por debajo de las tres tarjetas, fuera de donde la
persona está mirando. Se toca, y desde su punto de vista no pasa nada.

Medido en un móvil de 393 px: al tocar "Explorar por categoría" solo se veía
el **27%** de lo que se abría; desde la tercera tarjeta, nada. En escritorio,
el 81%.

Y había un segundo motivo, más simple todavía: **"Empezar por objetivo" viene
activa de fábrica.** Tocarla no cambiaba de pestaña, así que no movía nada en
absoluto.

### La corrección

En `components/ui/SelectorEntrada.tsx`:

- Al activar una puerta, su contenido **se trae a la vista**, con `scroll-mt-24`
  para no quedar tapado por la cabecera pegada. Solo si hace falta: si ya se
  ve, no se mueve nada. Respeta `prefers-reduced-motion`.
- Se cuenta **cada activación**, no solo los cambios, para que tocar la puerta
  que ya está activa también enseñe lo que abre.

Diseño, textos y estructura de las tarjetas, intactos.

### Por qué ninguna prueba lo vio, otra vez

La prueba de aquel día comprobaba que los enlaces ofrecidos **cambiaran**. Y
cambiaban. Salía en verde mientras la persona no veía absolutamente nada.

**Comprobar el DOM no es comprobar la pantalla.** La prueba nueva mide lo que
importa —que el contenido esté de verdad dentro del viewport— y se verificó al
revés: sin la corrección falla en dos de las tres puertas, exactamente lo que
se veía en el móvil.

Se añade además **el móvil como entorno de pruebas propio** (Pixel 5, pantalla
estrecha y táctil). Ese era el hueco: todas las pruebas anteriores miraban a
un escritorio de 1280 px, donde el diseño no se apila y el fallo no existe.
Las comprobaciones de "pasar el ratón" quedan solo en escritorio, porque en una
pantalla táctil el navegador ni siquiera aplica esos estilos.

### Lecciones, más allá de esta corrección

1. **Una prueba en verde no es una persona satisfecha.** Dos veces seguidas
   hubo baterías completas en verde sobre una web que la propietaria no podía
   usar. Ambas veces la prueba medía algo cierto pero irrelevante.
2. **Diagnosticar con seguridad antes de tener la prueba cuesta caro.** La
   causa de la caché se presentó como cerrada midiendo un servidor local, no
   molnip.com, al que este entorno no tiene acceso. Era una hipótesis razonable
   presentada como conclusión.
3. **Quien usa el producto describe el síntoma mejor que cualquier
   diagnóstico.** "Esas tres tarjetas no están desplegando nada" acotó en una
   frase lo que varias horas de hipótesis no habían acotado.
4. **Lo que en escritorio es una fila, en móvil es una columna.** Cualquier
   patrón donde el control y su efecto están separados verticalmente necesita
   comprobarse en pantalla estrecha.

### Registro del despliegue

| | |
|---|---|
| Corrección de la caché, recuperación de versión y tarjetas | `87ad5ac` |
| Restauración del sprint de la PR #32 | `7b55234` |
| Fusión a producción | `f9338cf` |
| Puertas de entrada visibles en móvil | `cc7135f` |
| Fusión a producción | `1550c3e` |
| Rama de producción | `claude/claude-md-docs-plkwnq` |
| Pruebas | 696 unitarias, TypeScript, ESLint, build y 41 E2E (escritorio y móvil) |
| **Resultado en producción** | **Confirmado por la propietaria el 2026-08-27: funciona en el móvil.** |
