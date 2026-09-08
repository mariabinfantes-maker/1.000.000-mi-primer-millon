<#
    Repesca de la verificación de F2 — ejecución local.

    Repite SÓLO lo que hace falta, no las herramientas enteras. La primera
    vuelta fueron dos horas y cuarto del ordenador de la propietaria; repetir a
    lo bruto habría vuelto a pagar unos 290 pares para recuperar 133.

    Hace tres cosas, en este orden:

    1. RESUELVE LAS REDIRECCIONES con el cliente HTTP y guarda la cadena
       —«/pricing/ → 301 → /pricing-plans/»—. Eso convierte una equivalencia
       supuesta en una demostrada, que es lo que la propietaria exigió para
       aceptarlas. No cuesta ni una llamada a Gemini.

    2. PREGUNTA LAS CAPACIDADES que se quedaron sin respuesta porque el modelo
       se cortó a mitad. En bloques pequeños, para que no vuelva a pasar.

    3. PREGUNTA SÓLO EL PLAN de las capacidades que ya están afirmadas con cita
       buena pero cuyo plan falta o se apoyaba en una portada. Volver a
       preguntar la capacidad entera tiraría una evidencia que ya vale.

    La clave se lee de GEMINI_API_KEY y NUNCA se escribe en pantalla, en un
    archivo ni en el repositorio.

    USO
        powershell -ExecutionPolicy Bypass -File data\verificacion\repescar.ps1

    Comparte estructura con ejecutar-lote.ps1 a propósito: se duplica lo justo
    para que cada script se pueda lanzar solo, sin módulos ni rutas relativas
    que en Windows PowerShell 5.1 dan más problemas que la copia.
#>

[CmdletBinding()]
param(
    [ValidateSet(1, 2, 3)][int] $Lote = 1,
    [string] $Salida = "",
    [int] $PorLlamada = 5,
    [int] $PausaSegundos = 6,
    [int] $Reintentos = 3,
    [int] $TiempoMaximoSegundos = 180,
    [string] $Modelo = "gemini-3.6-flash",
    [switch] $SoloRedirecciones
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

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
    <#
        -InputObject y NO la tubería: al pasar por `|`, una lista de UN solo
        elemento se desenvuelve y se escribe como objeto suelto en vez de como
        lista. El registro de errores lo destapó — con un fallo salía `{...}` y
        con dos `[{...},{...}]`, y quien lo leyera tendría que adivinar cuál de
        las dos formas le toca.
    #>
    $json = ConvertTo-Json -InputObject $objeto -Depth 20
    $sinBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($ruta, $json, $sinBom)
}

$plan        = Leer-Json (Join-Path $dirVerificacion "plan.json")
$vocabulario = Leer-Json (Join-Path $raiz "data\vocabulario\vocabulario.json")
$tareas      = @(Leer-Json (Join-Path $dirVerificacion "tareas.json"))

if ($plan.versionVocabulario -ne $vocabulario.version) {
    throw "El plan verifica contra el vocabulario $($plan.versionVocabulario) y el instalado es $($vocabulario.version). Para y revisa."
}

$capacidadPorId = @{}
foreach ($c in $vocabulario.capacidades) { $capacidadPorId[$c.id] = $c }

$loteElegido = $plan.lotes | Where-Object { $_.numero -eq $Lote }
$hoy = (Get-Date).ToString("yyyy-MM-dd")

Write-Host ""
Write-Host "Repesca del lote $Lote" -ForegroundColor Cyan
Write-Host "$($tareas.Count) tarea(s) · $(($tareas | ForEach-Object { $_.capacidadIds.Count } | Measure-Object -Sum).Sum) pares"
Write-Host ""

# --------------------------------------------------------------------------
# 1. Redirecciones, demostradas y no supuestas
# --------------------------------------------------------------------------

<#
    Resolver una redirección de verdad, y decir cuándo no se ha podido.

    La primera versión falló en los tres sitios donde podía fallar, y se vio con
    los datos: seis servidores devolvieron 403 a la petición —bloquean lo que no
    parece un navegador—, once fallaron sin respuesta, y las tres direcciones
    que SÍ redirigen no se siguieron porque no se leyó la cabecera Location.

    Peor que no resolverlas: un 403 se guardaba como «final = solicitada», o
    sea, como si se hubiera comprobado que no redirige. Eso es afirmar algo que
    no se sabe, que es exactamente lo que este módulo entero existe para evitar.
    Ahora hay un campo `resuelta`, y sin él la cadena no vale como prueba.
#>
$AGENTE_NAVEGADOR = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

function Cabecera-Location($respuesta) {
    if (-not $respuesta) { return $null }
    try { $v = $respuesta.Headers["Location"]; if ($v) { return $v } } catch { }
    try { $v = $respuesta.GetResponseHeader("Location"); if ($v) { return $v } } catch { }
    return $null
}

function Resolver-Redireccion([string] $url) {
    $codigos  = @()
    $actual   = $url
    $resuelta = $false

    for ($salto = 0; $salto -lt 10; $salto++) {
        $respuesta = $null
        $fallo     = $null

        # HEAD primero por ser barato; si el servidor no lo admite, GET.
        foreach ($metodo in @("Head", "Get")) {
            try {
                $respuesta = Invoke-WebRequest -UseBasicParsing -Uri $actual -Method $metodo `
                    -MaximumRedirection 0 -TimeoutSec 30 -UserAgent $AGENTE_NAVEGADOR -ErrorAction Stop
                $fallo = $null
                break
            } catch {
                $fallo = $_
                $r = $fallo.Exception.Response
                # Una redirección llega como excepción con -MaximumRedirection 0:
                # es respuesta buena, no hace falta reintentar con GET.
                if ($r -and [int]$r.StatusCode -ge 300 -and [int]$r.StatusCode -lt 400) { break }
            }
        }

        if ($respuesta) {
            $codigos += [int]$respuesta.StatusCode
            $resuelta = $true
            break
        }

        $r = $fallo.Exception.Response
        if (-not $r) { $codigos += -1; break }

        $codigo = [int]$r.StatusCode
        $codigos += $codigo
        if ($codigo -ge 300 -and $codigo -lt 400) {
            $destino = Cabecera-Location $r
            if (-not $destino) { break }
            $actual = (New-Object System.Uri ([Uri]$actual), $destino).AbsoluteUri
            continue
        }
        break
    }

    return [pscustomobject]@{ solicitada = $url; final = $actual; codigos = $codigos; resuelta = $resuelta }
}

Write-Host "Resolviendo redirecciones..." -ForegroundColor White
$conRedireccion = 0
$sinResolver = 0
foreach ($id in $loteElegido.herramientaIds) {
    $ruta = Join-Path $Salida "$id.json"
    if (-not (Test-Path -LiteralPath $ruta)) { continue }
    $datos = Leer-Json $ruta

    $cadenas = @()
    foreach ($u in @($datos.urlsSolicitadas)) {
        $c = Resolver-Redireccion $u
        $cadenas += $c
        if (-not $c.resuelta) {
            $sinResolver++
            Write-Host ("  {0}: NO se pudo comprobar {1} [{2}]" -f $id, $c.solicitada, ($c.codigos -join ", ")) -ForegroundColor Yellow
        } elseif ($c.final -ne $c.solicitada) {
            $conRedireccion++
            Write-Host ("  {0}: {1} -> {2} [{3}]" -f $id, $c.solicitada, $c.final, ($c.codigos -join ", ")) -ForegroundColor DarkGray
        }
    }

    $datos | Add-Member -NotePropertyName redirecciones -NotePropertyValue @($cadenas) -Force
    Escribir-Json $ruta $datos
}
Write-Host "  $conRedireccion redirigen · $sinResolver no se pudieron comprobar" -ForegroundColor Green
Write-Host ""

if ($SoloRedirecciones) {
    Write-Host "Sólo se pidieron las redirecciones. Nada más que hacer." -ForegroundColor Cyan
    exit 0
}

# --------------------------------------------------------------------------
# 2 y 3. Preguntar sólo lo que falta
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
            return Invoke-RestMethod -Method Post -Uri $uri -ContentType "application/json; charset=utf-8" -Body $bytes -TimeoutSec $TiempoMaximoSegundos
        } catch {
            $mensaje = $_.Exception.Message -replace [regex]::Escape($env:GEMINI_API_KEY), "«clave oculta»"
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

function Lista-De-Capacidades($capacidades) {
    return (($capacidades | ForEach-Object {
        $no = if ($_.noEs) { " FRONTERA: $($_.noEs)" } else { "" }
        "- $($_.id) | $($_.etiqueta): $($_.definicion)$no"
    }) -join "`n")
}

function Prompt-Capacidad($ficha, $capacidades) {
    $lineas = @(
        'Eres un verificador. Tu trabajo NO es describir la herramienta ni venderla: es'
        'comprobar, leyendo únicamente las páginas oficiales que te doy, qué se puede'
        'afirmar de ella con una frase de esas páginas delante.'
        ''
        "HERRAMIENTA: $($ficha.nombre)"
        ''
        'REGLAS, y son innegociables:'
        '1. Usa SOLO el contenido de las direcciones que te doy. No uses lo que sepas de'
        '   antes sobre esta herramienta. Si no lo has leído en esas páginas, no lo sabes.'
        '2. "no_documentado" es una respuesta correcta y frecuente. No es un hueco que'
        '   rellenar. Prefiero cincuenta "no_documentado" honestos a una sola afirmación'
        '   que no puedas sostener con una cita.'
        '3. Para responder "si" necesitas copiar una cita LITERAL de la página, palabra'
        '   por palabra, que lo demuestre por sí sola.'
        '4. Que sea una herramienta famosa, grande o completa no prueba nada.'
        '5. Respeta la FRONTERA de cada capacidad: si lo que has leído es la capacidad'
        '   vecina y no ésta, responde "no_documentado".'
        '6. Responde ÚNICAMENTE con un array JSON. Sin texto antes ni después.'
        '7. Sé breve en "nota": la respuesta entera debe caber sin cortarse.'
        ''
        'CAPACIDADES A COMPROBAR:'
        (Lista-De-Capacidades $capacidades)
        ''
        'FORMATO DE CADA ELEMENTO DEL ARRAY:'
        '{'
        '  "capacidadId": "el identificador exacto de la lista",'
        '  "veredicto": "si" | "no" | "no_documentado",'
        '  "profundidad": "nativa" | "modulo" | "integracion" | null,'
        '  "integraCon": "obligatorio si profundidad es integracion; si no, null",'
        '  "planMinimo": "nombre exacto del plan más barato donde existe, tal y como lo escribe el fabricante; null si la página no lo dice",'
        '  "urlFuente": "la dirección concreta de la que sacas la cita",'
        '  "cita": "la frase literal, copiada tal cual de esa página",'
        '  "nota": "breve: si es no_documentado, qué buscaste"'
        '}'
    )
    return ($lineas -join "`n")
}

function Prompt-Plan($ficha, $capacidades) {
    $lineas = @(
        'Tu única tarea es decir EN QUÉ PLAN está disponible cada capacidad, leyendo'
        'únicamente las páginas oficiales que te doy. Ya está comprobado que la'
        'herramienta las tiene: NO vuelvas a juzgar eso.'
        ''
        "HERRAMIENTA: $($ficha.nombre)"
        ''
        'REGLAS:'
        '1. El plan tiene que salir de la tabla de precios o de documentación oficial que'
        '   diga expresamente qué plan incluye qué. Una frase de la portada NO vale.'
        '2. Escribe el nombre del plan tal y como lo escribe el fabricante.'
        '3. Si las páginas no dicen en qué plan está, responde planMinimo null. Es una'
        '   respuesta correcta, y prefiero eso a un plan inventado.'
        '4. Copia una cita LITERAL que ligue esa capacidad con ese plan.'
        '5. Responde ÚNICAMENTE con un array JSON. Sin texto antes ni después.'
        ''
        'CAPACIDADES:'
        (Lista-De-Capacidades $capacidades)
        ''
        'FORMATO DE CADA ELEMENTO DEL ARRAY:'
        '{'
        '  "capacidadId": "el identificador exacto de la lista",'
        '  "planMinimo": "nombre exacto del plan más barato que la incluye, o null",'
        '  "urlFuente": "la dirección de la que sacas la cita",'
        '  "cita": "la frase literal que liga la capacidad con el plan"'
        '}'
    )
    return ($lineas -join "`n")
}

<#
    NADA DE LO QUE SIGUE PUEDE TUMBAR EL LOTE ENTERO.

    La versión anterior de este bucle tenía la llamada a Gemini fuera de todo
    `try`, así que un fallo que agotara los tres reintentos abortaba el
    `foreach` completo y las tareas siguientes no llegaban a ejecutarse nunca.
    Con `$ErrorActionPreference = "Stop"` y sin reanudación, eso dejaba
    aplicado sólo lo de las primeras tareas: es la explicación más probable de
    que la repesca del lote 1 aplicara 3 cambios en 765 pares.

    Ahora hay cuatro garantías, y cada una tapa una forma distinta de perder
    trabajo:

      1. AÍSLA. Un bloque que falla se queda en su bloque; una herramienta que
         falla se queda en su herramienta. El resto del lote sigue.
      2. CONSERVA. Se guarda el archivo de la herramienta DESPUÉS DE CADA
         BLOQUE, no al final. Si el proceso muere, lo ya conseguido está en
         disco.
      3. REGISTRA. Todo fallo va a `errores-repesca.json` con qué herramienta,
         qué bloque y qué capacidades, y con la clave oculta.
      4. REANUDA. Volver a lanzar el mismo comando NO repite lo que ya está
         respondido: sólo pregunta lo que sigue faltando.
#>

$llamadas = 0
$comienzo = Get-Date
$rutaErrores = Join-Path $Salida "errores-repesca.json"
$script:errores = @()

function Ocultar-Clave([string] $texto) {
    if ([string]::IsNullOrEmpty($texto)) { return "" }
    if ($env:GEMINI_API_KEY) {
        return ($texto -replace [regex]::Escape($env:GEMINI_API_KEY), "«clave oculta»")
    }
    return $texto
}

function Anotar-Error($herramientaId, $tipo, $bloque, $capacidadIds, $mensaje) {
    $limpio = Ocultar-Clave ([string]$mensaje)
    $script:errores += [pscustomobject]@{
        fecha         = (Get-Date).ToString("s")
        herramientaId = $herramientaId
        tipo          = $tipo
        bloque        = $bloque
        capacidadIds  = @($capacidadIds)
        mensaje       = $limpio
    }
    Escribir-Json $rutaErrores @($script:errores)
    Write-Host "      fallo anotado: $limpio" -ForegroundColor Red
}

function Poner-Propiedad($objeto, [string] $nombre, $valor) {
    $objeto | Add-Member -NotePropertyName $nombre -NotePropertyValue $valor -Force
}

<#
    Qué sigue faltando de verdad. Es lo que hace que reanudar no vuelva a
    pagar lo ya conseguido:
      - `capacidad`: falta si no hay ninguna respuesta para esa capacidad.
      - `plan`: falta si la respuesta que hay todavía no tiene plan escrito.
#>
function Falta-Todavia($datos, $tipo, [string] $capacidadId) {
    $vieja = $null
    foreach ($r in @($datos.respuestas)) {
        if ($r.capacidadId -eq $capacidadId) { $vieja = $r; break }
    }
    if ($tipo -eq "plan") {
        if ($vieja -and -not [string]::IsNullOrWhiteSpace([string]$vieja.planMinimo)) { return $false }
        return $true
    }
    if ($vieja) { return $false }
    return $true
}

<#
    Fusionar, no reemplazar. Una repesca de plan sólo toca el plan, la
    dirección y la cita: la profundidad y el «con qué se integra» ya estaban
    comprobados y volver a escribirlos sería tirar evidencia buena.
#>
function Fusionar-Respuestas($datos, $tipo, $pedidasDelBloque, $nuevas) {
    $porId = @{}
    foreach ($r in @($datos.respuestas)) { if ($r.capacidadId) { $porId[$r.capacidadId] = $r } }

    $aplicadas = 0
    foreach ($n in $nuevas) {
        if (-not $n.capacidadId -or ($pedidasDelBloque -notcontains $n.capacidadId)) { continue }
        if ($tipo -eq "plan") {
            $vieja = $porId[$n.capacidadId]
            if (-not $vieja) { continue }
            if ($null -eq $n.planMinimo -or [string]::IsNullOrWhiteSpace([string]$n.planMinimo)) { continue }
            $vieja.planMinimo = $n.planMinimo
            $vieja.urlFuente  = $n.urlFuente
            $vieja.cita       = $n.cita
            $aplicadas++
        } else {
            $porId[$n.capacidadId] = $n
            $aplicadas++
        }
    }

    Poner-Propiedad $datos "respuestas" @($porId.Values)
    $pedidasTotales = @($datos.capacidadesPedidas)
    Poner-Propiedad $datos "sinRespuesta" @($pedidasTotales | Where-Object { -not $porId.ContainsKey($_) })
    return $aplicadas
}

$tareasConFallo = 0
$tareasSaltadas = 0

foreach ($tarea in $tareas) {
    $id = $tarea.herramientaId

    try {
        $ruta = Join-Path $Salida "$id.json"
        if (-not (Test-Path -LiteralPath $ruta)) {
            throw "no existe $ruta. Esa herramienta no se ha ejecutado todavía con ejecutar-lote.ps1."
        }
        $datos = Leer-Json $ruta
        $ficha = Leer-Json (Join-Path $raiz "data\herramientas\$id.json")
        $urls  = @($datos.urlsSolicitadas)

        $todas = @($tarea.capacidadIds)
        $ids   = @($todas | Where-Object { Falta-Todavia $datos $tarea.tipo $_ })
        $hechas = $todas.Count - $ids.Count

        if (-not $ids.Count) {
            Write-Host "· $($ficha.nombre) ($id) — $($tarea.tipo): ya estaban las $($todas.Count), se salta" -ForegroundColor DarkGray
            $tareasSaltadas++
            continue
        }

        $bloques = [math]::Ceiling($ids.Count / $PorLlamada)
        $pendiente = if ($hechas) { " ($hechas ya estaban)" } else { "" }
        Write-Host "· $($ficha.nombre) ($id) — $($tarea.tipo): $($ids.Count) en $bloques llamada(s)$pendiente" -ForegroundColor White

        $aplicadasTarea = 0
        $bloquesConFallo = 0

        for ($b = 0; $b -lt $bloques; $b++) {
            $trozo = @($ids | Select-Object -Skip ($b * $PorLlamada) -First $PorLlamada)
            $caps  = @($trozo | ForEach-Object { $capacidadPorId[$_] })
            if ($caps -contains $null) {
                Anotar-Error $id $tarea.tipo ($b + 1) $trozo "alguna capacidad del bloque no existe en el vocabulario"
                $bloquesConFallo++
                continue
            }

            $prompt = if ($tarea.tipo -eq "plan") { Prompt-Plan $ficha $caps } else { Prompt-Capacidad $ficha $caps }

            try {
                $t0 = Get-Date
                $respuesta = Invocar-Gemini $prompt $urls
                $llamadas++
                $ms = [int]((Get-Date) - $t0).TotalMilliseconds

                <#
                    Sólo se queda lo que se preguntó EN ESTE BLOQUE. La
                    definición de cada capacidad nombra a sus vecinas para
                    marcar la frontera, así que el prompt lleva identificadores
                    que no se han preguntado; sin este filtro, la respuesta de
                    un bloque podía pisar la de otro. Se vio contando: 26
                    aplicadas para 18 pedidas.
                #>
                $texto  = Extraer-Texto $respuesta
                $nuevas = @($texto | ConvertFrom-Json | Where-Object { $trozo -contains $_.capacidadId })

                $aplicadas = Fusionar-Respuestas $datos $tarea.tipo $trozo $nuevas
                $aplicadasTarea += $aplicadas

                # Guardar YA. Si el proceso muere en el bloque siguiente, esto
                # está en disco y la próxima pasada no lo repite.
                Poner-Propiedad $datos "urlsRecuperadas" @(@($datos.urlsRecuperadas) + (Extraer-Urls $respuesta))
                Poner-Propiedad $datos "fechaConsulta" $hoy
                Escribir-Json $ruta $datos

                Write-Host "    bloque $($b + 1)/$bloques — $($trozo.Count), $ms ms, $aplicadas aplicada(s)" -ForegroundColor DarkGray
            } catch {
                # El bloque se pierde, la herramienta no. Sus capacidades se
                # quedan sin responder y la siguiente pasada las reintenta.
                Anotar-Error $id $tarea.tipo ($b + 1) $trozo $_.Exception.Message
                $bloquesConFallo++
            }

            if ($b -lt $bloques - 1) { Start-Sleep -Seconds $PausaSegundos }
        }

        if ($bloquesConFallo) {
            $tareasConFallo++
            Write-Host "    $aplicadasTarea de $($ids.Count) aplicada(s) · $bloquesConFallo bloque(s) sin respuesta, quedan para la próxima pasada" -ForegroundColor Yellow
        } else {
            Write-Host "    $aplicadasTarea de $($ids.Count) aplicada(s)" -ForegroundColor Green
        }
    } catch {
        # Una herramienta entera puede fallar —archivo que falta, ficha
        # ilegible— sin llevarse por delante las demás.
        Anotar-Error $id $tarea.tipo 0 @($tarea.capacidadIds) $_.Exception.Message
        $tareasConFallo++
    }

    Start-Sleep -Seconds $PausaSegundos
}

# Rehacer el archivo único con todo dentro.
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
Write-Host "Repesca terminada." -ForegroundColor Cyan
Write-Host "  tareas ya completas:  $tareasSaltadas"
Write-Host "  tareas con fallos:    $tareasConFallo"
Write-Host "  fallos registrados:   $($script:errores.Count)"
if ($script:errores.Count) {
    Write-Host ""
    Write-Host "  Quedan cosas sin responder. NO se ha perdido nada de lo conseguido." -ForegroundColor Yellow
    Write-Host "  El detalle está en: $rutaErrores" -ForegroundColor Yellow
    Write-Host "  Vuelve a lanzar EXACTAMENTE el mismo comando: sólo se preguntará lo que falta." -ForegroundColor Yellow
}
Write-Host "  llamadas a Gemini: $llamadas"
Write-Host "  tiempo:            $minutos min"
Write-Host ""
Write-Host "Envía este archivo:"
Write-Host "  $juntos" -ForegroundColor White
Write-Host "No contiene la clave." -ForegroundColor DarkGray
