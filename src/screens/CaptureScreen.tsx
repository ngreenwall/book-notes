import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import React, { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";

import { buildMarkdownNote } from "../lib/markdown";
import { transcribeAudio } from "../lib/transcribe";
import { useNoteStore } from "../store/useNoteStore";

export function CaptureScreen() {
  const createNote = useNoteStore((state) => state.createNote);
  const updateNote = useNoteStore((state) => state.updateNote);
  const updateStatus = useNoteStore((state) => state.updateStatus);
  const getNoteById = useNoteStore((state) => state.getNoteById);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const [bookTitle, setBookTitle] = useState("");
  const [location, setLocation] = useState("");

  const startRecording = async () => {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      Alert.alert("Microphone permission required");
      return;
    }

    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });

    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
  };

  const stopRecording = async () => {
    if (!recorderState.isRecording) {
      return;
    }

    try {
      await audioRecorder.stop();
      const audioUri = audioRecorder.uri;

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
        const persisted = getNoteById(noteId);
        const noteMarkdown = persisted
          ? buildMarkdownNote({
              bookTitle: persisted.bookTitle,
              location: persisted.location,
              createdAt: persisted.createdAt,
              transcriptText,
            })
          : buildMarkdownNote({
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
        <Button
          title="Start Recording"
          onPress={startRecording}
          disabled={recorderState.isRecording}
        />
        <Button title="Stop Recording" onPress={stopRecording} disabled={!recorderState.isRecording} />
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
