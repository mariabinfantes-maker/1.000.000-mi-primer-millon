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
3. 🎯 **Atlas Recomendador** — diseño aprobado, sin construir. Es la "Capa 2
   de Atlas Advisor" documentada más abajo: explicación personalizada
   asistida por IA sobre el ranking que ya calculó Evaluador — nunca decide
   el ranking, solo lo explica.
4. 💰 **Atlas Affiliate Manager** — completado. Cierra el circuito entre
   "programa de afiliados aprobado" e "ingresos reales" (`agents/atlas-affiliate-manager/`).
5. 📈 **Atlas Growth** — sin diseñar. Necesita tráfico real y eventos de
   clic/conversión que medir; probablemente no aporta valor hasta que
   Generador de Contenido exista y genere ese tráfico.
6. ✍️ **Atlas Generador de Contenido** — sin diseñar. Genera contenido para
   atraer tráfico orgánico; es lo que le da a Growth algo que medir.
7. 💬 **Atlas Assistant** — sin diseñar. Previsiblemente una interfaz
   conversacional que reutiliza la salida de Evaluador/Recomendador, como
   alternativa al cuestionario estructurado.
8. 🔧 **Atlas Mantenimiento** — sin diseñar. Mantiene el catálogo fresco con
   el tiempo (re-investigar herramientas ya promovidas, revisar estado de
   programas de afiliados) — previsiblemente reutiliza piezas del Researcher
   y del Affiliate Manager, pero en modo recurrente/programado en vez de
   alta única.
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

### Capa 2 de Atlas Advisor: explicación personalizada asistida por IA (= Atlas Recomendador)

**Registrada:** 2026-08-03 · **Estado:** pospuesta, no implementar todavía.

Esta es la pieza que la hoja de ruta llama "Atlas Recomendador" — mismo
agente, dos nombres (uno técnico, uno de producto). Atlas Advisor
(`agents/atlas-advisor/`) nace con una Capa 1 determinista y sin
coste: el motor de criterios calcula el ranking y una explicación de
plantilla, tal como ya hacía `lib/recommendationEngine/`. Esa capa se
implementa ya.

Una Capa 2 opcional, futura y con coste (llamadas a un proveedor de IA), está
aprobada en principio pero pospuesta: reescribir en prosa la explicación del
ranking ya calculado. Cuando se implemente, debe cumplir este principio sin
excepción:

- La IA **nunca** decide ni modifica el ranking — solo redacta una explicación
  sobre el resultado que ya calculó el motor determinista.
- La explicación **nunca** puede ser genérica. Debe usar el contexto concreto
  de ese usuario (sector, tamaño de negocio, presupuesto, necesidades, nivel
  técnico, etc., según lo recogido en `RespuestasUsuario`) para justificar por
  qué esa herramienta ocupa esa posición **para ese caso específico** — no una
  descripción intercambiable entre usuarios distintos.
- Si la llamada a la IA falla o no está activada, el sistema debe mostrar
  siempre la explicación determinista de la Capa 1 como respaldo. El usuario
  nunca debe quedarse sin explicación.

No adelantar esta implementación hasta que la Capa 1 esté construida, probada
y aprobada, y se decida explícitamente destinar presupuesto a esta capa.

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
