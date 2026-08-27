# Arquitectura de Agentes v1.0

**Registrada:** 2026-08-25 — decisión oficial del proyecto: la arquitectura
definitiva de Molnip tiene **11 agentes**. Este documento es la referencia
canónica de esa arquitectura — reemplaza a la lista informal de la "Hoja de
ruta de agentes" en `ATLAS.md`, que se conserva ahí como registro histórico
de cómo se fue decidiendo cada pieza, pero deja de ser la fuente de verdad
sobre nombres y estado actual.

Basado en una auditoría completa del código existente (ningún dato de este
documento está inventado ni deducido: cada responsabilidad, entrada, salida
y activación se verificó leyendo el código real, archivo por archivo).

## Cómo leer este documento

Cada agente tiene siete campos:

- **Nombre canónico** — el que se usa en arquitectura, documentación y
  cualquier decisión futura, a partir de ahora sin excepción.
- **Estado** — `Implementado` / `Parcialmente implementado` / `Planificado
  (sin código)`.
- **Carpeta de código** — dónde vive, si existe.
- **Responsabilidad** — qué decide o hace, en una frase.
- **Entradas** — qué recibe.
- **Salidas** — qué produce.
- **Activación** — quién o qué lo dispara.
- **Relaciones** — con qué otros agentes colabora, y el límite exacto de esa colaboración.

## Principio rector, sin excepción para ningún agente

La confianza del usuario y el mejor encaje para su negocio tienen prioridad
absoluta sobre cualquier comisión, patrocinio o ingreso. Ningún agente —
presente o futuro— puede modificar el orden objetivo de una recomendación
por motivos económicos. Este principio ya gobierna hoy a Advisor (nunca ve
datos de afiliación) y a Affiliate Manager (`priorizador.ts` nunca combina
comisión y puntuación en una cifra); a partir de este documento, gobierna
también, explícitamente, a Atlas Revenue.

---

## 1. Atlas Researcher

- **Estado:** Implementado.
- **Carpeta:** `agents/atlas-researcher/`
- **Responsabilidad:** investiga herramientas offline, por lotes, con IA;
  valida la propuesta; decide si el programa de afiliados de un candidato
  es fiable (prechequeo y comprobación final); gestiona la estrategia de
  afiliación *inicial* (siembra la primera cuenta al promover); mantiene el
  historial auditable de cada intento de promoción. Nunca promueve sin
  aprobación humana explícita, salvo la regla de promoción automática para
  el caso inequívoco (ver `ATLAS.md`).
- **Entradas:** nombre de una herramienta + `ProveedorIA` (Gemini); en
  promoción, un borrador ya investigado + decisión humana registrada.
- **Salidas:** `HerramientaPropuesta` (ficha pública + datos de afiliación
  internos); tras promoción, entrada real en `data/herramientas/` + registro
  en el historial de aprobaciones + informe HTML.
- **Activación:** exclusivamente un humano, por CLI (`investigar-herramienta`,
  `investigar-lote`, `promover-borrador`, `generar-informe`,
  `aprobar-borrador`, `actualizar-estrategia-afiliacion`,
  `informe-historial`). Nunca corre en producción.
- **Relaciones:**
  - → **Atlas Curator**: `promover.ts` llama a `detectarCasiDuplicados()`
    antes de escribir cualquier herramienta nueva — comprobación bloqueante.
  - → **Atlas Affiliate Manager**: siembra la primera `CuentaAfiliado` al
    promover (con `verificacionPendiente` si aplica), pero **la gestión
    posterior de esa cuenta pasa a ser propiedad de Affiliate Manager**
    (ver corrección de propiedad de dominio en la sección "Correcciones
    aplicadas" más abajo).
  - Nunca decide el ranking (eso es de Advisor) ni toca `EstrategiaAfiliacion`
    una vez que Affiliate Manager la gestiona activamente.

## 2. Atlas Advisor

- **Nombre canónico:** Atlas Advisor. *(Nombre de producto usado antes en la
  hoja de ruta: "Atlas Evaluador" — ver corrección de nombres más abajo.)*
- **Estado:** Implementado.
- **Carpeta:** `agents/atlas-advisor/`
- **Responsabilidad:** motor determinista de criterios (10+ señales,
  incluida detección de problema por texto libre y comparación todo-en-uno
  vs. especializada) que puntúa el catálogo público en vivo. Sin IA, sin
  coste, sin conocer nunca datos de afiliación.
- **Entradas:** `RespuestasUsuario` (cuestionario) + catálogo público de
  herramientas.
- **Salidas:** `ResultadoRecomendacion` — ranking completo (`top` + `todas`),
  cada herramienta con puntuación, detalle por criterio, razones y una
  explicación de plantilla.
- **Activación:** automática, dentro de `app/api/recomendaciones/route.ts`,
  cada vez que un usuario completa el cuestionario.
- **Relaciones:**
  - → **Atlas Recomendador**: le pasa el ranking ya calculado para que lo
    explique en prosa — **Recomendador nunca puede alterar ni un valor de
    ese ranking**, solo redactar sobre él.
  - Forman, juntos, el **Subsistema Advisor** (ver nota más abajo): dos
    agentes independientes que cooperan en cadena dentro de la misma
    petición HTTP, no un agente fusionado.
  - Nunca lee `AffiliateData` ni `EstrategiaAfiliacion` — cortafuegos
    estructural, no solo una promesa de comportamiento.

## 3. Atlas Recomendador

- **Nombre canónico:** Atlas Recomendador. También documentado como "Capa 2
  de Atlas Advisor" — es una descripción de su posición en el flujo, no un
  nombre alternativo: sigue siendo un agente independiente con su propia
  carpeta, sus propias entradas/salidas y su propia activación condicional.
- **Estado:** Implementado, **apagado por defecto en producción**
  (requiere `ATLAS_RECOMENDADOR_IA_ACTIVA=true`; a fecha de este documento
  no se ha activado en el entorno real).
- **Carpeta:** `agents/atlas-recomendador/`
- **Responsabilidad:** reescribe en prosa personalizada, vía IA, la
  explicación que ya calculó Advisor — nunca toca `puntuacionTotal`,
  `detalles` ni `razones`.
- **Entradas:** el `top` ya evaluado por Advisor + `RespuestasUsuario` +
  `ProveedorIA`.
- **Salidas:** las mismas herramientas evaluadas, con `explicacion`
  sustituida por prosa de IA — mismo orden, misma puntuación. Si la IA
  falla o no está activa, devuelve la explicación de Advisor sin cambios.
- **Activación:** automática, en la misma ruta que Advisor, condicionada
  a la variable de entorno. Sin activación manual.
- **Relaciones:**
  - ← **Atlas Advisor**: única fuente de su entrada; nunca calcula un
    ranking propio ni consulta el catálogo directamente.
  - Comparte con Advisor el contrato `ProveedorIA` de `agents/compartido/`
    (no una integración de IA propia).

> **Nota sobre el Subsistema Advisor:** Advisor y Recomendador cooperan en
> cadena (Advisor calcula → Recomendador explica) dentro de la misma
> petición, y por eso conviene pensarlos como un subsistema al hablar del
> "motor de recomendación" en conjunto. Pero siguen siendo dos agentes con
> responsabilidad, código, activación y ciclo de vida independientes — por
> decisión explícita, no se fusionan en uno solo.

## 4. Atlas Affiliate Manager

- **Estado:** Implementado (gestión operativa básica), con carencias
  identificadas para escalar a ~100 herramientas — ver la auditoría previa
  de este agente para el detalle completo de qué falta.
- **Carpeta:** `agents/atlas-affiliate-manager/`
- **Responsabilidad:** gestiona operativamente la relación real de Molnip
  con cada programa de afiliados ya confirmado por Researcher: registra y
  actualiza estados, guarda enlaces por segmento, detecta inconsistencias
  (cuentas activas sin enlace, estancadas, con verificación pendiente),
  prioriza qué solicitar primero por Puntuación Atlas, y selecciona el
  enlace real que se usa en cada clic de producción.
- **Entradas:** `EstrategiaAfiliacion` de cada herramienta (cuentas,
  enlaces, estados, comisiones) + el catálogo público (para cruzar con
  Puntuación Atlas).
- **Dónde vive su información (desde 2026-08-25):** en Postgres (Neon),
  tabla `estrategias_afiliacion`, no en archivos. El sistema de archivos de
  producción es efímero: cualquier cambio guardado en un archivo se perdería
  al reiniciar o volver a desplegar. Cada modificación queda además
  registrada en `historial_cambios_afiliacion` (qué campo, valor anterior,
  valor nuevo, fecha, usuario), una tabla que **solo admite inserciones**:
  la propia base de datos rechaza cualquier intento de modificar o borrar un
  registro pasado, así que restaurar un valor anterior crea un apunte nuevo
  en vez de reescribir la historia. Los archivos de
  `data/estrategia-afiliados/*.json` se conservan como copia de seguridad y
  origen de la migración inicial, pero **ya no son la fuente que lee ni
  escribe la aplicación**.
- **Salidas:** la URL de destino real del clic (o la oficial de respaldo);
  avisos de consistencia (bloqueantes en `verificar-datos`); lista
  priorizada de cuentas por solicitar; informe HTML de estado.
- **Activación:** mixta — `seleccionarEnlace.ts` corre automáticamente en
  cada clic real de un usuario; `consistencia.ts` corre dentro de
  `npm run verificar-datos`; el resto, por CLI humano
  (`npm run informe-afiliacion`).
- **Relaciones:**
  - ← **Atlas Researcher**: recibe la primera cuenta sembrada al promover
    una herramienta; a partir de ahí, la gestión es exclusiva de Affiliate
    Manager.
  - → **Atlas Revenue** (cuando exista): expone sus datos de afiliación
    (comisiones investigadas, estados, volumen por herramienta) para
    reporting cruzado — **Revenue solo lee estos datos, nunca los
    modifica ni decide sobre ellos**; la gestión operativa del programa de
    afiliados sigue siendo exclusiva de Affiliate Manager, sin excepción.
  - Nunca toca el ranking de Advisor ni combina comisión con puntuación en
    una cifra única (`priorizador.ts`, por diseño explícito).

## 5. Atlas Generador de Contenido

- **Estado:** Parcialmente implementado — Capa 1 (metadatos, sitemap,
  comparaciones, alternativas, JSON-LD, estructura de blog) completa; Capa 2
  (artículos redactados por IA) explícitamente diferida, sin código.
- **Carpeta:** `agents/atlas-generador-contenido/`
- **Responsabilidad:** genera todo lo necesario para que el catálogo y el
  blog sean indexables y atraigan tráfico orgánico: metadatos, sitemap,
  comparaciones par a par, alternativas, datos estructurados.
- **Entradas:** el catálogo público (herramientas, categorías, problemas,
  posts) y el id de la página en construcción.
- **Salidas:** objetos `Metadata` de Next.js, entradas de `sitemap.xml`,
  tablas comparativas, listas de alternativas, bloques JSON-LD.
- **Activación:** automática, dentro de los Server Components de Next.js,
  en cada build o petición de página. Ningún humano la dispara a mano.
- **Relaciones:**
  - Reutiliza el catálogo de Researcher y la Puntuación Atlas de Advisor;
    nunca duplica su lógica.
  - Todo enlace de salida que genera pasa por Affiliate Manager
    (`/herramienta/[id]/ir`), nunca directo a la web oficial.
  - → **Atlas Growth** (cuando exista): es quien le da a Growth el tráfico
    que medir — sin contenido indexado, no hay señal que analizar.

## 6. Atlas Mantenimiento

- **Estado:** Parcialmente implementado — Capa 1 (detección determinista)
  completa; Capa 2 (re-investigación asistida por IA) explícitamente
  pospuesta, sin código.
- **Carpeta:** `agents/atlas-mantenimiento/`
- **Responsabilidad:** detecta, sin IA y sin coste, fichas de herramientas
  y cuentas de afiliado que llevan más de 180 días sin revisar.
- **Entradas:** el catálogo completo con sus fechas de última revisión.
- **Salidas:** informe HTML de solo lectura con los avisos, priorizados por
  Puntuación Atlas.
- **Activación:** exclusivamente un humano, vía `npm run informe-mantenimiento`.
- **Relaciones:**
  - Eje distinto al de Curator: Mantenimiento vigila *frescura en el
    tiempo*, Curator vigila *calidad estructural* — sin solapamiento por
    diseño.
  - Coopera con Curator solo por informe si algún día se activa su Capa 2
    (re-investigación), nunca por código compartido.

## 7. Atlas Curator

- **Estado:** Implementado (ampliado el 2026-08-27 — ver "Taxonomía de dos
  ejes y evaluación por rutas separadas" en `ATLAS.md`). Por diseño nunca
  actúa por su cuenta: detecta, explica y propone; la acción es siempre
  humana.
- **Carpeta:** `agents/atlas-curator/`
- **Responsabilidad:** gobierna la calidad **estructural** del catálogo a
  escala. Cuatro frentes:
  - casi-duplicados antes de promoción (`duplicados.ts`);
  - equilibrio de taxonomía (`equilibrio.ts`) y **cobertura** de categorías
    —vacías, insuficientes, preparadas, sobrerrepresentadas y ausentes del
    marco mínimo— con el mínimo de alternativas configurable
    (`cobertura.ts`);
  - **validez de los valores**, no solo su presencia, distinguiendo un dato
    inválido de un dato que falta por investigar (`validez.ts`);
  - **coherencia de clasificación**: que lo que una ficha declara ser se
    corresponda con lo que sus propios datos respaldan (`coherencia.ts`).
    Es el contrapeso de la taxonomía de dos ejes: como declarar más
    categorías da más visibilidad, alguien tiene que comprobar que la
    reclamación esté respaldada.
- **Entradas:** una `HerramientaPropuesta` candidata + el catálogo activo
  (duplicados); el catálogo completo con **todas** las categorías, públicas
  y pendientes, para el resto.
- **Salidas:** avisos de duplicado (bloqueantes en promoción); informe HTML
  con cobertura, coherencia, validez, equilibrio y huecos editoriales; y dos
  **colas de investigación para Researcher** — por categoría (qué falta y
  cuánto) y por ficha (qué dato falta en cuál, con las comprobaciones
  concretas que dan la tarea por terminada). Todo lo demás es informativo:
  Curator nunca escribe en el catálogo.
- **Activación:** mixta — la detección de duplicados corre automáticamente
  dentro de `promover.ts` (Researcher); el resto, solo vía
  `npm run informe-curador` (humano).
- **Relaciones:**
  - → **Atlas Researcher**: única comprobación bloqueante que Curator aporta
    al flujo de promoción, y destinatario de las dos colas de investigación.
    Curator dice QUÉ falta; Researcher decide qué herramienta concreta
    investigar y con qué evidencia. Curator nunca nombra candidatas:
    proponerlas sin investigarlas sería inventarlas.
  - → **Atlas Mantenimiento**: Curator le PIDE la vigencia
    (`detectarHerramientasDesactualizadas`) y la muestra en su informe, pero
    no la recalcula. Dos umbrales de frescura serían dos verdades el día que
    uno cambie.
  - Ninguna relación con Advisor: Curator gobierna qué entra y en qué estado
    está el catálogo, nunca cómo se puntúa.
  - Ninguna relación con Affiliate Manager: cero referencias a afiliación en
    todo el agente, comprobado por prueba.

---

## 8. Atlas Growth

- **Estado:** Planificado — sin diseñar, sin código.
- **Carpeta:** ninguna todavía.
- **Responsabilidad prevista:** medir tráfico real y eventos de
  clic/conversión para informar decisiones de crecimiento. Sin diseño
  detallado todavía — no inventamos aquí un alcance que nadie ha aprobado.
- **Infraestructura ya existente que previsiblemente reutilizará:** el
  seguimiento de clics ya está construido (`lib/analitica/`,
  `app/api/clic/route.ts`) como infraestructura compartida, no como parte
  de este agente — hoy solo registra un log estructurado por clic, sin
  ningún agente que lo analice.
- **Activación prevista:** no decidida.
- **Relaciones previstas:** depende de que Generador de Contenido tenga
  tráfico real que medir; el `priorizador.ts` de Affiliate Manager ya usa
  la Puntuación Atlas como proxy de "cuánto se hace clic" por falta de
  datos reales — los datos de Growth podrían sustituir o complementar ese
  proxy en el futuro, sin que eso esté decidido todavía.

## 9. Atlas Assistant

- **Estado:** Planificado — sin diseñar, sin código.
- **Carpeta:** ninguna todavía.
- **Responsabilidad prevista:** interfaz conversacional que reutiliza la
  salida de Advisor/Recomendador como alternativa al cuestionario
  estructurado.
- **Activación prevista:** no decidida.
- **Relaciones previstas:** consumidor de la salida del Subsistema Advisor,
  igual que hoy lo son las pantallas del cuestionario — nunca calcularía su
  propio ranking.

## 10. Atlas Orchestrator

- **Estado:** Planificado — sin diseñar, sin código.
- **Carpeta:** ninguna todavía.
- **Responsabilidad prevista:** coordinar cuándo se activa cada agente que
  hoy depende de que un humano recuerde ejecutarlo. Hoy existen tres
  procesos periódicos sueltos que ya cumplirían el umbral que `ATLAS.md`
  fijó para justificarlo: `informe-afiliacion`, `informe-mantenimiento`,
  `informe-curador`.
- **Activación prevista:** no decidida — probablemente el único agente que,
  por definición, no es activado por un humano ni por una petición de
  usuario, sino que él mismo dispara a los demás.
- **Relaciones previstas:** coordina, no sustituye — nunca contendría la
  lógica de negocio de ningún otro agente, solo decide cuándo invocar la
  que ya existe en cada uno.

## 11. Atlas Revenue

- **Estado:** Planificado — **recuperado el 2026-08-25** como agente
  oficial de la arquitectura (ver "Correcciones aplicadas" más abajo).
  Sin diseño detallado ni código todavía.
- **Carpeta:** ninguna todavía.
- **Responsabilidad prevista, por separación explícita de esta decisión:**
  - **Atlas Affiliate Manager gestiona operativamente** programas,
    solicitudes, estados, enlaces y comisiones — un canal de ingreso a la
    vez, en el detalle operativo de cada herramienta.
  - **Atlas Revenue analiza y optimiza el modelo económico completo** —
    todas las fuentes de ingreso en conjunto (ver `MODELO-DE-NEGOCIO.md`),
    reporting cruzado entre canales, salud financiera agregada.
  - **Regla sin excepción:** Revenue nunca puede modificar el orden
    objetivo de las recomendaciones de Advisor, ni escribir directamente en
    `EstrategiaAfiliacion` (eso sigue siendo exclusivo de Affiliate
    Manager). Revenue **lee**, analiza y sugiere — nunca ejecuta ni decide
    sobre el catálogo, el ranking o las relaciones con proveedores.
- **Entradas previstas:** datos ya calculados por Affiliate Manager (y por
  cualquier fuente de ingreso futura que se active — publicidad,
  patrocinios, Premium), nunca el catálogo público directamente para
  alterar recomendaciones.
- **Salidas previstas:** informes de salud económica cruzada, señales para
  decisiones de negocio — nunca una escritura sobre el ranking ni sobre el
  estado operativo de una cuenta de afiliado.
- **Activación prevista:** no decidida.
- **Condición de disparo recomendada** (heredada de la decisión original,
  ahora confirmada en vez de descartada): tiene poco sentido construirlo
  mientras exista una sola fuente de ingreso real (afiliación) — el
  "análisis cruzado" que lo define no tiene todavía nada que cruzar. Se
  recomienda diseñarlo cuando exista una segunda fuente de ingreso real
  activa. Esta es una recomendación a confirmar contigo en el plan de
  sprints, no una decisión ya tomada.
- **Relaciones previstas:**
  - ← **Atlas Affiliate Manager**: única fuente de datos de afiliación,
    en modo solo lectura.
  - ← futuras fuentes de ingreso (publicidad, patrocinios, Premium) cuando
    existan.
  - Nunca → **Atlas Advisor**: no existe ninguna relación de escritura en
    esa dirección, por diseño irrevocable.

---

## Correcciones aplicadas sobre la documentación anterior

Estas son, exactamente, las contradicciones documentales que pediste
corregir — no se ha tocado ningún otro contenido de `ATLAS.md` salvo estos
dos puntos:

1. **Nombre Advisor/Evaluador.** A partir de este documento, **"Atlas
   Advisor" es el nombre canónico** en toda decisión de arquitectura y
   documentación futura. "Evaluador" se conserva únicamente como nombre de
   personaje en la capa de presentación pública (`lib/agentes.ts`, usado
   hoy en el comparador, la pantalla de recomendación, la insignia de
   confianza y la pantalla de carga) — un nombre de cara al usuario, nunca
   un nombre de arquitectura. `ATLAS.md` se corrige para dejar de presentar
   ambos nombres como equivalentes sin jerarquía.

2. **Estado de Atlas Revenue.** Ya no está "descartado". `ATLAS.md`
   describía su descarte por solapamiento con Affiliate Manager cuando solo
   existía afiliación como fuente de ingreso — esa lectura se corrige: el
   solapamiento se resuelve con la separación operativo/estratégico de
   arriba, no descartando el agente. Pasa a figurar como agente 11,
   planificado, con la condición de disparo recomendada (no forzosa)
   heredada de la decisión original.

### Contradicciones detectadas en la auditoría anterior que siguen abiertas (no son documentales, son de código/UI — fuera del alcance de esta corrección, que pediste explícitamente limitar a documentación)

- La home ya no menciona "tres agentes" (sprint ya aprobado y desplegado),
  pero el comparador, la pantalla de recomendación, la insignia de
  confianza y la pantalla de carga siguen mostrando los tres personajes de
  `lib/agentes.ts` — hoy desalineados con una arquitectura de 11 agentes
  reales, no 3.
- `/agentes` sigue siendo indexable en el sitemap aunque ya no tiene ningún
  enlace interno.
- El comentario de `app/agentes/page.tsx` que dice que la página "se
  enlaza solo desde la franja 'Así piensa Atlas' del home" está desactualizado.

Ninguna de las tres se toca en este documento ni en `ATLAS.md` — son
cambios de código y de interfaz pública, y pediste explícitamente no
modificar la lógica funcional ni la web en este sprint. Quedan registradas
aquí para que no se pierdan, a la espera de que decidas si entran en un
sprint futuro.
