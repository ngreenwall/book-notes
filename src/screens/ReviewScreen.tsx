import React, { useEffect, useRef, useState } from "react";
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
  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pageNumber, setPageNumber] = useState("");
  const dirtyRef = useRef(false);
  const loadedIdRef = useRef<string | null>(null);

  // Load transcript on note switch; also accept a new transcript if the user
  // hasn't typed (e.g. transcription finishes while Review is open).
  useEffect(() => {
    const id = activeNote?.id ?? null;
    const incoming = activeNote?.transcriptText ?? "";
    if (id !== loadedIdRef.current) {
      loadedIdRef.current = id;
      dirtyRef.current = false;
      setTranscriptText(incoming);
      setBookTitle(activeNote?.bookTitle ?? "");
      setAuthor(activeNote?.author ?? "");
      setPageNumber(activeNote?.location ?? "");
      return;
    }
    if (!dirtyRef.current) {
      setTranscriptText(incoming);
    }
  }, [
    activeNote?.id,
    activeNote?.bookTitle,
    activeNote?.author,
    activeNote?.location,
    activeNote?.transcriptText,
  ]);

  const onChangeTranscript = (value: string) => {
    dirtyRef.current = true;
    setTranscriptText(value);
  };

  const hasBookTitle = !!bookTitle.trim();
  const normalizedBookTitle = bookTitle.trim() || undefined;
  const normalizedAuthor = author.trim() || undefined;
  const normalizedPageNumber = pageNumber.trim() || undefined;

  const saveTranscript = () => {
    if (!activeNote) return;

    const noteMarkdown = buildMarkdownNote({
      bookTitle: normalizedBookTitle,
      author: normalizedAuthor,
      location: normalizedPageNumber,
      createdAt: activeNote.createdAt,
      transcriptText,
    });

    updateNote(activeNote.id, {
      bookTitle: normalizedBookTitle,
      author: normalizedAuthor,
      location: normalizedPageNumber,
      transcriptText,
      noteMarkdown,
    });
    if (activeNote.status !== "exported") {
      updateStatus(activeNote.id, "ready");
    }
    dirtyRef.current = false;
    Alert.alert("Saved", "Transcript and markdown updated.");
  };

  const saveToVaultFromReview = async () => {
    if (!activeNote) return;

    const markdown =
      activeNote.noteMarkdown ||
      buildMarkdownNote({
        bookTitle: normalizedBookTitle,
        author: normalizedAuthor,
        location: normalizedPageNumber,
        createdAt: activeNote.createdAt,
        transcriptText: transcriptText || activeNote.transcriptText,
      });

    const ok = await saveNoteToVault({
      vaultRootUri,
      vaultSubfolder,
      markdown,
      createdAt: activeNote.createdAt,
      bookTitle: normalizedBookTitle,
      pageNumber: normalizedPageNumber,
    });
    if (ok) {
      updateNote(activeNote.id, {
        bookTitle: normalizedBookTitle,
        author: normalizedAuthor,
        location: normalizedPageNumber,
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
      {!hasBookTitle ? (
        <Text style={{ color: "#8a6d3b", fontSize: 12 }}>
          Add a book title below before saving this note to your vault.
        </Text>
      ) : null}
      <TextInput
        value={bookTitle}
        onChangeText={setBookTitle}
        placeholder="Book title"
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 10,
          padding: 12,
        }}
      />
      <TextInput
        value={author}
        onChangeText={setAuthor}
        placeholder="Author"
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 10,
          padding: 12,
        }}
      />
      <TextInput
        value={pageNumber}
        onChangeText={setPageNumber}
        placeholder="Page number"
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 10,
          padding: 12,
        }}
      />
      <TextInput
        multiline
        value={transcriptText}
        onChangeText={onChangeTranscript}
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
      <Button title="Save to Vault" onPress={saveToVaultFromReview} disabled={!hasBookTitle} />
    </View>
  );
}
