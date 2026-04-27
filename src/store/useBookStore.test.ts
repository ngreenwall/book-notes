import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => undefined),
    removeItem: vi.fn(async () => undefined),
  },
}));

import { useBookStore } from "./useBookStore";
import { UNCATEGORIZED_BOOK_ID } from "../types/book";

describe("useBookStore", () => {
  beforeEach(() => {
    useBookStore.setState({
      books: [
        {
          id: UNCATEGORIZED_BOOK_ID,
          title: "Uncategorized",
          author: "",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          isSystem: true,
        },
      ],
    });
  });

  it("creates books and blocks duplicate title+author", () => {
    const first = useBookStore.getState().createBook({ title: "Deep Work", author: "Cal Newport" });
    expect(first.ok).toBe(true);
    const duplicate = useBookStore.getState().createBook({ title: "  Deep Work ", author: " cal newport " });
    expect(duplicate).toEqual({ ok: false, reason: "duplicate" });
  });

  it("sorts books alphabetically by title", () => {
    useBookStore.getState().createBook({ title: "Zed", author: "" });
    useBookStore.getState().createBook({ title: "Alpha", author: "" });
    const titles = useBookStore
      .getState()
      .books.filter((b) => !b.isSystem)
      .map((b) => b.title);
    expect(titles).toEqual(["Alpha", "Zed"]);
  });

  it("prevents deleting system book", () => {
    const result = useBookStore.getState().deleteBook(UNCATEGORIZED_BOOK_ID);
    expect(result).toEqual({ ok: false, reason: "system" });
  });
});
