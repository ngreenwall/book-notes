import AsyncStorage from "@react-native-async-storage/async-storage";
import { File } from "expo-file-system";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Note, NoteStatus } from "../types/note";

type CreateNoteInput = {
  bookTitle?: string;
  location?: string;
  audioUri: string;
  createdAt?: string;
};

type NoteStore = {
  notes: Note[];
  activeNoteId: string | null;
  createNote: (input: CreateNoteInput) => string;
  setActiveNote: (id: string | null) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  updateStatus: (id: string, status: NoteStatus, errorMessage?: string) => void;
  deleteNote: (id: string) => void;
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
      activeNoteId: null,
      createNote: ({ bookTitle, location, audioUri, createdAt }) => {
        const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const note: Note = {
          id,
          createdAt: createdAt || new Date().toISOString(),
          bookTitle: bookTitle?.trim() || undefined,
          location: location?.trim() || undefined,
          audioUri,
          transcriptText: "",
          noteMarkdown: "",
          status: "transcribing",
        };

        set((state) => ({
          notes: [note, ...state.notes],
          activeNoteId: id,
        }));

        return id;
      },
      setActiveNote: (id) => {
        set({ activeNoteId: id });
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
          activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
        }));
      },
      getNoteById: (id) => get().notes.find((note) => note.id === id),
    }),
    {
      name: "book-notes-voice-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
