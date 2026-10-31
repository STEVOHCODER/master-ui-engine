# Serve MASTER-UI-ENGINE so the visual lab can iframe every design.
# Usage: powershell -File showcase/serve.ps1
Set-Location (Split-Path $PSScriptRoot -Parent)
$port = 4173
Write-Host "Visual lab: http://127.0.0.1:$port/showcase/index.html"
python -m http.server $port
