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

> **Superada el 2026-08-31: Atlas Revenue está construido y desplegado.** Lo
> que sigue es el razonamiento de por qué se descartó primero y se recuperó
> después; se conserva porque explica los límites que el agente tiene hoy. El
> alcance real construido está al final de este documento, en «Atlas Revenue:
> medición mínima y privada». La condición de disparo que se lee abajo —una
> segunda fuente de ingresos— resultó no ser la correcta: lo que hizo falta
> primero no fue cruzar fuentes, sino saber si la única que hay funciona.

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

---

## Sprint de integridad del catálogo y del recomendador (2026-08-27)

Nació del caso Systeme.io. La propietaria observó que su programa de
afiliación no debía empujarla como recomendación, y al auditarla apareció algo
mayor: **no estaba mal puntuada, estaba mal clasificada** — y no era la única.

### Lo que se encontró

| Hallazgo | Magnitud |
|---|---|
| Herramientas **sin ningún objetivo** | **38 de 56 (68%)** |
| Categorías internas vacías | 11 de 11 |
| Herramientas usando categorías secundarias | **1 de 56** (monday.com) |
| Categoría que mezclaba productos no sustituibles | `asistentes-ia`: Grammarly ganaba el **100%** |

La puerta "por objetivo" **viene activa por defecto** en la portada y filtra de
forma estricta: si alguna herramienta tiene el objetivo, las demás quedan
fuera. Con 4-12 herramientas por objetivo, dos tercios del catálogo eran
invisibles para quien entraba por ahí. Quince CRM en catálogo y solo dos
aparecían al pedir "conseguir clientes".

### C1 — Objetivos

37 herramientas recibieron objetivo, **una a una y con la evidencia citada
literalmente de su propia ficha**. El registro completo, auditable, está en
`data/decisiones/objetivos-2026-08-27.json`: para cada una, el objetivo antes,
el objetivo después y el texto exacto de `funcionesPrincipales` o
`problemasQueResuelve` que lo justifica.

**Krisp** quedó marcada con `objetivoPendienteDeInvestigacion`. Su función
central es cancelar ruido en llamadas: ninguno de los cinco objetivos la
describe sin forzarla. Es deuda visible y contable, no un silencio.

### C2 — Subtipos

`asistentes-ia` se mantiene como familia, con un eje interno de subtipo:
escritura, vídeo, reuniones y transcripción, agenda y planificación,
presentaciones, espacio de trabajo. El motor solo compara dentro del mismo
subtipo; cuando la persona no ha concretado cuál busca, devuelve **lo mejor de
cada clase** en vez de decidir entre un corrector y un generador de vídeo, que
es una pregunta sin respuesta.

No se ha publicado ninguna página ni cambiado la navegación.

### C3 — Categorías secundarias, criterio uniforme

Dos reglas, aplicadas a las 15 suites por igual:

1. Toda suite cuya categoría principal no sea "plataformas todo en uno" la
   declara como secundaria: es donde se la busca.
2. Además declara una categoría pública si incluye su módulo **y** alguna de
   sus funciones principales sustancia esa capacidad.

Aplicar solo el criterio de módulos habría metido 13 de las 15 suites en
"asistentes de IA" —casi todas declaran un módulo `asistente_ia`—, de modo que
quien buscara un corrector competiría contra monday.com. `modulosIncluidos`
dice "tiene un módulo", no "es una alternativa".

11 suites ganaron categorías secundarias. **Ninguna gana un solo punto por
ello**: hay una prueba que lo comprueba evaluando la misma ficha con una
categoría y con tres.

### C4 — Systeme.io

Retirado el objetivo "automatizar tareas" por una **regla curada, no por una
excepción**: ese objetivo exige capacidad de conectarse con otras herramientas,
y su ficha registra "pocas integraciones nativas, dependiendo de Zapier". La
regla se aplicó a las cinco herramientas del objetivo; las otras cuatro lo
conservan porque ninguna documenta esa carencia.

Sigue en el catálogo y en el piloto de afiliación. Su comisión, atribución y
facilidad de admisión siguen sin tocar el motor.

### Lo que la simulación reveló, y no esperábamos

Con perfiles válidos y tipados, antes y después de todo el sprint:

| | Antes | Después |
|---|---|---|
| Herramientas que salen 1ª alguna vez | 19 | **17** |
| Herramientas que nunca entran en top 3 | 22 | **21** |

**Asignar objetivos arregló la invisibilidad estructural pero no la
concentración.** Las 38 herramientas ya compiten, pero siguen sin ganar: el
cuestionario pregunta tamaño de empresa, presupuesto y plan gratuito, y esas
variables no distinguen entre quince CRM parecidos.

Los avisos de concentración lo confirman: Zoho CRM gana el 95% de la categoría
CRM, y **dentro de subtipos con 3 y 4 alternativas** (escritura, reuniones) una
sola gana el 100%. Ninguna pregunta actual decide si necesitas Grammarly o
Jasper.

**Esto es el siguiente problema, y es de producto, no de datos.** No se ha
tapado con un reparto artificial: empeorar una recomendación para repartir
visibilidad sería mentirle a quien pregunta.

### Garantías automáticas

Ocho, en `agents/atlas-curator/integridad.ts` y su batería de pruebas, todas
contra el catálogo real y no contra fixtures — los tres agujeros de este sprint
eran invisibles ficha a ficha:

1. Ninguna herramienta activa sin objetivo, salvo marca explícita de pendiente.
2. Ningún objetivo incompatible con una limitación central, con **reglas
   curadas**: la detección por palabras clave que se probó daba falsos
   positivos y hay una prueba que lo fija.
3. Aviso de concentración por encima del 90%, que no modifica ningún dato.
4. Categorías secundarias con el mismo criterio para todas las suites.
5. Una categoría secundaria nunca aporta puntos.
6. Cobertura y competencia mínima por objetivo y por subtipo.
7. Perfiles de simulación con tipado estricto.
8. La afiliación nunca interviene (ya existía; sigue en pie).

La garantía 7 existe por un error propio: durante la auditoría se simuló el
catálogo pasando `preferenciaSuite: true/false` cuando el campo admite
`"todo_en_uno" | "especializada"`. El spread lo ocultaba de TypeScript, así que
la rama "quiero una suite" nunca se probó y los porcentajes publicados estaban
mal. Ahora los valores salen de arrays tipados: un valor inválido no compila.

### Un fallo real que destapó el sprint

Al compartir categoría dos suites, `generarParesComparacion()` generaba la
**misma pareja dos veces** — 693 parejas para 617 únicas. Cada pareja es una
URL, así que habrían salido páginas de comparación duplicadas en el sitemap. Lo
detectó una prueba que ya existía. Corregido indexando por slug.

### Riesgos y trabajo pendiente

- **El cuestionario no distingue lo suficiente.** Es el hallazgo grande y sigue
  abierto. Requiere decisión de producto.
- **`gestion-proyectos` tiene el mismo problema que `asistentes-ia`**, más
  suave: Asana gana el 75%. Mezcla generalistas con especialistas en Gantt
  (TeamGantt, GanttPRO) y en rentabilidad (Paymo, Productive, Scoro). Se
  proponen subtipos, no se han implementado.
- **ClickFunnels, HoneyBook y Kartra** declaran módulos de CRM que ninguna de
  sus funciones principales sustancia. Van a Researcher: o sobra el módulo o
  falta la función.
- **Los 11 subtipos y categorías internas** siguen sin cobertura suficiente
  para publicarse.
- **Krisp**, sin objetivo que la describa.

### Despliegue y cierre del sprint

| | |
|---|---|
| Rama de trabajo | `claude/integridad-catalogo` — commit `570b6e0` |
| Fusión a producción | `2575035` sobre `claude/claude-md-docs-plkwnq` |
| Pruebas sobre el commit de fusión | 713 unitarias · TypeScript · ESLint · build · 41 E2E (escritorio y móvil) |

Comprobado sobre el build de producción:

| Comprobación | Resultado |
|---|---|
| Tres puertas de entrada | Cubiertas por las pruebas E2E, en escritorio y en móvil táctil |
| Los cinco objetivos | Página y cuestionario, 200 los diez |
| Las cuatro categorías públicas | Página y cuestionario, 200 las ocho |
| Subtipos de asistentes de IA | Quien no concreta recibe **tres clases distintas** (escritura, agenda, reuniones) en vez de tres correctores; quien pide vídeo recibe solo vídeo |
| Systeme.io | **0 menciones** en "automatizar tareas"; sigue en "plataformas todo en uno" y su ficha responde 200 |
| Elementos protegidos | Portada, Affiliate Manager, Neon, Upstash, seguridad, historial y las 51 estrategias: **sin una sola línea modificada** (diff vacío) |
| Rutas | Sitemap con **747 URLs, 747 únicas, 0 duplicadas**; las 11 categorías internas devuelven 404 y ninguna se filtra al sitemap |

Las comprobaciones se hicieron contra el build de producción exacto que se
desplegó, no contra el dominio: este entorno no tiene salida a internet. La
confirmación sobre molnip.com corresponde a la propietaria.

**Sprint cerrado.**

---

## Piloto de preguntas adaptativas — subtipo "escritura" (2026-08-27)

Primer intento de resolver el hueco que dejó abierto el sprint de integridad:
los subtipos evitaban la comparación absurda, pero no la concentración.

### La redacción original no diferenciaba, y se cambió antes de implementarla

Las opciones aprobadas al principio eran "crear contenido de marketing desde
cero" y "producir mucho contenido con voz de marca consistente". Al contrastar
contra las fichas, **las tres herramientas declaraban ambas cosas**:

| Opción original | Grammarly | Jasper | Copy.ai |
|---|---|---|---|
| Corregir lo ya escrito | ✅ | ❌ | ❌ |
| Crear contenido de marketing | ⚠️ lo declara en `casosDeUso` | ✅ | ✅ |
| Voz de marca consistente | ⚠️ "guías de estilo de la marca" | ✅ | ✅ |

Las dos últimas dejaban el mismo conjunto, así que daban la misma respuesta y
**Jasper no podía ganar con ninguna**. Se paró antes de escribir código y se
buscó qué declara UNA SOLA de las tres:

- solo Jasper: Surfer SEO, "optimizar para motores de búsqueda a gran escala";
- solo Copy.ai: prospección B2B, Infobase, "más de 25 idiomas", localización;
- solo Grammarly: corrección, reescritura, detección de plagio.

### Resultado medido, con los mismos perfiles válidos

| | Antes | Después |
|---|---|---|
| Concentración de la 1ª recomendación | **100%** | **33%** |
| Ganadoras distintas | 1 | **3** |
| Preguntas añadidas | — | **1**, solo en `asistentes-ia/escritura` |
| Recorridos afectados | — | **1 de 9** puertas públicas |
| Respuestas sin efecto sobre las candidatas | — | **0 de 3** |

Por respuesta: "corregir" → Grammarly · "marketing y SEO" → Jasper · "ventas y
varios idiomas" → Copy.ai. Cada una en el 100% de sus 120 perfiles.

### Por qué no es un reparto de visibilidad

Dos pruebas lo fijan. La primera exige que la ganadora de cada respuesta sea
**exactamente la que ya iba más arriba en el ranking sin filtrar** entre las
que declaran esa capacidad. La segunda, que el orden relativo de las
supervivientes no cambie. Rotar ganadores habría sido trivial; estas dos
pruebas lo impiden.

En el módulo **no aparece ni un solo identificador de herramienta** — hay una
prueba que recorre las 56 y comprueba que ninguna se nombra. Cada opción
declara una capacidad y se queda con las fichas que la declaran por sí mismas.

### Una aclaración sobre las puntuaciones

Filtrar cambia la puntuación absoluta de una ficha (Grammarly: 31 sin filtro,
30 en su categoría, 31 en su subtipo, 29 con la necesidad). **Eso ya pasaba
antes de este piloto**: varios criterios son relativos a las competidoras, así
que al estrecharse el conjunto se recalculan. Lo que no puede cambiar —y las
pruebas lo comprueban— es quién gana y en qué orden.

### Limitación importante que destapa el piloto

**Cada respuesta deja una sola candidata.** Quien conteste "corregir" recibe
Grammarly y nada con lo que compararla. No es un fallo del filtro: es que el
catálogo tiene exactamente tres herramientas de escritura y cada una cubre una
necesidad distinta.

Dicho de otro modo, el piloto ha convertido un problema invisible (una gana
siempre) en uno visible y medible (falta catálogo por necesidad). Va a
Researcher: hacen falta más alternativas por cada necesidad antes de que la
pregunta ofrezca una comparación de verdad y no solo un acierto.

### Trabajo pendiente

- Más herramientas de escritura por necesidad, para que la respuesta ofrezca
  alternativas comparables.
- El subtipo solo se alcanza por parámetro de la dirección
  (`?subtipo=escritura`): no hay navegación de subtipos, por decisión previa
  de no tocar el flujo público.
- Los ámbitos de reuniones, CRM y gestión de proyectos siguen concentrados y
  sin pregunta. No se han tocado.

### Despliegue del piloto de escritura

| | |
|---|---|
| Rama | `claude/pregunta-escritura` — commit `fea9a94` |
| Fusión a producción | `7253a28` sobre `claude/claude-md-docs-plkwnq` |
| Probado por la propietaria | En Preview, antes de fusionar: las tres opciones funcionan |
| Pruebas sobre la fusión | 728 unitarias · TypeScript · ESLint · build · 47 E2E (escritorio y móvil) |

Comprobado sobre el build desplegado: la pregunta aparece únicamente en
`/categoria/asistentes-ia/cuestionario?subtipo=escritura`, y **no** aparece en
ese mismo cuestionario sin el parámetro, con el subtipo vídeo, con un subtipo
inventado, en CRM, ni en ninguna de las puertas por objetivo o de texto libre.
El resto de la web responde igual y las categorías internas siguen en 404.

**Piloto cerrado. No queda trabajo pendiente de este sprint.**

---

## Preguntas adaptativas en reuniones y CRM (2026-08-27)

Extensión del principio validado en escritura. **Auditados los tres ámbitos
antes de escribir código**, con este resultado:

| Ámbito | Herramientas | Concentración | ¿Cumple el umbral? |
|---|---|---|---|
| asistentes-ia / reuniones-transcripción | 4 | **100%** (Fireflies.ai) | Sí |
| CRM | 27 | **95%** (Zoho CRM) | Sí |
| Gestión de proyectos | 19 | **75%** (Asana) | **No** |

**Gestión de proyectos se queda fuera**, y a propósito. No llega al 90%, y sus
candidatas sí son sustituibles entre sí: un gestor generalista y uno
especializado en Gantt compiten por el mismo trabajo, a diferencia de un
corrector de textos y un generador de vídeo. Añadirle una pregunta habría sido
inventarle una necesidad al usuario para justificar el trabajo.

### Resultado medido

| Ámbito | Concentración | Ganadoras distintas |
|---|---|---|
| escritura | 100% → **33%** | 1 → 3 |
| reuniones y transcripción | 100% → **25%** | 1 → 4 |
| **CRM** | 95% → **23%** | 2 → **7** |

CRM es el mejor caso de los tres: **cada respuesta deja 2 o 3 finalistas
reales**, así que hay comparación de verdad — no como en escritura, donde cada
respuesta deja una sola herramienta.

| Respuesta en CRM | Finalistas |
|---|---|
| Que viva dentro de mi correo | Capsule CRM 88% · Copper 13% |
| Que rellene los datos solo | Salesflare 75% · Copper 25% |
| Sencillo, sin funciones de sobra | noCRM.io 60% · Less Annoying CRM 40% |
| Llamar y mandar SMS desde el CRM | Agile CRM 60% · Salesmate 40% |

### Dos errores propios que la auditoría destapó

**Un eje construido sobre falsos positivos.** La primera versión del eje
"sencillo para empezar" buscaba las palabras "sencillo" o "simple" y cazaba a
Agiled por *"módulo sencillo de RRHH"* y a Capsule CRM por *"proyectos
simples"* — nada que ver con lo sencillo que sea el CRM. La medición que salió
de ahí era basura. La señal definitiva exige una afirmación de posicionamiento
("complejidad excesiva", "exceso de funciones no utilizadas", "interfaz
extremadamente sencilla"), y deja dos herramientas que sí lo declaran.
Lección: **verificar el texto que activa cada señal, uno a uno, antes de medir
nada con ella.**

**Un fallo real en el motor.** `seleccionarCandidatas` salía antes de aplicar
el filtro de necesidad cuando no había subtipo, así que en CRM —una categoría
sin subtipos— la respuesta no hacía absolutamente nada. Lo detectó la prueba de
"ninguna ganadora es promocionada": ganaba una herramienta que ni siquiera
declaraba la capacidad pedida. Corregido.

**Y una prueba intermitente.** La de "tocar una puerta enseña lo que abre"
esperaba un tiempo fijo a que terminara el desplazamiento suave, y fallaba bajo
carga. Ahora sondea hasta que llega. Comprobado: tres pasadas seguidas de la
batería completa, 53 de 53 cada vez.

### Trabajo pendiente

- **Gestión de proyectos**: sin pregunta, por decisión medida. Si algún día su
  concentración sube del 90%, la garantía de concentración avisará.
- **Escritura**: sigue dando una sola candidata por respuesta. Hace falta más
  catálogo por necesidad.
- El piloto de afiliación y el alta de Systeme.io siguen **pausados e
  intactos** por decisión de la propietaria: 51 estrategias, sin tocar.

### Despliegue de las preguntas de reuniones y CRM

| | |
|---|---|
| Rama | `claude/preguntas-adaptativas-3` — commit `2ef02a6` |
| Fusión a producción | `1dea126` sobre `claude/claude-md-docs-plkwnq` |
| Pruebas sobre la fusión | 730 unitarias · TypeScript · ESLint · build · 53 E2E (escritorio y móvil) |

Comprobado sobre el build desplegado:

| Comprobación | Resultado |
|---|---|
| Pregunta de CRM | Aparece en `/categoria/crm/cuestionario`, sin necesitar parámetro |
| Pregunta de reuniones | Aparece con `?subtipo=reuniones-transcripcion` |
| Pregunta de escritura | Sigue apareciendo con `?subtipo=escritura` |
| Dónde **no** aparece ninguna | Gestión de proyectos, plataformas todo en uno, asistentes-ia sin subtipo, subtipo vídeo, las puertas por objetivo y texto libre — **0 de 7** |
| Escritorio y móvil | Las 53 pruebas E2E corren en ambos proyectos |
| Resto de la web | Portada, Sobre, blog, legales, sitemap, robots, fichas y landings: 200 |
| Categorías internas | 404 las cuatro comprobadas |
| Panel de administración | 307 (sigue protegido) |

**Elementos protegidos: diff completamente vacío** frente al despliegue
anterior en portada, cabecera, componentes de interfaz, imágenes, Affiliate
Manager, las 51 estrategias de afiliación, las 56 fichas, categorías,
objetivos, seguridad, Upstash, esquema de base de datos y API de
administración. El historial conserva sus 40 registros y Systeme.io sigue en
`no_solicitado`: **el piloto de afiliación no se ha tocado.**

Lo único modificado: los dos archivos de documentación, el módulo de preguntas,
el motor, y sus pruebas.

**Sprint cerrado, sin anomalías.**

---

## Requisito previo a ampliar la afiliación (anotado el 2026-08-29)

**Decisión de la propietaria:** Systeme.io se registra a mano, como parte del
piloto de cinco. Pero **antes de ampliar la afiliación a muchas herramientas**,
Affiliate Manager tiene que poder:

1. **Importar enlaces en bloque**, no uno a uno desde el panel.
2. **Validarlos** en el mismo paso: que respondan y que apunten a donde deben.
3. **Asociarlos automáticamente con su herramienta**, sin emparejar a mano.
4. **Dejarlos pendientes de aprobación** — nunca activos por el hecho de
   importarse. Ningún enlace debe generar tráfico real sin que una persona lo
   haya aprobado.

**No implementado. No ampliar la afiliación hasta que exista.**

### Qué hay ya construido, para no rehacerlo

| Pieza | Estado |
|---|---|
| `POST /api/admin/afiliacion/importar` | Existe. Importa un array de `EstrategiaAfiliacion` con el mismo formato que exporta `/exportar`; una fila inválida no aborta las demás |
| `POST /api/admin/afiliacion/verificar-enlaces` | Existe. Comprueba todos los enlaces guardados y persiste el resultado en cada cuenta |
| Botón de importar y de comprobar enlaces en el panel | Existen |

### Qué falta de verdad

- **La importación acepta el estado que venga en el archivo.** Hoy nada impide
  importar una cuenta ya marcada como `activo`, y eso encendería tráfico real
  sin que nadie lo apruebe. Ese es el hueco de seguridad del punto 4.
- **No valida en el momento de importar**: importar y comprobar son dos pasos
  separados que hay que lanzar a mano.
- **No asocia por sí sola**: el archivo tiene que traer ya el `herramientaId`
  correcto de cada fila.
- **No existe una bandeja de "importados, pendientes de aprobar"** donde
  revisarlos en bloque antes de encender ninguno.

### Contexto de por qué se anota aquí

Al intentar registrar el enlace de Systeme.io se descubrió que los JSON de
`data/estrategia-afiliados/` **ya no son la fuente de nada**: desde la
migración a Neon son una copia de respaldo de aquella migración, y la
aplicación lee y escribe en Postgres. Editarlos no cambia producción, y además
habría metido un enlace de afiliado real en el historial de Git para siempre.
El camino bueno es el panel, que registra cada cambio en el historial con el
usuario que lo hizo.

---

## Atlas Revenue — medición mínima y anónima (2026-08-29)

Undécimo agente, construido primero porque era el único que desbloqueaba la
monetización: el circuito del dinero estaba roto por la mitad.

```
usuario pulsa "Ir al proveedor" → /api/clic → proveedorConsola → console.log
                                                                      ↑ y ahí moría
```

No había tabla de clics. Con las altas de afiliación en marcha, cada visita era
un dato perdido para siempre y el piloto de cinco herramientas no podía
responder a su propia pregunta.

### Lo que guarda, y lo que no

`clics_salientes`: herramienta, categoría, tipo de enlace (afiliado u oficial),
pantalla de origen, **ruta de origen** y fecha. **Nada más.**

Sin IP, sin cookie, sin identificador de sesión, sin user-agent, sin referer.
No es una promesa de no usarlos: el dato no entra, así que no hay nada que
reidentificar ni con qué enlazar dos clics. Una prueba lee
`information_schema` y **compara la lista de columnas contra una escrita a
mano**: añadir una columna rompe la prueba y obliga a justificarla.

`ingresos_afiliacion`: lo que la propietaria anota de los paneles. Céntimos
enteros —el dinero no va en coma flotante— y append-only por trigger de base de
datos, igual que el historial de afiliación: una reversión por reembolso resta
sin borrar el asiento original.

### Un hueco que destapó una prueba

La etiqueta de recorrido es el único texto libre que llega del navegador hasta
la tabla, así que se validaba con un formato cerrado (`categoria:crm`). **Una
prueba demostró que no bastaba:** una cadena de 32 caracteres hexadecimales
—exactamente la pinta de un identificador de sesión— encajaba perfectamente en
ese formato.

Un filtro de forma solo puede decir "esto parece un slug"; no puede decir "esto
no es un identificador". La comprobación de verdad es **contra el catálogo**:
solo se guarda la etiqueta si su identificador existe como objetivo, categoría
o subtipo real. Nada inventado entra, por bien formado que venga.

### Independencia del ranking, comprobada sobre el código

Cuatro pruebas recorren los archivos del agente y exigen que no importe nada de
Advisor ni de Affiliate Manager, que no escriba en las tablas de afiliación y
que no mencione comisiones ni puntuaciones. La arquitectura ya lo decía
—*"Revenue solo lee estos datos, nunca los modifica ni decide sobre ellos"*—;
ahora se rompe solo si alguien cruza la línea.

Una de esas pruebas hubo que afinarla: saltaba porque el repositorio menciona
"las comisiones se revierten por reembolsos" **en un comentario**. Un
comprobador que no distinga el código de la prosa obliga a escribir peor los
comentarios para que pasen las pruebas, que es justo al revés de lo que
interesa. Ahora los ignora.

### El enlace de afiliada, intacto

Ocho pruebas fijan que la URL llega al navegador carácter por carácter: `?sa=`,
la ruta larga con hash de Systeme.io, varios parámetros con su orden, un
fragmento `#`, mayúsculas, y un parámetro ya codificado que re-codificar
rompería. Es el punto donde un error cuesta dinero **sin dar ninguna señal**:
la web seguiría perfecta y la comisión se perdería en silencio hasta cuadrar
cuentas meses después.

### Política de privacidad y de cookies

Actualizadas en el mismo cambio, como exigía el propio comentario del archivo.
Antes decían que Molnip no tiene analítica, y eso dejaba de ser cierto.

Se describe con exactitud qué se registra —herramienta, recorrido, tipo de
enlace y fecha— y se afirma con claridad que **no hay cookies, ni IP, ni
identificadores de sesión, ni nada que permita identificar o seguir a una
persona**. Siguiendo la indicación de la propietaria, **no se invoca ninguna
base jurídica del artículo 6.1**: hacerlo presupondría que se tratan datos
personales, y aquí no los hay. Se añade una nota de que el documento deberá
recibir revisión profesional antes de cualquier ampliación relevante del
seguimiento.

### Un detalle técnico que costó el build

El formulario del panel es un componente de cliente y necesitaba la lista de
estados. Importarla del repositorio arrastraba `pg` —y con él `dns`, `net`,
`tls`— al paquete del navegador. Por eso el vocabulario vive en `tipos.ts`, sin
dependencias de servidor: los dos lados comparten una definición sin compartir
dependencias.

### La etiqueta de recorrido, completada

`ruta_origen` llegaba vacía justo en la pantalla que más importa para el
piloto. Las cuatro salidas hacia el proveedor la llevan ya: pantalla final de
recomendaciones, comparador, ficha y tabla comparativa.

El recorrido `libre` no guarda nunca lo que la persona escribió. Se registra
siempre como `libre:texto-libre`. Saber que alguien vino por la puerta de texto
libre es información de producto; saber qué escribió sería exactamente lo que
esta medición promete no hacer.

Lo que se guarda se valida contra el catálogo real antes de escribirlo
(`identificadoresDelCatalogo()`). Sin esa comprobación, la columna aceptaba
cualquier cadena con el formato correcto — una prueba demostró que 32
caracteres hexadecimales, la forma de un identificador de sesión, pasaban el
filtro. El formato no basta: tiene que ser un objetivo, una categoría o un
subtipo que exista.

### Dos fallos que solo aparecieron al usarlo de verdad

**El formulario de ingresos guardaba bien y decía que no.** Tras un alta
correcta mostraba `Cannot read properties of null (reading 'reset')`:
`currentTarget` vale null tras el primer `await`, y el error caía en el `catch`
del guardado. El fallo estaba solo en el camino bueno, que es justo el que las
pruebas de error no recorren. Lo grave no era el mensaje: quien lo viera daría
el apunte por fallido y lo repetiría, sobre una tabla que no admite
modificaciones ni borrados. El duplicado se queda para siempre.

La prueba que lo impide recorre el árbol de sintaxis de los componentes en vez
de buscar texto, porque hay que distinguir el `await` de la propia función del
de una función anidada, y eso una expresión regular no lo sabe hacer.

**El aprovisionamiento verificaba dos tablas de cuatro.** La lista de tablas a
comprobar estaba escrita a mano y se había quedado vieja al añadir las de
Revenue, así que daba por bueno un aprovisionamiento a medias. Ahora lo que se
espera se deduce de las propias sentencias del esquema
(`data/db/verificarEsquema.ts`): una lista escrita a mano se queda vieja, una
deducida no puede. Y se comprueban tres cosas, porque las tres pueden faltar
por separado: la tabla, sus columnas y el trigger que la protege. Que exista
`historial_cambios_afiliacion` no dice nada sobre si sigue siendo de
solo-inserción.

### El aprovisionamiento, dentro de una transacción

Encontrado al revisar el script antes de ejecutarlo contra Neon. Dos triggers
se recrean en cada pasada, y recrear es primero `DROP` y después `CREATE`. Sin
transacción, un corte de red contra Neon justo entre esas dos sentencias
dejaría `historial_cambios_afiliacion` —una tabla que ya está en producción y
con datos— aceptando `UPDATE` y `DELETE`. El aviso habría salido por consola
como un error de aprovisionamiento cualquiera, sin mencionar que además la
tabla había quedado desprotegida.

En Postgres el DDL es transaccional, así que basta con envolverlo: o queda todo
aplicado, o no queda nada. Hay control negativo: una prueba reproduce el
comportamiento anterior y confirma que sí dejaba la tabla desprotegida.

Verificado además de forma empírica sobre una base con datos: dos pasadas
seguidas, y el resumen md5 de todas las filas idéntico antes y después.

**La variable que necesita el script es `POSTGRES_URL_NON_POOLING`**, no
`DATABASE_URL` — el aprovisionamiento tiene que ir por la conexión directa, no
por el pooler.

### Pendiente

- La importación y validación de enlaces en bloque sigue sin construir (ver el
  apartado anterior).
- La tasa de conversión de la tabla puede superar el 100 %: las conversiones que
  comunica un programa no corresponden al mismo periodo que los clics medidos.
  Se ha decidido no acotarla — una cifra imposible ahí es señal de que algo se
  apuntó mal, y ocultarla sería peor que enseñarla.


## Affiliate Manager: gestionar el enlace, y el estado que faltaba (2026-08-31)

Detectado por la propietaria usando el panel en producción para dar de alta
su enlace de Systeme.io. Su descripción era exacta: al pulsar en la fila solo
aparecía un selector de estados, no había ningún sitio donde pegar el enlace,
y no existía «Activo».

### Lo que había

El campo del enlace **sí existía**, detrás de un botón llamado «Detalle» en la
última de nueve columnas de una tabla con 1100px de ancho mínimo. En una
ventana más estrecha —el móvil siempre— esa columna cae fuera de la pantalla,
y hay que descubrir por tu cuenta que la tabla se desplaza en horizontal. Lo
único visible y pulsable de la fila era el selector de estados, así que
invitaba a cambiar el estado justo cuando lo que se buscaba era editar. Un
cambio de estado accidental es exactamente lo que no debe pasar en esa tabla,
y pasó.

### El fallo de fondo, que era peor

`seleccionarEnlace.ts` solo usa los enlaces de las cuentas en estado
`activo`. El panel traducía `aprobado` y `activo` al mismo estado de lectura,
«Aprobada», y no ofrecía ninguna forma de llegar a `activo`. Es decir: se
podía aprobar una afiliación, guardar su enlace, verlo todo correcto en la
tabla — y la web seguía enviando a la URL oficial del proveedor, sin comisión,
sin ninguna señal de que algo faltara.

«Activa» es ahora un estado propio del panel, con su color, su recuento y su
explicación. Y la próxima acción de una cuenta aprobada con enlace ya no dice
«Ninguna»: dice «Activar la cuenta — hasta entonces el enlace no se usa».

### El flujo nuevo

Cada fila lleva un botón **Gestionar**, en una columna pegada al borde derecho
para que no se pierda por estrecha que sea la pantalla. Abre una pantalla de
gestión con el enlace, la comisión, la duración de la cookie y el estado, y
**un botón de guardar de verdad**.

Antes cada campo se guardaba en su `onBlur`. Si pegabas el enlace y cerrabas
sin tocar nada más, no se guardaba y tampoco se decía. Para el dato del que
depende cobrar, eso no vale.

Dos reglas impiden guardar algo que no funcionaría, en `reglasEnlace.ts` para
que se puedan probar y para que valgan igual si mañana los enlaces entran por
importación en bloque:

- **No se puede activar sin enlace.** Es la misma regla que `consistencia.ts`
  detecta a posteriori; aquí se impide antes de crear el problema.
- **No se puede guardar un enlace pegado a medias.** `ps://systeme.io/...` en
  vez de `https://systeme.io/...` se guardaba sin protestar, no llevaba a
  ninguna parte y no pagaba nada, y no había forma de notarlo mirando la
  tabla. Visto de verdad al pegar un enlace largo en producción.

«Comprobar este enlace» comprueba solo el de esa herramienta, sin lanzar una
ronda contra los servidores de los 51 programas.

### Verificación

Con navegador real en escritorio (1440px) y móvil (Pixel 5): el botón queda
dentro de la pantalla en los dos sin desplazar nada, el modal cabe, el aviso
del enlace mal pegado bloquea el guardado, «Activa» aparece deshabilitada y
etiquetada «necesita enlace» mientras no lo haya, y al guardar el enlace llega
íntegro a la base de datos con la comisión y la cookie. 803 pruebas en verde.

### La duración de la atribución podía ser mentira

Al dar de alta Systeme.io, la ficha decía «365 días» y el correo oficial del
programa dice atribución permanente: se ancla al correo del lead registrado y
no caduca nunca.

La causa no fue un descuido al investigar. La descripción del campo que se le
pasa a Researcher decía literalmente *«Duración de la cookie de seguimiento
(ej. "30 días", "90 días")»*: pedía la respuesta en días y solo en días, así
que la permanencia no se podía ni expresar. Un campo que solo admite una forma
de respuesta acaba produciendo respuestas falsas con la forma correcta.

Corregido en los dos extremos:

- La descripción del campo admite ahora explícitamente la permanencia y
  advierte de no inventarse un número de días para que encaje.
- El campo del panel se llama «Duración de la cookie o atribución» —no todos
  los programas usan cookie— y ofrece sugerencias con la permanencia la
  primera, además de seguir siendo texto libre.
- `duracionAtribucion.ts` fija una redacción canónica para que no convivan
  cinco maneras de decir lo mismo, y reconoce la permanencia escrita de
  cualquier forma (con o sin tildes) para destacarla en la tabla: entre «90
  días» y algo que no caduca hay una diferencia de negocio grande que leyendo
  texto libre a toda velocidad se pasa por alto. Con control negativo: «no
  permanente» no cuenta como permanente.

Nada interpretaba ese campo como un número, así que no había ningún cálculo
que corregir — se comprobó antes de tocarlo.

El enlace elegido para el piloto es el universal del correo de bienvenida, con
forma `https://systeme.io/?sa=…`, no el `/tr/…` de una campaña concreta.

### Aprovisionar el esquema desde el panel

Añadido porque administrar Molnip no debería exigir abrir un terminal ni
conocer la cadena de conexión de Neon para crear unas tablas que la propia
aplicación ya sabe describir.

Cuando la pantalla de Ingresos no puede leer la base de datos, en vez de un
aviso que solo dice que algo va mal, aparece una tarjeta que va a mirar qué
falta —tablas, columnas y triggers, por separado— y ofrece crearlo. Enseña lo
que falta antes de dejar aplicar: nadie debería pulsar un botón que toca la
base de datos sin ver antes qué va a hacer.

`/api/admin/esquema` ejecuta las mismas `SENTENCIAS_ESQUEMA` que el script de
línea de órdenes, dentro de una transacción y con la misma verificación
posterior. El script sigue existiendo; son dos puertas a la misma habitación.

Verificado sobre una base en el estado anterior al sprint —solo las dos tablas
viejas, con datos dentro— con navegador real:

- listó exactamente lo que faltaba: las dos tablas nuevas y los dos triggers;
- al crearlo, las cuatro tablas quedaron presentes;
- el resumen md5 de todas las filas anteriores, idéntico antes y después;
- los triggers protegen de verdad: `UPDATE` y `DELETE` sobre el historial se
  rechazan con su mensaje;
- una segunda pulsación no cambia nada.

Detalle que solo se ve haciendo la prueba así: la base de partida no tenía el
trigger `historial_solo_insertar`, y el aprovisionamiento lo añadió. Es decir,
aprovisionar no solo crea lo que falta de Revenue: repone la protección de una
tabla que ya estaba en producción.

## Cierre de Atlas Revenue: el primer clic real (2026-08-31)

Fusionado con squash en `claude/claude-md-docs-plkwnq` como commit `d55dc58`,
autorizado expresamente por la propietaria. Un solo commit en el historial
principal, con el árbol idéntico al de la rama comprobado antes de publicar.

### El aprovisionamiento, hecho desde el panel

Este entorno de desarrollo no tiene salida de red ni credenciales de Neon, así
que el aprovisionamiento no pudo ejecutarlo Atlas. Por eso se construyó la
tarjeta de esquema en la pantalla de Ingresos: la propietaria pulsó
«Comprobar el esquema» y «Crear lo que falta», sin abrir un terminal.

Resultado en Neon, leído del propio panel:

    clics_salientes · 7 columnas
    estrategias_afiliacion · 3 columnas
    historial_cambios_afiliacion · 8 columnas
    ingresos_afiliacion · 11 columnas
    → «El esquema está completo»

Las siete columnas de `clics_salientes` son la prueba en producción de que no
hay columna de IP, ni de cookie, ni de sesión. La garantía de privacidad no es
una promesa del documento: es que las columnas no existen.

### Systeme.io, primera afiliación activa

Dada de alta por la propietaria desde el flujo nuevo, sin que Atlas tocara su
enlace ni sus estados:

- enlace universal `https://systeme.io/?sa=…` (no el `/tr/…` de campaña);
- comisión **60 % vitalicia**, corrigiendo el «40 % a 50 %» que traía
  investigado;
- atribución **Permanente — sin caducidad**, corrigiendo el «365 días»;
- comprobación del enlace en verde el 31/8/2026 a las 11:30:56;
- estado **Activa**, con próxima acción «Ninguna — cuenta activa y con enlace».

### El primer clic

Recorrido completo hecho a mano en producción: ficha pública → «Ir al
proveedor» → pantalla intermedia, que mostró el aviso de enlace de afiliada →
systeme.io.

    CLICS SALIENTES     1   · 1 herramienta(s)
    POR ENLACE PROPIO   1   · Pueden generar comisión
    SIN ENLACE PROPIO   0
    Systeme.io · clics 1 · con enlace propio 1

Un detalle que conviene recordar para no confundirlo con un fallo: al llegar a
Systeme.io la barra de direcciones muestra `systeme.io/es`, sin el `?sa=`.
Systeme.io anota la atribución y redirige a su página localizada. El parámetro
no se pierde: se consume.

Con esto queda comprobado en producción lo que el sprint venía a construir: el
panel Gestionar, el enlace universal, la comisión, la atribución permanente, el
paso de Aprobada a Activa, la comprobación del enlace, la redirección íntegra y
el registro del clic con su recorrido.

### Pendiente menor

La rama `claude/atlas-revenue` no pudo borrarse desde este entorno: el remoto
corta la conexión en la operación de borrado, aunque los envíos normales
funcionan. Su contenido está íntegro en producción —árbol idéntico
comprobado—, así que borrarla es cosmético y puede hacerse desde GitHub.

## Importación y validación de enlaces en bloque (2026-08-31)

Construida sobre lo que ya existía en vez de rehacerlo: `lote.ts` ya fusionaba
campo a campo, aislaba el fallo de cada fila y escribía en serie. Lo que no
había era forma de llegar a ello desde el panel, ni de ver antes qué iba a
pasar.

### El botón que había era peligroso

`/api/admin/afiliacion/importar` no fusiona: **reemplaza la estrategia entera**
de cada herramienta. Un archivo parcial borraba cuentas y enlaces que no
vinieran en él. Y estaba en el panel junto a «Exportar JSON», sin ninguna
advertencia: bastaba escoger el archivo equivocado.

Ahora exige una marca explícita de reemplazo. Sin ella, se rechaza y explica
la diferencia.

### El flujo

Cinco pasos, y nada se escribe hasta el cuarto: elegir archivo, emparejar
columnas, **ver qué va a pasar**, aplicar, resultado.

La vista previa dice fila a fila el veredicto —se creará, cambiará, sin
cambios, error— con el antes y el después de cada campo. Es lo que hace que
esto se pueda usar sin miedo: toca los enlaces de los que depende cobrar, en
muchas herramientas a la vez, y la tabla de estrategias no tiene papelera.

### Las activaciones, aparte

Decisión de la propietaria (opción 3 de tres presentadas). Las filas que dejan
una cuenta en «activo» se cuentan y se listan en su propio bloque, con su
propio botón. El botón principal aplica todo lo demás y deja las activaciones
pendientes.

La razón es que activar no es un cambio más: a partir de ese momento los
botones «Ir al proveedor» de esas herramientas llevan el enlace de afiliada.
Eso no debe colarse dentro de un «aplicar 40 cambios» que nadie lee entero.
Coincide además con el requisito que la propia propietaria anotó el 2026-08-29:
ningún enlace debe generar tráfico real sin que una persona lo haya aprobado.

### Protección del piloto: por regla, no por lista de nombres

Se pidió dejar fuera Systeme.io y las cinco afiliaciones del piloto. Lo obvio
sería una lista de identificadores, pero ATLAS.md no las nombra y los JSON del
repositorio son respaldos de la migración: los datos vivos están en Neon.
Escribir cinco identificadores a ojo habría sido inventarse el dato justo en la
pieza encargada de protegerlo.

Se protege por lo que la cuenta **es**:

- una cuenta **activa** no se toca desde una importación — es la que genera
  tráfico real ahora mismo, y cambiarla desde un archivo puede cortar los
  ingresos sin que nadie se entere hasta el siguiente cobro;
- un **enlace ya guardado no se pisa** por otro distinto — añadir donde no
  había es el objetivo, sustituir lo que alguien pegó y comprobó es otra cosa;
- `systeme-io`, además, por nombre.

Ninguna impide editar desde «Gestionar». Lo que se bloquea es el cambio masivo
y a ciegas.

### Tres cosas que aparecieron al probarlo de verdad

**El identificador de cuenta se derivaba del nombre de la plataforma.** En una
orden de terminal tiene sentido; en una hoja de cálculo, donde «plataforma» es
una columna descriptiva casi siempre rellena, un archivo razonable habría
creado una cuenta paralela nueva en cada herramienta, dejando los enlaces en
cuentas recién inventadas. Ahora, si la herramienta ya tiene una sola cuenta,
se actualiza esa; y la cuenta se fija antes de previsualizar y de aplicar, con
la misma función, porque una vista previa que no describe lo que va a pasar es
peor que no tenerla.

**El bloqueo por «más de la mitad de las filas fallan» acusaba a las
columnas.** Con navegador real, sobre un CSV de cinco filas perfectamente
emparejado donde tres fallaban por protecciones correctas, el archivo se
bloqueaba entero diciendo que las columnas estaban mal. Ahora solo cuentan
para ese umbral los errores que de verdad apuntan a un emparejamiento
equivocado: que falte el id o que no exista en el catálogo. Las protecciones
son negativas deliberadas y en un archivo normal habrá varias.

**Y ese mismo umbral no se aplica por debajo de cuatro filas**: en un archivo
de una línea, un solo error ya supera la mitad, y explicar el problema con una
causa equivocada es peor que no explicarlo.

### El lector de CSV

Escrito a mano. El problema no es analizar CSV —son treinta líneas— sino
tolerar lo que sale de un Excel en español: punto y coma, BOM, finales de
línea de Windows y encabezados con tildes. Una librería genérica resuelve lo
primero y deja lo demás igual de roto.

El delimitador se detecta contando fuera de comillas: una descripción
entrecomillada con comas basta para que un archivo separado por punto y coma
parezca separado por comas. Y una fila con distinto número de columnas que el
encabezado se omite y se avisa, en vez de rellenar o recortar — adivinar ahí
escribe el enlace de una herramienta en el campo de otra sin dar ningún error.

### Verificación

865 pruebas unitarias y 53 de navegador. El recorrido completo comprobado con
navegador real en escritorio y móvil, contra Postgres real, con un CSV con BOM,
punto y coma, tildes y finales de Windows, y con la base sembrada con
Systeme.io activa y una cuenta con enlace ya guardado:

    5 fila(s) · 2 se crearán · 0 cambiarán · 0 sin cambios · 3 con error
      Asana        Se creará
      ClickUp      Se creará · activa
      Systeme.io   Error — protegida
      monday.com   Error — ya tiene un enlace guardado
      no-existe    Error — no existe en el catálogo

    Botón principal  → «Aplicar 1 cambio(s)»
      resultado: 1 aplicada · 1 activación sigue pendiente de confirmación
      clickup: no creado · systeme-io y monday.com intactos

    Botón de activación → «Aplicar los cambios y activar 1»
      resultado: 2 aplicadas · 1 activada
      clickup: activo · systeme-io y monday.com siguen intactos

## Pendiente para el próximo sprint (anotado el 2026-08-31)

Registrado a petición de la propietaria al cerrar el sprint de importación en
bloque. **Nada de esto está empezado.**

### 1. El identificador de ejemplo de la plantilla produce error

`PLANTILLA_CSV`, en `agents/atlas-affiliate-manager/importacion/columnas.ts`,
trae la fila de ejemplo con el id `ejemplo-herramienta`. Al previsualizar la
plantilla tal cual descargada, esa fila sale en rojo:
«ejemplo-herramienta» no existe en el catálogo.

Es el comportamiento correcto —la validación hace su trabajo— pero convierte
el primer contacto con la función en un error, y eso enseña a desconfiar de
una pantalla que precisamente tiene que dar confianza. Comprobado así en
producción el 2026-08-31.

Arreglo: poner un id real del catálogo en la fila de ejemplo. Cambio de una
línea. Conviene además una prueba que falle si el id de la plantilla deja de
existir en el catálogo, porque si no volverá a pasar el día que se retire esa
herramienta.

### 2. Comprobar los enlaces dentro de la vista previa

Hoy la importación valida la FORMA del enlace —que sea una dirección completa
que empiece por https— pero no comprueba que responda. Eso se hace después y
por separado, desde «Comprobar este enlace» en Gestionar, una herramienta cada
vez.

Con un archivo de treinta filas eso deja de ser práctico justo cuando más
falta hace. La comprobación debería ocurrir en el paso de vista previa, con su
resultado en la propia tabla, para poder decidir con esa información delante.

Dos cosas a tener en cuenta al construirlo: comprobar treinta enlaces son
treinta peticiones a servidores ajenos, así que hace falta paralelismo acotado
y un tope de tiempo; y un enlace que no responde **no debe bloquear la
importación**, solo avisar — puede estar caído un momento, o rechazar peticiones
automáticas. Lo que sí debería impedir es activarlo.

`verificarEnlaces.ts` ya tiene la lógica y acepta un `fetchImpl` inyectado, así
que se puede probar sin red.

### 3. Fijar el prompt de referencia oficial «Molnip Visual v1»

Sigue pendiente desde antes de estos dos sprints. Sin un prompt de referencia
fijado, cada imagen nueva se parece a la anterior solo por casualidad.

## Plantilla sin errores y comprobación de enlaces en la vista previa (2026-08-31)

Las dos primeras tareas del sprint anterior. «Molnip Visual v1» sigue sin
empezar.

### La plantilla

El arreglo obvio —cambiar el id inventado por uno real— habría sido peor que
el problema. La fila de ejemplo llevaba valores rellenos: «Programa de
ejemplo», «30 % recurrente», una dirección inventada. Con un id real, la
plantilla habría pasado de dar un error inofensivo a **proponer escribir todo
eso sobre una herramienta de verdad**, con el botón de aplicar encendido. El
error protegía.

La fila de ejemplo lleva ahora un id real **y todo lo demás vacío**. Como una
casilla vacía no cambia nada, previsualizar la plantilla dice «Sin cambios» y
no hay nada que aplicar: se puede abrir cien veces sin tocar un dato. Los
valores de ejemplo se enseñan en la propia pantalla, en una tabla desplegable
donde no pueden aplicarse.

Con una prueba que falla si ese id desaparece del catálogo, para que no vuelva
a romperse en silencio el día que se retire esa herramienta.

### La comprobación de enlaces

Ocurre en el paso de vista previa, sobre los enlaces nuevos de las filas que
no traen ya un error —pedirle una dirección a un proveedor para después
descartar la fila sería molestarle para nada—. Botón aparte y explícito,
porque es lo único de toda la importación que sale a la red.

La regla: un enlace que no responde **avisa pero no bloquea**. La fila se
importa con su comisión, sus notas y su enlace; lo único que se le retira es
el paso a «activo». Un proveedor puede estar caído un momento o rechazar
peticiones automáticas, y eso no justifica tirar el resto de un archivo. Pero
sí justifica no poner en circulación un enlace que hoy no lleva a ninguna
parte.

**Activar comprueba siempre, pida el cliente lo que pida.** Si dependiera de
una bandera de la petición, omitirla —por descuido o a propósito— bastaría
para activar un enlace roto, y la promesa dejaría de serlo.

### Protecciones de la salida a la red

Comprobar enlaces significa que el servidor pide direcciones que alguien
escribió en un archivo. Sin restricciones eso es un SSRF: se le puede pedir
que hable con la propia máquina, con la red interna del alojamiento, o con el
servicio de metadatos que en las nubes públicas responde en 169.254.169.254 y
entrega credenciales.

- Solo http y https.
- Se rechazan `localhost`, `.local`, `.internal`, `metadata.google.internal`,
  los nombres sin punto y las direcciones con usuario y contraseña.
- Se rechazan bucle local, redes privadas, CGNAT, enlace local (incluidos los
  metadatos), locales únicas IPv6, multidifusión y rangos reservados — y las
  IPv4 disfrazadas de IPv6 como `::ffff:169.254.169.254`.
- Cuando el destino es un nombre, se comprueban **todas** las direcciones a
  las que resuelve: basta una interna para rechazarlo.
- Las redirecciones se siguen a mano y **cada salto se vuelve a comprobar**:
  un servidor legítimo puede redirigir a una dirección interna, y esa segunda
  petición la haría el servidor igual.
- Máximo 3 redirecciones, 8 segundos para toda la cadena, 6 peticiones en
  paralelo, y no se descarga el cuerpo: HEAD primero, y si hay que caer a GET
  se corta la lectura.

**Límite conocido, escrito en el código en vez de disimulado:** entre resolver
el nombre y conectar, el DNS podría devolver otra dirección (*DNS rebinding*).
Cerrarlo exige conectar a la IP ya validada con la cabecera Host puesta a
mano, algo que `fetch` no permite. No se cierra. La función la usa solo el
panel, detrás de sesión.

### Verificación, y lo que NO se pudo verificar

906 pruebas unitarias en 101 ficheros y 53 de navegador. 21 pruebas solo del
filtro de destinos y 12 del comprobador, con controles negativos.

Las pruebas de la API levantan un servidor HTTP de verdad y comprueban el
recorrido completo: enlace vivo → se activa; enlace roto → se importan los
demás datos y NO se activa; y activar comprueba aunque se pida lo contrario.

Con navegador real, en escritorio y móvil, quedó comprobado que la plantilla
previsualiza limpia con el botón de aplicar desactivado, que aparece el botón
de comprobar enlaces, y que las filas con enlace caído se marcan «no se
activará», desaparece el botón de activación y no se escribe nada.

Lo que **no** se pudo ver en el navegador es el estado verde de «el enlace
responde»: este entorno no tiene salida a internet, y al apuntar a un servidor
local la propia protección lo rechaza —correctamente— porque la compilación de
producción no admite direcciones locales. Ese camino queda cubierto por las
pruebas de la API, no por una captura.

### Revisión de las protecciones antes de desplegar (2026-08-31)

A petición de la propietaria, antes de autorizar el despliegue.

**Dos barreras, confirmadas.** `proxy.ts` cubre `/admin/:path*` y
`/api/admin/:path*`, y además cada manejador llama a `verificarPeticionAdmin`
como primera instrucción — antes de leer el cuerpo o consultar nada, para no
hacer trabajo por encargo de quien no se ha identificado. `verificarPeticionAdmin`
comprueba la sesión firmada y, en POST/PUT/PATCH/DELETE, el token CSRF. La
cookie de sesión es `httpOnly`, `secure` en producción y `sameSite: "strict"`.

**Un agujero encontrado al revisarlo, y no en lo nuevo.** `/api/admin/ingresos`
comprobaba la sesión pero **no el token CSRF**: era la única ruta que dependía
de una sola capa, y escribe en una tabla que no admite correcciones. No era
explotable —con `sameSite: "strict"` el navegador no manda la cookie desde
otro sitio— pero eso deja la seguridad en manos del navegador, y el propio
código dice que no hay que confiar en una sola capa. Igualada al resto.

**Y el motivo por el que no se había visto:** la prueba de acceso directo
llevaba una lista escrita a mano que cubría siete rutas de trece, mientras su
comentario afirmaba cubrirlas todas. Ahora hay dos: la lista, ampliada a todas
y con casos de sesión-sin-CSRF, y `toda-ruta-admin-protegida.test.ts`, que
recorre el directorio y falla el día que se añade una ruta sin guarda, no el
día que alguien se acuerde de mirarlo.

### DNS rebinding: riesgo residual aceptado

**Decisión de la propietaria, 2026-08-31.** La comprobación de enlaces valida
el destino antes de cada petición y en cada redirección, pero entre resolver
el nombre y abrir la conexión el DNS podría devolver otra dirección. Cerrarlo
exige conectar a la IP ya validada con la cabecera Host puesta a mano, y
`fetch` no lo permite.

Se acepta como riesgo residual **para esta función exclusivamente
administrativa**, sobre estas bases:

- solo se alcanza con sesión de administradora válida y token CSRF;
- quien puede llegar a ella ya puede editar enlaces y estados directamente,
  así que no otorga capacidad nueva a nadie que no la tuviera;
- lo que se obtendría es una petición ciega: la respuesta no se devuelve al
  cliente, solo si respondió y con qué código;
- el resto de defensas siguen en pie y cubren el caso corriente.

Si algún día esta comprobación se ofrece fuera del panel —en una API pública,
o disparada por datos que no haya escrito la administradora— **esta aceptación
deja de valer** y hay que cerrarlo con un cliente HTTP que permita fijar la IP.

---

# MOLNIP VISUAL v1 — referencia oficial y obligatoria

**Aprobada por la propietaria el 2026-08-31.** Auditada sobre el commit
`54a2998`, leyendo `app/globals.css` y los 74 componentes del proyecto. No
describe un rediseño: describe el sistema que ya existe en producción, y lo
fija para que no se deshaga sin que nadie se dé cuenta.

Toda pantalla nueva y todo cambio visual se ajusta a esto. Cuando un cambio
contradiga una regla congelada, no es la regla la que ha envejecido: ese
cambio necesita autorización explícita y una línea nueva aquí.

Cada regla sale de contar el código, no de una preferencia. Los recuentos son
la prueba de que ya se cumplen.

## Color

**Paleta de marca propia, no la de Tailwind.** Índigo-violeta con ancla en
`--color-brand-600: #6e5fe4`, y una escala neutra («slate») con matiz violeta
constante que sustituye a la de Tailwind entera, de `#faf9fc` a `#14121f`.

- Fondo `slate-50`, tinta `slate-950`. Nunca blanco puro de página ni negro
  puro de texto.
- **Cero grises de Tailwind**: usos de `gray`/`zinc`/`neutral`/`stone` en 74
  componentes: **0**.
- **El dorado señala «la opción elegida»**, como mucho una vez por pantalla y
  nunca decorativo. Comprobado: **9 usos en 5 ficheros** de todo el proyecto.
- Color por agente: Researcher `#0d9488`, Evaluador `#b45309`, Recomendador
  `#6e5fe4` — comparte el índigo de marca a propósito, porque de cara al
  usuario es la voz de Molnip.

### Dos familias de color con significado, y no se mezclan

Molnip tiene **dos** vocabularios de color con significado, y confundirlos ya
causó un error real: cuatro estados del proceso de afiliación estaban pintados
con los colores de mensaje —«activa» de `exito`, «rechazada» de `error`— como
si fueran lo mismo.

No lo son. Un color de **mensaje** habla de lo que acaba de pasar en la
pantalla y dura un instante. Un color de **estado del proceso** dice en qué
punto está una afiliación y dura semanas. Si algún día el verde de «guardado»
cambia, «activa» no tiene por qué cambiar con él.

#### 1. Colores de mensaje (toda la web)

| Significado | Token | Sale de |
|---|---|---|
| Éxito — algo salió bien, verificado o completado | `exito-*` | escala de `emerald` |
| Atención — pide una decisión, pero nada está roto | `atencion-*` | escala de `amber` |
| Error — algo falló o está bloqueado | `error-*` | escala de `red` |
| Información — contexto neutro, sin juicio | `info-*` | escala de `sky` |

Escala completa 50-950 en `globals.css`. Se escriben por su nombre
(`bg-exito-50`, `text-error-700`), nunca por el de Tailwind.

#### 2. Colores de los estados del proceso de afiliación

Nombre funcional, no técnico. Dos tonos por estado, con un trabajo cada uno:
`fondo` para la píldora y `texto` para lo que va escrito dentro.

| Estado | Qué significa | Tokens | Sale de |
|---|---|---|---|
| Pendiente | Todavía no se ha solicitado el programa | `estado-pendiente-fondo` · `-texto` | `slate-100` · `slate-700` |
| Preparada | Hay borrador de solicitud, falta enviarlo | `estado-preparada-fondo` · `-texto` | `sky-100` · `sky-700` |
| Enviada | Solicitud enviada, esperando respuesta | `estado-enviada-fondo` · `-texto` | `amber-100` · `amber-700` |
| Aprobada | El programa la aceptó; el enlace **aún no se usa** | `estado-aprobada-fondo` · `-texto` | `lime-100` · `lime-800` |
| Activa | En uso: «Ir al proveedor» ya lleva el enlace | `estado-activa-fondo` · `-texto` | `emerald-100` · `emerald-700` |
| Rechazada | El programa no la ha aceptado | `estado-rechazada-fondo` · `-texto` | `red-100` · `red-700` |
| Seguimiento | Enviada hace tiempo y sin respuesta | `estado-seguimiento-fondo` · `-texto` · `-nota` | `orange-100` · `orange-700` · `orange-600` |

«Seguimiento» lleva un tercer tono, `-nota`, porque también se escribe suelto
sobre fondo blanco (los días que lleva estancada, junto a la próxima acción),
donde el tono de la píldora no tendría contraste suficiente.

**Los siete viven en un solo sitio**: `components/admin/estadosAfiliacion.ts`,
junto con su nombre y su explicación. Una prueba falla si un token `estado-*`
aparece en cualquier otro fichero.

#### La regla común

**No se añade un color ni un estado nuevo sin incorporarlo antes a la tabla
que le corresponda.** Un quinto mensaje empieza por la primera tabla; un
octavo estado del proceso, por la segunda. Nunca por un componente.

Cada token declarado lleva escrito de qué tono sale (`/* = amber-700 */`), y
una prueba comprueba que sigue valiendo exactamente eso. Es lo que sostiene la
promesa de que ponerle nombre a un color no cambió ningún color.

## Tipografía

Tres familias con un trabajo cada una:

| Familia | Papel | Pesos |
|---|---|---|
| Bricolage Grotesque | Titulares y logotipo. **Nunca** párrafos ni interfaz | 600, 700, 800 |
| Manrope | Todo lo demás: párrafos, botones, etiquetas, formularios | 400–800 |
| IBM Plex Mono | Cifras alineadas, identificadores, enlaces | 500, 600 |

- De `text-3xl` hacia arriba, **siempre** `font-display`. Titulares grandes sin
  esa familia: **0 de 38**.
- La interfaz vive en `text-sm` (178 usos) y las etiquetas en `text-xs` (75).
  El cuerpo grande es la excepción.
- Peso por defecto de la interfaz: `font-semibold` (150 usos).

## Forma

- Controles `rounded-xl`, superficies que agrupan `rounded-2xl` y
  `rounded-3xl`, píldoras y avatares `rounded-full`.
- Una sola excepción, con nombre propio: **`rounded-codigo`** (4px) para los
  `<code>` en línea dentro de un párrafo. Un chip de una línea con 12px de
  radio se ve como una cápsula y rompe el renglón. Estaba escrito como
  `rounded` a secas, sin nombre y sin regla; ahora es parte del vocabulario,
  con el mismo aspecto exacto.
- Sombra de marca, no gris: doble capa —contacto más elevación— teñida de
  índigo. `shadow-premium` 26 usos, `shadow-premium-lg` 22.
- **Receta única de tarjeta**: `rounded-2xl border border-slate-200/80
  bg-white`, 30 apariciones literalmente iguales.
- El hilo que despega las superficies del fondo es `ring-1 ring-contorno`
  (`--color-contorno`, negro al 2%). Nunca se escribe a mano.

## Botones

Tres variantes y dos tamaños, todos a través del componente `Boton`. No se
componen a mano con clases sueltas.

| Variante | Cuándo | Receta |
|---|---|---|
| Primario | La acción que hace avanzar. Una por pantalla | `bg-brand-600 · text-white · shadow-premium` |
| Secundario | Alternativa legítima a la principal | `border-brand-200 · bg-white · text-brand-700` |
| Fantasma | Navegación y salidas, sin peso visual | `text-brand-600 · hover:bg-brand-50` |

Foco de teclado unificado en `globals.css` para `a`, `button`, `[role=tab]` y
`[tabindex]`: anillo de marca con hueco del color del fondo.

## Cabecera, medidas y responsive

- Cabecera fija arriba, translúcida y desenfocada, con línea inferior
  `slate-200/80`.
- Contenido centrado en `max-w-5xl` con `px-4`, que pasa a `px-6` desde `sm`.
  La prosa larga baja a `max-w-2xl`.
- **Solo dos puntos de ruptura**: `sm` (640px) y `lg` (1024px). Comprobado:
  `sm` 140 usos, `lg` 34, `md` **0**, `xl` **0**.
- En móvil las etiquetas largas se acortan; no se recortan con puntos
  suspensivos ni se dejan desbordar.
- Toda tabla ancha se desplaza dentro de su contenedor. El cuerpo de la página
  **nunca** se desplaza en horizontal.

## Imágenes y movimiento

- Cada imagen declara `width` y `height` explícitos; no se usa `fill`.
  **17 de 17**. Sin medidas, el diseño salta al cargar.
- Solo la imagen del primer pliegue lleva `priority`: **1 uso** en todo el
  proyecto.
- Tres animaciones y ninguna más: entrada en cascada, flotación suave y anillo
  de puntuación. Curva común `cubic-bezier(.16,1,.3,1)`.
- Con `prefers-reduced-motion` las tres se apagan. Una animación nueva entra
  también en ese bloque.

## Tema: solo claro (decisión de la propietaria)

**Molnip tendrá únicamente tema claro en esta etapa.** La ausencia de modo
oscuro es una decisión consciente, no un olvido.

Estado comprobado: clases `dark:` en el proyecto **0**, y ninguna regla
`prefers-color-scheme` en `globals.css`. Queda así registrado para que nadie
lo tome por un descuido y lo «arregle» a medias: añadir modo oscuro obligaría
a rehacer la escala neutra completa y sería un sprint entero, no un retoque.

## Las cinco líneas congeladas

No se cruzan sin autorización expresa:

1. **La paleta**: el índigo propio, la neutra violeta y el dorado de «opción
   elegida». Ningún color de marca nuevo.
2. **Las tres familias tipográficas y sus papeles.** Display solo en titulares.
3. **Los dos puntos de ruptura**, `sm` y `lg`.
4. **Las tres variantes de botón**, todas a través del componente `Boton`.
5. **La receta única de tarjeta** y el foco de teclado unificado.

Todo lo demás —tamaños concretos, huecos, disposiciones— es criterio dentro
del sistema, no una decisión nueva.

## Las cuatro correcciones — aplicadas el 2026-08-31

Autorizadas como sprint propio y pequeño, sin rediseñar pantallas ni tocar
ninguna regla congelada.

| # | Qué era | Qué es ahora | Cuánto se ve |
|---|---|---|---|
| 1 | `rounded-lg` en 6 controles, frente a 79 `rounded-xl` | `rounded-xl` | Radio de 8px a 12px en 6 elementos pequeños |
| 2 | `ring-1 ring-black/[0.02]` copiado 26 veces, una de ellas desviada a `[0.03]` | `ring-1 ring-contorno` | Nada, salvo la copia desviada: pasa de 3% a 2% de negro |
| 3 | `shadow-xl` en el modal «Gestionar» | `shadow-premium-lg` | El halo del modal deja de ser gris y pasa al índigo de marca |
| 4 | emerald/amber/red/sky escritos a pelo en 118 sitios | `exito`/`atencion`/`error`/`info` | Nada: mismos valores exactos |
| 4b | Los 7 estados del proceso, con clases sueltas y repartidas | `estado-*`, centralizados en un módulo | Nada: mismos valores exactos |

**Rectificación sobre el punto 3.** La tabla anterior decía «`shadow-xl` y
`shadow-2xl`, 1 uso cada una». Era un error de la auditoría: no existe ninguna
`shadow-2xl` en el proyecto. Lo que hay es `drop-shadow-2xl` en la fotografía
de la portada, que es un filtro sobre una imagen, no una sombra de caja, y ahí
está bien puesto. No se ha tocado.

### Cómo se comprobó que no cambió nada más

Se levantaron las dos versiones a la vez —producción (`54a2998`) y la
corregida— y se compararon en un navegador real, en escritorio (1280px) y en
móvil (Pixel 5):

- **5.434 elementos** comparados por estilo calculado en 14 pantallas más el
  modal, en escritorio y en móvil. Difieren 274, y cada uno por una de las
  correcciones: 183 son la «X» de «Desventajas» (solo `color`, y lo que
  hereda de él en el SVG); 18, el radio de 8px a 12px; 67, el anillo (mismo
  color, otra notación del navegador); 1, el anillo desviado del 3% al 2%; 1,
  la sombra del modal. **Ninguna propiedad de tamaño ni de posición cambió en
  ningún elemento.**
- **32 capturas** comparadas píxel a píxel. 14 idénticas; el resto solo
  cambia en las zonas de esas cuatro correcciones. Dos capturas de la misma
  versión dan 0 píxeles de diferencia, así que el método no tiene ruido.
- Cada línea modificada de los 27 componentes se reprodujo a partir de la
  versión antigua aplicando solo los renombrados: **ninguna línea cambió por
  otro motivo**.
- 948 pruebas unitarias y 53 de navegador (escritorio y móvil) en verde.

### Las dos pruebas que impiden la reincidencia

`components/__tests__/vocabularioVisual.test.ts`:

- **Radios**: falla si aparece un radio que no sea `xl`, `2xl`, `3xl` o
  `full` (con cualquier lado).
- **Colores**: falla si aparece un color con escala numérica que
  `globals.css` no declare. No lleva lista de colores prohibidos: lee los que
  el sistema declara. Para usar un color nuevo hay que empezar por definirlo,
  que es justo el paso que obliga a decidir qué significa.
- **Equivalencias**: cada token dice de qué tono sale; falla si el valor deja
  de coincidir con ese tono. Es lo que impide que alguien cambie un color
  «sin querer» al editar el sistema.
- **Estados del proceso**: falla si un token `estado-*` aparece fuera del
  módulo central, si un estado no tiene su par de tonos declarado, o si el
  módulo tiene un estado de más o de menos frente a los siete de la tabla.

### Lo que las pruebas destaparon: cerrado del todo

La auditoría contó los `rounded-lg` pero no el `rounded` a secas, y contó
emerald/amber/red/sky pero no rose, lime ni orange. Cada hallazgo se resolvió
**por su significado**, uno a uno, nunca en bloque.

| Dónde | Qué era | Qué es | ¿Cambia el tono? |
|---|---|---|---|
| `PanelAfiliacion.tsx` | `lime` para «aprobada», `orange` para «seguimiento» y para los días estancada | Tokens `estado-*` con nombre funcional | No |
| `cookies`, `DocumentoLegal` | `rounded` a secas en `<code>` en línea | `rounded-codigo`, en el vocabulario | No |
| `FormularioSuscripcion` | `rose-600` en el aviso de error | `error-600` | Sí — es un error de verdad |
| `test-imagen`, `test-investigador` | `rose-50/700` en el mensaje de error | `error-50/700` | Sí — son errores de verdad |
| `TarjetaHerramientaRecomendada`, ficha de herramienta | `rose-400` en la «X» de «Desventajas» | `error-400` | Sí — `#ff637e` → `#ff6467` |

**No queda ninguna desviación.** Las dos listas de excepciones de la prueba
están vacías, y una comprobación nueva falla si alguien vuelve a llenarlas:
ya no son un sitio donde apuntar una excepción para que las demás pruebas
pasen, son la afirmación de que no hay ninguna.

#### Sobre la «X» de «Desventajas»

Conviene dejar escrito qué es, porque su nombre engaña: **no es un botón de
cerrar**. Es un icono decorativo (`aria-hidden`) que marca cada línea de la
lista «Desventajas», emparejado con el `Check` verde que marca cada línea de
«Ventajas». Es la mitad de un par ventaja/desventaja.

Se decidió unificarla con `error-400` en vez de apagarla a un gris neutro —
que habría roto el par, dejando un lado marcado con color y el otro no— y en
vez de darle un token propio con el valor de hoy, que habría sido crear un
segundo rojo de marca. Cambia el tono: `#ff637e` → `#ff6467`. Se mantienen su
función, su tamaño (`h-3.5 w-3.5`) y su sitio.

## Dónde vive la referencia visual

La versión ilustrada —con las rampas de color, los especímenes tipográficos y
los botones reales— está publicada como página aparte y se construye con el
propio sistema que documenta, de modo que si algo del sistema está mal, se ve
en la propia página.
