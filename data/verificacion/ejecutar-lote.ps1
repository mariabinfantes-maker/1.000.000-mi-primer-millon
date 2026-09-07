<#
    Verificación de F2 contra fuentes oficiales — ejecución local.

    POR QUÉ ESTE SCRIPT EXISTE Y NO LO EJECUTA EL AGENTE
    La clave de Gemini vive en Vercel y en la cuenta de Google de la
    propietaria, no en el entorno remoto donde trabaja Claude. Este script se
    ejecuta en el ordenador de la propietaria, que sí la tiene. La clave se lee
    de la variable de entorno GEMINI_API_KEY y NUNCA se escribe en pantalla, en
    un archivo ni en el repositorio.

    QUÉ HACE
    Por cada herramienta del lote indicado, le pide a Gemini que LEA sus
    páginas oficiales —con url_context— y responda, capacidad por capacidad, si
    la tiene, en qué plan, y con qué frase literal de la página lo sostiene.
    Guarda la respuesta cruda tal cual, sin interpretarla: convertir eso en
    registros de verificación es trabajo del repositorio, donde están las
    reglas y las pruebas.

    QUÉ NO HACE
    No decide nada. No escribe registros.json. No toca fichas, catálogo, motor
    ni afiliación. Si algo falla, se para y lo dice.

    USO
        $env:GEMINI_API_KEY = "..."        # una sola vez, en esta ventana
        powershell -ExecutionPolicy Bypass -File data\verificacion\ejecutar-lote.ps1

    Se puede parar con Ctrl+C y volver a lanzar: lo ya hecho no se repite.
#>

[CmdletBinding()]
param(
    [ValidateSet(1, 2, 3)][int] $Lote = 1,
    [string] $Salida = "",
    [int] $PorLlamada = 13,
    [int] $PausaSegundos = 6,
    [int] $Reintentos = 3,
    [string] $Modelo = "gemini-3.6-flash",
    [switch] $Rehacer
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# --------------------------------------------------------------------------
# Rutas y comprobaciones previas
# --------------------------------------------------------------------------

$dirVerificacion = $PSScriptRoot
$raiz            = Split-Path -Parent (Split-Path -Parent $dirVerificacion)
if ([string]::IsNullOrWhiteSpace($Salida)) { $Salida = Join-Path $dirVerificacion "salida" }

if (-not $env:GEMINI_API_KEY) {
    throw "Falta GEMINI_API_KEY en esta ventana. Cárgala antes de lanzar el script (no la escribas en ningún archivo)."
}

function Leer-Json([string] $ruta) {
    if (-not (Test-Path -LiteralPath $ruta)) { throw "No encuentro el archivo: $ruta" }
    return (Get-Content -LiteralPath $ruta -Raw -Encoding UTF8 | ConvertFrom-Json)
}

function Escribir-Json([string] $ruta, $objeto) {
    $json = $objeto | ConvertTo-Json -Depth 20
    $sinBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($ruta, $json, $sinBom)
}

$plan        = Leer-Json (Join-Path $dirVerificacion "plan.json")
$plausibles  = Leer-Json (Join-Path $dirVerificacion "plausibles.json")
$vocabulario = Leer-Json (Join-Path $raiz "data\vocabulario\vocabulario.json")

if ($plan.versionVocabulario -ne $vocabulario.version) {
    throw "El plan verifica contra el vocabulario $($plan.versionVocabulario) y el vocabulario instalado es $($vocabulario.version). Algo se ha movido: para y revisa."
}

$loteElegido = $plan.lotes | Where-Object { $_.numero -eq $Lote }
if (-not $loteElegido) { throw "El plan no tiene ningún lote $Lote." }

$capacidadPorId = @{}
foreach ($c in $vocabulario.capacidades) { $capacidadPorId[$c.id] = $c }

New-Item -ItemType Directory -Force -Path $Salida | Out-Null

$hoy = (Get-Date).ToString("yyyy-MM-dd")

Write-Host ""
Write-Host "Lote $Lote — $($loteElegido.nombre)" -ForegroundColor Cyan
Write-Host "$($loteElegido.herramientaIds.Count) herramientas · vocabulario $($vocabulario.version) · modelo $Modelo"
Write-Host "Resultados en: $Salida"
Write-Host ""

# --------------------------------------------------------------------------
# Llamada a Gemini con url_context
# --------------------------------------------------------------------------

function Invocar-Gemini([string] $prompt, [string[]] $urls) {
    $texto = $prompt + "`n`nDirecciones que debes leer antes de responder:`n" + (($urls | ForEach-Object { "- $_" }) -join "`n")

    $cuerpo = @{
        contents         = @(@{ parts = @(@{ text = $texto }) })
        tools            = @(@{ url_context = @{} })
        generationConfig = @{ temperature = 0.1; maxOutputTokens = 8192 }
    } | ConvertTo-Json -Depth 12 -Compress

    $bytes = [System.Text.Encoding]::UTF8.GetBytes($cuerpo)
    $uri   = "https://generativelanguage.googleapis.com/v1beta/models/$Modelo`:generateContent?key=$($env:GEMINI_API_KEY)"

    for ($intento = 1; $intento -le $Reintentos; $intento++) {
        try {
            return Invoke-RestMethod -Method Post -Uri $uri -ContentType "application/json; charset=utf-8" -Body $bytes
        } catch {
            $mensaje = $_.Exception.Message
            # La clave viaja en la URL: nunca se muestra el mensaje sin filtrar.
            $mensaje = $mensaje -replace [regex]::Escape($env:GEMINI_API_KEY), "«clave oculta»"
            if ($intento -eq $Reintentos) { throw "Gemini falló tras $Reintentos intentos: $mensaje" }
            $espera = [math]::Pow(2, $intento) * 3
            Write-Host "      reintento $intento tras $espera s ($mensaje)" -ForegroundColor DarkYellow
            Start-Sleep -Seconds $espera
        }
    }
}

function Extraer-Texto($respuesta) {
    $t = $respuesta.candidates[0].content.parts[0].text
    if (-not $t) { return "" }
    return ($t -replace '^\s*```(?:json)?\s*', '' -replace '\s*```\s*$', '').Trim()
}

function Extraer-Urls($respuesta) {
    $metadatos = $respuesta.candidates[0].urlContextMetadata.urlMetadata
    if (-not $metadatos) { return @() }
    return @($metadatos | ForEach-Object {
        [pscustomobject]@{
            url        = $_.retrievedUrl
            estado     = $_.urlRetrievalStatus
            recuperada = ($_.urlRetrievalStatus -eq "URL_RETRIEVAL_STATUS_SUCCESS")
        }
    })
}

# --------------------------------------------------------------------------
# El encargo, redactado una sola vez
# --------------------------------------------------------------------------

function Construir-Prompt($ficha, $capacidades) {
    $lista = ($capacidades | ForEach-Object {
        $c = $_
        $no = if ($c.noEs) { " FRONTERA: $($c.noEs)" } else { "" }
        "- $($c.id) | $($c.etiqueta): $($c.definicion)$no"
    }) -join "`n"

    return @"
Eres un verificador. Tu trabajo NO es describir la herramienta ni venderla: es
comprobar, leyendo únicamente las páginas oficiales que te doy, qué se puede
afirmar de ella con una frase de esas páginas delante.

HERRAMIENTA: $($ficha.nombre)

REGLAS, y son innegociables:
1. Usa SOLO el contenido de las direcciones que te doy. No uses lo que sepas de
   antes sobre esta herramienta. Si no lo has leído en esas páginas, no lo sabes.
2. "no_documentado" es una respuesta correcta y frecuente. No es un hueco que
   rellenar. Prefiero cincuenta "no_documentado" honestos a una sola afirmación
   que no puedas sostener con una cita.
3. Para responder "si" necesitas copiar una cita LITERAL de la página, palabra
   por palabra, que lo demuestre por sí sola. Si tienes que razonar o deducir
   para llegar de la cita a la afirmación, la respuesta es "no_documentado".
4. Que sea una herramienta famosa, grande o completa no prueba nada.
5. Respeta la FRONTERA de cada capacidad: si lo que has leído es la capacidad
   vecina y no ésta, responde "no_documentado".
6. Responde ÚNICAMENTE con un array JSON. Sin texto antes ni después.

CAPACIDADES A COMPROBAR:
$lista

FORMATO DE CADA ELEMENTO DEL ARRAY:
{
  "capacidadId": "el identificador exacto de la lista",
  "veredicto": "si" | "no" | "no_documentado",
  "profundidad": "nativa" | "modulo" | "integracion" | null,
  "integraCon": "obligatorio si profundidad es integracion; si no, null",
  "planMinimo": "nombre exacto del plan más barato donde existe, tal y como lo escribe el fabricante; null si la página no lo dice",
  "urlFuente": "la dirección concreta de la que sacas la cita",
  "cita": "la frase literal, copiada tal cual de esa página",
  "nota": "si es no_documentado, qué buscaste y qué encontraste en su lugar; si no, límites que cambien la decisión"
}

"no" significa que la página dice expresamente que NO lo hace. Si simplemente no
aparece, eso es "no_documentado".
"@
}

# --------------------------------------------------------------------------
# Recorrido del lote
# --------------------------------------------------------------------------

$hechas = 0
$saltadas = 0
$llamadas = 0
$comienzo = Get-Date

foreach ($id in $loteElegido.herramientaIds) {

    $destino = Join-Path $Salida "$id.json"
    if ((Test-Path -LiteralPath $destino) -and -not $Rehacer) {
        Write-Host "· $id — ya estaba hecho, lo salto" -ForegroundColor DarkGray
        $saltadas++
        continue
    }

    $seleccion = $plausibles | Where-Object { $_.herramientaId -eq $id -and $_.lote -eq $Lote }
    if (-not $seleccion) { throw "$id no tiene selección congelada en plausibles.json. Sin ella no se verifica." }
    if ($seleccion.Count -gt 1) { throw "$id aparece más de una vez en plausibles.json." }

    $ficha = Leer-Json (Join-Path $raiz "data\herramientas\$id.json")

    $urls = @()
    if ($ficha.urlPrecios)    { $urls += $ficha.urlPrecios }
    if ($ficha.paginaOficial) { $urls += $ficha.paginaOficial }
    $urls = @($urls | Select-Object -Unique)
    if (-not $urls.Count) { throw "$id no tiene ninguna dirección oficial en su ficha." }

    $ids = @($seleccion.capacidadIds)
    $bloques = [math]::Ceiling($ids.Count / $PorLlamada)
    Write-Host "· $($ficha.nombre) ($id) — $($ids.Count) capacidades en $bloques llamada(s)" -ForegroundColor White

    $respuestas = @()
    $urlsVistas = @()
    $errores    = @()

    for ($b = 0; $b -lt $bloques; $b++) {
        $trozo = @($ids | Select-Object -Skip ($b * $PorLlamada) -First $PorLlamada)
        $caps  = @($trozo | ForEach-Object { $capacidadPorId[$_] })
        if ($caps -contains $null) { throw "${id}: alguna capacidad de la selección no existe en el vocabulario." }

        $t0 = Get-Date
        $respuesta = Invocar-Gemini (Construir-Prompt $ficha $caps) $urls
        $llamadas++
        $ms = [int]((Get-Date) - $t0).TotalMilliseconds

        $urlsVistas += Extraer-Urls $respuesta
        $texto = Extraer-Texto $respuesta

        try {
            $parseado = $texto | ConvertFrom-Json
            $respuestas += @($parseado)
            Write-Host "    bloque $($b + 1)/$bloques — $($trozo.Count) capacidades, $ms ms" -ForegroundColor DarkGray
        } catch {
            $errores += [pscustomobject]@{ bloque = $b + 1; motivo = "la respuesta no es JSON"; crudo = $texto }
            Write-Host "    bloque $($b + 1)/$bloques — respuesta no interpretable, queda registrada" -ForegroundColor Yellow
        }

        if ($b -lt $bloques - 1) { Start-Sleep -Seconds $PausaSegundos }
    }

    <#
        La definición de cada capacidad nombra a sus vecinas en el campo
        "noEs" —es lo que marca la frontera—, así que el prompt contiene
        identificadores que NO se han preguntado. Si el modelo responde por
        ellos, esas respuestas se apartan en vez de colarse: preguntar por
        trece capacidades y guardar dieciséis es exactamente cómo se llena una
        ficha de datos que nadie pidió.
    #>
    $porId       = @{}
    $intrusas    = @()
    foreach ($r in $respuestas) {
        if ($null -eq $r.capacidadId) { continue }
        if ($ids -contains $r.capacidadId) { $porId[$r.capacidadId] = $r } else { $intrusas += $r }
    }
    $sinRespuesta = @($ids | Where-Object { -not $porId.ContainsKey($_) })

    Escribir-Json $destino ([pscustomobject]@{
        herramientaId      = $id
        nombre             = $ficha.nombre
        lote               = $Lote
        fechaConsulta      = $hoy
        modelo             = $Modelo
        urlsSolicitadas    = $urls
        urlsRecuperadas    = @($urlsVistas)
        capacidadesPedidas = $ids
        respuestas         = @($porId.Values)
        sinRespuesta       = $sinRespuesta
        intrusas           = @($intrusas)
        errores            = @($errores)
    })

    $leidas = @($urlsVistas | Where-Object { $_.recuperada }).Count
    Write-Host "    guardado · $($porId.Count) de $($ids.Count) capacidades respondidas · $leidas de $($urlsVistas.Count) direcciones leídas" -ForegroundColor Green
    if ($sinRespuesta.Count) { Write-Host "    sin respuesta: $($sinRespuesta -join ', ')" -ForegroundColor Yellow }
    if ($intrusas.Count)     { Write-Host "    $($intrusas.Count) respuesta(s) por capacidades que no se preguntaron, apartadas" -ForegroundColor Yellow }

    $hechas++
    Start-Sleep -Seconds $PausaSegundos
}

# Un solo archivo con todo, para poder enviarlo sin adjuntar treinta.
$todos = @()
foreach ($id in $loteElegido.herramientaIds) {
    $ruta = Join-Path $Salida "$id.json"
    if (Test-Path -LiteralPath $ruta) { $todos += (Leer-Json $ruta) }
}
$juntos = Join-Path $Salida "todo-lote$Lote.json"
Escribir-Json $juntos ([pscustomobject]@{
    lote               = $Lote
    fecha              = $hoy
    modelo             = $Modelo
    versionVocabulario = $vocabulario.version
    herramientas       = @($todos)
})

$minutos = [math]::Round(((Get-Date) - $comienzo).TotalMinutes, 1)

Write-Host ""
Write-Host "Terminado." -ForegroundColor Cyan
Write-Host "  herramientas verificadas: $hechas"
Write-Host "  ya estaban hechas:        $saltadas"
Write-Host "  llamadas a Gemini:        $llamadas"
Write-Host "  tiempo:                   $minutos min"
Write-Host ""
Write-Host "Envía este archivo para convertirlo en registros de verificación:"
Write-Host "  $juntos" -ForegroundColor White
Write-Host "No contiene la clave." -ForegroundColor DarkGray
