import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type PersistedSettings = {
  vaultRootUri: string;
  vaultSubfolder: string;
};

type SettingsStore = PersistedSettings & {
  setVaultRootUri: (value: string) => void;
  setVaultSubfolder: (value: string) => void;
};

function normalizePersistedSettings(persistedState: unknown): PersistedSettings {
  if (!persistedState || typeof persistedState !== "object") {
    return { vaultRootUri: "", vaultSubfolder: "" };
  }
  const s = persistedState as Record<string, unknown>;
  const vaultRootUri = typeof s.vaultRootUri === "string" ? s.vaultRootUri : "";
  const vaultSubfolder =
    typeof s.vaultSubfolder === "string"
      ? s.vaultSubfolder
      : typeof s.obsidianRelativeFolder === "string"
        ? s.obsidianRelativeFolder
        : "";
  return { vaultRootUri, vaultSubfolder };
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      vaultRootUri: "",
      vaultSubfolder: "",
      setVaultRootUri: (vaultRootUri) => set({ vaultRootUri }),
      setVaultSubfolder: (vaultSubfolder) => set({ vaultSubfolder }),
    }),
    {
      name: "book-notes-voice-settings",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): PersistedSettings => ({
        vaultRootUri: state.vaultRootUri,
        vaultSubfolder: state.vaultSubfolder,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...normalizePersistedSettings(persistedState),
      }),
    }
  )
);
