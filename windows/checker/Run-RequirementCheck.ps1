param(
    [string]$RepoPath = "",
    [string]$WorkingDirectory = "C:\AccrediCore"
)

if ([string]::IsNullOrWhiteSpace($RepoPath)) {
    $RepoPath = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
}

$Checker = Join-Path $RepoPath "windows\checker\Check-SystemRequirements.ps1"
$OutFile = Join-Path $RepoPath "windows\checker\output\system-requirements.json"

if (-not (Test-Path -LiteralPath $Checker)) {
    throw "Checker file not found: $Checker"
}

powershell -ExecutionPolicy Bypass -File $Checker -WorkingDirectory $WorkingDirectory -OutFile $OutFile

Write-Host ""
Write-Host "Checker completed." -ForegroundColor Green
Write-Host "JSON output saved to:" -ForegroundColor White
Write-Host "  $OutFile" -ForegroundColor Yellow
