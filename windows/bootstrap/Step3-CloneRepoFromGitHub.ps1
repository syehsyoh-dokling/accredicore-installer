param(
  [Parameter(Mandatory=$true)][string]$RepoUrl,
  [Parameter(Mandatory=$true)][string]$TargetDir
)

$ErrorActionPreference = "Stop"

function Resolve-TargetDir {
  param([string]$PathInput)

  $p = ($PathInput | ForEach-Object { $_.Trim() })
  Write-Host "RAW TARGETDIR INPUT: [$p]"

  if ([string]::IsNullOrWhiteSpace($p)) {
    throw "TargetDir is required."
  }

  $desktopPath   = [Environment]::GetFolderPath("Desktop")
  $documentsPath = [Environment]::GetFolderPath("MyDocuments")
  $userHomePath  = [System.Environment]::GetFolderPath("UserProfile")

  if ($p -ieq "Desktop") {
    return Join-Path $desktopPath "AccrediCore"
  }

  if ($p -ieq "Documents") {
    return Join-Path $documentsPath "AccrediCore"
  }

  if ($p -like 'User\*' -or $p -like 'Users\*') {
    $suffix = $p -replace '^(User|Users)[\\/]*', ''
    return Join-Path $userHomePath $suffix
  }

  if ($p -like 'Desktop\*') {
    $suffix = $p.Substring(8).TrimStart('\','/')
    return Join-Path $desktopPath $suffix
  }

  if ($p -like 'Documents\*') {
    $suffix = $p.Substring(10).TrimStart('\','/')
    return Join-Path $documentsPath $suffix
  }

  if ($p -match '^[A-Za-z]:\\$') {
    return Join-Path $p "AccrediCore"
  }

  if ($p -notmatch '^[A-Za-z]:\\') {
    return Join-Path $userHomePath $p
  }

  return $p
}

function Test-AccrediCoreProject {
  param([string]$PathInput)

  $required = @(
    "README.md",
    ".gitignore",
    "app-source",
    "database\bootstrap",
    "docs",
    "scripts"
  )

  foreach ($item in $required) {
    if (-not (Test-Path (Join-Path $PathInput $item))) {
      return $false
    }
  }

  return $true
}

function Test-FolderHasContent {
  param([string]$PathInput)

  $existing = Get-ChildItem -Path $PathInput -Force -ErrorAction SilentlyContinue
  return ($existing -and $existing.Count -gt 0)
}

function Get-AvailableTargetDir {
  param([string]$PreferredPath)

  if (-not (Test-Path $PreferredPath)) {
    return $PreferredPath
  }

  if (-not (Test-FolderHasContent -PathInput $PreferredPath)) {
    return $PreferredPath
  }

  if (Test-AccrediCoreProject -PathInput $PreferredPath) {
    return $PreferredPath
  }

  for ($i = 1; $i -le 99; $i++) {
    $candidate = "$PreferredPath-$i"
    if (-not (Test-Path $candidate)) {
      return $candidate
    }
    if (-not (Test-FolderHasContent -PathInput $candidate)) {
      return $candidate
    }
  }

  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  return "$PreferredPath-$stamp"
}

try {
  if ([string]::IsNullOrWhiteSpace($RepoUrl)) {
    throw "RepoUrl is required."
  }

  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "Git is not installed or not available in PATH."
  }

  $ResolvedTargetDir = Resolve-TargetDir -PathInput $TargetDir
  $PreferredTargetDir = $ResolvedTargetDir
  $ResolvedTargetDir = Get-AvailableTargetDir -PreferredPath $ResolvedTargetDir

  $parentDir = Split-Path -Path $ResolvedTargetDir -Parent
  if (-not (Test-Path $parentDir)) {
    New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
  }

  if (-not (Test-Path $ResolvedTargetDir)) {
    New-Item -ItemType Directory -Path $ResolvedTargetDir -Force | Out-Null
    Write-Host "Target folder created automatically:"
    Write-Host "  $ResolvedTargetDir"
  } else {
    Write-Host "Target folder already exists:"
    Write-Host "  $ResolvedTargetDir"
  }

  if ((Test-FolderHasContent -PathInput $ResolvedTargetDir) -and (Test-AccrediCoreProject -PathInput $ResolvedTargetDir)) {
    Write-Host ""
    Write-Host "Existing AccrediCore project detected. Clone step skipped safely."
    Write-Host "Target   : $ResolvedTargetDir"
    Write-Host ""
    Write-Host "STEP 3 RESULT"
    Write-Host "- Existing repository/project was reused."
    Write-Host "- No files were overwritten."
    Write-Host "- Resolved path: $ResolvedTargetDir"
    exit 0
  }

  if ($PreferredTargetDir -ne $ResolvedTargetDir) {
    Write-Host ""
    Write-Host "Preferred target folder already contains unrelated files."
    Write-Host "The installer selected a clean folder automatically:"
    Write-Host "  $ResolvedTargetDir"
  }

  Write-Host ""
  Write-Host "Cloning repository from GitHub..."
  Write-Host "Repo URL : $RepoUrl"
  Write-Host "Target   : $ResolvedTargetDir"
  Write-Host ""

  git clone $RepoUrl $ResolvedTargetDir
  if ($LASTEXITCODE -ne 0) {
    throw "git clone failed."
  }

  Write-Host ""
  Write-Host "STEP 3 RESULT"
  Write-Host "- Target folder prepared automatically."
  Write-Host "- Repository clone completed successfully."
  Write-Host "- Resolved path: $ResolvedTargetDir"
  exit 0
}
catch {
  Write-Host "ERROR: $($_.Exception.Message)"
  exit 1
}

