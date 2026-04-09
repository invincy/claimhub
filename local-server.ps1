param(
    [int]$Port = 8000
)

Set-Location -Path (Split-Path -Path $MyInvocation.MyCommand.Definition -Parent)

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()
Write-Host "Serving $(Get-Location) at http://127.0.0.1:$Port"

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $requestLine = $reader.ReadLine()

        if (-not $requestLine) {
            $client.Close()
            continue
        }

        $method, $rawPath, $protocol = $requestLine -split ' '
        $path = $rawPath.Split('?')[0].TrimStart('/')
        if ($path -eq '') { $path = 'index.html' }

        $bytes = $null
        $statusLine = "HTTP/1.1 200 OK"
        $contentType = "application/octet-stream"
        $filePath = Join-Path (Get-Location) $path

        if (-not (Test-Path $filePath)) {
            $statusLine = "HTTP/1.1 404 Not Found"
            $bytes = [System.Text.Encoding]::UTF8.GetBytes('Not found')
            $contentType = "text/plain"
        }
        else {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
            $contentTypeMap = @{
                '.html' = 'text/html'
                '.css'  = 'text/css'
                '.js'   = 'application/javascript'
                '.json' = 'application/json'
                '.svg'  = 'image/svg+xml'
                '.png'  = 'image/png'
                '.jpg'  = 'image/jpeg'
                '.jpeg' = 'image/jpeg'
                '.gif'  = 'image/gif'
                '.ico'  = 'image/x-icon'
            }
            if ($contentTypeMap.ContainsKey($ext)) {
                $contentType = $contentTypeMap[$ext]
            }
        }

        $writer = New-Object System.IO.StreamWriter($stream)
        $writer.WriteLine($statusLine)
        $writer.WriteLine("Content-Type: $contentType")
        $writer.WriteLine("Content-Length: $($bytes.Length)")
        $writer.WriteLine("Connection: close")
        $writer.WriteLine('')
        $writer.Flush()
        $stream.Write($bytes, 0, $bytes.Length)
        $stream.Flush()
        $stream.Close()
        $client.Close()
    }
}
finally {
    $listener.Stop()
}
