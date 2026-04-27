import React from "react";
import { Alert, Button, FlatList, Text, View } from "react-native";

import { canSaveToVaultFromHistory } from "../lib/historyValidation";
import { buildMarkdownNote } from "../lib/markdown";
import { saveNoteToVault } from "../lib/saveNoteToVault";
import { transcribeAudio } from "../lib/transcribe";
import { useBookStore } from "../store/useBookStore";
import { useNoteStore } from "../store/useNoteStore";
import { useSettingsStore } from "../store/useSettingsStore";

type YourNotesScreenProps = {
  onEditNote: (noteId: string) => void;
};

export function YourNotesScreen({ onEditNote }: YourNotesScreenProps) {
  const notes = useNoteStore((state) => state.notes);
  const updateNote = useNoteStore((state) => state.updateNote);
  const updateStatus = useNoteStore((state) => state.updateStatus);
  const deleteNote = useNoteStore((state) => state.deleteNote);
  const getNoteById = useNoteStore((state) => state.getNoteById);
  const vaultRootUri = useSettingsStore((s) => s.vaultRootUri);
  const getBookById = useBookStore((s) => s.getBookById);

  const retryTranscription = async (noteId: string, audioUri: string | undefined) => {
    if (!audioUri) {
      return;
    }
    updateStatus(noteId, "transcribing");
    try {
      const transcriptText = await transcribeAudio(audioUri);
      const note = getNoteById(noteId);
      const noteMarkdown = note
        ? buildMarkdownNote({
            bookTitle: getBookById(note.bookId)?.title,
            author: getBookById(note.bookId)?.author,
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

  const confirmDelete = (noteId: string, title?: string, hasAudio?: boolean) => {
    const audioPhrase = hasAudio ? " and its audio file" : "";
    Alert.alert(
      "Delete note?",
      `This removes "${title || "Reading Note"}"${audioPhrase} from this device. Any file already saved to your vault is not affected.`,
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
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Your Notes</Text>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ color: "#666" }}>No notes yet. Tap New note on Home to create one.</Text>}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const book = getBookById(item.bookId);
          const markdown =
            item.noteMarkdown ||
            buildMarkdownNote({
              bookTitle: book?.title,
              author: book?.author,
              location: item.location,
              createdAt: item.createdAt,
              transcriptText: item.transcriptText,
            });
          return (
            <View
              style={{
                borderWidth: 1,
                borderColor: "#eee",
                borderRadius: 10,
                padding: 12,
                gap: 8,
              }}
            >
              <Text style={{ fontWeight: "700" }}>{book?.title || "Reading Note"}</Text>
              {book?.author ? <Text style={{ color: "#666" }}>Author: {book.author}</Text> : null}
              {item.location ? <Text style={{ color: "#666" }}>Page: {item.location}</Text> : null}
              <Text style={{ color: "#666" }}>{new Date(item.createdAt).toLocaleString()}</Text>
              <Text>Status: {item.status}</Text>
              {!canSaveToVaultFromHistory(book?.title) ? (
                <Text style={{ color: "#8a6d3b", fontSize: 12 }}>
                  Add a book title when editing this note before saving to your vault folder.
                </Text>
              ) : null}
              <View style={{ gap: 6 }}>
                <Button title="Edit note" onPress={() => onEditNote(item.id)} />
                {item.status === "failed" && item.audioUri ? (
                  <Button
                    title="Retry transcription"
                    onPress={() => void retryTranscription(item.id, item.audioUri)}
                  />
                ) : null}
                <Button
                  title="Save to vault"
                  onPress={() => saveToVault(item.id, markdown, item.createdAt, book?.title, item.location)}
                  disabled={!canSaveToVaultFromHistory(book?.title)}
                />
                <Button
                  title="Delete"
                  color="#c0392b"
                  onPress={() => confirmDelete(item.id, book?.title, !!item.audioUri)}
                />
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
