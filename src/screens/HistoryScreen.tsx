import React from "react";
import { Alert, Button, FlatList, Text, View } from "react-native";

import { VaultSettingsCard } from "../components/VaultSettingsCard";
import { canSaveToVaultFromHistory } from "../lib/historyValidation";
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
  const deleteNote = useNoteStore((state) => state.deleteNote);
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
            author: note.author,
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

  const confirmDelete = (noteId: string, bookTitle?: string) => {
    Alert.alert(
      "Delete note?",
      `This removes "${bookTitle || "Reading Note"}" and its audio file from this device. Any file already saved to your vault is not affected.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteNote(noteId) },
      ]
    );
  };

  const saveToVault = async (
    noteId: string,
    markdown: string,
    createdAt: string,
    bookTitle?: string,
    pageNumber?: string
  ) => {
    const ok = await saveNoteToVault({
      vaultRootUri,
      vaultSubfolder,
      markdown,
      createdAt,
      bookTitle,
      pageNumber,
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
            {item.author ? <Text style={{ color: "#666" }}>Author: {item.author}</Text> : null}
            {item.location ? <Text style={{ color: "#666" }}>Page: {item.location}</Text> : null}
            <Text style={{ color: "#666" }}>{new Date(item.createdAt).toLocaleString()}</Text>
            <Text>Status: {item.status}</Text>
            {!canSaveToVaultFromHistory(item.bookTitle) ? (
              <Text style={{ color: "#8a6d3b", fontSize: 12 }}>
                Add a book title in Review before saving to vault.
              </Text>
            ) : null}
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
                    saveToVault(item.id, item.noteMarkdown, item.createdAt, item.bookTitle, item.location)
                  }
                  disabled={!canSaveToVaultFromHistory(item.bookTitle)}
                />
              ) : null}
              <Button
                title="Delete"
                color="#c0392b"
                onPress={() => confirmDelete(item.id, item.bookTitle)}
              />
            </View>
          </View>
        )}
      />
    </View>
  );
}
