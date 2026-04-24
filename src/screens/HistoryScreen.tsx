import React from "react";
import { Button, FlatList, Text, View } from "react-native";

import { VaultSettingsCard } from "../components/VaultSettingsCard";
import { buildMarkdownNote } from "../lib/markdown";
import { saveNoteToVault } from "../lib/saveNoteToVault";
import { transcribeAudio } from "../lib/transcribe";
import { useNoteStore } from "../store/useNoteStore";
import { useSettingsStore } from "../store/useSettingsStore";

type HistoryScreenProps = {
  onOpenInReview: () => void;
};

export function HistoryScreen({ onOpenInReview }: HistoryScreenProps) {
  const notes = useNoteStore((state) => state.notes);
  const setActiveNote = useNoteStore((state) => state.setActiveNote);
  const updateNote = useNoteStore((state) => state.updateNote);
  const updateStatus = useNoteStore((state) => state.updateStatus);
  const getNoteById = useNoteStore((state) => state.getNoteById);
  const vaultRootUri = useSettingsStore((s) => s.vaultRootUri);
  const vaultSubfolder = useSettingsStore((s) => s.vaultSubfolder);

  const retryTranscription = async (noteId: string, audioUri: string) => {
    updateStatus(noteId, "transcribing");
    try {
      const transcriptText = await transcribeAudio(audioUri);
      const note = getNoteById(noteId);
      const noteMarkdown = note
        ? buildMarkdownNote({
            bookTitle: note.bookTitle,
            location: note.location,
            createdAt: note.createdAt,
            transcriptText,
          })
        : "";
      updateNote(noteId, { transcriptText, noteMarkdown });
      updateStatus(noteId, "ready");
    } catch (error) {
      updateStatus(noteId, "failed", String(error));
    }
  };

  const saveToVault = async (
    noteId: string,
    markdown: string,
    createdAt: string,
    bookTitle?: string
  ) => {
    const ok = await saveNoteToVault({
      vaultRootUri,
      vaultSubfolder,
      markdown,
      createdAt,
      bookTitle,
    });
    if (ok) {
      updateStatus(noteId, "exported");
    }
  };

  return (
    <View style={{ gap: 10, flex: 1 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>History</Text>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<VaultSettingsCard />}
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
              <Button
                title="Open In Review"
                onPress={() => {
                  setActiveNote(item.id);
                  onOpenInReview();
                }}
              />
              {item.status === "failed" ? (
                <Button
                  title="Retry Transcription"
                  onPress={() => retryTranscription(item.id, item.audioUri)}
                />
              ) : null}
              {item.noteMarkdown ? (
                <Button
                  title="Save to Vault"
                  onPress={() =>
                    saveToVault(item.id, item.noteMarkdown, item.createdAt, item.bookTitle)
                  }
                />
              ) : null}
            </View>
          </View>
        )}
      />
    </View>
  );
}
