# Build Artifact Flow

## Local developer path

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run one of the following:
   - `npm run dist:win`
   - `npm run dist:linux`
   - `npm run dist:mac`
4. Collect artifacts from `artifacts/`.

## CI path

A GitHub Actions workflow is included at `.github/workflows/build-artifacts.yml`.

Trigger conditions:
- Manual run via workflow_dispatch
- Push of tags matching `v*`

Output:
- Windows installer artifact
- Linux installer artifact
- macOS installer artifact

## Packaging targets

- Windows: NSIS installer + portable EXE
- Linux: AppImage + DEB + tar.gz
- macOS: DMG + ZIP

## Release recommendation

Before public release, add:
- signing certificates
- notarization credentials for macOS
- checksums for each artifact
- release notes automation
