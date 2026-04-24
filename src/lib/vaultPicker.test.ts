import { beforeEach, describe, expect, it, vi } from "vitest";

const { pickSpy, rememberSpy } = vi.hoisted(() => ({
  pickSpy: vi.fn(),
  rememberSpy: vi.fn(),
}));

vi.mock("./saveNoteToVault", () => ({
  rememberVaultDirectoryFromPicker: rememberSpy,
}));

vi.mock("expo-file-system", () => {
  class MockDirectory {
    uri: string;
    static pickDirectoryAsync = pickSpy;

    constructor(uri: string) {
      this.uri = uri;
    }

    get exists() {
      return true;
    }
  }

  class MockFile {
    uri: string;
    exists = true;

    constructor(_dir: MockDirectory, _name: string) {
      this.uri = "file:///probe";
    }

    create() {}

    write() {}

    delete() {}
  }

  return { Directory: MockDirectory, File: MockFile };
});

import { pickVaultDirectoryWithValidation, validateVaultDirectoryWritable } from "./vaultPicker";

describe("vaultPicker", () => {
  beforeEach(() => {
    pickSpy.mockReset();
    rememberSpy.mockReset();
  });

  it("validateVaultDirectoryWritable succeeds when directory exists and probe write/delete work", async () => {
    const { Directory } = await import("expo-file-system");
    const dir = new Directory("file:///vault");
    await expect(validateVaultDirectoryWritable(dir)).resolves.toEqual({ ok: true });
  });

  it("pickVaultDirectoryWithValidation returns cancelled when picker throws cancel-like error", async () => {
    pickSpy.mockRejectedValueOnce(new Error("User canceled"));
    await expect(pickVaultDirectoryWithValidation()).resolves.toEqual({ kind: "cancelled" });
    expect(rememberSpy).not.toHaveBeenCalled();
  });

  it("pickVaultDirectoryWithValidation picks, validates, and remembers", async () => {
    const { Directory } = await import("expo-file-system");
    const picked = new Directory("file:///picked");
    pickSpy.mockResolvedValueOnce(picked);

    await expect(pickVaultDirectoryWithValidation()).resolves.toEqual({
      kind: "picked",
      directory: picked,
    });
    expect(rememberSpy).toHaveBeenCalledWith(picked);
  });
});
