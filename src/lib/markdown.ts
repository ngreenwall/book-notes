import type { Note } from "../types/note";

export function buildMarkdownNote(note: Pick<Note, "bookTitle" | "location" | "createdAt" | "transcriptText">) {
  const title = note.bookTitle?.trim() || "Reading Note";
  const book = note.bookTitle?.trim() || "Unknown book";
  const pageOrChapter = note.location?.trim() || "N/A";
  const capturedAt = new Date(note.createdAt).toLocaleString();
  const body = note.transcriptText?.trim() || "_(no transcript yet)_";

  return `# ${title}

- Book: ${book}
- Page / chapter: ${pageOrChapter}
- Captured: ${capturedAt}

${body}
`;
}
