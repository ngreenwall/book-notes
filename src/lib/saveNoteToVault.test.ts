import { beforeEach, describe, expect, it, vi } from "vitest";

const { alertSpy, fileCreateSpy, fileWriteSpy, state } = vi.hoisted(() => ({
  alertSpy: vi.fn(),
  fileCreateSpy: vi.fn(),
  fileWriteSpy: vi.fn(),
  state: { rootExists: true },
}));

vi.mock("react-native", () => ({
  Alert: {
    alert: alertSpy,
  },
}));

vi.mock("expo-file-system", () => {
  class MockDirectory {
    uri: string;

    constructor(base: string | MockDirectory, child?: string) {
      if (typeof base === "string") {
        this.uri = base;
      } else {
        this.uri = child ? `${base.uri}/${child}` : base.uri;
      }
    }

    get exists() {
      if (!this.uri.includes("/")) {
        return state.rootExists;
      }
      return true;
    }

    create() {
      // no-op
    }

    get name() {
      return this.uri.split("/").filter(Boolean).at(-1) || "";
    }
  }

  class MockFile {
    constructor(_dir: MockDirectory, _fileName: string) {}

    create() {
      fileCreateSpy();
    }

    write() {
      fileWriteSpy();
    }
  }

  return {
    Directory: MockDirectory,
    File: MockFile,
  };
});

import { saveNoteToVault } from "./saveNoteToVault";

describe("saveNoteToVault", () => {
  beforeEach(() => {
    state.rootExists = true;
    alertSpy.mockReset();
    fileCreateSpy.mockReset();
    fileWriteSpy.mockReset();
  });

  it("returns false and skips write when title is missing", async () => {
    const ok = await saveNoteToVault({
      vaultRootUri: "vault://root",
      markdown: "body",
      createdAt: "2026-04-24T12:00:00.000Z",
      bookTitle: "   ",
      pageNumber: "10",
    });

    expect(ok).toBe(false);
    expect(fileCreateSpy).not.toHaveBeenCalled();
    expect(fileWriteSpy).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith("Missing title", "Add a book title before saving to vault.");
  });

  it("returns false with recovery guidance when vault root is inaccessible", async () => {
    state.rootExists = false;

    const ok = await saveNoteToVault({
      vaultRootUri: "vaultroot",
      markdown: "body",
      createdAt: "2026-04-24T12:00:00.000Z",
      bookTitle: "Deep Work",
      pageNumber: "10",
    });

    expect(ok).toBe(false);
    expect(fileCreateSpy).not.toHaveBeenCalled();
    expect(fileWriteSpy).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith(
      "Vault access expired",
      expect.stringContaining("Choose the folder again in Settings or History")
    );
  });
});
