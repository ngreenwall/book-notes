import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => undefined),
    removeItem: vi.fn(async () => undefined),
  },
}));

vi.mock("expo-file-system", () => ({
  File: class MockFile {
    constructor(public uri: string) {}
    get exists() {
      return false;
    }
    delete() {
      // no-op for tests
    }
  },
}));

import { useNoteStore } from "./useNoteStore";

describe("useNoteStore", () => {
  beforeEach(() => {
    useNoteStore.setState({ notes: [], activeNoteId: null });
  });

  it("creates and updates a note status", () => {
    const id = useNoteStore.getState().createNote({
      bookTitle: "Book",
      author: "Author",
      location: "10",
      audioUri: "file:///tmp/audio.m4a",
      createdAt: "2026-04-24T12:00:00.000Z",
    });

    let note = useNoteStore.getState().getNoteById(id);
    expect(note?.bookTitle).toBe("Book");
    expect(note?.author).toBe("Author");
    expect(note?.status).toBe("transcribing");

    useNoteStore.getState().updateStatus(id, "ready");
    note = useNoteStore.getState().getNoteById(id);
    expect(note?.status).toBe("ready");
  });

  it("deletes the note and clears active selection", () => {
    const id = useNoteStore.getState().createNote({
      bookTitle: "Book",
      audioUri: "file:///tmp/audio.m4a",
    });
    useNoteStore.getState().setActiveNote(id);
    useNoteStore.getState().deleteNote(id);

    expect(useNoteStore.getState().getNoteById(id)).toBeUndefined();
    expect(useNoteStore.getState().activeNoteId).toBeNull();
  });
});
