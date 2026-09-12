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

## La visión de Molnip (dictada por la propietaria el 2026-09-03)

Esta sección **manda sobre el resto del documento**. Cuando una decisión futura
pueda ir en dos direcciones, se elige la que cumple esto. Y si algo de lo que ya
existe la contradice, es lo existente lo que está pendiente de corregir, no la
visión lo que hay que ajustar.

Va primero en palabras de la propietaria, sin editar. Lo que viene después es
lectura operativa y puede refinarse; el texto de arriba, no.

### La visión, literal

> Molnip no es un directorio ni un comparador de programas. Es un asesor
> tecnológico cercano, capaz de ayudar tanto a una persona autónoma que solo
> sabe explicar su problema con palabras sencillas como a una empresa que conoce
> exactamente lo que necesita.
>
> La persona no debe saber qué software buscar. Puede decir «soy peluquera y
> pierdo citas» o «estoy empezando a crear vídeos», y Molnip debe entender su
> situación, descubrirle soluciones que quizá no sabía que existían y
> explicárselas sin lenguaje técnico. Si no entiende o no tiene una solución
> adecuada, debe decirlo y nunca recomendar por rellenar tres espacios.
>
> Las recomendaciones deben ser funcionalmente compatibles, verificadas con
> fuentes reales y ordenadas por el encaje con la persona: tamaño, precio,
> idioma, facilidad y necesidades. La afiliación nunca puede alterar el
> resultado.
>
> Molnip debe sentirse como una gran empresa tecnológica: sólida, premium,
> rigurosa y capaz de crecer en diferentes ramas, pero siempre humana y cercana.
> Sencilla para quien empieza y profunda para quien sabe más.
>
> Su imagen y toda la experiencia deben transmitir la solidez, la escala y la
> ambición de una gran empresa tecnológica global, sin perder nunca la cercanía
> humana.

### Las seis exigencias que se derivan de ella

1. **La carga de entender es de Molnip, no de la persona.** «Soy peluquera y
   pierdo citas» es una entrada válida y completa. Que alguien no conozca la
   palabra «CRM» no es un problema suyo que deba resolver antes de entrar.
2. **Descubrir, no sólo responder.** Enseñarle lo que no sabía que existía. Eso
   obliga a saber qué necesita típicamente un oficio, no sólo a interpretar la
   frase que escribió.
3. **Explicar sin lenguaje técnico.** La explicación es parte de la
   recomendación, no un adorno. Si sólo la entiende quien ya sabía, no ha
   servido.
4. **Decir que no es un resultado legítimo.** No entender, y no tener solución
   adecuada, son respuestas válidas. **Tres es la consecuencia de que haya tres
   buenas, nunca un objetivo.**
5. **Compatibilidad funcional primero; encaje después.** Primero que sirva para
   lo que necesita, verificado contra fuentes reales; después el orden por
   tamaño, precio, idioma, facilidad y necesidades. Lo segundo sin lo primero es
   exactamente lo que respondió Grammarly a una peluquera que perdía citas.
6. **La afiliación no altera el resultado.** No «se procura que no influya»: no
   puede.

### Lo que esta visión descarta

Se entiende mejor por lo que prohíbe:

- Recomendar algo plausible cuando no se ha entendido la necesidad.
- Rellenar hasta tres cuando sólo hay una que valga.
- Afirmar una capacidad sin fuente que la sostenga.
- Pedirle a la persona que hable nuestro idioma para poder ayudarla.
- Que un programa suba porque paga mejor.
- Ser sencillo a costa de volverse superficial, o riguroso a costa de volverse
  frío.

### Qué exige de lo que hoy existe

La visión no describe el producto actual: describe el que debe ser. Estas son
las distancias conocidas al 2026-09-03, y ninguna es un fallo oculto — están
todas medidas y anotadas en este documento:

| Exigencia | Estado hoy |
|---|---|
| Decir que no cuando no se entiende | **Cumplido** — Bloque 1, en producción |
| Compatibilidad funcional antes que encaje | **Diseñado, no conectado** — el vocabulario (F1) está en producción y no lo lee nadie; conectarlo es F3 |
| Verificadas con fuentes reales | **No cumplido** — las 62 fichas no se verificaron contra fuentes primarias. Es F2, hoy parada por falta de acceso a las fuentes |
| Descubrir lo que no sabía que existía | **Diseñado, no construido** — es la relación actividad→necesidad del vocabulario |
| Entrar sin saber qué buscar | **Parcial** — la puerta de texto libre existe, pero la interfaz sigue pidiendo elegir categoría y subtipo, que es lenguaje de producto |
| La afiliación no altera el resultado | **Cumplido y protegido** — Advisor nunca ve datos de afiliación |
| Sólida y premium | **Parcial** — la identidad visual está definida (Molnip Visual v1), pero todavía debe transmitir plenamente la escala y ambición de una gran tecnológica global |

### Una tensión que conviene tener presente

«Sencilla al entrar» y «verificada con fuentes reales» tiran en direcciones
opuestas en el tiempo: lo primero se nota enseguida, lo segundo cuesta meses y
no se ve.

**La visión da prioridad a no mentir.** Es preferible que Molnip diga «todavía no
tenemos herramientas para esto» a que dé una respuesta bonita y falsa.

## Política de catálogo y afiliación — PROVISIONAL (2026-09-03)

**Provisional a propósito.** Se escribe mientras se termina de definir la
visión monetaria, y **se revisará cuando terminemos de definir la visión
monetaria o cuando la evidencia real demuestre que necesita cambiar**. No se
condiciona la revisión a que exista ya una segunda fuente de ingresos. Hasta
entonces, manda esto.

Resuelve una tensión real entre dos principios que hasta hoy convivían sin
resolverse: *«el mejor encaje para su negocio tiene prioridad absoluta»* y
*«toda herramienta incorporada debe tener un programa de afiliados fiable»*.
Aplicadas a la vez, podían dejar a una persona sin la mejor solución para su
problema porque esa solución no pagaba comisión.

### El catálogo está vivo

- **Debe crecer continuamente** según las necesidades reales de autónomos,
  pequeñas empresas y otros negocios. No es una colección que se completa: es
  un catálogo que sigue a la demanda.
- **Las 62 herramientas actuales son sólo la base que verifica F2**, no el
  límite presente ni futuro. Cualquier recuento que aparezca en este documento
  describe un momento, nunca un tope.

### Nunca un callejón sin salida

- **Molnip nunca deja al cliente sin opciones ni lo conduce a un callejón sin
  salida.**
- Si el catálogo verificado **de ese momento** no cubre una necesidad,
  **Researcher investiga alternativas nuevas, con o sin afiliación**.
- La búsqueda **prioriza el beneficio real del cliente**, y sólo después
  estudia una forma sostenible de beneficiar también a Molnip y al proveedor.
  Ese orden no se invierte.

### Qué se ofrece, y qué no

- **Molnip nunca rellena tres puestos con herramientas incompatibles.**
- Si existen **una o dos** herramientas válidas, ofrece esas y **explica
  honestamente por qué no presenta tres**.
- Si **no existe ninguna solución directa**, sigue buscando caminos útiles
  **sin presentarlos falsamente como recomendaciones equivalentes**.

### Herramientas sin afiliación

**No se eleva cualquier herramienta a valoración.** Sólo se presenta cuando se
cumpla **al menos una** de estas condiciones:

- **Cubre, con evidencia verificable, una necesidad que el catálogo afiliado no
  cubre.**
- **Aunque existan alternativas afiliadas, demuestra con evidencia comparable
  una ventaja material para el cliente.**

**La fama, el tamaño, el marketing, la cantidad total de funciones o una ficha
más extensa no demuestran esa ventaja.**

**Si una alternativa afiliada cubre la necesidad igual de bien, se mantiene la
regla habitual y la herramienta sin afiliación no se eleva.**

Cuando sí se cumple al menos una de ellas, se presenta para valoración
acompañada de su utilidad, sus alternativas y las posibilidades de
monetización. **La decisión de incorporarla es de la propietaria.** Ni
Researcher ni Curator la toman por su cuenta.

### Qué se conserva de la regla anterior

- **La afiliación habitual se mantiene** mientras se termina la visión
  monetaria. Sigue siendo la vía normal de incorporación.
- Pero **nunca convierte una herramienta incompatible en recomendación.** Que
  pague comisión no la hace apta; que no pague no la hace inservible.

### Qué cambia respecto a lo que había

| | Antes | Ahora |
|---|---|---|
| Herramienta sin afiliación | Descartada automáticamente por Researcher | Se presenta a la propietaria **sólo si cubre un hueco o demuestra ventaja material**; si no, se mantiene la regla habitual |
| Hueco en el catálogo | Se anotaba y se esperaba | Researcher investiga alternativas, con o sin afiliación |
| Menos de tres opciones válidas | Se completaba con lo mejor disponible | Se ofrecen las que haya y se explica por qué no hay tres |
| El catálogo | 62 herramientas, una cifra estable | Una base de partida que debe crecer |

**Consecuencia técnica pendiente:** `tieneProgramaDeAfiliadosFiable()` en
`agents/atlas-researcher/agente.ts` descarta hoy la herramienta sin más. Con
esta política, ese descarte debería pasar a ser una **derivación a la
propietaria**, no un rechazo. No se toca todavía: queda anotado como trabajo
por autorizar, y esta política es documental hasta entonces.

> **Resuelto el 2026-09-12**, ver «El Researcher deja de descartar por
> afiliación» al final de este documento. La política deja de ser sólo
> documental: el código ya deriva en vez de rechazar.

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
explícita antes de tocar el catálogo real.

> **Corregido el 2026-09-12.** Esta sección decía que las descartadas por el
> prechequeo de afiliados «no se presentan como candidatas, solo se reportan
> de forma transparente». Eso contradecía la política de «Herramientas sin
> afiliación» igual que la hacía el código, y no estaba anotado en ningún
> pendiente. Ya no hay descarte por afiliación: el prechequeo las deja en
> `pendiente_de_decision` y **sí se presentan a la propietaria**.

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
## El sprint de asistentes de IA y los subtipos navegables (2026-09-02)

Cuatro de los seis subtipos de «IA y productividad» estaban por debajo de
`MINIMO_POR_SUBTIPO = 3`, así que el motor devolvía menos de tres opciones.
Presentaciones y espacio de trabajo devolvían **una sola herramienta**: eso no
es una comparación, es un anuncio.

Seis fichas nuevas, aprobadas una a una: HeyGen (96), Todoist (94), Canva (98),
Beautiful.ai (83), Taskade (92) y ClickUp Brain (91). Cinco de las seis salieron
de reutilizar herramientas que ya estaban en el catálogo en otra categoría, no
de investigar de cero.

Después, los subtipos dejaron de ser invisibles: un selector accesible en
`/categoria/asistentes-ia` y **seis páginas indexables**, una por subtipo, con
contenido editorial propio —eje de decisión, cómo elegir, error habitual— en vez
de seis páginas iguales cambiando una palabra. El subtipo elegido viaja hasta el
motor validado contra la taxonomía, no como texto libre en la URL.

Commits `a86e774` y `9706786`.

## Molnip aprende a decir que no (2026-09-02)

**El fallo, encontrado por la propietaria probando en producción como una
usuaria cualquiera:**

> «Soy peluquera. Tengo entre 1 y 10 empleados. Estoy perdiendo citas.»
> → **Grammarly, 100/100.** Después Canva y Reclaim.ai.

Ninguna de las tres gestiona citas.

La causa no era una puntuación mal calculada. Era que `seleccionarCandidatas`,
cuando la detección determinista no entendía la frase, **devolvía el catálogo
entero** «para no dejar al usuario sin recomendación». A partir de ahí el motor
puntuaba las 62 herramientas por tamaño, precio, facilidad e idioma —criterios
que nunca preguntan si la herramienta sirve para algo— y ganaba la que mejor
encajaba en el perfil. Grammarly encaja perfectamente con una autónoma
hispanohablante de presupuesto ajustado. Lo único que no hace es dar citas.

Preferir una respuesta mala a ninguna respuesta era la decisión equivocada: una
recomendación falsa destruye la confianza que el resto del producto tarda meses
en construir.

Ahora el motor puede decir que no, y decir por qué:

| Motivo | Cuándo | Qué ve la persona |
|---|---|---|
| `necesidad_no_entendida` | No se pudo determinar qué necesita | «No he sabido entender qué necesitas» |
| `sin_cobertura` | Se entendió el objetivo, pero el catálogo no lo cubre | «Todavía no tenemos herramientas para esto» |

Dos decisiones de tono, deliberadas: **la culpa es nuestra, nunca de quien
pregunta** —«no he sabido entender», no «no has escrito bien»—, y **nunca se
queda en un callejón sin salida**: siempre hay camino hacia las categorías, que
son la vía experta y sí funcionan.

19 pruebas de regresión y 8 de extremo a extremo. Commit `a79b8e3`.

## La puntuación guardada que contradecía a la mostrada (2026-09-02)

Las seis fichas del sprint tenían `analisisAtlas.puntuacion: 0` y
`motivosPuntuacion: []` guardados. El borrador se escribió con esos campos a
cero esperando que la promoción los recalculara, y `promover.ts` no lo hace:
calcula la puntuación para decidir si supera el umbral de calidad, pero copia la
ficha tal cual.

No llegó a verse desde fuera —la tarjeta recalcula al vuelo, así que se veía 98—
ni afectó al orden de las recomendaciones: el motor sólo lee
`nivelTecnicoRecomendado` y `tipoNegocioIdeal` de `analisisAtlas`, nunca la
puntuación. **Pero un dato guardado que contradice al que se muestra es una
trampa esperando a que alguien confíe en él.**

61 pruebas que recorren todo el catálogo comparando lo guardado con lo
recalculado. De paso quedó fijada una lista que no puede crecer en silencio:
`bitrix24`, `gohighlevel`, `hubspot`, `odoo` y `zoho-one` **no tienen
`analisisAtlas` en absoluto** — entraron sin pasar por un borrador de Researcher.
Queda anotado como bloque independiente, sin corregir.

Commit `029caa1`.

## F1: el vocabulario de capacidades, en producción (2026-09-03)

Molnip tenía dos conceptos para describir el mundo —categoría y problema— y
**ninguno decía qué sabe hacer un programa**. Esa es la raíz del caso de la
peluquera, no un error de puntuación.

F1 añade el concepto que faltaba: la **capacidad**. Lo que un programa sabe
hacer, estable en el tiempo, distinto de una necesidad («pierdo citas»), de un
proceso («cómo doy hora») y de una restricción («en español»).

**146 capacidades · 23 dominios · 5 áreas · 8 restricciones.** Cada capacidad
con su definición y —lo que de verdad sostiene el vocabulario— con su frontera
escrita: con qué se confunde y por qué no es eso.

Decisiones que se materializaron aquí:

- **Los identificadores no llevan el dominio dentro.** Un prefijo de dominio es
  una jerarquía metida en un nombre permanente y antes o después miente: pasó
  con `hr.training_lms`, que nació en «Personas y equipo» y hoy vive en
  «Formación y alumnado». La ubicación va en `dominioId`, que sí puede cambiar.
  El identificador es un nombre, no una dirección.
- **Seis reglas de identificador comprobadas automáticamente**, no confiadas a
  la buena intención de quien añada la siguiente capacidad.
- **`requiere` entre capacidades**: un widget de reserva sin motor detrás no
  reserva nada.
- **Las restricciones salen de dentro de las capacidades.** Duras las que
  excluyen, blandas las que puntúan, y **`dura_condicional`** para las que sólo
  aplican cuando alguien las exige — `req.data_residency_eu` y
  `req.esignature_qualified`.
- **Las menciones de términos reservados se declaran, no se deducen.** Se
  intentó deducirlas de la redacción y siempre quedaba una rendija; ahora una
  capacidad que necesita nombrar un término ajeno declara cuál y a quién se lo
  atribuye, y eso se revisa en el diff.

**Nadie lo lee todavía.** El motor, las fichas y la interfaz siguen igual, y hay
una prueba que falla el día que alguien lo importe sin querer. Que el motor
filtre por capacidad es F3, y exige simular antes todas las rutas actuales.

Tres revisiones —dos independientes— encontraron defectos reales en las guardas,
todos corregidos antes de fusionar. Las dos condiciones que quedaban pendientes
están escritas en **`data/vocabulario/CONDICIONES-PARA-F3.md`**.

Commits `b118ea1`, `a0f0d35`, `5a8445c` y `cd45c01`. 276 pruebas.

## De dónde salieron de verdad las 62 fichas (descubierto el 2026-09-03)

Esto no estaba escrito en ninguna parte y explica dos meses de trabajo posterior.

**Las 62 fichas del catálogo no se verificaron contra fuentes primarias.** No
es que esa verificación se perdiera: **nunca llegó a hacerse.**

Dicho así a secas se entiende mal, porque **sí pasaron una validación
estructural, y era exigente**. Lo que faltó fue contrastar lo que dicen con la
fuente que lo demuestra. Son dos cosas distintas y el resto de la sección
separa una de otra.

### La puerta que sí existía, y era exigente

Nada llegó al catálogo sin pasar por `promover.ts`, y ahí había cinco cerrojos:

| | Comprobación | Qué exigía |
|---|---|---|
| 1 | `calcularPuntuacionAtlas()` | Puntuación Molnip **≥ 80/100** |
| 2 | `detectarCasiDuplicados()` — **de Atlas Curator** | Que no fuera otra herramienta ya presente |
| 3 | `tieneProgramaDeAfiliadosFiable()` | Programa activo y confianza no baja |
| 4 | `evaluarCriteriosDeCalidad()` | Confianza, advertencias y campos completos |
| 5 | **Aprobación explícita de la propietaria** | Informe leído y decisión firmada |

Y no era un trámite. El historial guarda **46 decisiones: 44 aceptadas y 2
bloqueadas por Curator** — Zoho CRM y Zoho Projects, por compartir dominio con
Zoho One. Los dos bloqueos se levantaron después, pero **por decisión escrita de
la propietaria** («Aprobada por el CEO tras revisión del informe completo del
lote»), no por omisión. El mecanismo funcionó: detectó, avisó y esperó.

Curator estaba dentro de esa puerta, aunque nunca usó IA: `promover.ts` importa
`detectarCasiDuplicados` directamente de él.

### Lo que esa puerta no podía comprobar

Researcher obtuvo las fichas pidiéndoselas a Gemini, en local, con llamadas
reales (el límite de 5 peticiones por minuto del nivel gratuito se descubrió
ejecutando el primer lote). Pero el adaptador
—`agents/compartido/proveedores/gemini.ts`— **envía únicamente `contents` y
`generationConfig`**: no lleva `google_search`, ni grounding, ni `url_context`.

**Conectarse a la API de Gemini no es que Gemini navegue. Contestaba desde lo
que sabía, no desde lo que leía.**

El prompt sí pedía `"fuentes": ["URL de cada fuente que hayas usado"]`, y el
validador calcula la confianza a partir de **cuántas** URLs devuelve, no de
comprobar ninguna. Y esas fuentes no llegaron al catálogo:

```
campos del esquema de ficha:  paginaOficial, urlPrecios, metodologiaValoracion...
fichas con campo `fuentes`:   0 de 62
```

Frases como «agregación de miles de opiniones verificadas en plataformas como G2
y Capterra» en `metodologiaValoracion` son **afirmaciones del modelo**, no citas
rastreables.

### La frase que lo resume

> **El filtro medía calidad, no veracidad. Una invención coherente lo pasaba
> entero.**

Las cinco comprobaciones miran si la ficha está bien hecha: si puntúa alto, si no
duplica, si tiene programa de afiliados, si no le faltan campos. **Ninguna puede
distinguir una ficha bien redactada y cierta de una bien redactada y falsa.**

No faltó rigor. Faltó una capacidad que el sistema nunca tuvo: **abrir la fuente
y leerla.** Nadie lo echó en falta porque no había hueco donde se notara — al no
guardarse las fuentes, no quedaba nada que revisar después.

Dos consecuencias que conviene no olvidar:

1. **Curator nunca validó nada contra una fuente externa.** Sus siete módulos son
   deterministas y sin IA: comprueban que los datos encajen entre sí, no que sean
   ciertos. Curator dice qué falta; nunca dice si lo que hay es verdad.
2. **`paginaOficial` es una portada en muchas fichas** y no demuestra ninguna
   función ni ningún precio. La URL que sirve como evidencia es `urlPrecios`.
   Las 62 tienen ambas.

Esto es exactamente lo que F2 viene a arreglar, y por eso F2 no puede apoyarse en
el mecanismo que creó el problema.

## Qué alcanza cada entorno (comprobado el 2026-09-03)

Comprobado, no supuesto, porque condiciona qué se puede hacer desde dónde:

| | Sesión remota en la nube | Local |
|---|---|---|
| Páginas de fabricantes (`pipedrive.com`, `asana.com`, …) | **Bloqueadas** — `connect_rejected`, 403 a CONNECT | Sin comprobar |
| API de Gemini (`generativelanguage.googleapis.com`) | **Alcanzable** — responde Google, no el proxy | Sin comprobar |
| Documentación de Google (`ai.google.dev`) | **Bloqueada** | Sin comprobar |
| `GEMINI_API_KEY` | **Ausente** | Presente, según la propietaria |
| Búsqueda web | Funciona, pero devuelve **fuentes secundarias** | — |

`ATLAS.md` ya decía que la clave «hasta ahora solo se ha usado en local, para los
lotes de Researcher». Sigue siendo cierto: **no está configurada en Vercel**, o
al menos no hay forma de comprobarlo desde el repositorio.

## F2: parada antes de verificar, y por qué (2026-09-03)

F2 verifica las 62 herramientas contra el vocabulario de F1. **Está parada antes
de verificar la primera**, por decisión consciente y no por un fallo.

Lo que sí quedó hecho, en la rama `claude/atlas-advisor-mvp-4e854s` (commit
`b097820`, **sin fusionar**):

- **Las dos condiciones obligatorias de `CONDICIONES-PARA-F3.md`, cerradas.**
  `normalizar` ya colapsa espacios —antes un doble espacio tecleado por descuido
  apagaba la guarda de un término— y las declaraciones duplicadas se rechazan en
  cualquier orden, validándose todas y no sólo la primera.
- **El esquema de los registros de verificación**, con tres ideas que existen
  para evitar errores ya cometidos: *no saber no es no tener* (`desconocido` es
  un resultado legítimo); *la selección de capacidades plausibles se congela
  antes* de verificar, con su criterio escrito, para que no se estreche donde la
  evidencia incomoda; y *la afiliación no entra* — hay una prueba que comprueba
  que este módulo no la importe.
- **El plan de lotes**: 30 herramientas de rutas que hoy funcionan, 18
  asistentes de IA, 14 suites. Las 62, cada una una sola vez.

**Por qué se paró:** verificar exige páginas oficiales, y desde la sesión remota
están bloqueadas. Lo único disponible es búsqueda web, que devuelve blogs y
comparativas — y por regla explícita de la propietaria, **una fuente secundaria
nunca da confianza alta**. Hacerlo igualmente produciría registros con fecha y
URL que *parecerían* verificados sin serlo: exactamente el problema que F2
existe para resolver.

La vía que queda por probar es **URL Context de Gemini**: se le pasa la URL
oficial que ya tenemos y la lee, con la descarga del lado de Google. Requiere la
clave, que sólo existe en local. Prueba pendiente con Pipedrive.

Una guarda de F1 hubo que ampliarla: la verificación necesita leer el vocabulario
para comprobar que cada capacidad citada exista. La autorización se amplió sólo a
`data/verificacion`, con la lista fijada por una prueba. Lo que ve la gente
—motor, interfaz, fichas— sigue sin poder leerlo.

## Esto es una sola sesión (anotado el 2026-09-03)

Dato que conviene tener presente al leer los commits: **97 de los 98 commits
firmados de Molnip llevan el mismo identificador de sesión.** Este proyecto no
ha pasado por muchas manos — es prácticamente una única conversación abierta
desde el 3 de julio.

Lo que sí cambió fue el modelo: empezó **Claude Sonnet 5** (61 commits) y
continuó **Claude Opus 5** (37). Por eso hay dos firmas distintas sin que haya
dos proyectos.

**Consecuencia práctica:** una sesión larga no recuerda su propio principio —lo
antiguo se comprime en un resumen—, así que puede no reconocer trabajo que ella
misma hizo semanas antes. Los commits y este documento no tienen ese problema, y
por eso **valen más que la memoria de la sesión**. Mantener ATLAS.md al día no es
burocracia: es lo único que sobrevive.


## Gemini sí puede leer la fuente oficial (probado el 2026-09-07)

La prueba que faltaba para desbloquear F2 se hizo de verdad, contra la API real,
desde el ordenador de la propietaria. **Dos llamadas, dos resultados.**

**Página real.** `https://www.pipedrive.com/es/pricing`, con la herramienta
`url_context` activada. Estado devuelto: `URL_RETRIEVAL_STATUS_SUCCESS`.
Respuesta: plan **Lite**, **US$14 por puesto/mes con facturación anual**, con
tres citas literales de la página.

**Página inexistente.** `https://www.pipedrive.com/es/precios-historicos-2019-archivo`,
mismo dominio, misma pregunta. Estado: `URL_RETRIEVAL_STATUS_ERROR`. Respuesta:
**`NO PUEDO LEERLA.`**

La segunda es la que importa. Gemini conoce Pipedrive de sobra y podría haber
rellenado de memoria un texto perfectamente creíble — que es exactamente cómo se
generaron las 62 fichas. No lo hizo. Eso es la regla de la propietaria
funcionando: «no está documentado» significa «no sabemos».

**Lo que queda probado:** que `gemini-3.6-flash` acepta `url_context` —no había
fuente oficial que lo confirmara— y que devuelve el estado de recuperación por
URL, así que «lo leyó» y «no lo leyó» son dos hechos distintos y comprobables de
forma automática.

**Lo que no:** una sola herramienta, una sola página. No se midió latencia ni
coste. Y no se comprobó de forma independiente que esas frases estén literalmente
en la página: el entorno remoto no alcanza `pipedrive.com`.

**El hallazgo que cambió el planteamiento:** quien descarga la página es el
servidor de Google, no el nuestro. Que el entorno remoto tenga bloqueados los
dominios de los fabricantes es irrelevante — el endpoint de Gemini sí es
alcanzable desde él (devuelve el 403 propio de Google por falta de clave, no un
bloqueo del proxy). Lo único que falta ahí es la clave.

**La decisión de la propietaria:** camino 1, script local en PowerShell. No mete
claves en el repositorio, no toca producción y da el resultado real. Las otras
dos —clave en el entorno remoto, o endpoint en producción usando la clave que
Vercel ya tiene— quedan anotadas por si algún día conviene.

### El incidente de la clave

Al cargar la clave en PowerShell se pegó en el orden equivocado y quedó
**visible en pantalla en texto claro**. No hubo consecuencia conocida, pero la
clave quedó expuesta y debe rotarse: eliminarla en AI Studio, crear otra y
actualizar la variable en Vercel. **Pendiente.**

La causa fue una instrucción mal ordenada, no un descuido de quien la ejecutó.
El procedimiento corregido —cargar primero la línea, pegar la clave sólo cuando
el aviso lo pide— está escrito en `data/verificacion/COMO-EJECUTAR.md`.

## Lo que F2 tiene montado para el lote 1 (2026-09-07)

En la rama `claude/atlas-advisor-mvp-4e854s`, **sin fusionar**:

- **El adaptador de Gemini sabe leer páginas.** `generarJsonLeyendoUrls` se
  añade como extensión (`ProveedorIAQueLee`) y no toca `generarJson`: Researcher,
  el prechequeo de afiliados y la clasificación de módulos no cambian por esto.
  Devuelve, junto a los datos, qué direcciones consiguió leer de verdad. Las
  pruebas están calcadas de la respuesta real del 2026-09-07, con los nombres de
  campo que devolvió Google y no los que suponíamos.
- **La selección plausible del lote 1, congelada:** 30 herramientas, **765 pares
  herramienta–capacidad**. El criterio es una regla escrita y aplicada igual a
  las treinta —doce capacidades transversales más las de su categoría—, no una
  elección caso a caso, precisamente para que no se estreche donde incomode.
  Incluye a propósito **sondas que la herramienta probablemente no tenga**:
  reserva por internet y recordatorios de cita en los CRM, órdenes de trabajo en
  gestión de proyectos. Son las que el motor da hoy por buenas sin evidencia. Una
  prueba falla si alguien las quita.
- **El script `ejecutar-lote.ps1`**, que ejecuta la propietaria: 60 llamadas, dos
  por herramienta, entre 15 y 25 minutos. Guarda las respuestas crudas sin
  interpretarlas —convertirlas en registros es trabajo del repositorio, donde
  están las reglas y las pruebas—, se puede parar y reanudar, y oculta la clave
  incluso en los mensajes de error.

Una comprobación del script surgió de probarlo: la definición de cada capacidad
nombra a sus vecinas en el campo `noEs`, así que el prompt contiene
identificadores que no se han preguntado. Si el modelo responde por ellos, esas
respuestas **se apartan** en vez de colarse.

**Pendiente:** que la propietaria ejecute el lote 1 y devuelva el archivo de
salida. Hasta entonces F2 sigue sin un solo registro de verificación, y eso es
correcto: no hay ninguno inventado.

## El lote 1 de F2, ejecutado y a medias (2026-09-07)

Las 30 herramientas del lote 1 pasaron por sus páginas oficiales: **78 llamadas,
dos horas y cuarto del ordenador de la propietaria, 765 pares**. Todo en la rama
`claude/atlas-advisor-mvp-4e854s`, **sin fusionar**.

**El resultado hoy: 120 verificados de 765.** Los otros 645 son «desconocido», y
362 de ellos son honestos —Gemini leyó las páginas y dijo que no aparece—; el
resto los degradaron las reglas.

**El hallazgo que justifica F2 entera.** De las 30 herramientas, **ninguna
documenta reserva por internet**. Ninguna de las 15 de gestión de proyectos
documenta órdenes de trabajo, y ninguno de los 15 CRM documenta recordatorios de
cita. Son las tres sondas que se metieron a propósito en la selección congelada,
y el motor recomienda hoy esas herramientas igualmente. La peluquera que dice
«pierdo citas» recibe un CRM que, según su propia página oficial, no sabe coger
una cita. **El catálogo no cubre la vertical de citas.**

### Las cuatro decisiones de la propietaria, con el lote delante

1. **Redirecciones.** Sólo cuentan si hay evidencia técnica de que la dirección
   pedida llevó a la leída. No se aceptan retroactivamente.
2. **Plan.** Lo sostiene la tarifa oficial o documentación que vincule capacidad
   y plan. Una portada no. Su cita se conserva como pista, no como prueba.
3. **Repesca.** Se repiten los pares necesarios, no las herramientas enteras:
   241 en vez de 765.
4. **Citas.** No hay mínimo automático de longitud. Por debajo de treinta
   caracteres la cita va a revisión y sin veredicto escrito no pasa. Revisadas
   las 50 del lote 1 en `citas-revisadas.json`: 47 valen, 3 no.

La cuarta la pidió la propietaria y los datos le dieron la razón: la regla de
longitud anterior **rechazaba «SSO», «Audit logs» y «Kanban board»**, que no son
ambiguas, y aceptaba etiquetas genéricas más largas. Estaba invertida.

### Lo que falló y sigue abierto

**La repesca no funcionó.** Se ejecutó y aplicó tres cambios en 765 pares: los
133 sin respuesta siguen siendo 133. No se sabe todavía por qué — falta ver la
salida de pantalla.

**La resolución local de redirecciones tampoco.** De 60 direcciones, 40
respondieron 200, **seis devolvieron 403** —el servidor bloquea lo que no parece
un navegador—, once fallaron, y las tres que sí redirigen no se siguieron porque
no se leyó la cabecera `Location`. Cero redirecciones demostradas.

Y guardaba el 403 como «final = solicitada», es decir, **como si constara que no
redirige**. Afirmar eso es exactamente lo que este módulo existe para impedir.
Corregido: ahora hay un campo `resuelta`, y una cadena sin resolver no vale como
prueba.

### Dos defectos propios, encontrados midiendo

**Comparar direcciones en crudo tiraba evidencia buena.** El proveedor casi
nunca devuelve la dirección que se le pidió —barra final, «www», esquema—, y eso
descartaba 88 afirmaciones bien fundadas. Corregido normalizando, sin tocar la
ruta: «/pricing» y «/signup» siguen siendo páginas distintas.

**Una respuesta podía pisar a otra entre bloques.** La definición de cada
capacidad nombra a sus vecinas para marcar la frontera, así que el prompt lleva
identificadores que no se han preguntado. Se vio en el ensayo: 26 aplicadas para
18 pedidas. **En la ejecución real no llegó a dispararse** —cero respuestas
intrusas registradas—, pero la guarda queda en los dos scripts.

## La clave de Gemini y el camino crítico (2026-09-07)

Todo el lote 1 pasó por el ordenador de la propietaria: cargar la clave a mano,
lanzar PowerShell, fotografiar la pantalla, copiar el archivo a Descargas y
subirlo. Se perdieron horas en eso, y aparecieron tres fallos que sólo se ven en
Windows: el archivo sin BOM que rompe los acentos, el here-string que no cierra
con saltos de línea de Unix, y la llamada sin límite de espera que dejó el
proceso colgado veinte minutos sin decir nada.

**El endpoint de Gemini SÍ es alcanzable desde el entorno remoto** — devuelve el
403 propio de Google por falta de clave, no un bloqueo del proxy. Y quien
descarga las páginas es el servidor de Google, así que da igual que el proxy
tenga bloqueados los dominios de los fabricantes.

Lo único que falta ahí es la clave. La propietaria la configuró el 2026-09-07,
pero **las variables de entorno se inyectan al arrancar la sesión**: hace falta
una sesión nueva para que llegue. Con ella, F2 deja de depender de su ordenador
y ella pasa de ejecutar a revisar. Es la palanca más grande que tiene el
proyecto ahora mismo.

## Pendientes sueltos, para que no se pierdan (2026-09-07)

Cosas pequeñas que se detectaron trabajando en otra cosa y que no entran en
ningún sprint. Ninguna urge; todas se olvidan si no están escritas.

- **`--color-agente-evaluador` es un nombre fósil.** El agente se llama Atlas
  Advisor desde hace tiempo; el token CSS conserva el nombre viejo. Cambiarlo
  toca `app/globals.css` y quien lo use, y **los colores están congelados**: no
  se toca sin aprobación de la propietaria.
- **`lib/agentes.ts` no está alineado con los 11 agentes** de
  `ARQUITECTURA-AGENTES.md`, que es la referencia canónica.
- **Copia pendiente: «La opción elegida» / «Mejor ajuste para ti».** Sprint de
  redacción anotado y nunca abierto.
- **Cinco fichas sin `analisisAtlas`:** bitrix24, gohighlevel, hubspot, odoo y
  zoho-one. Son las mismas cinco sin facilidad de implementación.
- **Los seis registros de afiliación en Neon** siguen sin crear.
- ~~**`tieneProgramaDeAfiliadosFiable()` sigue descartando** automáticamente las
  herramientas sin programa de afiliación, y eso **contradice la política de
  catálogo aprobada**.~~ **Hecho el 2026-09-12**: ya no descarta. Ver «El
  Researcher deja de descartar por afiliación».
- **La clave de Gemini que quedó visible el 2026-09-07 hay que borrarla** en AI
  Studio. Era una clave de pruebas y **no está configurada en Vercel** (lo
  confirmó la propietaria), así que borrarla no rompe nada ni exige
  redesplegar.

## El lote 1, rematado sin pasar por el ordenador de la propietaria (2026-09-07)

La palanca de la que hablaba la entrada anterior ya está tirada: el proxy de red
del entorno remoto inyecta la clave hacia `generativelanguage.googleapis.com`, y
la sesión nueva la recibe. **F2 ha dejado de depender del ordenador de la
propietaria.** Ella pasó de ejecutar a decidir, que era el objetivo.

**El resultado: de 120 verificados a 248, de 765.** Los desconocidos bajan de
645 a 517 y los descartes de 283 a 121. **Y no queda ni un solo par «sin
respuesta»: eran 133.**

De los 248 verificados, **243 se apoyan en la tarifa oficial** y 241 dicen en
qué plan está la capacidad. La profundidad se reparte en 232 nativas, 9
integraciones y 7 módulos.

### Lo que cambió por cada regla de la propietaria

| Regla | Antes | Después |
|---|---|---|
| 1. Redirección con evidencia técnica | 41 pares caídos | **0** |
| 2. El plan lo sostiene la tarifa, no la portada | 36 sin fuente que lo demuestre | 18 |
| 3. Citas breves: a revisión, no a la basura | 50 revisadas | 96, con 46 nuevas |
| 4. Cero «no disponible» es esperable | 0 | 0 |

La regla 2 sube de 16 a 18 al recuperar Zenkit, y eso es una buena señal, no
una regresión: son pares que antes caían por la regla 1 sin llegar a que nadie
mirara su plan, y ahora llegan y se quedan a las puertas por la razón correcta.

**Regla 1.** Las cinco herramientas cuya dirección de tarifas redirigía
—Insightly, Zoho CRM, Capsule, Wrike y Zenkit— están declaradas en
`sustituciones.json` con la dirección final y su motivo. La evidencia técnica
es el `retrievedUrl` que devuelve el propio `url_context` de Gemini: quien
descarga la página es el servidor de Google, así que resuelve la cadena que el
cliente HTTP local no pudo. **Ninguna ficha del catálogo se ha tocado.**

**Regla 3.** Las 46 citas breves nuevas se revisaron una a una con veredicto y
motivo escritos: **36 valen y 10 no.** Los rechazos siguen los precedentes ya
sentados: «API» a secas (scoro, zenkit) por el mismo motivo que ya se rechazó en
ganttpro; «Import & Export» para importar (vtiger) por el mismo motivo que
«Import»; y el Gantt (clickup, zoho-projects, wrike) porque la capacidad exige
ver el proyecto en el tiempo **y** encadenar tareas, y el Gantt demuestra sólo
la primera mitad — es el espejo exacto de «Task Dependencies», que ya se rechazó
por demostrar sólo la segunda.

**Regla 4.** Sigue habiendo cero registros «no disponible», y **las tres sondas
siguen intactas**: ninguna de las 30 herramientas documenta reserva por
internet (30 de 30 desconocido), ninguno de los 15 CRM documenta recordatorios
de cita, y ninguna de las 15 de gestión de proyectos documenta órdenes de
trabajo. Con 127 pares más verificados, el hallazgo que justifica F2 no se ha
movido ni un punto. Y sigue significando lo que significaba: **no consta**, no
«no lo tiene».

### Por qué la repesca anterior aplicó 3 cambios de 765

**No era el prompt.** Se comprobó de la única forma que vale: repitiendo los
mismos 133 pares de «capacidad» que en PowerShell no aplicaron ni uno, con el
mismo prompt, el mismo modelo y el mismo tamaño de bloque, pero llamando a la
API desde el entorno remoto. **Respondieron los 133.**

Lo que sí se reprodujo, y por accidente, fue el mecanismo: la primera versión
del script remoto **murió entera** cuando un bloque agotó sus tres reintentos
contra un error transitorio del proxy, y se llevó por delante el trabajo ya
hecho de las herramientas anteriores, porque la fusión sólo ocurre al final.
`repescar.ps1` tiene exactamente ese agujero: la llamada a Gemini está fuera del
`try/catch` del bloque, así que un fallo que agote los reintentos aborta el
`foreach` entero y las tareas siguientes no llegan a ejecutarse nunca. Con
`$ErrorActionPreference = "Stop"` y sin reanudación, eso deja aplicado sólo lo
de las primeras tareas — que es la forma que tenían los 3 cambios: los tres de
tipo «plan», ninguno de «capacidad».

**No está demostrado al cien por cien** —el mensaje de error de aquella ventana
de PowerShell no lo tiene nadie—, pero es la única explicación que encaja con
las tres cosas medidas a la vez: que la fusión sí escribía, que «capacidad» no
aplicó nada, y que el total de respuestas no se movió.

La corrección ya está en el arnés remoto: un bloque que falla queda en
`sinRespuesta` y el proceso sigue, y hay un checkpoint por herramienta para no
volver a pagar lo ya conseguido. Hicieron falta cinco pasadas de rescate para
recuperar los últimos 18 pares, y la última sólo salió al partir el bloque de
teamwork.com en trozos de dos: su respuesta completa tardaba más de lo que el
proxy aguanta. **Si los lotes 2 y 3 se ejecutan con `repescar.ps1` sin arreglar
ese `try/catch`, volverá a pasar.**

### Dos cosas que quedaban abiertas, resueltas el mismo día

**1. `sustituciones.json` ya sabe declarar una `paginaOficial`.** Autorizado por
la propietaria. El campo nuevo guarda **las dos** direcciones —`solicitada` y
`resuelta`— y no una sola, porque la prueba de la equivalencia es el par: con
sólo la de destino, quien lea esto dentro de seis meses no sabrá si la ficha
sigue llevando ahí o si alguien la cambió por conveniencia. El validador exige
las dos, exige que sean direcciones, y **rechaza una redirección que no
redirige** —declarar que algo lleva a sí mismo deja escrito como comprobado
algo que no se ha comprobado—. Siete pruebas nuevas lo fijan.

Con Zenkit declarado (`zenkit.com` → `zenkit.com/en/`), **el motivo «la
dirección citada no consta como leída» ha desaparecido: de 41 a 0.**

Conviene ser exacto con lo que eso recuperó, porque no son 8 verificados: el
fallo que desaparece es el **mecánico** —la cita ya resuelve contra la página
que de verdad se leyó—, y lo que queda al descubierto es un límite **de fondo**.
De los 8 pares, 1 quedó verificado (una integración, que no necesita plan), 1
salió `no_documentado` al leer la tarifa, y **6 caen ahora por la regla 2**:
su cita sale de la portada, y una portada no sitúa un plan. La regla 1 ya no
tira evidencia buena; la regla 2 sigue haciendo su trabajo.

**2. La dirección de precios de noCRM estaba muerta, y la propietaria autorizó
cambiarla.** `urlPrecios` era `https://www.nocrm.io/es/precios` y hoy no se
puede recuperar: tres intentos, `URL_RETRIEVAL_STATUS_ERROR` las tres veces. La
que sí responde es `https://www.nocrm.io/es/pricing`, en español, con encabezado
«Cierra más, administra menos» y su tabla de planes —Starter 13 US$, Expert
26 US$, Dream 39 US$ por usuario y mes—.

Cambiada la ficha, y **sólo esa línea**: una sustitución de una dirección por
otra, sin tocar ni un precio, ni un nombre de plan, ni ningún otro campo. Es la
primera vez que F2 modifica el catálogo, y conviene dejar escrito por qué se
pudo: la decisión fue de la propietaria, con la evidencia delante y por
autorización expresa para esa línea concreta.

**No invalida ninguna evidencia ya recogida.** Se comprobó antes de tocar nada:
los 25 registros de `nocrm-io` son los 25 «desconocido» y todos citan la
portada, no la tarifa. Ninguno se apoyaba en la dirección vieja —no llegó a
responder nunca—, así que el cambio no reescribe el pasado: cuenta hacia
adelante, la próxima vez que se verifique esta herramienta.

Queda anotado, **sin tocarlo**, que los datos de precio de esa ficha tampoco
cuadran con esa página: la ficha dice «Desde 12€/usuario/mes» y un plan «Sales
Experts» a 29€, y la página dice Starter/Expert/Dream y en dólares. Cambiar eso
a partir de una sola lectura sería repetir el error que F2 existe para
deshacer: son datos que necesitan su propia verificación, no un arreglo de paso.

### `repescar.ps1`, arreglado y demostrado

El agujero que explicaba los 3 cambios de 765 está cerrado, y con cuatro
garantías que se probaron una a una en un banco de pruebas aislado, sin gastar
ni una llamada real:

1. **Aísla.** Un bloque que falla se queda en su bloque; una herramienta que
   falla se queda en su herramienta. Probado forzando el fallo en la de en
   medio: ALFA aplicó, BETA falló, **GAMMA se ejecutó igual**. Antes, BETA se
   habría llevado a GAMMA por delante.
2. **Conserva.** El archivo de cada herramienta se guarda **después de cada
   bloque**, no al final. Tras el fallo de BETA, su evidencia previa seguía
   intacta en disco.
3. **Registra.** Todo fallo va a `salida\errores-repesca.json` con herramienta,
   bloque, capacidades y mensaje, **con la clave oculta**.
4. **Reanuda.** Volver a lanzar el mismo comando no repite lo respondido: en la
   segunda pasada ALFA y GAMMA se saltaron y sólo se repreguntó BETA, **una
   llamada en vez de tres**. En las tareas de tipo `plan` el criterio es tener
   ya un plan escrito: probado con una herramienta donde una capacidad lo tenía
   y otra no, se repreguntó sólo la que faltaba y la que ya lo tenía conservó
   su plan y su cita.

Se arregló además un defecto que destapó el propio registro de errores:
`Escribir-Json` pasaba por la tubería, y una lista de **un** elemento se
desenvolvía y se escribía como objeto suelto. Con un fallo salía `{...}` y con
dos `[{...},{...}]`. Ahora usa `-InputObject` y siempre es una lista.

**Lo que NO se ha tocado: `ejecutar-lote.ps1` tiene el mismo agujero** —la
llamada a Gemini está fuera de todo `try`—, y es el script que abre el lote 2.
Su daño es menor porque ya salta las herramientas hechas al relanzar, así que
un fallo cuesta una herramienta y un relanzamiento a mano, no el lote entero.
Aun así, mientras no se arregle, un fallo a mitad para la ejecución y hay que
estar delante para verlo. **Decide la propietaria.**

## La simulación piloto del Lote 1 (2026-09-09)

Sobre `285223a`, sin una sola llamada y sin tocar nada: se ejecutó el motor real
con seis rutas del Lote 1 —la categoría CRM, sus cuatro respuestas de
diferenciación y la categoría de gestión de proyectos— por los 120 perfiles del
generador tipado. **720 ejecuciones.**

La regla contrafactual la definió la sesión, no el proyecto, y sin ella el
número no significa nada. Para cada ruta, la sesión asignó dos capacidades
mínimas. C1b excluye una herramienta únicamente cuando una de esas capacidades
formaba parte de su selección congelada y, después de investigarla, no quedó
"verificado". Si esa capacidad nunca se investigó para esa herramienta, el
piloto no la juzga y la herramienta permanece elegible. Así se evita convertir
una pregunta que nunca se hizo en evidencia negativa.

**222 de 720 ejecuciones cambian el trío**, y el reparto importa más que el
total:

| Ruta | Cambios | Causa |
|---|---|---|
| CRM | 6/120 | `less-annoying-crm` con el embudo en `desconocido` |
| CRM + «dentro del correo» | 0/120 | — |
| CRM + «captura sola» | 0/120 | — |
| CRM + «sencillo» | 120/120 | las dos únicas fichas que el filtro selecciona no están verificadas; al quedarse sin ninguna, el motor **ensancha en silencio** a toda la categoría |
| CRM + «llamar desde dentro» | 0/120 | — |
| Gestión de proyectos | 96/120 | `cap.project_planning` en `desconocido` en cinco de quince |

**Cero cambios** con la regla que sólo excluye la ausencia demostrada, porque no
hay ni un registro `no_disponible` en los 765: **todo lo que cambia procede de
un `desconocido`, nunca de una ausencia demostrada.** Ninguna ruta se quedó sin
recomendación.

**Lo que el piloto NO dice.** No dice que el resultado nuevo sea mejor: eso no
se ha medido con gente. No dice que Zoho Projects o Wrike no planifiquen
proyectos, sino que no lo sabemos. No cubre las puertas por objetivo ni de texto
libre, ni las otras trece categorías. Y depende de esa definición de «qué exige
cada ruta» hecha por la sesión.

**Cuatro requisitos que deja escritos para F3:**

1. **Correspondencia explícita ruta–capacidad.** Hoy ninguna ruta declara qué
   capacidad exige; hay que decidirlo antes de filtrar por evidencia.
2. **Trato honesto del `desconocido`.** Puede dejar fuera por «el silencio no es
   permiso», pero nunca afirmar que la herramienta no lo tiene.
3. **Prohibir el ensanchamiento silencioso.** Cuando ninguna ficha declara lo
   que la persona pidió, hoy se conserva la categoría entera y su respuesta deja
   de aplicarse sin que nadie lo vea.
4. **Resolver las cuatro opciones de la pregunta de CRM** —vivir dentro del
   correo, capturar los datos solo, ser sencillo, telefonía integrada—, que **no
   tienen equivalente en el vocabulario de 146 capacidades**. Resolverlas no
   presupone ampliar el vocabulario: habrá que decidir expresamente si cada
   opción corresponde a una capacidad, una preferencia, un atributo o una regla
   de selección.

**Lo que este punto de control NO cambia.** El Lote 1 sigue cerrado en
`285223a` y sus 765 registros no se tocan. **El piloto no cancela ni acota F2**,
y el siguiente paso sigue siendo preparar la selección plausible del Lote 2. Y
el hueco del catálogo en reserva y recordatorios de cita es **una decisión de
catálogo aparte**: no fue la causa del caso de la peluquera, que fueron la
necesidad no entendida y el `return universo`, corregidos el 2026-09-02 en
`a79b8e3`.

**F4 no está localizada.** No aparece en ningún archivo del repositorio. Queda
anotada como definición que falta, **no como decisión cancelada**.

## El lote 2, cerrado (2026-09-09)

Las 18 herramientas de los seis subtipos de asistentes de IA, **384 pares
preguntados a sus páginas oficiales en 189 llamadas**. Commit `b8bcd52`.

**168 capacidades verificadas de 384.** Y el reparto del resto importa tanto
como esa cifra:

| | Pares |
|---|---|
| Capacidad verificada + plan verificado | 119 |
| **Capacidad verificada + plan desconocido** | **47** |
| Capacidad verificada, sin opinar del plan (integraciones) | 2 |
| Capacidad desconocida | 216 |
| **Negativos demostrados** | **0** |

De los 216 desconocidos, **207 son honestos** —se leyó la página oficial y la
capacidad no aparece— y **9 los degradó una regla**: 6 por cita breve revisada
y rechazada, 3 por dirección citada que no consta como leída. **Ni un solo par
se quedó sin preguntar.**

Los 765 registros del lote 1 se comprobaron uno a uno contra `a281171` después
de cada vuelta: **cero cambiados, cero desaparecidos**. `registros.json` pasa
de 765 a 1.149.

### Lo que enseñó el puente

Las dos capacidades del puente se preguntaron a las dieciocho aunque no fueran
su especialidad, y ahí está su valor: **redactar textos sale verificado en 10 de
18, y agentes de IA que ejecutan tareas en 6 de 18.** Doce de estas herramientas
anuncian inteligencia artificial y no documentan agentes que hagan tareas por su
cuenta. Con una selección hecha subtipo a subtipo esa pregunta no se habría
hecho nunca.

### Las sondas de citas: verificadas, y aun así no cubren a la peluquera

Las dos sondas incómodas volvieron casi vacías —reserva online 2 de 18,
recordatorios de cita 1 de 18—, pero los tres registros que sí salieron
merecen quedar explicados, porque son el caso límite de esta vertical.

**Motion y Reclaim.ai se quedan verificados**, y es correcto: cumplen la
definición congelada. Reclaim demuestra además su plan con fila y columna.

- Motion: «Motion creates meeting booking pages, shows your availability, and
  schedules meetings at ideal times that maximize your focus time.»
- Reclaim, reserva: «Share your availability for meetings with Scheduling Links
  that offer smart priority settings to book the right meetings sooner.»
- Reclaim, recordatorios: «Send email reminders to attendees ahead of meetings
  booked via Scheduling Links.»

**Pero esa evidencia demuestra reserva y recordatorio básicos de REUNIONES, no
cobertura de la vertical de citas de un negocio de servicios.** Las tres citas
hablan de *meetings* y de *attendees*; ninguna nombra a un cliente ni a una cita
de negocio. Los recordatorios sólo cubren reuniones reservadas por esos mismos
enlaces, y por correo. **Esta evidencia no demuestra agenda por profesional o
recurso, franjas de servicios, gestión de ausencias ni otras funciones propias
de un negocio de servicios. F2 no obtuvo negativos demostrados**, así que no se
afirma que no las tengan: se afirma que esto no lo demuestra.

La causa es identificable: el `noEs` de estas dos capacidades separa «reserva el
cliente» de «lo apunta el negocio», pero **no separa reunión de trabajo de cita
de servicio**, y por esa rendija entran los tres registros. **Queda anotado, no
resuelto**: tocar el vocabulario es F1 y lo decide la propietaria.

Y no cambia el hallazgo del lote 1: **el catálogo sigue sin cubrir la vertical
de citas**. Con los dos lotes, 48 de las 62 fichas están medidas contra ella.

### Notion AI: una migración de dominio disfrazada de herramienta sin funciones

Notion AI salió **0 de 22** y no porque no hiciera nada: sus 22 respuestas
citaban `notion.so` sin que constara que esa dirección se hubiera descargado, y
caían enteras por la regla de redirecciones. La evidencia estaba en el propio
lector: se pidió `notion.so` y se leyó **`notion.com`**, catorce descargas, las
catorce con `URL_RETRIEVAL_STATUS_SUCCESS`. Declarada la equivalencia en
`sustituciones.json` —sin tocar la ficha, que es dato de producto— y
repreguntada, **pasa de 0 a 14 de 22**.

### Lo que costó en llamadas

**189 llamadas para 384 pares en 18 herramientas**, repescas incluidas: algo
menos de once por herramienta. Es el único dato de coste demostrado —el gasto
en euros no se midió, así que no se anota—, y es el que hay para dimensionar el
lote 3, que son catorce suites con bastantes más capacidades cada una.

### Tres correcciones a los informes de esta sesión

1. **«Degradados» no es «capacidades perdidas».** El resumen del arnés cuenta
   entradas de `descartes.json`, y ahí conviven dos cosas distintas: las
   capacidades que sí cayeron y las anotaciones de un plan que no se demostró
   sobre una capacidad **que sigue verificada**. Se informó de 66 y de 115
   capacidades degradadas cuando eran 34 y 28. La cifra buena hoy es **9**.
2. **Los cinco pares que quedaron sin respuesta eran de HeyGen, no de
   Synthesia.** Los de Synthesia se habían recuperado en la vuelta anterior.
3. **Se autorizó repescar 27 pares y cambiaron 32 registros.** Los 27 son los
   repreguntados; los otros 5 los tocó la pasada de plan, que recorre todas las
   capacidades afirmadas cuyo plan no se preguntó nunca. Comprobado uno a uno:
   **ninguna cita de capacidad quedó pisada por la del plan**, y sólo uno
   —`heygen/cap.audit_log`— cambió de resultado, ganando su plan.

### El límite que dejó abiertos doce pares del lote 3 (2026-09-09)

Doce pares quedan `desconocidos` por una razón que no es la herramienta: el
modelo citó la dirección que se le PIDIÓ y lo que el proveedor descargó fue
otra, así que la afirmación cae por la regla de redirecciones. Seis de
EngageBay, cuatro de Kartra y dos de HubSpot.

Las dos primeras redirecciones están demostradas con la evidencia del propio
lector y declaradas en `sustituciones.json` —EngageBay pidió `/pricing` y
descargó `/pricing/all-in-one`; Kartra pidió `www.kartra.com/pricing/` y
descargó `kartra.com/plans-and-pricing/`—, así que **las próximas vueltas
preguntarán bien**. Pero una sustitución no rescata lo ya contestado: esas
respuestas siguen citando la dirección vieja.

**Se repreguntaron las 53 capacidades de esas dos herramientas y el resultado
se descartó entero, por decisión de la propietaria.** Recuperaba los diez
pares, pero **tumbaba cuatro capacidades que estaban verificadas** —tres de
EngageBay y una de Kartra—, y tres de las cuatro citaban la PORTADA, que la
sustitución no cambia: no era otra fuente leyéndose mejor, era el mismo texto
juzgado con más exigencia en otra llamada. Cambiar cuatro verificadas por diez
recuperadas no compensa cuando la diferencia es variabilidad entre llamadas y
no evidencia nueva. El estado del lote 3 se conserva tal cual quedó en
`1c05c2d`.

**Los dos de HubSpot no se pueden arreglar sin tocar el arnés, y no se toca.**
Son `cap.dashboards` y `cap.custom_reports`. Se pidió `/pricing/` y se descargó
`/pricing/marketing`: declarar eso como sustitución fijaría la tarifa de
HubSpot en la de un solo producto y dejaría fuera ventas y servicio. Y la
fuente correcta no se puede pedir: **el arnés pide dos direcciones por
herramienta —precios y oficial—, las mismas para todas sus capacidades**, y el
campo `documentacion` de `sustituciones.json` sólo sirve para clasificar el
tipo de fuente, no para pedirla. Queda anotado como límite conocido del
mecanismo, no como resultado sobre HubSpot.


## La revisión global de F2, cerrada (2026-09-09)

Una revisión independiente comparó la rama de F2 con producción (`baf0f6b`) y
encontró **un único bloqueante**: doce registros daban el plan por verificado
con una cita que hablaba de la función y no nombraba el plan. El nombre
—«Free», «Enterprise», «Creator», «Plus»— venía del modelo, no de la página.
Eran cinco de Descript, cuatro de Synthesia, dos de Notion AI y uno de
Otter.ai.

**Las doce capacidades siguen verificadas**: su evidencia era buena y no se
tocó ni una cita. Lo que no estaba demostrado era el plan, así que sólo el plan
se movió: `planEstado: "desconocido"` y fuera el nombre. Es la misma separación
de certezas que ya regía desde el lote 1, aplicada donde se había colado.

Para que no vuelva a pasar, **el validador exige ahora que la cita de un plan
verificado nombre ese plan**, comparando por palabras enteras para que «Free»
no quede demostrado dentro de «freelance». Lo protegen **seis pruebas nuevas**,
la última de las cuales recorre los registros reales.

La comprobación independiente posterior identificó los doce por su cuenta,
confirmó **cero casos restantes** y que **las 659 capacidades verificadas
siguen intactas**, y verificó que las pruebas caen si se quita la regla.

**Deuda anotada:** `convertir.ts` todavía no aplica esta regla al generar, así
que sigue produciendo esos planes. No puede reintroducirlos en silencio —el
único punto que escribe `registros.json` valida antes y aborta sin escribir
nada—, pero significa que **los lotes 2 y 3 no son reconvertibles mientras el
conversor no lleve la regla**. Es deuda previa a cualquier reconversión futura,
no un bloqueo de F3.


## F3: el motor ya lee lo que F2 verificó (2026-09-10)

Desde `94b3542`, en la rama `claude/f3-bloques-1-2`. **Sin fusionar.**

El motor recomendaba sin preguntarse si la herramienta hace lo que la persona
pide. Ahora se lo pregunta: se queda con las que lo han **demostrado**, antes de
puntuar nada.

**Cómo entra, sin que el motor sepa de F2.** El motor recibe un objeto con dos
métodos —`filaDe` y `loDemuestra`— y no importa nada de `data/verificacion`. Lo
construye la ruta de API, que es el **único** lector de la verificación en toda
la aplicación. Sin ese objeto, el motor se comporta exactamente como antes.

**Tres estados.** «Demostrada», «ausencia demostrada» y «no nos consta». Sólo
la primera supera la puerta.

La primera versión eran dos, razonando que F2 no obtuvo ni una ausencia
demostrada en 1.544 comprobaciones. Era cierto sobre los datos y **falso sobre
el esquema**: en F2, `estado: "verificado"` no significa «lo hace», significa
«tenemos evidencia», y la dirección la lleva `profundidad`. Con `no_disponible`
hay evidencia de que NO lo hace. La revisión independiente demostró que aquella
lectura lo daba por capacidad demostrada: **la herramienta de la que sí sabemos
que no sirve era la única que la puerta debía apartar con certeza, y era justo
la que promovía**, descrita además como comprobada. Hoy no puede pasar —hay
cero registros `no_disponible`— pero el conversor los produce en cuanto el
modelo responda «no», y el validador no los rechaza.

`ausencia_demostrada` **no se colapsa en «no consta»**: perderíamos la
diferencia entre saber que no está y no saberlo. El dato se conserva dentro;
afirmarlo en voz alta es otra decisión, y no está tomada.

El «no consta» sigue distinguiendo si se preguntó y no quedó claro (885) o si
nunca se preguntó (7.508 de los 9.052 posibles): pesan igual para decidir, y
cambian qué haría falta para resolverlo. **El plan nunca decide**: una
capacidad verificada con el plan sin demostrar sigue siendo elegible, y su
nombre no se escribe.

**Siete filas congeladas**, aprobadas por la propietaria. Gestión de proyectos
—planificación, tareas **o** Gantt— y los seis subtipos de asistentes de IA.
El Gantt se añadió al ver la simulación: monday.com quedaba fuera con
`gantt_and_dependencies`, `kanban_boards` y `team_workload_planning`
verificadas, porque la fila preguntaba por dos nombres que a ella no le
preguntaron así. **La fila medía la evidencia, no el producto.**

**CRM y las plataformas todo en uno siguen pendientes**, escritas como tales y
con una prueba que impide que se cuelen como resueltas. Las cuatro opciones de
CRM no tienen equivalente en el vocabulario y las suites necesitan una pregunta
que el cuestionario todavía no hace. Una regla inventada haría más daño que
ninguna.

**Cuando no se puede confirmar, se dice.** Si nadie demuestra lo que la ruta
pide, o si ninguna ficha encaja con la opción elegida, Molnip no ensancha en
silencio: enseña las mejores de la categoría en un bloque aparte, titulado
«sin esa necesidad comprobada», con un aviso que nombra la necesidad y deja
escrito que **podrían hacerlo igualmente**. La franja de confianza desaparece
en ese estado. Las dos causas se enseñan igual y se guardan distintas —falta
evidencia, o falta catálogo— porque son dos problemas con dos arreglos, y si
coinciden se conservan las dos, también en el enlace. El aviso viaja en el
token como campo opcional: **los enlaces guardados antes de F3 siguen
funcionando**.

**Qué cambia para quien usa Molnip hoy: la recomendación no, un número sí.** Se
compararon las **3.120 combinaciones** —las 15 categorías declaradas, los 6
subtipos y los 5 objetivos, por 120 perfiles cada uno— entre producción y la
rama. **El trío no cambia en ninguna.** Sin la puerta, el resultado es idéntico
bit a bit.

Lo que sí se ve: **la pantalla de espera dice «Evaluamos N herramientas», y en
gestión de proyectos pasa de 19 a 17**, porque Odoo y Zoho One dejan de
evaluarse al no haber demostrado ninguna de las tres capacidades de la fila. Es
más honesto que antes —el motor evalúa 17 de verdad— pero es un cambio visible
y no debe contarse como «ningún cambio observable».

Y en esa misma ruta la puntuación de las supervivientes baja hasta 0,5 puntos,
porque varios criterios son comparativos y el conjunto contra el que se
comparan se ha hecho más pequeño; el orden relativo no cambia.

F3 no arregla nada que hoy esté roto: instala la red antes de que haga falta.

**El aislamiento cambia de promesa**, no desaparece: de «nadie lee la
verificación» a «la lee un solo sitio, y está escrito quién y por qué».

**Dos guardas estaban peor de lo que parecían.** La de afiliación recorría una
lista de cuatro archivos escrita a mano, así que un módulo nuevo no entraba
solo —y el que decide quién compite habría sido justo el único sin vigilar—;
ahora recorre el directorio. Y la de aislamiento cazaba prosa: señalaba
`tipos.ts` por explicar en un comentario que el motor NO importa la
verificación. Ahora mira código, igual que su hermana.

**Una nota de F2, corregida.** La de `beautiful-ai/cap.customer_appointment_reminders`
decía que la herramienta «no incluye» recordatorios de cita. Ahora dice que la
evidencia consultada no lo demuestra. Las otras cuatro que el detector señala
hablan de que no hay una cita literal en la página, que es cierto y no dice
nada de la herramienta.

**Lo que queda fuera de F3 y sigue pendiente:** las restricciones duras —no hay
ni un dato verificado de ninguna de las cinco, y el cuestionario no pregunta
ninguna—, la correspondencia de CRM y de las suites, y la imagen que se ve al
compartir el enlace, que sigue diciendo «Tu recomendación».


## F4: definición oficial — piloto vertical profundo de belleza con citas (2026-09-10)

**Aprobada por la propietaria el 2026-09-10.** Es la definición, no la
ejecución: **ninguna etapa está hecha** y ninguna puede empezar sin
autorización expresa.

**Nombre.** Se llama **F4**, de la serie F1–F2–F3. No confundir con la «Fase 4:
Blog SEO» de la numeración del lanzamiento, completada el 2026-08-21 y sin
relación con ésta. Antes de escribirla, se buscó una definición previa de F4 en
los 186 commits de todas las ramas: **no existía ninguna**, ni en texto vivo ni
en texto borrado.

### Qué es, y qué no

F4 lleva a Molnip de saber preguntar a **saber responder en una vertical
completa**: peluquería, barbería, uñas y estética, de una profesional sola a un
centro de dos a cinco.

**No cambia el público ni sustituye nada.** Las cuatro categorías cubiertas
siguen igual y siguen atendiendo a autónomos y a empresas: un autónomo que
busca un CRM ya está atendido hoy. F4 **añade** cobertura donde no la hay.

Quedan **fuera**: sanidad, veterinaria, servicios a domicilio, restauración,
aforos, academias y grupos.

### Por qué esta vertical y no otra

Se compararon ocho candidatas. **Ninguna gana por encaje de vocabulario**: las
146 capacidades de F1 cubren las ocho sin que falte una sola, comprobado id a
id. Donde se diferencian es en trabajo y en riesgo, y la belleza gana por
**menor riesgo regulatorio** —no arrastra `req.health_special_category`, que es
una restricción dura sin un solo dato verificado— y por negocios pequeños y
fragmentados con un problema frecuente.

**La afiliación no decidió la elección** y se investiga al final, sobre un
conjunto ya elegido por compatibilidad.

**Lo que no se pudo comprobar:** el proxy de la sesión bloqueó todo el egreso
web —INE, prensa sectorial, webs de fabricantes—, así que **la comparación
comercial no está verificada** y no sostiene la decisión. La sostiene el
análisis del repositorio y el criterio de la propietaria.

### La bisagra

`cap.per_resource_booking_calendar` —«agenda separada por profesional, sala,
sillón o máquina»— es lo que separa a la profesional sola del centro. **F2 no
se la preguntó nunca a nadie.**

### Cinco capacidades esenciales comunes

Sin ellas no es una herramienta de esta vertical, se trabaje sola o en equipo:

`cap.online_self_service_booking` · `cap.customer_appointment_reminders` ·
`cap.booking_cancellation_and_rescheduling` · `cap.customer_contact_records` ·
`cap.offer_catalog`

**Dos de las cinco no tienen ni un dato en F2.**

### Ocho capacidades condicionales

Cada una atada a una respuesta, no al sector: `per_resource_booking_calendar`
(varias con agenda propia) · `payment_collection` (cobro online) ·
`point_of_sale` (cobro en mostrador) · `no_show_and_deposits` (protección ante
ausencias) · `prepaid_session_packages` (bonos) · `commissions_and_tips`
(retribución variable) · `embeddable_booking_widget` (web propia) ·
`inventory_tracking` (vende producto).

**Tres cosas que son independientes y no pueden mezclarse:** la forma de cobro,
los bonos y la protección ante ausencias. **Cobrar antes no es exigir
depósito.**

`stock_reorder_alerts` es **complementaria**, no exigencia: llevar existencias
y que te avisen cuando bajan del mínimo son dos cosas distintas.

### Seis preguntas, y una adaptativa

Ninguna activa lo que activa otra: (1) ¿sola o varias con agenda propia?, (2)
¿quieres cobrar desde la herramienta —**online, en mostrador, ambos o
ninguno**—?, (3) ¿pedir señal o penalizar ausencias?, (4) ¿vendes bonos?, (5)
¿tienes web propia?, (6) ¿vendes producto? Y sólo si la 1 fue «varias»:
¿pagáis comisión o repartís propinas?

**«Ninguno» tiene que ser una respuesta válida en la 2**: quien cobra en
efectivo no necesita que el software cobre, y descartarle herramientas por eso
sería inventarle una necesidad. **Ninguna pregunta el oficio**: una barbería y
un centro de uñas que respondan igual necesitan lo mismo.

### Restricciones

Aplican `req.language_es` (dura) y, como blandas altas, `req.mobile_first`,
`req.low_price` y `req.no_training_needed`. `req.data_residency_eu` sólo si un
contrato lo exige. **No aplican** `req.health_special_category`,
`req.offline_capable` ni `req.esignature_qualified`.

**`req.language_es` hay que verificarla en las herramientas que entren**, aunque
no sea una restricción nueva: es dura, y una herramienta que no esté en español
no vale para este público por buena que sea.

### El hueco de vocabulario: sin decidir, a propósito

Se anota dónde guarda un salón **la ficha técnica del servicio** —el tinte, la
proporción, el tiempo—. Ninguna capacidad cercana encaja por su propio `noEs`:
`customer_interaction_history` es trato comercial, `clinical_record` es salud
—y traería la restricción que esta vertical evita—, `serviced_asset_registry`
es un bien del cliente. **Eso no demuestra que falte.** Se decide en la etapa 4,
después de observar herramientas reales, no antes.

### Seis perfiles de simulación

Peluquera sola sin web ni cobro por la herramienta · peluquera sola con web y
cobro online · salón de 3 con comisión · barbería de 2 con señal y cobro en
mostrador · uñas con bonos y sin cobro · estética de 4 con cobro por ambos
canales y venta de producto. Cruzados con los 120 perfiles del generador
tipado: **720 ejecuciones**.

### Nueve etapas, nueve autorizaciones

1. El mapa *(aprobado)* · 2. **Investigación y preselección, solo lectura** ·
3. **Comparación de candidatas y aprobación en bloque de las fichas** ·
4. Decisión sobre el hueco de vocabulario · 5. Creación del catálogo ·
6. Verificación F2 · 7. Preguntas en el cuestionario · 8. Fila congelada y
**simulación antes de conectar** · 9. Publicar la categoría, conectar y
documentar.

**Ninguna ficha entra sola**: la etapa 3 presenta una comparación y la
propietaria aprueba el conjunto. **La etapa 2 está bloqueada** mientras el
entorno no permita salir a la web.

### Condición obligatoria antes de publicar la categoría

Hoy `reservas-citas` devuelve **`top: 0 · todas: 0 · sin ningún motivo`**: la
ruta de API generaría un enlace vacío y la página diría «Este enlace no es
válido», cuando lo cierto es que no hay catálogo. **No es alcanzable ahora**
—la categoría está en estado `pendiente` y sólo cuatro son públicas—, pero **la
etapa 9 no puede fusionarse sin resolverlo**: publicar una categoría cuyo
camino acaba en «enlace no válido» sería lo contrario de decir que no.

### Criterio de terminado

F4 está terminada cuando, todo a la vez:

1. Las 5 esenciales están **demostradas positivamente** en las herramientas
   elegibles —`estado: "demostrada"` del puerto de F3—. **Una ausencia
   demostrada no cuenta**: `verificado` en F2 significa «tenemos evidencia», no
   «lo hace», y confundirlo fue el bloqueante que encontró la revisión de F3.
2. `req.language_es` está verificada para todas las fichas nuevas.
3. Cada condicional tiene evidencia en al menos una ficha; la que no la tenga
   en ninguna se documenta como hueco de catálogo.
4. El hueco de vocabulario está resuelto por escrito tras observar herramientas.
5. Las 6 preguntas y la adaptativa están en el cuestionario y **cada una cambia
   el resultado de al menos un perfil**; la que no lo haga, se retira. La 2 debe
   cambiarlo en al menos tres de sus cuatro respuestas.
6. Los 6 perfiles reciben recomendación real o un «no lo sé» que nombra la
   necesidad. **Cero respuestas mudas y cero enlaces no válidos.**
7. **El perfil 1 —la peluquera sola— recibe recomendación verificada.** Es el
   único criterio que por sí solo declara F4 fallida.
8. Los perfiles 1 y 3 no coinciden en primera opción, ni 4 y 5, salvo que una
   herramienta demuestre servir a ambos casos.
9. **Las 3.120 combinaciones actuales no cambian ni una.** Las de
   `reservas-citas` sí cambiarán —hoy devuelven vacío— y eso es el objetivo, no
   una regresión: se documentan aparte con su antes y su después.
10. La fila está congelada y simulada antes de conectar.
11. El defecto del resultado vacío está resuelto.
12. Suite verde, `tsc --noEmit` limpio, lint sin problemas nuevos, build verde.
13. `ATLAS.md` documentado y autorización expresa para fusionar.

---

## El Researcher deja de descartar por afiliación (2026-09-12)

Preparando la etapa 3 de F4 apareció que **el código contradecía la política
de catálogo aprobada**. La política de «Herramientas sin afiliación» dice que
una herramienta sin programa **se presenta a la propietaria**; el código la
descartaba sola. La contradicción ya estaba anotada, pero no su tamaño: **no
era un punto, eran tres**, más una frase de este mismo documento que la
consagraba.

`agente.ts` devolvía `ok: false` y tiraba una investigación entera ya pagada.
`promover.ts` volvía a bloquear. Y `prechequeoAfiliados.ts` ni siquiera
llegaba a investigar: `lote.ts` marcaba `descartado_prechequeo` y ahí moría.
La función de cuatro líneas estaba copiada tres veces.

**El defecto de fondo era el mismo de F2:** la condición `hasAffiliateProgram
!== true` metía en el mismo saco el `false` demostrado y el `undefined` de una
investigación que no encontró nada. De las quince candidatas de F4, **siete
habrían caído por «no tener programa» cuando lo único cierto es que no se
encontró**.

### Tres estados, y una exigencia de prueba

`estadoAfiliacion.ts` replica el patrón de `EstadoDeEvidencia` de F3 —el
patrón, no el módulo: importar `data/verificacion` desde aquí habría hecho
fallar su guarda de aislamiento, y esa guarda vale más que veinte líneas
ahorradas—:

- `confirmada` — programa activo y la investigación no se declara poco fiable.
- `ausencia_demostrada` — **exige una cita literal de una página oficial** que
  diga expresamente que no lo ofrecen. `hasAffiliateProgram: false` por sí
  solo **no basta**: sin cita es `no_consta`.
- `no_consta` — todo lo demás.

**Ninguno de los tres descarta.** Los dos últimos dejan la candidata en
`pendiente_de_decision`, con motivos separados, y **no disparan la
investigación completa**: gastarla sería decidir por la propietaria que
merece la pena seguir. El ahorro del prechequeo se conserva entero.

Un fallo del proveedor ya no se confunde con una respuesta: devuelve `ok:
false` y se reintenta. Antes acababa en descarte, que es lo contrario de lo
que se sabe en ese momento.

### Lo que sigue bloqueando

La afiliación **sigue siendo la vía habitual y sigue bloqueando la promoción
por defecto**. Lo que deja de ser es incondicional: la excepción de la
política —cubre un hueco, o demuestra ventaja material— la abre la propietaria
con `--admitir-sin-afiliacion` y una justificación escrita que queda en el
historial, mismo patrón que la anulación del aviso de duplicado. La decisión
editorial aprobada sigue delante de todo.

El estado de afiliación **no se escribe en `advertencias`**: cualquier
advertencia hace fallar `evaluarCriteriosDeCalidad`, y eso habría levantado un
segundo bloqueo que la excepción no podría abrir, dejándola inservible. Son
dos cosas distintas y se mantienen separadas.

`npm run investigar-pendiente` cierra el ciclo: lista lo que espera y, con una
decisión «aprobado» registrada, lanza la investigación completa. Sin ese
comando, «esperar autorización» no tendría forma de terminar.

### Compatibilidad, comprobada antes de tocar nada

`descartado_prechequeo` **no estaba persistido en ningún sitio**: sólo vivía
en el código. `cli-lote.ts` no escribe a disco y no hay checkpoints. El único
artefacto guardado, `historial-aprobaciones.json` (46 registros), usa
`estadoAfiliacion: "confirmada" | "pendiente_de_verificar"`, que este cambio
no toca. **No hizo falta migrar nada.**

**Nada de esto altera ninguna recomendación.** Es entrada al catálogo, no
salida al usuario: `independenciaAfiliacion.test.ts` sigue pasando sin
tocarlo.


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

> **La identidad de color de Molnip vive en `brand-guidelines.md`**, documento
> oficial desde el 2026-09-01. Ahí está la paleta completa, el significado de
> cada familia y las comprobaciones que la sostienen. Lo de aquí abajo es el
> resumen; ante cualquier duda manda ese documento.

**El color principal de Molnip es `#6E5FE4` y está congelado**: lo fijó la
propietaria el 2026-09-01 y no se modifica sin su aprobación explícita. Una
prueba falla si cambia.

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

1. **La paleta**: el índigo propio —ancla `#6E5FE4`, **congelada**—, la neutra
   violeta y el dorado de «opción elegida». Ningún color de marca nuevo, y el
   principal no se cambia sin aprobación explícita de la propietaria
   (`brand-guidelines.md`).
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
