# Agent instructions — Book Notes Voice

Session history source of truth: write dated session notes in `docs/CONTEXT.md` only (**Shipped** / **Next** / **Blockers** = repo and product state—avoid doc-changelog prose; details belong in archive or PRs).

## Read first

For architecture, native iOS quirks, Metro, device install, and vault behavior, read **`docs/CONTEXT.md`**. For human-facing setup, **`README.md`**.

## Non-negotiables

- **Development build** required for Apple speech + full recording (`npx expo run:ios` / `--device`). Do not assume stock Expo Go matches this workflow.
- **Vault saves** use `expo-file-system` and a **system folder picker**. On **iOS**, picked-folder access may **not** survive an app cold start — UX and errors should assume the user may need **Choose vault folder** again.
- **`npm install`** runs **`patch-package`**; do not remove `patches/expo-constants+55.0.15.patch` without replacing the fix for path-with-spaces in Pods scripts.
- Prefer **minimal diffs**; match existing patterns in `src/` (imports, Zustand, screen layout).

## Pointers

- Books store: `src/store/useBookStore.ts` — AsyncStorage `book-notes-voice-books-v1` (persisted: `books`; includes system Uncategorized).
- Notes store: `src/store/useNoteStore.ts` — AsyncStorage `book-notes-voice-store-v2` (persisted field: `notes` only; each note has `bookId`).
- Flow: `MyBooksScreen` → open book → `BookNotesScreen` → `NoteCreatorScreen` (overlay) for new/edit note; vault export from book notes list or prior patterns.
- Settings: `src/store/useSettingsStore.ts` — `book-notes-voice-settings`; persisted `vaultRootUri`, `hasCompletedWelcome` (welcome skip/complete + legacy migration).
- Save markdown: `src/lib/saveNoteToVault.ts`, paths: `src/lib/noteFilePath.ts`.

## When changing native config

After `app.json` plugin or iOS plist changes, say clearly that the user needs a **native rebuild** (`npx expo run:ios` / `--device`), not only a Metro reload.
