import { Directory } from "expo-file-system";
import React, { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";

import { rememberVaultDirectoryFromPicker } from "../lib/saveNoteToVault";
import { useSettingsStore } from "../store/useSettingsStore";

const inputStyle = {
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 10,
  padding: 12,
} as const;

export function VaultSettingsCard() {
  const vaultRootUri = useSettingsStore((s) => s.vaultRootUri);
  const vaultSubfolder = useSettingsStore((s) => s.vaultSubfolder);
  const setVaultRootUri = useSettingsStore((s) => s.setVaultRootUri);
  const setVaultSubfolder = useSettingsStore((s) => s.setVaultSubfolder);
  const [picking, setPicking] = useState(false);

  const chooseFolder = async () => {
    setPicking(true);
    try {
      const dir = await Directory.pickDirectoryAsync();
      rememberVaultDirectoryFromPicker(dir);
      setVaultRootUri(dir.uri);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const lower = message.toLowerCase();
      if (lower.includes("cancel") || lower.includes("canceled") || lower.includes("cancelled")) {
        return;
      }
      Alert.alert("Folder", message || "Could not open the folder picker.");
    } finally {
      setPicking(false);
    }
  };

  const vaultLabel = vaultRootUri
    ? (() => {
        try {
          return new Directory(vaultRootUri).name || vaultRootUri;
        } catch {
          return vaultRootUri;
        }
      })()
    : "None selected";

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#e0e0e0",
        borderRadius: 10,
        padding: 12,
        gap: 8,
        marginBottom: 4,
      }}
    >
      <Text style={{ fontWeight: "700" }}>Vault</Text>
      <Text style={{ color: "#666", fontSize: 13 }}>
        Pick the folder where markdown files should be saved (for example your Obsidian vault or an inbox folder).
        Optional subfolder is created under that root (e.g. Inbox/Voice notes). On iOS you may need to pick the folder
        again after restarting the app.
      </Text>
      <Text style={{ fontSize: 13, color: "#333" }}>
        Folder: <Text style={{ fontWeight: "600" }}>{vaultLabel}</Text>
      </Text>
      <Button title={picking ? "Opening picker…" : "Choose vault folder"} onPress={chooseFolder} disabled={picking} />
      <TextInput
        value={vaultSubfolder}
        onChangeText={setVaultSubfolder}
        placeholder="Subfolder (optional), e.g. Inbox/Voice notes"
        autoCapitalize="none"
        autoCorrect={false}
        style={inputStyle}
      />
    </View>
  );
}
