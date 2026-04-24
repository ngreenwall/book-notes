/** Relative path (optional folders + filename) for a saved markdown note. */
export function buildRelativeNotePath(
  relativeFolder: string,
  createdAt: string,
  bookTitle?: string | null
): string {
  const folder = relativeFolder.trim().replace(/^\/+|\/+$/g, "");
  const iso = createdAt.replace(/[:.]/g, "-").slice(0, 19);
  const slug = slugify(bookTitle, 48);
  const base = slug ? `${iso}-${slug}` : `${iso}-voice-note`;
  const fileName = `${base}.md`.replace(/[/\\?%*:|"<>#]/g, "-");
  return folder ? `${folder}/${fileName}` : fileName;
}

function slugify(s: string | null | undefined, max: number): string {
  if (!s?.trim()) {
    return "";
  }
  return s
    .trim()
    .slice(0, max)
    .replace(/[/\\?%*:|"<>#\n\r]/g, "-")
    .replace(/\s+/g, "-");
}
