export async function transcribeAudio(_audioUri: string): Promise<string> {
  // V1 bootstrap stub: replace with Whisper integration once OPENAI_API_KEY is configured.
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return "Transcription placeholder. Next step: wire OpenAI Whisper in src/lib/transcribe.ts.";
}
