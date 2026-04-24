import React from "react";
import { ScrollView, Text, View } from "react-native";

import { VaultSettingsCard } from "../components/VaultSettingsCard";

export function SettingsScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>Settings</Text>
        <Text style={{ color: "#666", fontSize: 14 }}>
          Change where “Save to Vault” writes markdown. The same controls appear under History for quick access.
        </Text>
        <VaultSettingsCard />
      </View>
    </ScrollView>
  );
}
