# Book Notes Voice

Mobile-first app for capturing spoken notes while reading, transcribing on iOS, and saving markdown into a folder you choose (vault).
Session history source of truth: use `docs/CONTEXT.md` only (do not maintain dated history in this file).

## Project docs (for you and for Cursor)

Start here if you are not sure which file to read. Think of this as a "where do I go next?" guide.

| File | Purpose |
|------|--------|
| [README.md](README.md) | This file — what the app does, setup, run on device, how to start new chats. |
| [AGENTS.md](AGENTS.md) | Short defaults for coding agents (dev build, vault, patch-package). |
| [docs/CONTEXT.md](docs/CONTEXT.md) | Deep operational notes — Metro, Xcode, physical iPhone, troubleshooting, **optional session log** at the bottom. |

Cursor loads [`.cursor/rules/book-notes-voice.mdc`](.cursor/rules/book-notes-voice.mdc) automatically for invariants.

## What v1 does

This is what the app can do right now. If something is not listed here, it is probably not built yet.

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

These are the main tools/libraries used by the app. Check this when you are debugging and want to know what technology is responsible for a feature.

- Expo React Native + TypeScript
- Zustand + AsyncStorage
- `expo-audio` for recording
- `expo-speech-recognition` for iOS transcription (requires a **development build** — `npx expo run:ios`; not available in stock Expo Go)
- `expo-file-system` for saving notes into a user-chosen vault folder

## Local setup (machine prep)

Use this section to prepare your computer before testing. You usually do this once per machine, then only repeat parts of it when dependencies or native settings change.

**Tip:** Avoid **spaces in the project folder path** (e.g. `.../AI Projects/...`). They can break React Native’s prebuilt iOS binaries; this repo sets `ios.buildReactNativeFromSource` in `ios/Podfile.properties.json` to work around that (first iOS build is slower). Moving the repo to a path without spaces is still the most reliable option.

1. **[One-time per machine] Install dependencies** — downloads packages and runs `patch-package` (reapplies `patches/expo-constants+55.0.15.patch` for iOS script paths):

   ```bash
   npm install
   ```

2. **[Every session] Start Metro** — JavaScript bundler; keep this running while you develop (default LAN URL so a physical phone can connect):

   ```bash
   npm run start
   ```

3. **[Optional] Typecheck** (useful before commits):

   ```bash
   npx tsc --noEmit
   ```

4. **[Optional] Run tests** (Vitest):

   ```bash
   npm test
   ```

## Run on your iPhone (device testing)

Use this when you are ready to test on your actual iPhone. A **real device** works much better for microphone + speech than the iOS Simulator. Start here after [local setup (machine prep)](#local-setup-machine-prep).

1. **[First time or reconnect] Connect the iPhone** with USB, unlock it, tap **Trust** if prompted — establishes the device as an Xcode run destination.
2. **[One-time per iPhone] Xcode setup** — add your Apple ID under **Xcode → Settings → Accounts**; open `ios/booknotesvoice.xcworkspace`, select target **booknotesvoice**, **Signing & Capabilities** → your **Team** (personal team is fine). This creates/provisions a dev signing identity so the app can install on your phone.
3. **[One-time per iPhone] Developer Mode** (iOS 16+) — if the system asks, enable **Settings → Privacy & Security → Developer Mode** and reboot — required to run development-signed apps.
4. **[Every session] Build and install (or re-run) the dev client** from the **repo root** — compiles native code + JS bundle and installs the app on the phone:

   ```bash
   npx expo run:ios --device
   ```

   Optional: `npx expo run:ios --device "Your iPhone Name"` to skip the device picker.

5. **[Every session] Keep Metro running** on your Mac (`npm run start`) — the dev client loads the JS bundle from your machine. Use **default LAN** (do not use `npx expo start --localhost` for a phone on Wi‑Fi).
6. **[Every session] Same Wi‑Fi** for Mac and iPhone — so the phone can reach `http://<your-mac-ip>:8081` (unless you use `npx expo start --tunnel` for difficult networks).
7. **[If prompted by iOS] Trust the developer app** — **Settings → General → VPN & Device Management** → trust your developer certificate.
8. **[Every session] In the app, verify permissions + flow** — allow **Microphone** and **Speech Recognition** when prompted, then test **Capture → stop → transcript** and **Save to Vault** after choosing a folder under **History**.

Signing errors, “No script URL,” firewall, and tunnel mode are covered in [docs/CONTEXT.md](docs/CONTEXT.md) → **Physical iPhone (dev build)** and **Metro / dev server**.

### Quick repeat checklist (two terminals + phone)

Use this every day after the first setup is done. It is the shortest repeatable test flow.

#### Terminal 1 (Metro)

```bash
npm run start
```

- Keep this running.
- Leave it on **LAN** (for physical phone testing).

#### Terminal 2 (native iOS dev build install)

```bash
npx expo run:ios --device
```

- Pick your iPhone if prompted.
- Wait for build + install to finish.

#### On your iPhone

1. Open the installed **booknotesvoice** dev app.
2. Confirm iPhone and Mac are on the same Wi-Fi (or use USB networking).
3. If prompted, allow **Microphone** and **Speech Recognition** permissions.
4. Test flow: **Capture → Stop → Transcript appears**.
5. Go to **History** and use **Choose vault folder** (again if needed after restart), then test **Save to Vault**.

#### Why both terminals are needed

- `expo run:ios --device` builds/installs the **native app container** on the phone.
- `npm run start` runs **Metro**, which serves your latest JavaScript bundle to that app.
- No Metro = app opens but cannot load current JS ("No script URL"/connection errors).

## Continuing in a new chat (context window full)

Use this when you start a new Cursor chat and do not want to lose momentum. It helps the next agent understand what you already did and what to do next.

Quick reusable handoff prompt (for this and future projects):

Tip: you can run `/handoff` in Cursor chat to insert/use this prompt without copying and pasting.
This command is project-local and defined in `.cursor/commands/handoff.md`.
To reuse in another repo, copy `.cursor/commands/handoff.md` into that repo's `.cursor/commands/` folder.

```text
Before we end, do a quick handoff:
1) Update docs/CONTEXT.md session log with only essentials (max 3 bullets total: what changed, what is next, blockers).
2) Update other project memory/docs only if changes are durable and user-facing (skip duplicates/speculative notes; if none, say "No additional doc updates needed.").
3) Deduplicate before adding: if the same point appears in the newest 1-2 session notes, update that note instead of appending a near-duplicate.
4) Keep edits concise by updating existing text when possible, not adding new sections; if session notes exceed 10 entries, archive the oldest to `docs/archive/context-YYYY-MM.md` before adding a new one.
If context will matter in the next chat, give me a 1-paragraph next-session starter prompt. Otherwise skip it.
```

1. **After running the handoff prompt above, confirm the session log is updated** at the bottom of [docs/CONTEXT.md](docs/CONTEXT.md) (what changed, what is next, blockers), deduplicated, and still capped at 10 recent entries. If needed, add 1-2 lines manually.
2. **Open a new chat** with the repo folder already open in Cursor.
3. **If you need a starter prompt, paste or send something like this:** use it when prior context matters; skip it for small standalone tasks.

   ```text
   Read AGENTS.md and docs/CONTEXT.md for project context.

   Current goal: [one sentence].

   Relevant files (optional): @[path] @[path]
   ```

4. **Attach only what you need** — `@` files or folders for the current task so the model does not re-read the whole tree blindly.
5. **Optional (only if needed):** summarize the ending of the old thread yourself (or use your editor’s thread tools if available), then paste a short summary into the session log in `docs/CONTEXT.md` instead of the full transcript.
6. **Monthly hygiene checkpoint (5 minutes):** merge near-duplicate session notes, archive overflow notes to `docs/archive/context-YYYY-MM.md`, and remove stale "Next" items that are already complete.

The [`.cursor/rules/book-notes-voice.mdc`](.cursor/rules/book-notes-voice.mdc) rule already carries stable invariants (dev build, vault session behavior, patch-package), so new chats start with that baseline without you repeating it.

## Project structure

This is a simple map of the project folders. Use it when you need a quick reminder of where things live.

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

These are "nice to have" ideas for later. You can ignore them if your current goal is iPhone testing.

1. Optional: Android transcription path in `src/lib/transcribe.ts` (file-based recognition needs Android 13+ in `expo-speech-recognition`).
2. Optional: cloud fallback (e.g. OpenAI Whisper via a backend) if Apple’s transcript quality is not enough.

## Transcription notes

Use these notes if transcription is missing, looks wrong, or behaves differently across devices.

- **iOS:** After `npx expo run:ios`, grant microphone + speech recognition when prompted. On-device recognition is used when the device supports it; otherwise the module falls back to Apple’s networked speech service.
- **Other platforms:** `transcribeAudio` throws; use Review to type or paste.
- Keep local audio files intact when transcription fails.
- Note states: `transcribing` → `ready` or `transcribing` → `failed`.
