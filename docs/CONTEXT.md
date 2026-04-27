# Book Notes Voice — project context

Deep operational notes for humans and coding agents. **Product overview and install:** [README.md](../README.md). **Agent defaults:** [AGENTS.md](../AGENTS.md).

**Recent session notes** (below) should read as **ground truth for the next reader**: what exists in code, paths, constraints, **Next**, blockers—not play-by-play about editing docs or merging lines (use [`docs/archive/`](archive/) for trimmed history; handoff workflow lives in [`.cursor/skills/handoff/SKILL.md`](../.cursor/skills/handoff/SKILL.md) and [README.md](../README.md) section **Continuing in a new chat**). Keep dated session updates in this file only.

---

## New Cursor chat

1. **File → Open Folder…** — open this repo (folder with `package.json` and `ios/`).
2. Ask the agent to read **`AGENTS.md`** and **`docs/CONTEXT.md`** before large changes or native debugging.
3. **Speech / recording** need a **development build** (`npx expo run:ios` / `--device`). Stock **Expo Go** does not provide the full speech stack for this app.
4. **Metro** from repo root. If the dev client opens from the home screen but shows **No script URL**, run **`npx expo start`** (LAN) and reinstall or reopen with Metro running.

---

## What this app is

**Book Notes Voice** — Expo React Native: notes live **inside books** (title + author per book, plus system **Uncategorized**). User picks a vault folder after welcome, browses **My Books**, opens a book to see notes, then **New note** / edit opens the **note creator** as a bottom sheet (type or dictate, transcribe on **iOS**, **Save to Vault**). Tabs: **My Books** / **Settings**. State: **Zustand** + **AsyncStorage** — `book-notes-voice-books-v1` (books), `book-notes-voice-store-v2` (`notes` with required `bookId`; v2 key replaces pre-books data), `book-notes-voice-settings` (`vaultRootUri`, `hasCompletedWelcome`). Notes API: `createNote`, `updateNote`, `updateStatus`, `deleteNote`, `moveNotesToBook`, `getNoteById`. Status values: `transcribing` | `ready` | `exported` | `failed`. Types: `src/types/book.ts`, `src/types/note.ts`; shared UI colors: `src/theme/tokens.ts`.

---

## Current stack (high signal)

- **Expo SDK 55**, React 19.2, React Native 0.83.6.
- **Audio:** `expo-audio` in `NoteCreatorScreen.tsx` (not `expo-av`).
- **Transcription (iOS):** `expo-speech-recognition` in `src/lib/transcribe.ts` — on-device when supported, else Apple network recognition; accepts an optional `AbortSignal` (Note creator cancels pending transcription on unmount); **non-iOS** `transcribeAudio` throws (type the note manually).
- **Vault:** `expo-file-system` — `Directory.pickDirectoryAsync`, post-pick validate + write probe in `src/lib/vaultPicker.ts`, write via `src/lib/saveNoteToVault.ts`; UI `VaultSettingsCard`, **Settings** tab, **iOS-only** welcome in `App.tsx` (`WelcomeVaultScreen`). **iOS:** access to the picked folder is **session-scoped**; after a cold app restart the user may need **Choose notes folder** again before saves work.
- **Export contract:** markdown uses app-side Obsidian frontmatter (`date`, `title`, `author`, `page`, `tags`) with `MM-DD-YYYY` dates, plus `## Note` body. Filename uses `Book Title, Page Number, Date.md`.
- **`app.json` plugins:** `expo-audio`, `expo-asset`, `expo-file-system` (`supportsOpeningDocumentsInPlace: true`), `expo-speech-recognition`.
- **iOS Info.plist:** `LSSupportsOpeningDocumentsInPlace` for document workflow; no `obsidian` URL scheme (removed when Save to Vault replaced Obsidian URIs).
- **`patch-package`:** `postinstall` reapplies `patches/expo-constants+55.0.15.patch` (iOS script paths with spaces in `$PODS_TARGET_SRCROOT`).
- **Path with spaces:** `ios/Podfile.properties.json` sets `ios.buildReactNativeFromSource: true` to avoid `React-Core-prebuilt` issues; first native build is slower. Moving the repo to a path **without spaces** is still the most reliable fix.

---

## Important source files

| Area | Files |
|------|--------|
| Tabs / navigation + `activeBookId` + note creator sheet | `App.tsx`, `src/screens/NoteCreatorSheet.tsx` |
| Book list, create/edit/delete books, Continue last book | `src/screens/MyBooksScreen.tsx` |
| Notes for one book + Save to Vault / delete | `src/screens/BookNotesScreen.tsx` |
| New / edit note (record, transcribe, save) | `src/screens/NoteCreatorScreen.tsx` |
| Settings tab + vault | `src/screens/SettingsScreen.tsx`, `VaultSettingsCard` |
| iOS welcome / guided folder copy | `src/screens/WelcomeVaultScreen.tsx` |
| Markdown body | `src/lib/markdown.ts` |
| Transcription | `src/lib/transcribe.ts` |
| Save `.md` to picked folder | `src/lib/saveNoteToVault.ts`, `src/lib/noteFilePath.ts` |
| Pick folder + validate | `src/lib/vaultPicker.ts` |
| Books persist | `src/store/useBookStore.ts` |
| Notes persist | `src/store/useNoteStore.ts` |
| Settings persist | `src/store/useSettingsStore.ts` (`vaultRootUri`, `hasCompletedWelcome`) |

**Layout:** `MyBooksScreen` / `BookNotesScreen` use `FlatList`; do not nest those lists inside a parent `ScrollView` (VirtualizedList warning).

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
| Run tests | `npm test` |
| Simulator from Metro | `i` |
| Tunnel | `npx expo start --tunnel` |
| Health check | `npx expo-doctor` |
| Typecheck | `npx tsc --noEmit` |
| Pods | `cd ios && pod install` |
| Dev build iOS | `npx expo run:ios` |
| Dev build on device | `npx expo run:ios --device` |

---

## Recent session notes (edit me)

Keep the **newest** entry at the **top** (one or two lines per session is enough).
- Keep a **maximum of 10** recent entries here; when adding entry 11, move the oldest entry to `docs/archive/context-YYYY-MM.md` and keep this list capped.
- Deduplicate before adding: if your update repeats the newest 1-2 entries, edit the existing note instead of appending a near-duplicate.
- Entry template: `- YYYY-MM-DD — **Shipped:** … **Next:** … **Blockers:** …`
- **For AI/human readers:** Prefer **Shipped** = durable facts (screens, stores, filenames, behaviors). Reserve process-only stories for archive or PR description.

### Active blockers

- None.

- **2026-04-27** — **Shipped:** Note creator multiline `TextInput` (`styles.noteInput` in `NoteCreatorScreen.tsx`) bounded with `minHeight: 160` + `maxHeight: 240` + `textAlignVertical: "top"`, so RN's built-in multiline scroll keeps the caret on screen instead of letting the input grow off the bottom of the sheet behind the keyboard. Plus `onFocus` on the note `TextInput` calls `scrollRef.current?.scrollToEnd({ animated: true })` (250ms delay so KAV padding settles first) using a new `scrollRef` on the outer `ScrollView`, so the bounded box's bottom edge sits above the keyboard while the internal scroll keeps the caret pinned there. Sheet `KeyboardAvoidingView` and `ScrollView` keyboard inset flags unchanged (prior Page/Note over-scroll fix preserved). **Next:** QA on physical iPhone after Metro reload: New note + Edit note, long typing in Note field (caret vs keyboard); tap Page field and confirm no over-scroll above keyboard. **Blockers:** none.
- **2026-04-27** — **Shipped:** **`NoteCreatorSheet`** / **`NoteCreatorScreen`** for new/edit: bottom sheet (~90% height, fade scrim + slide) over tabs + book list; **`App.tsx`** `onFullyClosed` / **Saved** → **My Books**; discard/backdrop/Android back via `onRegisterHardwareBack` + `requestClose`. Keyboard: no full-modal **`KeyboardAvoidingView`**; **iOS** `KeyboardAvoidingView` only inside the sheet; **Android** sheet uses plain `View`; sheet **`ScrollView`**: `automaticallyAdjustKeyboardInsets` false on iOS / true on Android, iOS `contentInsetAdjustmentBehavior="never"` (stops Page + Note fields over-scrolling above the keyboard). **Next:** none. **Blockers:** none.
- **2026-04-27** — **Shipped:** **Edit details** opens an **Edit Book** bottom sheet (same motion as Add Book): title/author, **Save changes**, **Cancel**, non-primary **Delete book** (still confirms via alert); card-level **Delete** link removed (`MyBooksScreen.tsx`). **Next:** none. **Blockers:** none.
- **2026-04-27** — **Shipped:** **My Books** top **Add Book** opens a slide-up sheet (title + author); **Add Book** submits and closes the sheet; inline “New book” card removed (`MyBooksScreen.tsx`). **Next:** none. **Blockers:** none.
- **2026-04-27** — **Shipped:** Opening a book no longer crashes or loops—`src/lib/transcribe.ts` uses `await import("expo-speech-recognition")` only inside `transcribeAudio` so `BookNotesScreen` mount does not evaluate `requireNativeModule("ExpoSpeechRecognition")` (Expo Go / missing native). `BookNotesScreen` subscribes to `state.notes` and filters by `bookId` in `useMemo` (avoids React 19 / Zustand `useSyncExternalStore` “getSnapshot should be cached” + max update depth from `.filter()` inside the store selector). Commits `c10fbcb`, `355cfd7`. **Next:** none. **Blockers:** none.
- **2026-04-27** — **Shipped:** Handoff workflow is **skill-only**—removed `.cursor/commands/handoff.md`; README **Continuing in a new chat** points to `.cursor/skills/handoff/SKILL.md` (e.g. say “handoff”), replaces the long inline handoff block, notes copying `.cursor/skills/handoff/` into other repos; README project-structure tree aligned to repo (`index.ts`, `app.json`, `assets/`, `docs/archive/`, `ios/`, `patches/`, `HomeScreen.tsx`, `YourNotesScreen.tsx`, `historyValidation.ts`). Earlier same day: `docs/CONTEXT.md` intro + session-note rubric; `AGENTS.md`, `.cursor/rules/book-notes-voice.mdc`; April rows retuned; handoff doc commit on `main`. **Next:** none. **Blockers:** none.
- **2026-04-27** — **Shipped:** books-first UI and data (`MyBooksScreen`, `BookNotesScreen`, `useBookStore`, `Note` + `bookId`, `book-notes-voice-store-v2`, Uncategorized + delete-book reassignment, **Continue last book**, `src/theme/tokens.ts`, Note creator themed touch targets); work is on `main`. README **What v1 does** + project structure note aligned to My Books → book → notes flow (`HomeScreen` / `YourNotesScreen` unused). **Next:** book cover APIs deferred. **Blockers:** none.
- **2026-04-24** — **Shipped:** **Home / Your Notes / Settings** + full-screen **Note creator** (new/edit: type or record, **Stop & transcribe** appends, **Save note** to store); optional `audioUri`; `useNoteStore` persists `notes` only; removed Capture/Review/History; `historyValidation.test.ts`; README/AGENTS/CONTEXT + non-iOS transcribe; vault **Settings**-only; **follow-up:** `serializeFormSnapshot` + trimmed fields after save (fixes false **Discard** on **Close**); edit save **OK** runs `onSaved` (overlay closes, **Your Notes** tab). **Next:** none. **Blockers:** none.
- **2026-04-24** — **Shipped:** vault markdown body heading is `## Note` (replaces `## Quote`); removed extra blank line between closing frontmatter `---` and that heading (`src/lib/markdown.ts`, `markdown.test.ts`). **Next:** none. **Blockers:** none.
- **2026-04-24** — **Shipped:** iOS-only welcome + Skip with `hasCompletedWelcome`, legacy migration (no key → skip welcome loop), Settings tab + shared `pickVaultDirectoryWithValidation` (exists + write probe, no leftover probe file), optional dismissible banner when no folder; strings point to Settings for folder changes. **Confirmed:** v1 stays **pick an existing folder** only (no auto-create under iCloud parent); users use **New Folder** in Files or an existing vault, then select it. Re-test welcome from a **clean install** (delete app) because migrated installs skip welcome. **Next:** none. **Blockers:** none.
- _Prepend dated lines above—**Shipped:** / **Next:** / **Blockers:**._
