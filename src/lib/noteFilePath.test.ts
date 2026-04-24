import { describe, expect, it } from "vitest";

import { buildRelativeNotePath } from "./noteFilePath";

describe("buildRelativeNotePath", () => {
  it("uses Book Title, Page Number, Date filename format", () => {
    const result = buildRelativeNotePath(
      "Inbox/Voice Notes",
      "2026-04-24T09:12:13.000Z",
      "Deep Work",
      "42"
    );

    expect(result).toBe("Inbox/Voice Notes/Deep Work, 42, 04-24-2026.md");
  });

  it("normalizes whitespace and invalid path characters", () => {
    const result = buildRelativeNotePath("", "2026-04-24T09:12:13.000Z", "Deep   / Work", "  p:42  ");
    expect(result).toBe("Deep - Work, p-42, 04-24-2026.md");
  });
});
