param(
    [switch]$SkipDocker,
    [switch]$UseChocolatey
)

$ErrorActionPreference = 'Stop'

function Ensure-Admin {
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdmin) {
        throw 'Please run this script from an elevated PowerShell window.'
    }
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

Ensure-Admin
$winget = Get-Command winget -ErrorAction SilentlyContinue
$choco = Get-Command choco -ErrorAction SilentlyContinue

if (-not $winget -and -not $choco) {
    throw 'Neither winget nor Chocolatey is available. Install winget or choco first.'
}

$mode = if ($UseChocolatey -and $choco) { 'choco' } elseif ($winget) { 'winget' } elseif ($choco) { 'choco' } else { throw 'No supported Windows package manager found.' }
Write-Host "Using package manager: $mode" -ForegroundColor Green

$packages = @(
    @{ winget = 'Git.Git'; choco = 'git' },
    @{ winget = 'OpenJS.NodeJS.LTS'; choco = 'nodejs-lts' },
    @{ winget = 'pnpm.pnpm'; choco = 'pnpm' },
    @{ winget = 'PostgreSQL.PostgreSQL'; choco = 'postgresql' },
    @{ winget = 'GitHub.cli'; choco = 'gh' },
    @{ winget = 'PHP.PHP'; choco = 'php' },
    @{ winget = 'Composer.Composer'; choco = 'composer' }
)

if (-not $SkipDocker) {
    $packages += @{ winget = 'Docker.DockerDesktop'; choco = 'docker-desktop' }
}

foreach ($pkg in $packages) {
    if ($mode -eq 'winget') {
        Install-WithWinget -Id $pkg.winget
    } else {
        Install-WithChoco -Package $pkg.choco
    }
}

Write-Host 'Dependency installation finished. Restart your terminal before running checks again.' -ForegroundColor Green
