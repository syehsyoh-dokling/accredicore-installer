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

function Find-DockerDesktopExecutable {
  $candidates = @(
    "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
    "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
    "$env:LOCALAPPDATA\Docker\Docker Desktop.exe"
  )

  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path -LiteralPath $candidate)) {
      return $candidate
    }
  }

  return $null
}

function Test-DockerEngineReady {
  $script:LastDockerInfo = & docker info 2>&1
  return ($LASTEXITCODE -eq 0)
}

function Start-DockerDesktopAndWait {
  param(
    [int]$TimeoutSeconds = 120
  )

  if (Test-DockerEngineReady) {
    return $true
  }

  $dockerDesktop = Find-DockerDesktopExecutable
  if (-not $dockerDesktop) {
    Write-Host "ERROR: Docker Desktop application was not found."
    Write-Host "Instruction:"
    Write-Host "1. Install Docker Desktop from https://www.docker.com/products/docker-desktop/"
    Write-Host "2. Open Docker Desktop and finish login/register if requested."
    Write-Host "3. Return to this installer and run Step 7 again."
    return $false
  }

  Write-Host "- Docker engine is not ready. Opening Docker Desktop automatically..."
  Start-Process -FilePath $dockerDesktop | Out-Null
  Write-Host "- Waiting for Docker Desktop engine to become ready. If Docker asks for login/register, complete it in the Docker window."

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    Start-Sleep -Seconds 5
    if (Test-DockerEngineReady) {
      Write-Host "- Docker Desktop engine is ready."
      return $true
    }
    Write-Host "- Still waiting for Docker Desktop..."
  } while ((Get-Date) -lt $deadline)

  Write-Host "ERROR: Docker Desktop was opened, but the Docker engine is still not ready."
  Write-Host "Instruction:"
  Write-Host "1. Check the Docker Desktop window."
  Write-Host "2. If Docker asks you to sign in, register, accept terms, or start the engine, complete that step."
  Write-Host "3. Wait until Docker Desktop status shows it is running."
  Write-Host "4. Return to this installer and click Step 7 again."
  Write-Host ""
  Write-Host ($script:LastDockerInfo | Out-String)
  return $false
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
Write-Host "- If Windows redirects you to CMD/PowerShell Prompt, do not close those windows. Keep them open and return to this installer page."
Write-Host "- Continue to Step 8 only after the frontend window shows the local URL."
Write-Host ""

Write-Host "- Starting local Supabase stack. Docker Desktop must be running."
Write-Host "- Checking Docker Desktop engine..."
if (-not (Start-DockerDesktopAndWait -TimeoutSeconds 120)) {
  exit 1
}

Push-Location $appSource
try {
  npx supabase start | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "Supabase local stack failed to start. Make sure Docker Desktop is running, then run Step 7 again."
  }
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
