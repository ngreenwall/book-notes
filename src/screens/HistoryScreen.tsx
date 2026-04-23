import * as Clipboard from "expo-clipboard";
import React from "react";
import { Button, FlatList, Text, View } from "react-native";

import { transcribeAudio } from "../lib/transcribe";
import { useNoteStore } from "../store/useNoteStore";

export function HistoryScreen() {
  const notes = useNoteStore((state) => state.notes);
  const setActiveNote = useNoteStore((state) => state.setActiveNote);
  const updateNote = useNoteStore((state) => state.updateNote);
  const updateStatus = useNoteStore((state) => state.updateStatus);

  const retryTranscription = async (noteId: string, audioUri: string) => {
    updateStatus(noteId, "transcribing");
    try {
      const transcriptText = await transcribeAudio(audioUri);
      updateNote(noteId, { transcriptText });
      updateStatus(noteId, "ready");
    } catch (error) {
      updateStatus(noteId, "failed", String(error));
    }
  };

  const copyMarkdown = async (noteId: string, markdown: string) => {
    await Clipboard.setStringAsync(markdown);
    updateStatus(noteId, "exported");
  };

  return (
    <View style={{ gap: 10, flex: 1 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>History</Text>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ color: "#666" }}>No notes yet.</Text>}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <View
            style={{
              borderWidth: 1,
              borderColor: "#eee",
              borderRadius: 10,
              padding: 12,
              gap: 8,
            }}
          >
            <Text style={{ fontWeight: "700" }}>{item.bookTitle || "Reading Note"}</Text>
            <Text style={{ color: "#666" }}>{new Date(item.createdAt).toLocaleString()}</Text>
            <Text>Status: {item.status}</Text>
            <View style={{ gap: 6 }}>
              <Button title="Open In Review" onPress={() => setActiveNote(item.id)} />
              {item.status === "failed" ? (
                <Button
                  title="Retry Transcription"
                  onPress={() => retryTranscription(item.id, item.audioUri)}
                />
              ) : null}
              {item.noteMarkdown ? (
                <Button title="Copy Markdown" onPress={() => copyMarkdown(item.id, item.noteMarkdown)} />
              ) : null}
            </View>
          </View>
        )}
      />
    </View>
  );
}
