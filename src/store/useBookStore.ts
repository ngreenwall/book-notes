import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Book } from "../types/book";
import { UNCATEGORIZED_BOOK_ID } from "../types/book";

type CreateBookInput = {
  title: string;
  author?: string;
};

type UpdateBookInput = {
  title: string;
  author?: string;
};

type BookStore = {
  books: Book[];
  createBook: (input: CreateBookInput) => { ok: true; id: string } | { ok: false; reason: "duplicate" | "invalid" };
  updateBook: (id: string, input: UpdateBookInput) => { ok: true } | { ok: false; reason: "duplicate" | "invalid" | "system" };
  deleteBook: (id: string) => { ok: true } | { ok: false; reason: "system" | "not-found" };
  markBookOpened: (id: string) => void;
  getBookById: (id: string) => Book | undefined;
  ensureDefaults: () => void;
};

function nowIso(): string {
  return new Date().toISOString();
}

function normalize(value: string | undefined): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function makeUncategorizedBook(): Book {
  const now = nowIso();
  return {
    id: UNCATEGORIZED_BOOK_ID,
    title: "Uncategorized",
    author: "",
    createdAt: now,
    updatedAt: now,
    isSystem: true,
  };
}

function hasDuplicate(books: Book[], title: string, author: string, excludeId?: string): boolean {
  const titleKey = normalize(title).toLocaleLowerCase();
  const authorKey = normalize(author).toLocaleLowerCase();
  return books.some((book) => {
    if (excludeId && book.id === excludeId) return false;
    return book.title.toLocaleLowerCase() === titleKey && book.author.toLocaleLowerCase() === authorKey;
  });
}

function ensureDefaultBooks(books: Book[]): Book[] {
  const hasUncategorized = books.some((b) => b.id === UNCATEGORIZED_BOOK_ID);
  if (hasUncategorized) return books;
  return [makeUncategorizedBook(), ...books];
}

export function sortBooksAlphabetically(books: Book[]): Book[] {
  return [...books].sort((a, b) => {
    const byTitle = a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    if (byTitle !== 0) return byTitle;
    return a.author.localeCompare(b.author, undefined, { sensitivity: "base" });
  });
}

export const useBookStore = create<BookStore>()(
  persist(
    (set, get) => ({
      books: [makeUncategorizedBook()],
      createBook: ({ title, author }) => {
        const normalizedTitle = normalize(title);
        const normalizedAuthor = normalize(author);
        if (!normalizedTitle) return { ok: false, reason: "invalid" };
        const books = ensureDefaultBooks(get().books);
        if (hasDuplicate(books, normalizedTitle, normalizedAuthor)) {
          return { ok: false, reason: "duplicate" };
        }
        const now = nowIso();
        const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const book: Book = {
          id,
          title: normalizedTitle,
          author: normalizedAuthor,
          createdAt: now,
          updatedAt: now,
        };
        set({ books: sortBooksAlphabetically([...books, book]) });
        return { ok: true, id };
      },
      updateBook: (id, { title, author }) => {
        const normalizedTitle = normalize(title);
        const normalizedAuthor = normalize(author);
        if (!normalizedTitle) return { ok: false, reason: "invalid" };
        const books = ensureDefaultBooks(get().books);
        const current = books.find((b) => b.id === id);
        if (!current) return { ok: false, reason: "invalid" };
        if (current.isSystem) return { ok: false, reason: "system" };
        if (hasDuplicate(books, normalizedTitle, normalizedAuthor, id)) {
          return { ok: false, reason: "duplicate" };
        }
        const updated = books.map((book) =>
          book.id === id
            ? { ...book, title: normalizedTitle, author: normalizedAuthor, updatedAt: nowIso() }
            : book
        );
        set({ books: sortBooksAlphabetically(updated) });
        return { ok: true };
      },
      deleteBook: (id) => {
        const books = ensureDefaultBooks(get().books);
        const current = books.find((b) => b.id === id);
        if (!current) return { ok: false, reason: "not-found" };
        if (current.isSystem) return { ok: false, reason: "system" };
        set({ books: books.filter((b) => b.id !== id) });
        return { ok: true };
      },
      markBookOpened: (id) => {
        set((state) => ({
          books: state.books.map((book) =>
            book.id === id ? { ...book, lastOpenedAt: nowIso(), updatedAt: nowIso() } : book
          ),
        }));
      },
      getBookById: (id) => get().books.find((book) => book.id === id),
      ensureDefaults: () => {
        set((state) => ({ books: ensureDefaultBooks(state.books) }));
      },
    }),
    {
      name: "book-notes-voice-books-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ books: state.books }),
    }
  )
);
