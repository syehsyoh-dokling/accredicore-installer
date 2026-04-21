$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

function Show-LauncherNotice {
    param(
        [string] $Title,
        [string] $Message
    )

    Write-Host ''
    Write-Host ('=' * 72) -ForegroundColor Cyan
    Write-Host $Title -ForegroundColor Yellow
    Write-Host ('=' * 72) -ForegroundColor Cyan
    Write-Host $Message
    Write-Host ('=' * 72) -ForegroundColor Cyan
    Write-Host ''
}

function Confirm-LauncherAction {
    param(
        [string] $Question
    )

    $answer = Read-Host "$Question [Y/N]"
    return @('y', 'yes') -contains $answer.Trim().ToLowerInvariant()
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Show-LauncherNotice `
        -Title 'Required component missing: Node.js LTS' `
        -Message 'Your device does not have Node.js installed. The native installer needs Node.js and npm to start the desktop launcher. If you continue, we will open the official Node.js download page. After installing Node.js LTS, run Start-Installer-for-windows.bat again.'

    if (Confirm-LauncherAction 'Do you agree to open the Node.js LTS download page now?') {
        Start-Process 'https://nodejs.org/en/download'
    }

    Write-Host 'Opening browser-only fallback. Native Step 1 checks require Node.js LTS.' -ForegroundColor Yellow
    Start-Process (Join-Path $repoRoot 'index.html')
    exit 0
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Show-LauncherNotice `
        -Title 'Required component missing: npm' `
        -Message 'Node.js was found, but npm is not available. npm is required to prepare the launcher dependencies. Please reinstall Node.js LTS with npm enabled, then run this launcher again.'

    Start-Process (Join-Path $repoRoot 'index.html')
    exit 0
}

$electronBinary = Join-Path $repoRoot 'node_modules\.bin\electron.cmd'
if (-not (Test-Path -LiteralPath $electronBinary)) {
    Show-LauncherNotice `
        -Title 'Launcher dependency setup required' `
        -Message 'Your device does not have the local launcher dependencies yet. The installer needs to download and install Electron and related packages into this extracted installer folder. This may take a few minutes and requires internet access on first launch.'

    if (-not (Confirm-LauncherAction 'Do you agree to download and install the launcher dependencies now?')) {
        Write-Host 'Dependency setup was cancelled by the user.' -ForegroundColor Yellow
        Write-Host 'Opening browser-only fallback. Native Step 1 checks will not be available from a normal browser tab.' -ForegroundColor Yellow
        Start-Process (Join-Path $repoRoot 'index.html')
        exit 0
    }

    Write-Host 'Running npm install. Please wait...' -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Show-LauncherNotice `
            -Title 'Dependency setup failed' `
            -Message 'The launcher could not finish npm install. Please check your internet connection, antivirus restrictions, or corporate proxy settings. We will open the browser-only fallback now.'
        Start-Process (Join-Path $repoRoot 'index.html')
        exit $LASTEXITCODE
    }
}

Write-Host 'Launching AccrediCore Installer desktop app...' -ForegroundColor Cyan
npm run app
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Desktop app failed to launch. Opening browser launcher as fallback.' -ForegroundColor Yellow
    Start-Process (Join-Path $repoRoot 'index.html')
    exit $LASTEXITCODE
}
