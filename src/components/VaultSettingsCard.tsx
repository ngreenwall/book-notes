import { Directory } from "expo-file-system";
import React, { useState } from "react";
import { Alert, Button, Text, View } from "react-native";

import { pickVaultDirectoryWithValidation } from "../lib/vaultPicker";
import { useSettingsStore } from "../store/useSettingsStore";

export function VaultSettingsCard() {
  const vaultRootUri = useSettingsStore((s) => s.vaultRootUri);
  const setVaultRootUri = useSettingsStore((s) => s.setVaultRootUri);
  const [picking, setPicking] = useState(false);

  const chooseFolder = async () => {
    setPicking(true);
    try {
      const result = await pickVaultDirectoryWithValidation();
      if (result.kind === "cancelled") {
        return;
      }
      if (result.kind === "invalid") {
        Alert.alert("Folder", result.message, [
          { text: "Cancel", style: "cancel" },
          { text: "Retry", onPress: () => void chooseFolder() },
        ]);
        return;
      }
      setVaultRootUri(result.directory.uri);
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
  const vaultAccessible = vaultRootUri
    ? (() => {
        try {
          return new Directory(vaultRootUri).exists;
        } catch {
          return false;
        }
      })()
    : null;

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
      <Text style={{ fontWeight: "700" }}>Notes folder</Text>
      <Text style={{ color: "#666", fontSize: 13 }}>
        Pick the folder where markdown files should be saved (for example your Obsidian vault under iCloud Drive, or
        an inbox folder). On My iPhone works for local-only notes. On iOS you may need to pick the folder again after
        restarting the app.
      </Text>
      <Text style={{ fontSize: 13, color: "#333" }}>
        Folder: <Text style={{ fontWeight: "600" }}>{vaultLabel}</Text>
      </Text>
      {vaultRootUri && !vaultAccessible ? (
        <Text style={{ color: "#8a6d3b", fontSize: 12 }}>
          Current folder access appears unavailable. Choose notes folder again (common after iOS app restart).
        </Text>
      ) : null}
      <Button title={picking ? "Opening picker…" : "Choose notes folder"} onPress={chooseFolder} disabled={picking} />
    </View>
  );
}
