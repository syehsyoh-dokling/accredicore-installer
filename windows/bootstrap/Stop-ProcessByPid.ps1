param(
  [Parameter(Mandatory=$true)][string]$Pid
)

$ErrorActionPreference = "Stop"

try {
  $process = Get-Process -Id $Pid -ErrorAction Stop
  Stop-Process -Id $Pid -Force -ErrorAction Stop
  Write-Host "Stopped process successfully:"
  Write-Host "  PID   : $Pid"
  Write-Host "  Name  : $($process.ProcessName)"
  exit 0
}
catch {
  Write-Host "ERROR: $($_.Exception.Message)"
  exit 1
}
