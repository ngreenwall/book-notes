/** Relative path (optional folders + filename) for a saved markdown note. */
export function buildRelativeNotePath(
  relativeFolder: string,
  createdAt: string,
  bookTitle?: string | null,
  pageNumber?: string | null
): string {
  const folder = relativeFolder.trim().replace(/^\/+|\/+$/g, "");
  const dateLabel = formatDate(createdAt);
  const title = cleanLabel(bookTitle, "Reading Note");
  const page = cleanLabel(pageNumber, "Unknown Page");
  const base = `${title}, ${page}, ${dateLabel}`;
  const fileName = `${base}.md`.replace(/[/\\?%*:|"<>#]/g, "-");
  return folder ? `${folder}/${fileName}` : fileName;
}

function cleanLabel(value: string | null | undefined, fallback: string): string {
  return normalizeLabel(value?.trim() || fallback).replace(/[/\\?%*:|"<>#\n\r]/g, "-");
}

function formatDate(dateIso: string): string {
  const date = new Date(dateIso);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${month}-${day}-${year}`;
}

function normalizeLabel(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
