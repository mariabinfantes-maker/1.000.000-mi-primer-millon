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

### Capa 2 de Atlas Advisor: explicación personalizada asistida por IA

**Registrada:** 2026-08-03 · **Estado:** pospuesta, no implementar todavía.

Atlas Advisor (`agents/atlas-advisor/`) nace con una Capa 1 determinista y sin
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

### Atlas Affiliate Manager: piezas dejadas fuera de esta fase

**Registrada:** 2026-08-03 · **Estado:** arquitectura aprobada, construcción en curso.

Siguiente agente tras el Researcher y el Advisor: cierra el circuito entre
"tenemos un programa de afiliados aprobado" y "el enlace real está en
producción". `EstrategiaAfiliacion` (`data/esquemaInterno.ts`) se migró al
modelo `{ herramientaId, cuentas: CuentaAfiliado[] }`, cada cuenta con sus
propios `enlaces: EnlaceAfiliado[]` por país/idioma — pensado desde el
principio para varias cuentas por plataforma, varios enlaces por segmento, y
para crecer a cientos o miles de herramientas sin rediseño.

Quedan fuera de esta fase, a propósito:

- **Redacción asistida por IA de solicitudes de afiliación**: enviar
  información de negocio real a plataformas externas no debe automatizarse
  sin una decisión explícita y posterior a esta.
- **Integración con APIs de redes de afiliados** (comprobar el estado de una
  solicitud automáticamente): depende de qué plataformas se usen realmente;
  prematuro con el tamaño actual del catálogo.
- **Analítica de clics/conversión real** (territorio del futuro agente
  Growth): no tiene sentido sin tráfico real que medir.
