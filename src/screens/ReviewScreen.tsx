import React, { useEffect, useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";

import { buildMarkdownNote } from "../lib/markdown";
import { saveNoteToVault } from "../lib/saveNoteToVault";
import { useNoteStore } from "../store/useNoteStore";
import { useSettingsStore } from "../store/useSettingsStore";

export function ReviewScreen() {
  const notes = useNoteStore((state) => state.notes);
  const activeNoteId = useNoteStore((state) => state.activeNoteId);
  const updateNote = useNoteStore((state) => state.updateNote);
  const updateStatus = useNoteStore((state) => state.updateStatus);
  const vaultRootUri = useSettingsStore((s) => s.vaultRootUri);
  const vaultSubfolder = useSettingsStore((s) => s.vaultSubfolder);

  const activeNote = notes.find((note) => note.id === activeNoteId) ?? null;
  const [transcriptText, setTranscriptText] = useState("");

  useEffect(() => {
    setTranscriptText(activeNote?.transcriptText ?? "");
  }, [activeNote?.id, activeNote?.transcriptText]);

  const saveTranscript = () => {
    if (!activeNote) return;

    const noteMarkdown = buildMarkdownNote({
      bookTitle: activeNote.bookTitle,
      location: activeNote.location,
      createdAt: activeNote.createdAt,
      transcriptText,
    });

    updateNote(activeNote.id, { transcriptText, noteMarkdown });
    if (activeNote.status !== "exported") {
      updateStatus(activeNote.id, "ready");
    }
    Alert.alert("Saved", "Transcript and markdown updated.");
  };

  const saveToVaultFromReview = async () => {
    if (!activeNote) return;

    const markdown =
      activeNote.noteMarkdown ||
      buildMarkdownNote({
        bookTitle: activeNote.bookTitle,
        location: activeNote.location,
        createdAt: activeNote.createdAt,
        transcriptText: transcriptText || activeNote.transcriptText,
      });

    const ok = await saveNoteToVault({
      vaultRootUri,
      vaultSubfolder,
      markdown,
      createdAt: activeNote.createdAt,
      bookTitle: activeNote.bookTitle,
    });
    if (ok) {
      updateNote(activeNote.id, {
        noteMarkdown: markdown,
        transcriptText: transcriptText || activeNote.transcriptText,
      });
      updateStatus(activeNote.id, "exported");
    }
  };

  if (!activeNote) {
    return (
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>Review</Text>
        <Text style={{ color: "#666" }}>No active note yet. Capture or open one from history.</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Review</Text>
      <Text>Status: {activeNote.status}</Text>
      {activeNote.errorMessage ? <Text style={{ color: "crimson" }}>{activeNote.errorMessage}</Text> : null}
      <TextInput
        multiline
        value={transcriptText}
        onChangeText={setTranscriptText}
        placeholder="Transcript appears here..."
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 10,
          padding: 12,
          minHeight: 140,
          textAlignVertical: "top",
        }}
      />
      <Button title="Save Transcript Edits" onPress={saveTranscript} />
      <Button title="Save to Vault" onPress={saveToVaultFromReview} />
    </View>
  );
}
