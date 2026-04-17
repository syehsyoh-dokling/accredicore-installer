param(
    [string]$SourceZip = "C:\Installers\accredicore-source.zip",
    [string]$TargetDir = "C:\AccrediCore\app"
)

$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $SourceZip)) {
    throw "Source ZIP not found: $SourceZip"
}
New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
Expand-Archive -Path $SourceZip -DestinationPath $TargetDir -Force
Write-Host "Source extracted to $TargetDir" -ForegroundColor Green
