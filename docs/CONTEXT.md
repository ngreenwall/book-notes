# Book Notes Voice — project context

Deep operational notes for humans and coding agents. **Product overview and install:** [README.md](../README.md). **Agent defaults:** [AGENTS.md](../AGENTS.md).

---

## New Cursor chat

1. **File → Open Folder…** — open this repo (folder with `package.json` and `ios/`).
2. Ask the agent to read **`AGENTS.md`** and **`docs/CONTEXT.md`** before large changes or native debugging.
3. **Speech / recording** need a **development build** (`npx expo run:ios` / `--device`). Stock **Expo Go** does not provide the full speech stack for this app.
4. **Metro** from repo root. If the dev client opens from the home screen but shows **No script URL**, run **`npx expo start`** (LAN) and reinstall or reopen with Metro running.

---

## What this app is

**Book Notes Voice** — Expo React Native: record short voice notes while reading, transcribe on **iOS**, edit in **Review**, save markdown with **Save to Vault** (folder picker + file write). Tabs: **Capture** / **Review** / **History**. State: **Zustand** + **AsyncStorage** (`book-notes-voice-store` for notes, `book-notes-voice-settings` for vault path). Notes store exposes `createNote`, `updateNote`, `updateStatus`, `deleteNote` (also removes the local audio file), `getNoteById`, `setActiveNote`. Status values: `transcribing` | `ready` | `exported` | `failed`. Types: `src/types/note.ts`, stores: `src/store/useNoteStore.ts`, `src/store/useSettingsStore.ts`.

---

## Current stack (high signal)

- **Expo SDK 55**, React 19.2, React Native 0.83.6.
- **Audio:** `expo-audio` in `CaptureScreen.tsx` (not `expo-av`).
- **Transcription (iOS):** `expo-speech-recognition` in `src/lib/transcribe.ts` — on-device when supported, else Apple network recognition; accepts an optional `AbortSignal` (Capture cancels pending transcription on unmount); **non-iOS** `transcribeAudio` throws (use Review manually).
- **Vault:** `expo-file-system` — `Directory.pickDirectoryAsync`, write via `src/lib/saveNoteToVault.ts`; UI `src/components/VaultSettingsCard.tsx`; optional subfolder in settings. **iOS:** access to the picked folder is **session-scoped**; after a cold app restart the user may need **Choose vault folder** again before saves work.
- **`app.json` plugins:** `expo-audio`, `expo-asset`, `expo-file-system` (`supportsOpeningDocumentsInPlace: true`), `expo-speech-recognition`.
- **iOS Info.plist:** `LSSupportsOpeningDocumentsInPlace` for document workflow; no `obsidian` URL scheme (removed when Save to Vault replaced Obsidian URIs).
- **`patch-package`:** `postinstall` reapplies `patches/expo-constants+55.0.15.patch` (iOS script paths with spaces in `$PODS_TARGET_SRCROOT`).
- **Path with spaces:** `ios/Podfile.properties.json` sets `ios.buildReactNativeFromSource: true` to avoid `React-Core-prebuilt` issues; first native build is slower. Moving the repo to a path **without spaces** is still the most reliable fix.

---

## Important source files

| Area | Files |
|------|--------|
| Tabs / navigation | `App.tsx` |
| Capture / record | `src/screens/CaptureScreen.tsx` |
| Transcript edit | `src/screens/ReviewScreen.tsx` |
| History + vault settings header | `src/screens/HistoryScreen.tsx` |
| Markdown body | `src/lib/markdown.ts` |
| Transcription | `src/lib/transcribe.ts` |
| Save `.md` to picked folder | `src/lib/saveNoteToVault.ts`, `src/lib/noteFilePath.ts` |
| Vault UI + picker | `src/components/VaultSettingsCard.tsx` |
| Settings persist | `src/store/useSettingsStore.ts` (merge maps legacy `obsidianRelativeFolder` → `vaultSubfolder`) |

**Layout:** `HistoryScreen` uses `FlatList` and is **not** nested inside the same outer `ScrollView` as Capture/Review (avoids VirtualizedList warning).

---

## Reopen / move repo

1. Open the new folder in Cursor.
2. Repo root: `npm install` (runs `patch-package`).
3. iOS: `cd ios && pod install`, then `npx expo run:ios` or `npx expo run:ios --device`.
4. If you run `npx expo prebuild --clean`, re-check Xcode **Bundle React Native code and images** phase and native plist keys; `patch-package` still runs on `npm install`.

---

## iOS native build / Xcode

### `React-Core-prebuilt` / missing `source`

Often path-with-spaces related. Mitigation: `ios/Podfile.properties.json` → `buildReactNativeFromSource: true`.

### `xcodebuild` exit 65 / database is locked

Do not run two iOS builds at once on the same DerivedData. Quit duplicates; optionally `rm -rf ~/Library/Developer/Xcode/DerivedData/booknotesvoice-*`, then one `npx expo run:ios`.

### Other space-related noise

`find: .../AI: No such file or directory` during scripts — unquoted paths; move repo if builds break.

---

## Expo Go vs dev client

Expo Go may lag SDK 55. Use **`npx expo run:ios`** (or EAS dev client) for speech + recording.

---

## Metro / dev server

- Avoid **`npx expo start --localhost`** for physical phones; use default **LAN** (`npx expo start` / `-c`).
- **Stale bundle:** `npx expo start -c`, reload app (e.g. Cmd+R in Simulator).

---

## Physical iPhone (dev build)

Use a **real device** for mic + transcription; Simulator often gives empty transcripts.

### Prerequisites

- USB, Trust this Computer.
- **Xcode** → **Settings → Accounts** — Apple ID; **Signing & Capabilities** on target **booknotesvoice** — team selected. Bundle ID: `com.anonymous.book-notes-voice` (`app.json`).
- **Developer Mode** on iPhone if prompted (iOS 16+).

### Install dev client

From **repo root**:

```bash
npx expo run:ios --device
```

Optional: `npx expo run:ios --device "Your iPhone Name"`.

Signing failures: open `ios/booknotesvoice.xcworkspace` in Xcode, select team, **Product → Run** to device once.

### Code signing errors (no certificates)

Xcode → Settings → Accounts → Manage Certificates → **+** → Apple Development. Accept Apple agreements at appleid.apple.com if **+** is disabled. `xcode-select -p` should be `.../Xcode.app/Contents/Developer`.

### Metro so JS loads on device

1. `npx expo start` (LAN).
2. Same Wi‑Fi as Mac (or `npx expo start --tunnel` if blocked).
3. Mac firewall: allow Node incoming if needed.

### First launch

**Settings → General → VPN & Device Management** — trust developer. In app: allow **Microphone** and **Speech Recognition**.

---

## Quick commands

| Goal | Command |
|------|--------|
| Install deps | `npm install` |
| Start Metro | `npx expo start` |
| Clear Metro cache | `npx expo start -c` |
| Simulator from Metro | `i` |
| Tunnel | `npx expo start --tunnel` |
| Health check | `npx expo-doctor` |
| Typecheck | `npx tsc --noEmit` |
| Pods | `cd ios && pod install` |
| Dev build iOS | `npx expo run:ios` |
| Dev build on device | `npx expo run:ios --device` |

---

## Optional cleanup ideas

- RN `SafeAreaView` deprecation — consider `react-native-safe-area-context`.

---

## Recent session notes (edit me)

Keep the **newest** entry at the **top** (one or two lines per session is enough).

- **2026-04-24** — architecture review pass: Capture now cancels pending transcription on unmount (AbortSignal) and shows a "Transcribing…" indicator; Review guards local edits with a dirty-ref so store updates don't clobber typing; History has a **Delete** action that also removes the local audio file (new `deleteNote` in `useNoteStore`); markdown shows `_(no transcript yet)_` when empty; `"draft"` dropped from `NoteStatus`; `openai` removed from dependencies.
- _Add entries here when wrapping a session (what shipped, what is next, blockers)._
