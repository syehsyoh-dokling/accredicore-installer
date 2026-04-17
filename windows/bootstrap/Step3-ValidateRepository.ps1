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
    "database\bootstrap\local_full_schema_dump.sql",
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

  Write-Host "STEP 4 RESULT"
  Write-Host "- Repository validation passed."
  Write-Host "- .git folder detected."
  Write-Host "- AccrediCore project structure detected."
  Write-Host "- Required paths found: $($requiredPaths -join ', ')"
  exit 0
}
catch {
  Write-Host "ERROR: $($_.Exception.Message)"
  exit 1
}
