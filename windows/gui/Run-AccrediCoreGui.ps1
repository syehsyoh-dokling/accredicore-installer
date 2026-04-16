param(
    [string]$GuiPath = "C:\Users\Saifuddin\accredicore-installer\windows\gui\index.html"
)

if (-not (Test-Path -LiteralPath $GuiPath)) {
    throw "GUI file not found: $GuiPath"
}

Start-Process $GuiPath
