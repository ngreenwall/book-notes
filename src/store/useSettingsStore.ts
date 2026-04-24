import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type PersistedSettings = {
  vaultRootUri: string;
  hasCompletedWelcome: boolean;
};

type SettingsStore = PersistedSettings & {
  setVaultRootUri: (value: string) => void;
  completeWelcome: () => void;
};

export function normalizePersistedSettings(persistedState: unknown): PersistedSettings {
  if (!persistedState || typeof persistedState !== "object") {
    return { vaultRootUri: "", hasCompletedWelcome: false };
  }
  const s = persistedState as Record<string, unknown>;
  const vaultRootUri = typeof s.vaultRootUri === "string" ? s.vaultRootUri : "";
  // Legacy installs (before welcome flag): do not force onboarding on every launch.
  const hasCompletedWelcome =
    "hasCompletedWelcome" in s && typeof s.hasCompletedWelcome === "boolean"
      ? s.hasCompletedWelcome
      : true;
  return { vaultRootUri, hasCompletedWelcome };
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      vaultRootUri: "",
      hasCompletedWelcome: false,
      setVaultRootUri: (vaultRootUri) =>
        set((prev) => ({
          vaultRootUri,
          ...(vaultRootUri.trim() ? { hasCompletedWelcome: true } : {}),
        })),
      completeWelcome: () => set({ hasCompletedWelcome: true }),
    }),
    {
      name: "book-notes-voice-settings",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): PersistedSettings => ({
        vaultRootUri: state.vaultRootUri,
        hasCompletedWelcome: state.hasCompletedWelcome,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...normalizePersistedSettings(persistedState),
      }),
    }
  )
);
