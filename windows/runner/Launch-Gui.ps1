$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host 'Launching AccrediCore Installer desktop app...' -ForegroundColor Cyan
    npm run app
} else {
    Write-Host 'Node.js is not installed yet. Opening browser launcher instead.' -ForegroundColor Yellow
    Start-Process (Join-Path $repoRoot 'index.html')
}
