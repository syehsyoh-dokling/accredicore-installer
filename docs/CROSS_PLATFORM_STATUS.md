# AccrediCore Cross-Platform Status

## Added in this package
- Universal root launcher (`index.html`) with OS detection and manual fallback.
- Shared GUI assets under `shared/gui`.
- Linux foundation: checker, runner, bootstrap, GUI.
- macOS foundation: checker, runner, bootstrap, GUI.
- Shared JSON schema under `shared/schema/system-requirements.schema.json`.
- Placeholder `logs/` and `releases/` directories.

## Current scope
This repository now has a complete cross-platform starter skeleton.

## Current operational status
- Windows has the most complete guided flow today: requirement check, dependency install, port resolution, repository clone, database bootstrap, and activation import.
- Linux and macOS are available from the root launcher and include native requirement checkers and installers, but they are still foundation-level flows and are not yet aligned with the full Windows 1-6 guided automation.

## Still not fully production-grade
- No native packaged installer (`.exe`, `.dmg`, `.AppImage`, `.deb`, etc.)
- No signed artifacts
- No fully automated dependency installation for every edge case
- No final service orchestration for the AccrediCore runtime yet
