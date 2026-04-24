import { describe, expect, it } from "vitest";

import { buildMarkdownNote } from "./markdown";

describe("buildMarkdownNote", () => {
  it("builds Obsidian frontmatter with mapped metadata", () => {
    const markdown = buildMarkdownNote({
      bookTitle: "The Pragmatic Programmer",
      author: "Andrew Hunt",
      location: "123",
      createdAt: "2026-04-24T12:00:00.000Z",
      transcriptText: "A practical quote.",
    });

    expect(markdown).toContain("date: 04-24-2026");
    expect(markdown).toContain("title: The Pragmatic Programmer");
    expect(markdown).toContain("author: Andrew Hunt");
    expect(markdown).toContain("page: 123");
    expect(markdown).toContain("tags:");
    expect(markdown).toContain("## Quote");
    expect(markdown).toContain("A practical quote.");
  });

  it("falls back to empty metadata and placeholder quote body", () => {
    const markdown = buildMarkdownNote({
      bookTitle: "",
      author: "",
      location: "",
      createdAt: "2026-04-24T12:00:00.000Z",
      transcriptText: "",
    });

    expect(markdown).toContain("title: ");
    expect(markdown).toContain("author: ");
    expect(markdown).toContain("page: ");
    expect(markdown).toContain("_(no transcript yet)_");
  });
});
