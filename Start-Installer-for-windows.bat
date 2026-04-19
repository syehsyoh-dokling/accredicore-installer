@echo off
setlocal
cd /d "%~dp0"

echo Starting Arab Compliance Hub Installer for Windows...
echo.
echo This launcher will open the native Windows runner for Step 1 and the next installation steps.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0windows\runner\Launch-Gui.ps1"

if errorlevel 1 (
  echo.
  echo The native runner could not be started automatically.
  echo Please right-click this file and choose "Run as administrator" if needed.
  echo You can also run:
  echo   windows\runner\Launch-Gui.ps1
  pause
)

endlocal
