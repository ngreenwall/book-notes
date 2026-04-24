import React, { useState } from "react";
import { Alert, Button, ScrollView, Text, View } from "react-native";

import { pickVaultDirectoryWithValidation } from "../lib/vaultPicker";
import { useSettingsStore } from "../store/useSettingsStore";

type Step = "welcome" | "guided";

type WelcomeVaultScreenProps = {
  onFinished: () => void;
};

export function WelcomeVaultScreen({ onFinished }: WelcomeVaultScreenProps) {
  const setVaultRootUri = useSettingsStore((s) => s.setVaultRootUri);
  const completeWelcome = useSettingsStore((s) => s.completeWelcome);
  const [step, setStep] = useState<Step>("welcome");
  const [picking, setPicking] = useState(false);

  const skip = () => {
    completeWelcome();
    onFinished();
  };

  const openPicker = async () => {
    setPicking(true);
    try {
      const result = await pickVaultDirectoryWithValidation();
      if (result.kind === "cancelled") {
        return;
      }
      if (result.kind === "invalid") {
        Alert.alert("Could not use that folder", result.message, [
          { text: "OK", style: "cancel" },
          { text: "Try again", onPress: () => void openPicker() },
        ]);
        return;
      }
      setVaultRootUri(result.directory.uri);
      completeWelcome();
      onFinished();
    } finally {
      setPicking(false);
    }
  };

  if (step === "welcome") {
    return (
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 16 }}>
          <Text style={{ fontSize: 26, fontWeight: "700" }}>Welcome</Text>
          <Text style={{ fontSize: 16, color: "#333", lineHeight: 22 }}>
            Book Notes Voice records short voice notes while you read, transcribes them on iOS, and lets you save each
            note as markdown in a folder you choose.
          </Text>
          <Text style={{ fontSize: 15, color: "#444", lineHeight: 22 }}>
            Recommended: save into a folder under <Text style={{ fontWeight: "700" }}>iCloud Drive</Text> (for
            example the vault folder Obsidian syncs there). Advanced users can pick another location under Browse in
            Files; iCloud is the path we test most. <Text style={{ fontWeight: "600" }}>On My iPhone</Text> is fine for
            local-only notes. Obsidian is optional—the files are standard markdown with frontmatter.
          </Text>
          <Text style={{ fontSize: 13, color: "#666", lineHeight: 20 }}>
            After a full app restart, iOS may require you to choose the folder again before saves work. You can always
            change it in Settings or History.
          </Text>
          <View style={{ gap: 10, marginTop: 8 }}>
            <Button title="Set up where notes are saved" onPress={() => setStep("guided")} />
            <Button title="Skip — set up later" onPress={skip} color="#666" />
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View style={{ gap: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>Choose your notes folder</Text>
        <Text style={{ fontSize: 15, color: "#333", lineHeight: 22 }}>
          Next you’ll see the Files browser. Tap <Text style={{ fontWeight: "700" }}>Browse</Text>, then{" "}
          <Text style={{ fontWeight: "700" }}>iCloud Drive</Text> (or On My iPhone). Open the folder where you want
          markdown saved—often your existing Obsidian vault folder—then confirm.
        </Text>
        <Text style={{ fontSize: 13, color: "#666", lineHeight: 20 }}>
          Pick an existing folder you can edit. You can change this anytime in Settings or History.
        </Text>
        <View style={{ gap: 10, marginTop: 8 }}>
          <Button title={picking ? "Opening Files…" : "Choose folder in Files"} onPress={() => void openPicker()} disabled={picking} />
          <Button title="Back" onPress={() => setStep("welcome")} color="#666" />
        </View>
      </View>
    </ScrollView>
  );
}
