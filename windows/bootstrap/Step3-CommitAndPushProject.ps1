param(
    [string]$ProjectRoot = "C:\AccrediCore\app",
    [string]$RemoteUrl = "",
    [string]$CommitMessage = "Production-ready installer bootstrap"
)

$ErrorActionPreference = 'Stop'
Set-Location $ProjectRoot
if (-not (Test-Path .git)) { git init | Out-Host }
if ($RemoteUrl) {
    git remote remove origin 2>$null
    git remote add origin $RemoteUrl
}
git add .
$pending = git diff --cached --name-only
if ($pending) {
    git commit -m $CommitMessage | Out-Host
} else {
    Write-Host 'No staged changes to commit.' -ForegroundColor Yellow
}
if ($RemoteUrl) {
    $branch = git branch --show-current
    if (-not $branch) {
        git checkout -b main | Out-Host
        $branch = 'main'
    }
    git push -u origin $branch | Out-Host
}
