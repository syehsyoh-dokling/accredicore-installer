param(
  [Parameter(Mandatory=$true)][string]$ProjectRoot,
  [Parameter(Mandatory=$true)][string]$EnvSourcePath,
  [Parameter(Mandatory=$true)][string]$ActivationSourcePath
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $ProjectRoot)) {
  throw "ProjectRoot does not exist: $ProjectRoot"
}

if (-not (Test-Path -LiteralPath $EnvSourcePath)) {
  throw ".env source file not found: $EnvSourcePath"
}

if (-not (Test-Path -LiteralPath $ActivationSourcePath)) {
  throw "activation.json source file not found: $ActivationSourcePath"
}

$configEnvDir = Join-Path $ProjectRoot "config\env"
if (-not (Test-Path -LiteralPath $configEnvDir)) {
  New-Item -ItemType Directory -Path $configEnvDir -Force | Out-Null
}

$envTarget = Join-Path $configEnvDir ".env"
$activationTarget = Join-Path $configEnvDir "activation.json"

Copy-Item -LiteralPath $EnvSourcePath -Destination $envTarget -Force
Copy-Item -LiteralPath $ActivationSourcePath -Destination $activationTarget -Force

Write-Host "STEP 6 RESULT"
Write-Host "- Configuration files imported successfully."
Write-Host "- .env stored at: $envTarget"
Write-Host "- activation.json stored at: $activationTarget"
