# ATLAS

## Qué es

Atlas es un asesor inteligente que ayuda a las empresas a elegir la mejor tecnología para crecer.

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

**Registrada:** 2026-08-03. Visión completa del sistema, definida por el
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
2. ⭐ **Atlas Evaluador** — ya construido, bajo el nombre técnico "Atlas
   Advisor Capa 1" (`agents/atlas-advisor/`): motor determinista de 10
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

## Pendiente antes de producción

Tareas operativas, no de arquitectura — nada que implementar, solo
configurar antes de lanzar. Ninguna se ha resuelto con un valor inventado
en el código; todas quedan aquí para no olvidarlas.

### Dominio real del sitio

**Registrada:** 2026-08-03 (Atlas Generador de Contenido, sitemap dinámico).

`app/sitemap.ts` y `app/robots.ts` necesitan URLs absolutas. Hasta que el
dominio de producción esté decidido, `lib/urlBase.ts` usa
`NEXT_PUBLIC_SITE_URL` con `http://localhost:3000` como valor de
repuesto — nunca un dominio hardcodeado. Antes de lanzar Atlas de verdad:
configurar `NEXT_PUBLIC_SITE_URL` con el dominio real en el entorno de
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
