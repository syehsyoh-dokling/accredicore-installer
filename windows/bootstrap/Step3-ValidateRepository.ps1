param(
  [Parameter(Mandatory=$true)][string]$ProjectRoot
)

$ErrorActionPreference = "Stop"

try {
  if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    throw "ProjectRoot is required."
  }

  if (-not (Test-Path -LiteralPath $ProjectRoot)) {
    throw "Project folder does not exist: $ProjectRoot"
  }

  $gitDir = Join-Path $ProjectRoot ".git"
  if (-not (Test-Path -LiteralPath $gitDir)) {
    throw "Validation failed: .git folder was not found."
  }

  $requiredPaths = @(
    "README.md",
    ".gitignore",
    "app-source",
    "config\env",
    "database\bootstrap",
    "docs",
    "scripts"
  )

  $missingPaths = @()
  foreach ($pathEntry in $requiredPaths) {
    if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot $pathEntry))) {
      $missingPaths += $pathEntry
    }
  }

  if ($missingPaths.Count -gt 0) {
    throw "Validation failed: missing AccrediCore project paths: $($missingPaths -join ', ')"
  }

  $schemaCandidates = @(
    "database\bootstrap\local_full_schema_dump.sql",
    "database\bootstrap\merged_supabase_migrations.sql"
  )
  $schemaFound = $false
  foreach ($schemaPath in $schemaCandidates) {
    if (Test-Path -LiteralPath (Join-Path $ProjectRoot $schemaPath)) {
      $schemaFound = $true
      break
    }
  }

  $migrationDir = Join-Path $ProjectRoot "app-source\supabase\migrations"
  $migrationCount = 0
  if (Test-Path -LiteralPath $migrationDir) {
    $migrationCount = @(Get-ChildItem -LiteralPath $migrationDir -Filter "*.sql" -File).Count
  }

  if (-not $schemaFound -and $migrationCount -eq 0) {
    throw "Validation failed: no database bootstrap schema or Supabase migration files were found."
  }

  Write-Host "STEP 4 RESULT"
  Write-Host "- Repository validation passed."
  Write-Host "- .git folder detected."
  Write-Host "- AccrediCore project structure detected."
  Write-Host "- Required paths found: $($requiredPaths -join ', ')"
  if ($schemaFound) {
    Write-Host "- Database bootstrap schema detected."
  } else {
    Write-Host "- Supabase migration files detected: $migrationCount file(s)."
  }
  exit 0
}
catch {
  Write-Host "ERROR: $($_.Exception.Message)"
  exit 1
}
