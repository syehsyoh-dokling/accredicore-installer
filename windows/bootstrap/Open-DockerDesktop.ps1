param(
  [int]$TimeoutSeconds = 180
)

$ErrorActionPreference = "Stop"

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

Write-Host "OPEN DOCKER DESKTOP"
Write-Host "============================================================"

$dockerDesktop = Find-DockerDesktopExecutable
if (-not $dockerDesktop) {
  Write-Host "ERROR: Docker Desktop application was not found on this device."
  Write-Host ""
  Write-Host "Instruction:"
  Write-Host "1. Install Docker Desktop from https://www.docker.com/products/docker-desktop/"
  Write-Host "2. Open Docker Desktop."
  Write-Host "3. Sign in or register if Docker asks for it."
  Write-Host "4. Return to this installer and run Step 7 again."
  exit 1
}

Write-Host "- Opening Docker Desktop:"
Write-Host "  $dockerDesktop"
Start-Process -FilePath $dockerDesktop | Out-Null

Write-Host "- Docker Desktop should appear on your screen."
Write-Host "- If Docker shows a login/register/terms page, complete it in the Docker Desktop window."
Write-Host "- Do not close Docker Desktop after login. Keep it running, then return to this installer."
Write-Host "- Waiting for Docker engine readiness for up to $TimeoutSeconds seconds..."
Write-Host ""

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
do {
  if (Test-DockerEngineReady) {
    Write-Host "SUCCESS: Docker Desktop engine is running."
    Write-Host "Next: return to this installer and click Step 7. Start servers."
    exit 0
  }

  Write-Host "- Docker engine is not ready yet. Waiting..."
  Start-Sleep -Seconds 5
} while ((Get-Date) -lt $deadline)

Write-Host ""
Write-Host "Docker Desktop was opened, but the engine is still not ready."
Write-Host ""
Write-Host "Most common reasons:"
Write-Host "- Docker is waiting for sign in or account registration."
Write-Host "- Docker is asking you to accept terms."
Write-Host "- Docker Desktop is still starting in the background."
Write-Host ""
Write-Host "Instruction:"
Write-Host "1. Look at the Docker Desktop window."
Write-Host "2. Complete login/register/terms if requested."
Write-Host "3. Wait until Docker Desktop says it is running."
Write-Host "4. Return to this installer and click Step 7 again."
Write-Host ""
Write-Host ($script:LastDockerInfo | Out-String)
exit 1
