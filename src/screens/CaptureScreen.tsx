import { Audio } from "expo-av";
import React, { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";

import { buildMarkdownNote } from "../lib/markdown";
import { transcribeAudio } from "../lib/transcribe";
import { useNoteStore } from "../store/useNoteStore";

export function CaptureScreen() {
  const createNote = useNoteStore((state) => state.createNote);
  const updateNote = useNoteStore((state) => state.updateNote);
  const updateStatus = useNoteStore((state) => state.updateStatus);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [bookTitle, setBookTitle] = useState("");
  const [location, setLocation] = useState("");

  const startRecording = async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Microphone permission required");
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const newRecording = new Audio.Recording();
    await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await newRecording.startAsync();
    setRecording(newRecording);
  };

  const stopRecording = async () => {
    if (!recording) {
      return;
    }

    try {
      await recording.stopAndUnloadAsync();
      const audioUri = recording.getURI();
      setRecording(null);

      if (!audioUri) {
        Alert.alert("No audio file was created.");
        return;
      }

      const createdAt = new Date().toISOString();
      const noteId = createNote({ bookTitle, location, audioUri, createdAt });
      setBookTitle("");
      setLocation("");

      try {
        const transcriptText = await transcribeAudio(audioUri);
        const noteMarkdown = buildMarkdownNote({
          bookTitle,
          location,
          transcriptText,
          createdAt,
        });

        updateNote(noteId, { transcriptText, noteMarkdown, createdAt });
        updateStatus(noteId, "ready");
      } catch (error) {
        updateStatus(noteId, "failed", String(error));
      }
    } catch (error) {
      setRecording(null);
      Alert.alert("Recording error", String(error));
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Capture</Text>
      <TextInput
        value={bookTitle}
        onChangeText={setBookTitle}
        placeholder="Book title (optional)"
        style={inputStyle}
      />
      <TextInput
        value={location}
        onChangeText={setLocation}
        placeholder="Page / chapter (optional)"
        style={inputStyle}
      />
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button title="Start Recording" onPress={startRecording} disabled={Boolean(recording)} />
        <Button title="Stop Recording" onPress={stopRecording} disabled={!recording} />
      </View>
      <Text style={{ color: "#666" }}>
        Record a short note while reading; transcription starts after stopping.
      </Text>
    </View>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 10,
  padding: 12,
} as const;
