# Cómo ejecutar la verificación del lote 1

Esto lo ejecuta la propietaria en su ordenador, no el agente. La razón es
simple: la clave de Gemini está en Vercel y en su cuenta de Google, y no puede
añadirse al entorno remoto donde trabaja Claude. El script pide las páginas
oficiales de cada herramienta y guarda lo que Gemini haya podido leer de ellas.

**La clave no se escribe nunca en un archivo, ni en el repositorio, ni en la
pantalla.** Vive sólo en la ventana de PowerShell mientras está abierta, y
desaparece al cerrarla.

## Antes de empezar

Descarga la última versión de la rama `claude/atlas-advisor-mvp-4e854s`. El
script no existe en descargas anteriores.

Abre **una** ventana de PowerShell y quédate con ella hasta el final: lo que se
carga en una ventana no existe en las demás.

## Los tres pasos

**1. Colócate en la carpeta del proyecto.**

```powershell
cd C:\Users\cupit\Downloads\<carpeta-del-proyecto>
```

**2. Carga la clave.** Cópiala antes desde <https://aistudio.google.com/apikey>,
pega la línea siguiente, pulsa Enter, y **sólo entonces** pega la clave cuando
te la pida. No se verá nada al pegarla: está oculta a propósito.

```powershell
$s = Read-Host "Pega la clave y pulsa Enter" -AsSecureString; $env:GEMINI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)); Write-Output ("Clave cargada. Longitud: " + $env:GEMINI_API_KEY.Length)
```

**3. Lanza la verificación.**

```powershell
powershell -ExecutionPolicy Bypass -File data\verificacion\ejecutar-lote.ps1
```

## Qué va a pasar

Recorre las 30 herramientas del lote 1 y hace **60 llamadas** a Gemini —dos por
herramienta—, con una pausa de 6 segundos entre ellas para no chocar con los
límites de la cuenta. Calcula entre **15 y 25 minutos**.

Por cada herramienta verás una línea como ésta:

```
· Pipedrive (pipedrive) — 25 capacidades en 2 llamada(s)
    bloque 1/2 — 13 capacidades, 4210 ms
    bloque 2/2 — 12 capacidades, 3980 ms
    guardado · 25 de 25 capacidades respondidas · 2 de 4 direcciones leídas
```

«2 de 4 direcciones leídas» no es un fallo. Cada herramienta tiene dos
direcciones y se piden en las dos llamadas; que alguna no se pueda leer es
información válida, y queda registrada como tal.

Los resultados se guardan en `data\verificacion\salida\`, un archivo por
herramienta. **Ninguno contiene la clave.**

## Si algo va mal

- **Se corta a mitad.** Vuelve a lanzar el mismo comando: lo ya hecho no se
  repite. Con `-Rehacer` se fuerza a empezar de cero.
- **Errores de límite de la cuenta.** Reintenta solo, hasta tres veces, esperando
  cada vez más. Si aun así falla, lánzalo con `-PausaSegundos 15`.
- **Cualquier otra cosa.** Se para y lo dice. Copia el mensaje tal cual, pero
  **comprueba antes que no aparece la clave en él** — el script la oculta, pero
  míralo igualmente antes de pegarlo en ningún sitio.

## Cuando termine

Envía un único archivo: `data\verificacion\salida\todo-lote1.json`. Lo escribe
el propio script al terminar y reúne las 30 herramientas. Ahí no hay ninguna decisión
tomada todavía: son las respuestas crudas. Convertirlas en registros de
verificación —aplicando las reglas de `repositorio.ts`, que exigen cita
literal, fuente de primera mano y plan mínimo real— es el paso siguiente, y se
hace en el repositorio, donde hay pruebas que lo vigilan.

## Cuando ya no lo necesites

Cierra la ventana de PowerShell. La clave desaparece con ella.

---

# La repesca

Después de convertir la salida, hay pares que no se pudieron dar por buenos:
respuestas que se cortaron a mitad, y capacidades afirmadas con cita buena pero
sin decir en qué plan. La repesca vuelve a preguntar **sólo eso**.

No se repiten las herramientas enteras. En el lote 1 eso significa **241 pares
en vez de 765**.

## Los tres pasos

Con la misma ventana y la misma clave cargada:

```powershell
powershell -ExecutionPolicy Bypass -File data\verificacion\repescar.ps1
```

Antes de preguntar nada, el script **resuelve las redirecciones** de todas las
direcciones con el cliente HTTP y guarda la cadena —`/pricing/ → 301 →
/pricing-plans/`—. Eso convierte una equivalencia supuesta en una demostrada,
que es lo que hace falta para que esas citas cuenten. No gasta ni una llamada.

Si sólo quieres eso, sin preguntar nada más:

```powershell
powershell -ExecutionPolicy Bypass -File data\verificacion\repescar.ps1 -SoloRedirecciones
```

Al terminar vuelve a escribir `todo-lote1.json` con todo dentro, listo para
enviar.

## Si una dirección de una ficha lleva a otro sitio

No se cambia la ficha. Las direcciones del catálogo son datos de producto y las
decide la propietaria. Lo que se hace es declararlo en
`data/verificacion/sustituciones.json`, con su motivo y su fecha, y sólo afecta
a la verificación:

```json
[
  {
    "herramientaId": "insightly",
    "urlPrecios": "https://www.insightly.com/pricing-plans/",
    "motivo": "La dirección de la ficha redirige aquí, comprobado con la cadena HTTP.",
    "fecha": "2026-09-07"
  }
]
```

Ahí mismo se declara qué direcciones son **documentación oficial**, que —junto a
la página de tarifas— es lo único que puede situar una capacidad en un plan
concreto. Una portada no.
