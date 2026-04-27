import AsyncStorage from "@react-native-async-storage/async-storage";
import { File } from "expo-file-system";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Note, NoteStatus } from "../types/note";
import { UNCATEGORIZED_BOOK_ID } from "../types/book";

type CreateNoteInput = {
  bookId: string;
  location?: string;
  audioUri?: string;
  transcriptText: string;
  noteMarkdown: string;
  createdAt?: string;
  status?: NoteStatus;
};

type NoteStore = {
  notes: Note[];
  createNote: (input: CreateNoteInput) => string;
  updateNote: (id: string, patch: Partial<Note>) => void;
  updateStatus: (id: string, status: NoteStatus, errorMessage?: string) => void;
  deleteNote: (id: string) => void;
  moveNotesToBook: (fromBookId: string, toBookId: string) => void;
  getNoteById: (id: string) => Note | undefined;
};

function deleteAudioFile(audioUri: string | undefined): void {
  if (!audioUri) return;
  try {
    const file = new File(audioUri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Non-fatal: local scratch file may already be gone.
  }
}

export const useNoteStore = create<NoteStore>()(
  persist(
    (set, get) => ({
      notes: [],
      createNote: ({
        bookId,
        location,
        audioUri,
        transcriptText,
        noteMarkdown,
        createdAt,
        status,
      }) => {
        const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const trimmedUri = audioUri?.trim();
        const note: Note = {
          id,
          bookId: bookId.trim() || UNCATEGORIZED_BOOK_ID,
          createdAt: createdAt || new Date().toISOString(),
          location: location?.trim() || undefined,
          audioUri: trimmedUri || undefined,
          transcriptText,
          noteMarkdown,
          status: status ?? "ready",
        };

        set((state) => ({
          notes: [note, ...state.notes],
        }));

        return id;
      },
      updateNote: (id, patch) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, ...patch } : note
          ),
        }));
      },
      updateStatus: (id, status, errorMessage) => {
        // Passing errorMessage clears any stale error from a previous failure.
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, status, errorMessage: errorMessage ?? undefined } : note
          ),
        }));
      },
      deleteNote: (id) => {
        const note = get().notes.find((n) => n.id === id);
        if (note) {
          deleteAudioFile(note.audioUri);
        }
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        }));
      },
      moveNotesToBook: (fromBookId, toBookId) => {
        if (!fromBookId.trim() || !toBookId.trim() || fromBookId === toBookId) return;
        set((state) => ({
          notes: state.notes.map((note) =>
            note.bookId === fromBookId ? { ...note, bookId: toBookId } : note
          ),
        }));
      },
      getNoteById: (id) => get().notes.find((note) => note.id === id),
    }),
    {
      // v2 key intentionally resets old note-only data for books-first launch.
      name: "book-notes-voice-store-v2",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ notes: state.notes }),
    }
  )
);
