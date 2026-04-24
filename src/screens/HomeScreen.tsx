import React from "react";
import { Button, Text, View } from "react-native";

type HomeScreenProps = {
  onNewNote: () => void;
};

export function HomeScreen({ onNewNote }: HomeScreenProps) {
  return (
    <View style={{ gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Book Notes Voice</Text>
      <Text style={{ color: "#666", fontSize: 15, lineHeight: 22 }}>
        Take reading notes by typing or with voice transcription, then save them on your device or export markdown to
        a folder you choose in Settings.
      </Text>
      <Button title="New note" onPress={onNewNote} />
    </View>
  );
}
