# Lote `cursos-1` del Researcher — PENDIENTE DE VERIFICAR

**Estado: borradores sin promover. Nada de esta carpeta está en el catálogo.**

Primer disparo autorizado por la propietaria el 2026-09-16, desde el entorno
remoto, con la cuenta de Gemini de pago. Seis llamadas (prechequeo de
afiliación e investigación completa por candidata). `ejecucion.log` es la
salida del comando tal cual; no contiene claves ni secretos (comprobado).

## Qué hay aquí

- `borradores/herramientas/*.json` — la ficha que escribió el modelo.
- `borradores/afiliados/*.json` — lo que el modelo dijo de la afiliación.
- `borradores/metadatos/*.json` — las direcciones que el modelo declara haber usado.
- `verificacion.json` — lo que se comprobó después, campo a campo, con
  fuente, fecha, cita y estado: `verificado`, `corregido`, `desconocido` o
  `no_consta`.

## Por qué está aquí y no en `data/borradores/`

`data/borradores/` está fuera de git a propósito (estado de trabajo local),
y el entorno remoto donde se lanzó el lote es efímero. Para aprobar o
promover un borrador con `npm run aprobar-borrador` y `npm run
promover-borrador` hay que copiarlo antes a `data/borradores/`. **Antes de
eso, los datos corregidos en `verificacion.json` tienen que llevarse a la
ficha**; los borradores se conservan tal cual los escribió el modelo, como
evidencia de lo que devolvió.

## Límite del método de verificación

La lectura directa de las páginas oficiales está bloqueada desde el entorno
remoto. Se usó el buscador restringido a los dominios oficiales, así que las
citas son las frases que devolvió el buscador a partir de esas páginas y no
una lectura literal. Cuentan como pista fuerte con fuente y fecha, y quedan
**pendientes de cita literal** antes de que ningún dato entre en una ficha.
Lo que el buscador no devolvió está como `desconocido`.
