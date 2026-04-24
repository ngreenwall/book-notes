export type NoteStatus = "transcribing" | "ready" | "exported" | "failed";

export type Note = {
  id: string;
  createdAt: string;
  bookTitle?: string;
  location?: string;
  audioUri: string;
  transcriptText: string;
  noteMarkdown: string;
  status: NoteStatus;
  errorMessage?: string;
};
