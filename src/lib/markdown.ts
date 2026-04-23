import type { Note } from "../types/note";

export function buildMarkdownNote(note: Pick<Note, "bookTitle" | "location" | "createdAt" | "transcriptText">) {
  const title = note.bookTitle?.trim() || "Reading Note";
  const source = note.bookTitle?.trim() || "Unknown Book";
  const location = note.location?.trim() || "N/A";
  const capturedAt = new Date(note.createdAt).toLocaleString();

  return `# ${title}

- Source: ${source}
- Location: ${location}
- Captured: ${capturedAt}

${note.transcriptText}
`;
}
