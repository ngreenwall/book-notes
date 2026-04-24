import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { CaptureScreen } from "./src/screens/CaptureScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { ReviewScreen } from "./src/screens/ReviewScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { WelcomeVaultScreen } from "./src/screens/WelcomeVaultScreen";
import { useSettingsStore } from "./src/store/useSettingsStore";

type Screen = "capture" | "review" | "history" | "settings";

export default function App() {
  const [screen, setScreen] = useState<Screen>("capture");
  const [settingsHydrated, setSettingsHydrated] = useState(() => useSettingsStore.persist.hasHydrated());
  const [vaultBannerDismissed, setVaultBannerDismissed] = useState(false);

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

  const showIosWelcome =
    Platform.OS === "ios" && settingsHydrated && !hasCompletedWelcome;

  const showVaultBanner =
    settingsHydrated &&
    hasCompletedWelcome &&
    !vaultRootUri.trim() &&
    !vaultBannerDismissed;

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
        {showVaultBanner ? (
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
              No notes folder yet. Choose one in Settings or History to use Save to Vault. On iOS you may need to pick
              again after restarting the app.
            </Text>
            <TouchableOpacity onPress={() => setVaultBannerDismissed(true)} accessibilityRole="button">
              <Text style={{ fontWeight: "700", color: "#111" }}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <View style={{ flexDirection: "row", padding: 12, gap: 8, flexWrap: "wrap" }}>
          <TabButton label="Capture" active={screen === "capture"} onPress={() => setScreen("capture")} />
          <TabButton label="Review" active={screen === "review"} onPress={() => setScreen("review")} />
          <TabButton label="History" active={screen === "history"} onPress={() => setScreen("history")} />
          <TabButton label="Settings" active={screen === "settings"} onPress={() => setScreen("settings")} />
        </View>
        {screen === "history" ? (
          <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 16 }}>
            <HistoryScreen onOpenInReview={() => setScreen("review")} />
          </View>
        ) : screen === "settings" ? (
          <View style={{ flex: 1 }}>
            <SettingsScreen />
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
            keyboardShouldPersistTaps="handled"
          >
            {screen === "capture" ? <CaptureScreen /> : null}
            {screen === "review" ? <ReviewScreen /> : null}
          </ScrollView>
        )}
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
