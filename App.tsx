import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { BookNotesScreen } from "./src/screens/BookNotesScreen";
import { MyBooksScreen } from "./src/screens/MyBooksScreen";
import { NoteCreatorSheet } from "./src/screens/NoteCreatorSheet";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { WelcomeVaultScreen } from "./src/screens/WelcomeVaultScreen";
import { useBookStore } from "./src/store/useBookStore";
import { useSettingsStore } from "./src/store/useSettingsStore";
import { UNCATEGORIZED_BOOK_ID } from "./src/types/book";

type Tab = "books" | "settings";
type CreatorState = null | { mode: "new" } | { mode: "edit"; noteId: string };

export default function App() {
  const [tab, setTab] = useState<Tab>("books");
  const [creator, setCreator] = useState<CreatorState>(null);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [settingsHydrated, setSettingsHydrated] = useState(() => useSettingsStore.persist.hasHydrated());
  const [vaultBannerDismissed, setVaultBannerDismissed] = useState(false);
  const ensureDefaultBooks = useBookStore((s) => s.ensureDefaults);
  const getBookById = useBookStore((s) => s.getBookById);

  const hasCompletedWelcome = useSettingsStore((s) => s.hasCompletedWelcome);
  const vaultRootUri = useSettingsStore((s) => s.vaultRootUri);

  useEffect(() => {
    const unsub = useSettingsStore.persist.onFinishHydration(() => {
      setSettingsHydrated(true);
    });
    if (useSettingsStore.persist.hasHydrated()) {
      setSettingsHydrated(true);
    }
    return unsub;
  }, []);

  useEffect(() => {
    if (vaultRootUri.trim()) {
      setVaultBannerDismissed(false);
    }
  }, [vaultRootUri]);
  useEffect(() => {
    ensureDefaultBooks();
  }, [ensureDefaultBooks]);
  useEffect(() => {
    if (activeBookId && !getBookById(activeBookId)) {
      setActiveBookId(UNCATEGORIZED_BOOK_ID);
    }
  }, [activeBookId, getBookById]);

  const showIosWelcome = Platform.OS === "ios" && settingsHydrated && !hasCompletedWelcome;

  const showVaultBanner =
    settingsHydrated && hasCompletedWelcome && !vaultRootUri.trim() && !vaultBannerDismissed;

  const handleCreatorFullyClosed = (reason: "dismiss" | "saved") => {
    setCreator(null);
    if (reason === "saved") {
      setTab("books");
    }
  };

  if (showIosWelcome) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          <StatusBar style="auto" />
          <WelcomeVaultScreen onFinished={() => {}} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <StatusBar style="auto" />
        {showVaultBanner && !creator ? (
          <View
            style={{
              marginHorizontal: 12,
              marginTop: 4,
              padding: 10,
              borderRadius: 10,
              backgroundColor: "#f4f0e6",
              borderWidth: 1,
              borderColor: "#e6dcc4",
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <Text style={{ flex: 1, fontSize: 13, color: "#4a4028", lineHeight: 18 }}>
              No notes folder yet. Choose one in Settings to use Save to Vault. On iOS you may need to pick again after
              restarting the app.
            </Text>
            <TouchableOpacity onPress={() => setVaultBannerDismissed(true)} accessibilityRole="button">
              <Text style={{ fontWeight: "700", color: "#111" }}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", padding: 12, gap: 8, flexWrap: "wrap" }}>
            <TabButton label="My Books" active={tab === "books"} onPress={() => setTab("books")} />
            <TabButton label="Settings" active={tab === "settings"} onPress={() => setTab("settings")} />
          </View>
          {tab === "settings" ? (
            <View style={{ flex: 1 }}>
              <SettingsScreen />
            </View>
          ) : activeBookId ? (
            <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 16 }}>
              <BookNotesScreen
                bookId={activeBookId}
                onBack={() => setActiveBookId(null)}
                onNewNote={() => setCreator({ mode: "new" })}
                onEditNote={(noteId) => setCreator({ mode: "edit", noteId })}
              />
            </View>
          ) : (
            <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 16 }}>
              <MyBooksScreen
                onOpenBook={(bookId) => {
                  setActiveBookId(bookId);
                  setTab("books");
                }}
              />
            </View>
          )}
        </View>
        {creator ? (
          <NoteCreatorSheet
            key={creator.mode === "edit" ? creator.noteId : "new-note"}
            creator={creator}
            bookId={activeBookId ?? ""}
            onFullyClosed={handleCreatorFullyClosed}
          />
        ) : null}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 18,
        backgroundColor: active ? "#111" : "#efefef",
      }}
    >
      <Text style={{ color: active ? "#fff" : "#111", fontWeight: "600" }}>{label}</Text>
    </TouchableOpacity>
  );
}
