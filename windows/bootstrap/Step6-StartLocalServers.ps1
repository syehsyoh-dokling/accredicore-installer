param(
  [Parameter(Mandatory=$true)][string]$ProjectRoot,
  [string]$DbHost = "127.0.0.1",
  [string]$DbPort = "5432",
  [string]$DbName = "accredicore",
  [string]$DbUser = "postgres",
  [string]$DbPassword = "",
  [int]$FrontendPort = 4173,
  [int]$LocalApiPort = 3005
)

$ErrorActionPreference = "Stop"

function Assert-Path {
  param(
    [Parameter(Mandatory=$true)][string]$Path,
    [Parameter(Mandatory=$true)][string]$Label
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "$Label was not found: $Path"
  }
}

function Ensure-NpmInstall {
  param(
    [Parameter(Mandatory=$true)][string]$Folder,
    [Parameter(Mandatory=$true)][string]$Label
  )

  $packageJson = Join-Path $Folder "package.json"
  $nodeModules = Join-Path $Folder "node_modules"
  Assert-Path -Path $packageJson -Label "$Label package.json"

  if (Test-Path -LiteralPath $nodeModules) {
    Write-Host "- $Label dependencies already exist. Skipping npm install."
    return
  }

  Write-Host "- Installing $Label dependencies. This can take several minutes on first run."
  Push-Location $Folder
  try {
    npm install
  } finally {
    Pop-Location
  }
}

function Start-NamedPowerShell {
  param(
    [Parameter(Mandatory=$true)][string]$Title,
    [Parameter(Mandatory=$true)][string]$WorkingDirectory,
    [Parameter(Mandatory=$true)][string]$Command
  )

  $safeTitle = $Title.Replace("'", "''")
  $safeWorkingDirectory = $WorkingDirectory.Replace("'", "''")
  $safeCommand = $Command.Replace("'", "''")
  Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command",
    "`$Host.UI.RawUI.WindowTitle = '$safeTitle'; Set-Location '$safeWorkingDirectory'; $safeCommand"
  ) | Out-Null
}

function Write-Utf8NoBom {
  param(
    [Parameter(Mandatory=$true)][string]$Path,
    [Parameter(Mandatory=$true)][string]$Content
  )

  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

$appSource = Join-Path $ProjectRoot "app-source"
$localApi = Join-Path $ProjectRoot "local-api"
$setupScript = Join-Path $ProjectRoot "scripts\setup\setup-env-win.ps1"

Assert-Path -Path $ProjectRoot -Label "Project root"
Assert-Path -Path $appSource -Label "Frontend source folder"
Assert-Path -Path $localApi -Label "Local API folder"

if (Test-Path -LiteralPath $setupScript) {
  Write-Host "- Preparing environment file locations."
  & powershell.exe -ExecutionPolicy Bypass -File $setupScript | Out-Host
}

$frontendEnv = Join-Path $appSource ".env.local"
$frontendEnvContent = @"
VITE_SUPABASE_PROJECT_ID=accredicore-local
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
"@
Write-Utf8NoBom -Path $frontendEnv -Content $frontendEnvContent
Write-Host "- Frontend runtime env prepared: $frontendEnv"

$apiEnv = Join-Path $localApi ".env"
$apiEnvContent = @"
PORT=$LocalApiPort
DB_HOST=$DbHost
DB_PORT=$DbPort
DB_USER=$DbUser
DB_PASSWORD=$DbPassword
DB_NAME=$DbName
"@
Write-Utf8NoBom -Path $apiEnv -Content $apiEnvContent
Write-Host "- Local API runtime env prepared: $apiEnv"

Ensure-NpmInstall -Folder $appSource -Label "frontend"
Ensure-NpmInstall -Folder $localApi -Label "local API"

Write-Host ""
Write-Host "SERVER IS STARTING..."
Write-Host "- This usually takes 2-3 minutes on the first run."
Write-Host "- Please keep the opened service windows running."
Write-Host "- Continue to Step 8 only after the frontend window shows the local URL."
Write-Host ""

Write-Host "- Starting local Supabase stack. Docker Desktop must be running."
Push-Location $appSource
try {
  npx supabase start | Out-Host
} finally {
  Pop-Location
}

Write-Host "- Opening backend and frontend service windows."
Start-NamedPowerShell -Title "AccrediCore Supabase Edge Functions" -WorkingDirectory $appSource -Command "npx supabase functions serve"
Start-NamedPowerShell -Title "AccrediCore Local API" -WorkingDirectory $localApi -Command "npm start"
Start-NamedPowerShell -Title "AccrediCore Frontend" -WorkingDirectory $appSource -Command "npm run dev -- --host 127.0.0.1 --port $FrontendPort"

Write-Host ""
Write-Host "STEP 7 RESULT"
Write-Host "- Backend and frontend startup commands were launched."
Write-Host "- Frontend URL: http://127.0.0.1:$FrontendPort"
Write-Host "- Login URL: http://127.0.0.1:$FrontendPort/auth"
Write-Host "- Local API health: http://localhost:$LocalApiPort/api/health"
Write-Host "- Supabase API: http://127.0.0.1:54321"
Write-Host "- Supabase Studio: http://127.0.0.1:54323"
Write-Host ""
Write-Host "Next: wait until the frontend terminal shows the Vite ready message, then click Step 8 in the installer."
