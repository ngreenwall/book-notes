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
    useNoteStore.setState({ notes: [] });
  });

  it("creates and updates a note status", () => {
    const id = useNoteStore.getState().createNote({
      bookTitle: "Book",
      author: "Author",
      location: "10",
      audioUri: "file:///tmp/audio.m4a",
      createdAt: "2026-04-24T12:00:00.000Z",
      transcriptText: "Hello",
      noteMarkdown: "---\n## Note\nHello\n",
    });

    let note = useNoteStore.getState().getNoteById(id);
    expect(note?.bookTitle).toBe("Book");
    expect(note?.author).toBe("Author");
    expect(note?.status).toBe("ready");

    useNoteStore.getState().updateStatus(id, "exported");
    note = useNoteStore.getState().getNoteById(id);
    expect(note?.status).toBe("exported");
  });

  it("creates a typed-only note without audio and deletes it", () => {
    const id = useNoteStore.getState().createNote({
      bookTitle: "Book",
      transcriptText: "Typed body",
      noteMarkdown: "---\n## Note\nTyped body\n",
    });
    const note = useNoteStore.getState().getNoteById(id);
    expect(note?.audioUri).toBeUndefined();
    useNoteStore.getState().deleteNote(id);

    expect(useNoteStore.getState().getNoteById(id)).toBeUndefined();
  });
});
