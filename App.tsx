import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { CaptureScreen } from "./src/screens/CaptureScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { ReviewScreen } from "./src/screens/ReviewScreen";

type Screen = "capture" | "review" | "history";

export default function App() {
  const [screen, setScreen] = useState<Screen>("capture");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar style="auto" />
      <View style={{ flexDirection: "row", padding: 12, gap: 8 }}>
        <TabButton label="Capture" active={screen === "capture"} onPress={() => setScreen("capture")} />
        <TabButton label="Review" active={screen === "review"} onPress={() => setScreen("review")} />
        <TabButton label="History" active={screen === "history"} onPress={() => setScreen("history")} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        {screen === "capture" ? <CaptureScreen /> : null}
        {screen === "review" ? <ReviewScreen /> : null}
        {screen === "history" ? <HistoryScreen /> : null}
      </ScrollView>
    </SafeAreaView>
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
