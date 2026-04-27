function formatDate(dateIso: string): string {
  const date = new Date(dateIso);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${month}-${day}-${year}`;
}

export function buildMarkdownNote(note: {
  bookTitle?: string;
  author?: string;
  location?: string;
  createdAt: string;
  transcriptText: string;
}) {
  const bookTitle = note.bookTitle?.trim() || "";
  const author = note.author?.trim() || "";
  const page = note.location?.trim() || "";
  const capturedDate = formatDate(note.createdAt);
  const body = note.transcriptText?.trim() || "_(no transcript yet)_";

  return `---
date: ${capturedDate}
title: ${bookTitle}
author: ${author}
page: ${page}
tags:
---
## Note
${body}`;
}
