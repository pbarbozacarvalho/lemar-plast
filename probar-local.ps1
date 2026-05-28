$port = 8080
$root = (Get-Location).Path
$prefix = "http://localhost:$port/"

$contentTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png" = "image/png"
  ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".gif" = "image/gif"
  ".svg" = "image/svg+xml"
  ".ico" = "image/x-icon"
}

function Send-Response($response, $statusCode, $contentType, [byte[]]$body) {
  $response.StatusCode = $statusCode
  $response.ContentType = $contentType
  $response.ContentLength64 = $body.Length
  $response.OutputStream.Write($body, 0, $body.Length)
  $response.OutputStream.Close()
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($prefix)

try {
  $listener.Start()
} catch {
  Write-Host "No pude iniciar el servidor en $prefix"
  Write-Host "Si ya hay algo usando el puerto 8080, cerra esa app o cambia el puerto en este script."
  Write-Host $_.Exception.Message
  pause
  exit 1
}

Write-Host "Le-mar Plast iniciado en $prefix"
Write-Host "Abri http://localhost:$port/index.html"
Write-Host "Deja esta ventana abierta mientras probas el catalogo."
Write-Host "Presiona Ctrl+C para detenerlo."
Write-Host ""

while ($listener.IsListening) {
  try {
    $context = $listener.GetContext()
    $requestPath = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart("/"))

    if ([string]::IsNullOrWhiteSpace($requestPath)) {
      $requestPath = "index.html"
    }

    $candidatePath = [System.IO.Path]::GetFullPath((Join-Path $root $requestPath))

    if (-not $candidatePath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
      $body = [System.Text.Encoding]::UTF8.GetBytes("403")
      Send-Response $context.Response 403 "text/plain; charset=utf-8" $body
      continue
    }

    if (-not [System.IO.File]::Exists($candidatePath)) {
      $body = [System.Text.Encoding]::UTF8.GetBytes("404")
      Send-Response $context.Response 404 "text/plain; charset=utf-8" $body
      continue
    }

    $extension = [System.IO.Path]::GetExtension($candidatePath).ToLowerInvariant()
    $contentType = $contentTypes[$extension]
    if (-not $contentType) {
      $contentType = "application/octet-stream"
    }

    $body = [System.IO.File]::ReadAllBytes($candidatePath)
    Send-Response $context.Response 200 $contentType $body
  } catch {
    if ($context -and $context.Response) {
      $body = [System.Text.Encoding]::UTF8.GetBytes("500")
      Send-Response $context.Response 500 "text/plain; charset=utf-8" $body
    }
  }
}
