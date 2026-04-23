# Book Notes Voice

Mobile-first app for capturing spoken notes while reading and quickly moving them into Obsidian.

## What v1 does

- Record a short voice note while reading.
- Auto-transcribe after recording (currently stubbed in code).
- Edit transcript.
- Generate markdown note content.
- Copy markdown for pasting into Obsidian.
- Persist history locally with statuses (`transcribing`, `ready`, `exported`, `failed`).

## Stack

- Expo React Native + TypeScript
- Zustand + AsyncStorage
- `expo-av` for recording
- `expo-clipboard` for markdown copy

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start dev server:

   ```bash
   npm run start
   ```

3. Run typecheck:

   ```bash
   npx tsc --noEmit
   ```

## Project structure

```text
App.tsx
src/
  lib/
    markdown.ts
    transcribe.ts
  screens/
    CaptureScreen.tsx
    ReviewScreen.tsx
    HistoryScreen.tsx
  store/
    useNoteStore.ts
  types/
    note.ts
```

## Next steps

1. Replace transcription stub in `src/lib/transcribe.ts` with OpenAI Whisper.
2. Add retry-safe UI messaging for transcription failures.
3. Add optional export modes (copy markdown is current v1).

## OpenAI transcription notes

- Add `OPENAI_API_KEY` to your environment.
- Keep local audio files intact when transcription fails.
- Transition note states strictly:
  - `transcribing` -> `ready`
  - `transcribing` -> `failed`
