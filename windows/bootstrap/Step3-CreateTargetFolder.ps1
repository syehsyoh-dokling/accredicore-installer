param(
  [Parameter(Mandatory=$true)][string]$TargetDir
)

$ErrorActionPreference = "Stop"

function Resolve-TargetDir {
  param([string]$PathInput)

  $p = ($PathInput | ForEach-Object { $_.Trim() })

  if ([string]::IsNullOrWhiteSpace($p)) {
    throw "TargetDir is required."
  }

  $desktop   = [Environment]::GetFolderPath("Desktop")
  $documents = [Environment]::GetFolderPath("MyDocuments")
  $home      = $HOME

  if ($p -ieq "Desktop") {
    return Join-Path $desktop "AccrediCore"
  }

  if ($p -ieq "Documents") {
    return Join-Path $documents "AccrediCore"
  }

  if ($p -match '^[A-Za-z]:\\$') {
    return Join-Path $p "AccrediCore"
  }

  if ($p -notmatch '^[A-Za-z]:\\') {
    if ($p -like 'Desktop\*') {
      return Join-Path $desktop ($p.Substring(8))
    }
    if ($p -like 'Documents\*') {
      return Join-Path $documents ($p.Substring(10))
    }
    return Join-Path $home $p
  }

  return $p
}

try {
  $ResolvedTargetDir = Resolve-TargetDir -PathInput $TargetDir

  if (-not (Test-Path $ResolvedTargetDir)) {
    New-Item -ItemType Directory -Path $ResolvedTargetDir -Force | Out-Null
    Write-Host "Created target folder:"
    Write-Host "  $ResolvedTargetDir"
  } else {
    Write-Host "Target folder already exists:"
    Write-Host "  $ResolvedTargetDir"
  }

  $writableTest = Join-Path $ResolvedTargetDir ".write-test.tmp"
  "ok" | Set-Content -Path $writableTest -Encoding UTF8
  Remove-Item $writableTest -Force

  Write-Host ""
  Write-Host "STEP 3.2 RESULT"
  Write-Host "- Target folder is ready."
  Write-Host "- Resolved path: $ResolvedTargetDir"
  Write-Host "- Write access confirmed."
  exit 0
}
catch {
  Write-Host "ERROR: $($_.Exception.Message)"
  exit 1
}
