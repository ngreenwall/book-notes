import AsyncStorage from "@react-native-async-storage/async-storage";
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
  getNoteById: (id: string) => Note | undefined;
};

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
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, status, errorMessage } : note
          ),
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
