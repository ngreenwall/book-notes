import { describe, expect, it } from "vitest";

import { canSaveToVaultFromHistory } from "../lib/historyValidation";

describe("canSaveToVaultFromHistory", () => {
  it("returns false when title is empty or whitespace", () => {
    expect(canSaveToVaultFromHistory("")).toBe(false);
    expect(canSaveToVaultFromHistory("   ")).toBe(false);
    expect(canSaveToVaultFromHistory(undefined)).toBe(false);
  });

  it("returns true when title has non-whitespace characters", () => {
    expect(canSaveToVaultFromHistory("Deep Work")).toBe(true);
    expect(canSaveToVaultFromHistory("  Deep Work  ")).toBe(true);
  });
});
