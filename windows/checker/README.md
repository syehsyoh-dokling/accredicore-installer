# Windows Real Checker

This stage adds a real PowerShell checker for Windows.

## Files
- Check-SystemRequirements.ps1
- Run-RequirementCheck.ps1
- output/system-requirements.json

## Run manually
```powershell
powershell -ExecutionPolicy Bypass -File .\Run-RequirementCheck.ps1
```

## Purpose
This checker produces actual JSON output for:
- Git
- Node.js
- npm / pnpm
- Docker
- disk space
- internet connection
- required ports
- write access
