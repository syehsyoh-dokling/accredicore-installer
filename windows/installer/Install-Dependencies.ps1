param(
    [switch]$SkipDocker,
    [switch]$UseChocolatey,
    [switch]$Elevated
)

$ErrorActionPreference = 'Stop'

function Ensure-Admin {
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    return $isAdmin
}

function Start-ElevatedSelf {
    $argList = @(
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        ('"{0}"' -f $PSCommandPath),
        '-Elevated'
    )

    if ($UseChocolatey) { $argList += '-UseChocolatey' }
    if ($SkipDocker) { $argList += '-SkipDocker' }

    Write-Host 'Administrator permission is required to install system dependencies.' -ForegroundColor Yellow
    Write-Host 'A Windows security prompt will open. Choose Yes to install missing dependencies.' -ForegroundColor Yellow
    $process = Start-Process powershell.exe -ArgumentList $argList -Verb RunAs -Wait -PassThru

    if ($process.ExitCode -ne 0) {
        throw "Elevated dependency installer exited with code $($process.ExitCode)."
    }

    Write-Host 'Elevated dependency installer finished. Run Step 1 Check Requirements again.' -ForegroundColor Green
}

function Install-WithWinget {
    param([string]$Id)
    Write-Host "Installing $Id via winget..." -ForegroundColor Cyan
    winget install --id $Id --exact --accept-package-agreements --accept-source-agreements --silent
}

function Install-WithChoco {
    param([string]$Package)
    Write-Host "Installing $Package via Chocolatey..." -ForegroundColor Cyan
    choco install $Package -y
}

function Test-ToolAvailable {
    param([string]$CommandName)
    return [bool](Get-Command $CommandName -ErrorAction SilentlyContinue)
}

function Test-PsqlAvailable {
    if (Get-Command psql -ErrorAction SilentlyContinue) { return $true }
    $paths = @(
        "C:\Program Files\PostgreSQL\17\bin\psql.exe",
        "C:\Program Files\PostgreSQL\16\bin\psql.exe",
        "C:\Program Files\PostgreSQL\15\bin\psql.exe",
        "C:\Program Files\PostgreSQL\14\bin\psql.exe",
        "C:\Program Files\PostgreSQL\13\bin\psql.exe"
    )
    return [bool]($paths | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1)
}

function Test-DockerAvailable {
    if (Get-Command docker -ErrorAction SilentlyContinue) { return $true }
    $paths = @(
        "C:\Program Files\Docker\Docker\resources\bin\docker.exe",
        "C:\Program Files\Docker\Docker\docker.exe"
    )
    return [bool]($paths | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1)
}

if (-not (Ensure-Admin)) {
    Start-ElevatedSelf
    exit 0
}

$winget = Get-Command winget -ErrorAction SilentlyContinue
$choco = Get-Command choco -ErrorAction SilentlyContinue

if (-not $winget -and -not $choco) {
    throw 'Neither winget nor Chocolatey is available. Install winget or choco first.'
}

$mode = if ($UseChocolatey -and $choco) { 'choco' } elseif ($winget) { 'winget' } elseif ($choco) { 'choco' } else { throw 'No supported Windows package manager found.' }
Write-Host "Using package manager: $mode" -ForegroundColor Green

$packages = @(
    @{ winget = 'Git.Git'; choco = 'git'; name = 'Git'; ready = { Test-ToolAvailable 'git' } },
    @{ winget = 'OpenJS.NodeJS.LTS'; choco = 'nodejs-lts'; name = 'Node.js'; ready = { Test-ToolAvailable 'node' } },
    @{ winget = 'pnpm.pnpm'; choco = 'pnpm'; name = 'pnpm'; ready = { Test-ToolAvailable 'pnpm' } },
    @{ winget = 'PostgreSQL.PostgreSQL'; choco = 'postgresql'; name = 'PostgreSQL client/server'; ready = { Test-PsqlAvailable } },
    @{ winget = 'GitHub.cli'; choco = 'gh'; name = 'GitHub CLI'; ready = { Test-ToolAvailable 'gh' } },
    @{ winget = 'PHP.PHP'; choco = 'php'; name = 'PHP'; ready = { Test-ToolAvailable 'php' } },
    @{ winget = 'Composer.Composer'; choco = 'composer'; name = 'Composer'; ready = { Test-ToolAvailable 'composer' } }
)

if (-not $SkipDocker) {
    $packages += @{ winget = 'Docker.DockerDesktop'; choco = 'docker-desktop'; name = 'Docker Desktop'; ready = { Test-DockerAvailable } }
}

foreach ($pkg in $packages) {
    if (& $pkg.ready) {
        Write-Host "$($pkg.name) already available. Skipping." -ForegroundColor Green
        continue
    }

    if ($mode -eq 'winget') {
        Install-WithWinget -Id $pkg.winget
    } else {
        Install-WithChoco -Package $pkg.choco
    }
}

Write-Host ''
Write-Host 'Dependency installation finished.' -ForegroundColor Green
Write-Host 'Important: if PostgreSQL was just installed, restart this installer or your terminal, then run Step 1 Check Requirements again.' -ForegroundColor Yellow
if (-not (Test-PsqlAvailable)) {
    Write-Host 'PostgreSQL/psql is still not visible. Open a new terminal or verify the PostgreSQL installation path.' -ForegroundColor Yellow
}
