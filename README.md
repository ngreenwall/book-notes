# Book Notes Voice

Mobile-first app for capturing spoken notes while reading, transcribing on iOS, and saving markdown into a folder you choose (vault).

## Project docs (for you and for Cursor)

| File | Purpose |
|------|--------|
| [README.md](README.md) | This file — what the app does, setup, run on device, how to start new chats. |
| [AGENTS.md](AGENTS.md) | Short defaults for coding agents (dev build, vault, patch-package). |
| [docs/CONTEXT.md](docs/CONTEXT.md) | Deep operational notes — Metro, Xcode, physical iPhone, troubleshooting, **optional session log** at the bottom. |

Cursor loads [`.cursor/rules/book-notes-voice.mdc`](.cursor/rules/book-notes-voice.mdc) automatically for invariants.

## What v1 does

- Record a short voice note while reading.
- Auto-transcribe after recording on **iOS** using Apple Speech (on-device when supported; falls back to Apple’s network recognition if needed).
- Edit transcript and metadata (`title`, `author`, `page`) in **Review**.
- Generate markdown note content using fixed Obsidian-style frontmatter:
  - `date`, `title`, `author`, `page`, `tags`
  - date format `MM-DD-YYYY`
- **Save to Vault** writes the note as a `.md` file using a **system folder picker** (configure under **History**). Details: [docs/CONTEXT.md](docs/CONTEXT.md) (vault / iOS session access).
- Exported filename format: `Book Title, Page Number, Date.md`.
- Persist history locally with statuses (`transcribing`, `ready`, `exported`, `failed`).

## Stack

- Expo React Native + TypeScript
- Zustand + AsyncStorage
- `expo-audio` for recording
- `expo-speech-recognition` for iOS transcription (requires a **development build** — `npx expo run:ios`; not available in stock Expo Go)
- `expo-file-system` for saving notes into a user-chosen vault folder

## Local setup

**Tip:** Avoid **spaces in the project folder path** (e.g. `.../AI Projects/...`). They can break React Native’s prebuilt iOS binaries; this repo sets `ios.buildReactNativeFromSource` in `ios/Podfile.properties.json` to work around that (first iOS build is slower). Moving the repo to a path without spaces is still the most reliable option.

1. **Install dependencies** — downloads packages and runs `patch-package` (reapplies `patches/expo-constants+55.0.15.patch` for iOS script paths):

   ```bash
   npm install
   ```

2. **Start Metro** — JavaScript bundler; keep this running while you develop (default LAN URL so a physical phone can connect):

   ```bash
   npm run start
   ```

3. **Typecheck** (optional but useful before commits):

   ```bash
   npx tsc --noEmit
   ```

4. **Run tests** (Vitest):

   ```bash
   npm test
   ```

## Run on your iPhone for testing

Use a **real device** for microphone + speech; the Simulator often produces empty transcripts. After [local setup](#local-setup):

1. **Connect the iPhone** with USB, unlock it, tap **Trust** if prompted — establishes the device as an Xcode run destination.
2. **One-time Xcode setup** — add your Apple ID under **Xcode → Settings → Accounts**; open `ios/booknotesvoice.xcworkspace`, select target **booknotesvoice**, **Signing & Capabilities** → your **Team** (personal team is fine). This creates/provisions a dev signing identity so the app can install on your phone.
3. **Developer Mode** (iOS 16+) — if the system asks, enable **Settings → Privacy & Security → Developer Mode** and reboot — required to run development-signed apps.
4. **Build and install the dev client** from the **repo root** — compiles native code + JS bundle and installs the app on the phone:

   ```bash
   npx expo run:ios --device
   ```

   Optional: `npx expo run:ios --device "Your iPhone Name"` to skip the device picker.

5. **Keep Metro running** on your Mac (`npm run start`) — the dev client loads the JS bundle from your machine. Use **default LAN** (do not use `npx expo start --localhost` for a phone on Wi‑Fi).
6. **Same Wi‑Fi** for Mac and iPhone — so the phone can reach `http://<your-mac-ip>:8081` (unless you use `npx expo start --tunnel` for difficult networks).
7. **Trust the developer app** if iOS blocks it — **Settings → General → VPN & Device Management** → trust your developer certificate.
8. **In the app**, allow **Microphone** and **Speech Recognition** when prompted, then test **Capture → stop → transcript** and **Save to Vault** after choosing a folder under **History**.

Signing errors, “No script URL,” firewall, and tunnel mode are covered in [docs/CONTEXT.md](docs/CONTEXT.md) → **Physical iPhone (dev build)** and **Metro / dev server**.

## Continuing in a new chat (context window full)

1. **Update the session log** at the bottom of [docs/CONTEXT.md](docs/CONTEXT.md) — one or two lines: what changed, what is next, any blockers. That preserves state without pasting a long chat.
2. **Open a new chat** with the repo folder already open in Cursor.
3. **Paste or send something like:**

   ```text
   Read AGENTS.md and docs/CONTEXT.md for project context.

   Current goal: [one sentence — e.g. “improve vault error when folder access expires”.]

   Relevant files (optional): @src/lib/saveNoteToVault.ts @src/screens/HistoryScreen.tsx
   ```

4. **Attach only what you need** — `@` files or folders for the current task so the model does not re-read the whole tree blindly.
5. **Optional:** summarize the ending of the old thread yourself (or use your editor’s thread tools if available), then paste a short summary into the session log in `docs/CONTEXT.md` instead of the full transcript.

The [`.cursor/rules/book-notes-voice.mdc`](.cursor/rules/book-notes-voice.mdc) rule already carries stable invariants (dev build, vault session behavior, patch-package), so new chats start with that baseline without you repeating it.

## Project structure

```text
App.tsx
docs/
  CONTEXT.md
src/
  components/
    VaultSettingsCard.tsx
  lib/
    markdown.ts
    noteFilePath.ts
    saveNoteToVault.ts
    transcribe.ts
  screens/
    CaptureScreen.tsx
    ReviewScreen.tsx
    HistoryScreen.tsx
  store/
    useNoteStore.ts
    useSettingsStore.ts
  types/
    note.ts
```

## Next steps (ideas)

1. Optional: Android transcription path in `src/lib/transcribe.ts` (file-based recognition needs Android 13+ in `expo-speech-recognition`).
2. Optional: cloud fallback (e.g. OpenAI Whisper via a backend) if Apple’s transcript quality is not enough.

## Transcription notes

- **iOS:** After `npx expo run:ios`, grant microphone + speech recognition when prompted. On-device recognition is used when the device supports it; otherwise the module falls back to Apple’s networked speech service.
- **Other platforms:** `transcribeAudio` throws; use Review to type or paste.
- Keep local audio files intact when transcription fails.
- Note states: `transcribing` → `ready` or `transcribing` → `failed`.
