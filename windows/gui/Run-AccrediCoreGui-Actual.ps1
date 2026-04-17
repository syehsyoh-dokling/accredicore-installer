param(
    [string]$RepoPath = "C:\Users\Saifuddin\accredicore-installer"
)

$CheckerRunner = Join-Path $RepoPath "windows\checker\Run-RequirementCheck.ps1"
$WindowsRoot = Join-Path $RepoPath "windows"
$GuiHtml = Join-Path $WindowsRoot "gui\index.html"

if (-not (Test-Path -LiteralPath $CheckerRunner)) {
    throw "Checker runner not found: $CheckerRunner"
}
if (-not (Test-Path -LiteralPath $GuiHtml)) {
    throw "GUI file not found: $GuiHtml"
}

powershell -ExecutionPolicy Bypass -File $CheckerRunner

$port = 8090
$url = "http://localhost:{0}/gui/index.html" -f $port

Write-Host "Starting local server at $url" -ForegroundColor Cyan
Start-Process $url

Push-Location $WindowsRoot
try {
    python -m http.server $port
}
finally {
    Pop-Location
}
