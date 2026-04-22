param(
  [Parameter(Mandatory=$true)][string]$NewPassword,
  [string]$DbUser = "postgres",
  [int]$DbPort = 5432
)

$ErrorActionPreference = "Stop"

function Assert-PasswordInput {
  if ([string]::IsNullOrWhiteSpace($NewPassword) -or $NewPassword.Length -lt 8 -or $NewPassword.Length -gt 256) {
    throw "Invalid PostgreSQL password. Password is required and must be 8-256 characters."
  }

  if (($NewPassword -notmatch '[a-z]') -or ($NewPassword -notmatch '[A-Z]') -or ($NewPassword -notmatch '\d') -or ($NewPassword -notmatch '[^A-Za-z0-9]')) {
    throw "Invalid PostgreSQL password. Use uppercase, lowercase, number, and symbol such as #, $, &, !, or @."
  }

  if ($DbUser -notmatch '^[a-z][a-z0-9_]{0,62}$') {
    throw "Invalid PostgreSQL user. Use lowercase letters, numbers, and underscore only; start with a letter; max 63 characters."
  }

  if ($DbPort -lt 1 -or $DbPort -gt 65535) {
    throw "Invalid PostgreSQL port. Use a number between 1 and 65535."
  }
}

function Test-IsAdministrator {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = [Security.Principal.WindowsPrincipal]::new($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Quote-Arg {
  param([string]$Value)
  return '"' + ($Value -replace '"', '\"') + '"'
}

function Restart-AsAdministrator {
  $scriptPath = $PSCommandPath
  $args = @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", (Quote-Arg $scriptPath),
    "-NewPassword", (Quote-Arg $NewPassword),
    "-DbUser", (Quote-Arg $DbUser),
    "-DbPort", "$DbPort"
  )

  Write-Host "Administrator permission is required to reset the local PostgreSQL password."
  Write-Host "A Windows security prompt will appear. Choose Yes to continue."

  $process = Start-Process -FilePath "powershell.exe" -ArgumentList $args -Verb RunAs -Wait -PassThru
  exit $process.ExitCode
}

function Resolve-PsqlPath {
  $cmd = Get-Command psql -ErrorAction SilentlyContinue
  $candidatePaths = @()
  if ($cmd) { $candidatePaths += $cmd.Source }
  $candidatePaths += @(
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files\PostgreSQL\13\bin\psql.exe"
  )

  foreach ($root in @(
    "C:\Program Files\PostgreSQL",
    "C:\Program Files (x86)\PostgreSQL",
    "$env:LOCALAPPDATA\Programs\PostgreSQL",
    "$env:APPDATA\PostgreSQL"
  )) {
    if (Test-Path -LiteralPath $root) {
      $candidatePaths += Get-ChildItem -LiteralPath $root -Recurse -Filter "psql.exe" -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty FullName
    }
  }

  foreach ($path in $candidatePaths | Select-Object -Unique) {
    if ($path -and (Test-Path -LiteralPath $path)) {
      return $path
    }
  }

  return $null
}

function Get-PostgresService {
  $services = @(Get-CimInstance Win32_Service |
    Where-Object { $_.Name -match 'postgresql' -or $_.DisplayName -match 'PostgreSQL' } |
    Sort-Object State, Name)

  if ($services.Count -eq 0) {
    throw "PostgreSQL service was not found. Install PostgreSQL from Step 2 first, then retry."
  }

  return $services | Select-Object -First 1
}

function Resolve-DataDirectory {
  param([object]$Service)

  $pathName = [string]$Service.PathName
  $match = [regex]::Match($pathName, '-D\s+"([^"]+)"')
  if ($match.Success) {
    return $match.Groups[1].Value
  }

  $match = [regex]::Match($pathName, '-D\s+([^\s]+)')
  if ($match.Success) {
    return $match.Groups[1].Value
  }

  foreach ($root in @("C:\Program Files\PostgreSQL", "C:\Program Files (x86)\PostgreSQL")) {
    if (Test-Path -LiteralPath $root) {
      $config = Get-ChildItem -LiteralPath $root -Recurse -Filter "pg_hba.conf" -ErrorAction SilentlyContinue |
        Sort-Object FullName |
        Select-Object -First 1
      if ($config) {
        return Split-Path -Parent $config.FullName
      }
    }
  }

  throw "Could not locate PostgreSQL data directory for service '$($Service.Name)'."
}

function Restart-PostgresService {
  param([object]$Service)

  Restart-Service -Name $Service.Name -Force -ErrorAction Stop
  Start-Sleep -Seconds 4
}

function Escape-SqlLiteral {
  param([string]$Value)
  return $Value -replace "'", "''"
}

Assert-PasswordInput

if (-not (Test-IsAdministrator)) {
  Restart-AsAdministrator
}

$backupPath = $null
$hbaPath = $null

try {
  Write-Host "POSTGRESQL PASSWORD RESET"
  Write-Host "- Scope: local PostgreSQL installation only."
  Write-Host "- Use this only for a new/local Arab Compliance Hub installation or a PostgreSQL server you own."

  $psqlCommand = Resolve-PsqlPath
  if (-not $psqlCommand) {
    throw "psql was not found. Install PostgreSQL Client/Server first, then retry."
  }

  $service = Get-PostgresService
  $dataDir = Resolve-DataDirectory -Service $service
  $hbaPath = Join-Path $dataDir "pg_hba.conf"
  if (-not (Test-Path -LiteralPath $hbaPath)) {
    throw "pg_hba.conf was not found at: $hbaPath"
  }

  $timestamp = Get-Date -Format "yyyyMMddHHmmss"
  $backupPath = "$hbaPath.ach-reset-backup-$timestamp"
  Copy-Item -LiteralPath $hbaPath -Destination $backupPath -Force
  Write-Host "- PostgreSQL authentication config backed up."

  $original = Get-Content -LiteralPath $backupPath -Raw
  $temporaryTrust = @"
# ACH_TEMP_PASSWORD_RESET_START
host all $DbUser 127.0.0.1/32 trust
host all $DbUser ::1/128 trust
# ACH_TEMP_PASSWORD_RESET_END

"@

  Set-Content -LiteralPath $hbaPath -Value ($temporaryTrust + $original) -Encoding UTF8
  Restart-PostgresService -Service $service
  Write-Host "- Temporary local trust rule applied."

  $escapedPassword = Escape-SqlLiteral -Value $NewPassword
  $escapedUser = $DbUser -replace '"', '""'
  $alterSql = "ALTER USER ""$escapedUser"" WITH PASSWORD '$escapedPassword';"
  $alterOutput = & $psqlCommand -h "127.0.0.1" -p "$DbPort" -U $DbUser -d "postgres" -v "ON_ERROR_STOP=1" -c $alterSql 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Could not reset PostgreSQL password. Details: $($alterOutput | Out-String)"
  }

  Copy-Item -LiteralPath $backupPath -Destination $hbaPath -Force
  Restart-PostgresService -Service $service
  Write-Host "- Original PostgreSQL authentication config restored."

  $env:PGPASSWORD = $NewPassword
  $testOutput = & $psqlCommand -w -h "127.0.0.1" -p "$DbPort" -U $DbUser -d "postgres" -tAc "SELECT 1;" 2>&1
  if ($LASTEXITCODE -ne 0 -or (($testOutput | Out-String).Trim() -ne "1")) {
    throw "Password was changed, but the final login test failed. Details: $($testOutput | Out-String)"
  }

  Write-Host "PostgreSQL password reset completed successfully."
  Write-Host "Return to the installer and click Retry Step 5 Database Set-up."
  exit 0
}
catch {
  if ($backupPath -and $hbaPath -and (Test-Path -LiteralPath $backupPath)) {
    try {
      Copy-Item -LiteralPath $backupPath -Destination $hbaPath -Force
      if ($service) { Restart-PostgresService -Service $service }
      Write-Host "- PostgreSQL authentication config restored after failure."
    } catch {}
  }

  Write-Host ("ERROR: " + $_.Exception.Message)
  exit 1
}
finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
