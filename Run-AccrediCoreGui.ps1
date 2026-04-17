param()
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$GuiPath = Join-Path $RepoRoot 'index.html'
if (-not (Test-Path -LiteralPath $GuiPath)) { throw "Launcher file not found: $GuiPath" }
Start-Process $GuiPath
