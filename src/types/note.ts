export type NoteStatus = "transcribing" | "ready" | "exported" | "failed";

export type Note = {
  id: string;
  bookId: string;
  createdAt: string;
  location?: string;
  /** Present when the note was saved with a recording; optional for typed-only notes. */
  audioUri?: string;
  transcriptText: string;
  noteMarkdown: string;
  status: NoteStatus;
  errorMessage?: string;
};
