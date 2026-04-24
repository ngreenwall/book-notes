import { beforeEach, describe, expect, it } from "vitest";

import { normalizePersistedSettings } from "./useSettingsStore";

describe("normalizePersistedSettings", () => {
  it("defaults hasCompletedWelcome to false for missing / empty persisted state (new installs)", () => {
    expect(normalizePersistedSettings(undefined)).toEqual({
      vaultRootUri: "",
      hasCompletedWelcome: false,
    });
    expect(normalizePersistedSettings(null)).toEqual({
      vaultRootUri: "",
      hasCompletedWelcome: false,
    });
    expect(normalizePersistedSettings({})).toEqual({
      vaultRootUri: "",
      hasCompletedWelcome: true,
    });
  });

  it("treats legacy objects without hasCompletedWelcome as completed (no welcome loop)", () => {
    expect(normalizePersistedSettings({ vaultRootUri: "" })).toEqual({
      vaultRootUri: "",
      hasCompletedWelcome: true,
    });
    expect(normalizePersistedSettings({ vaultRootUri: "file:///vault" })).toEqual({
      vaultRootUri: "file:///vault",
      hasCompletedWelcome: true,
    });
  });

  it("respects explicit hasCompletedWelcome when present", () => {
    expect(
      normalizePersistedSettings({ vaultRootUri: "", hasCompletedWelcome: false })
    ).toEqual({
      vaultRootUri: "",
      hasCompletedWelcome: false,
    });
    expect(
      normalizePersistedSettings({ vaultRootUri: "", hasCompletedWelcome: true })
    ).toEqual({
      vaultRootUri: "",
      hasCompletedWelcome: true,
    });
  });
});
