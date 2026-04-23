# Project Handoff Notes

## Current Status
- Expo project is configured for SDK 55 and passes health checks.
- `expo-doctor` result: `18/18 checks passed`.
- Dev server starts successfully with `npx expo start`.

## Changes Made This Session
- Fixed Expo config schema issues in `app.json`:
  - Removed `expo.newArchEnabled`
  - Removed `expo.android.edgeToEdgeEnabled`
- Fixed dependency mismatch in `package.json`:
  - Removed duplicate `@types/react` from `dependencies`
  - Set `devDependencies.@types/react` to `~19.2.10` (SDK 55-compatible)
- Added Expo Doctor exclude for package metadata warning:
  - `expo.doctor.reactNativeDirectoryCheck.exclude = ["expo-av"]`

## Known Blocker
- iPhone testing in Expo Go is blocked by client version mismatch.
- Error seen in terminal:
  - "Project is incompatible with this version of Expo Go"
  - "The project you requested requires a newer version of Expo Go."
- Reported Expo Go client version on phone: `1017756` (too old for SDK 55).

## Next Steps (Recommended)
1. Delete Expo Go from iPhone.
2. Reinstall from official App Store listing:
   - https://apps.apple.com/app/expo-go/id982107779
3. Restart dev server with cache clear:
   - `npx expo start -c`
4. Scan QR again in Expo Go.

If update still does not appear or version remains old:
- Use iOS Simulator from terminal (`i` while Expo is running), or
- Build native dev client:
  - `npx expo run:ios`

## Quick Commands
- Install deps: `npm install`
- Start dev server: `npx expo start`
- Start with tunnel (if local network issues): `npx expo start --tunnel`
- Validate project: `npx expo-doctor`
