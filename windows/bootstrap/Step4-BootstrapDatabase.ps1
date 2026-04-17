param(
  [Parameter(Mandatory=$true)][string]$ProjectRoot,
  [string]$DbHost = "127.0.0.1",
  [int]$DbPort = 5432,
  [string]$DbName = "accredicore",
  [string]$DbUser = "postgres",
  [string]$DbPassword = "",
  [string]$SchemaPath = ""
)

$ErrorActionPreference = "Stop"

function Resolve-SchemaPath {
  param(
    [string]$BaseProjectRoot,
    [string]$ExplicitPath
  )

  if (-not [string]::IsNullOrWhiteSpace($ExplicitPath)) {
    if (-not (Test-Path -LiteralPath $ExplicitPath)) {
      throw "Explicit schema file was not found: $ExplicitPath"
    }
    return (Resolve-Path -LiteralPath $ExplicitPath).Path
  }

  $candidates = @(
    (Join-Path $BaseProjectRoot "database\bootstrap\local_full_schema_dump.sql"),
    (Join-Path $BaseProjectRoot "database\bootstrap\merged_supabase_migrations.sql")
  )

  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) {
      return (Resolve-Path -LiteralPath $candidate).Path
    }
  }

  throw "No bootstrap schema file was found in the cloned AccrediCore project."
}

if (-not (Test-Path -LiteralPath $ProjectRoot)) {
  throw "ProjectRoot does not exist: $ProjectRoot"
}

$psqlCommand = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlCommand) {
  throw "psql was not found in PATH. Install PostgreSQL client/server first."
}

$schemaFile = Resolve-SchemaPath -BaseProjectRoot $ProjectRoot -ExplicitPath $SchemaPath
$env:PGPASSWORD = $DbPassword

try {
  Write-Host "STEP 5 RESULT"
  Write-Host "- Project root: $ProjectRoot"
  Write-Host "- Database target: ${DbHost}:${DbPort} / $DbName"
  Write-Host "- Schema file: $schemaFile"

  $existsOutput = & psql -h $DbHost -p $DbPort -U $DbUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$DbName';" 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Could not query PostgreSQL server. Details: $existsOutput"
  }

  $dbExists = ($existsOutput | Out-String).Trim() -eq "1"
  if (-not $dbExists) {
    $createOutput = & psql -h $DbHost -p $DbPort -U $DbUser -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE ""$DbName"";" 2>&1
    if ($LASTEXITCODE -ne 0) {
      throw "Could not create database '$DbName'. Details: $createOutput"
    }
    Write-Host "- Database created successfully."
  } else {
    Write-Host "- Database already exists. Re-importing structure into the existing database."
  }

  $importOutput = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -v ON_ERROR_STOP=1 -f $schemaFile 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Schema import failed. Details: $importOutput"
  }

  Write-Host "- Database structure import completed successfully."
  exit 0
}
finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
