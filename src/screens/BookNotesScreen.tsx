import React, { useMemo } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { buildMarkdownNote } from "../lib/markdown";
import { saveNoteToVault } from "../lib/saveNoteToVault";
import { transcribeAudio } from "../lib/transcribe";
import { colors, radius, space } from "../theme/tokens";
import { useBookStore } from "../store/useBookStore";
import { useNoteStore } from "../store/useNoteStore";
import type { NoteStatus } from "../types/note";
import { useSettingsStore } from "../store/useSettingsStore";

type BookNotesScreenProps = {
  bookId: string;
  onBack: () => void;
  onNewNote: () => void;
  onEditNote: (noteId: string) => void;
};

function notePreview(transcript: string, maxLen = 100): string {
  const line = transcript.replace(/\s+/g, " ").trim();
  if (!line) return "No text yet — tap Edit to add or dictate.";
  if (line.length <= maxLen) return line;
  return `${line.slice(0, maxLen).trim()}…`;
}

function statusLabel(status: NoteStatus): string {
  switch (status) {
    case "transcribing":
      return "Transcribing";
    case "ready":
      return "Ready";
    case "exported":
      return "Saved to vault";
    case "failed":
      return "Needs attention";
    default:
      return status;
  }
}

function statusStyle(status: NoteStatus) {
  switch (status) {
    case "exported":
      return { bg: colors.exportedBg, text: colors.exported };
    case "failed":
      return { bg: colors.dangerBg, text: colors.danger };
    case "transcribing":
      return { bg: colors.warningBg, text: colors.warning };
    case "ready":
    default:
      return { bg: colors.successBg, text: colors.success };
  }
}

export function BookNotesScreen({ bookId, onBack, onNewNote, onEditNote }: BookNotesScreenProps) {
  const book = useBookStore((s) => s.getBookById(bookId));
  const allNotes = useNoteStore((state) => state.notes);
  const notes = useMemo(() => allNotes.filter((n) => n.bookId === bookId), [allNotes, bookId]);
  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [notes]
  );
  const updateNote = useNoteStore((state) => state.updateNote);
  const updateStatus = useNoteStore((state) => state.updateStatus);
  const deleteNote = useNoteStore((state) => state.deleteNote);
  const getNoteById = useNoteStore((state) => state.getNoteById);
  const vaultRootUri = useSettingsStore((s) => s.vaultRootUri);

  const retryTranscription = async (noteId: string, audioUri: string | undefined) => {
    if (!audioUri) return;
    updateStatus(noteId, "transcribing");
    try {
      const transcriptText = await transcribeAudio(audioUri);
      const note = getNoteById(noteId);
      if (!note || !book) return;
      const noteMarkdown = buildMarkdownNote({
        bookTitle: book.title,
        author: book.author,
        location: note.location,
        createdAt: note.createdAt,
        transcriptText,
      });
      updateNote(noteId, { transcriptText, noteMarkdown });
      updateStatus(noteId, "ready");
    } catch (error) {
      updateStatus(noteId, "failed", String(error));
    }
  };

  const confirmDelete = (noteId: string, hasAudio?: boolean) => {
    const audioPhrase = hasAudio ? " and its recording" : "";
    Alert.alert(
      "Delete note?",
      `This removes the note${audioPhrase} from this device. Files already in your vault stay there.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteNote(noteId) },
      ]
    );
  };

  const saveToVault = async (noteId: string, createdAt: string, pageNumber?: string) => {
    if (!book) return;
    const note = getNoteById(noteId);
    if (!note) return;
    const markdown =
      note.noteMarkdown ||
      buildMarkdownNote({
        bookTitle: book.title,
        author: book.author,
        location: note.location,
        createdAt: note.createdAt,
        transcriptText: note.transcriptText,
      });
    const ok = await saveNoteToVault({
      vaultRootUri,
      markdown,
      createdAt,
      bookTitle: book.title,
      pageNumber,
    });
    if (ok) updateStatus(noteId, "exported");
  };

  if (!book) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.screenTitle}>Book not found</Text>
        <Text style={styles.screenSubtitle}>Go back and pick a book from your library.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onBack} accessibilityRole="button">
          <Text style={styles.primaryButtonText}>Back to My Books</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const header = (
    <>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} accessibilityRole="button" accessibilityLabel="Back to My Books">
          <Text style={styles.backLink}>← My Books</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButtonSmall}
          onPress={onNewNote}
          accessibilityRole="button"
          accessibilityLabel="New note"
        >
          <Text style={styles.primaryButtonText}>New note</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.titleBlock}>
        <Text style={styles.screenTitle}>{book.title}</Text>
        {book.author ? <Text style={styles.authorLine}>{book.author}</Text> : null}
      </View>
      <Text style={styles.notesHeading}>
        Notes{" "}
        <Text style={styles.notesCount}>
          ({sortedNotes.length})
        </Text>
      </Text>
    </>
  );

  const emptyComponent = (
    <View style={styles.emptyNotes}>
      <Text style={styles.emptyTitle}>No notes yet</Text>
      <Text style={styles.emptySubtitle}>Capture a quote or thought while you read — tap New note to start.</Text>
      <TouchableOpacity
        style={[styles.primaryButton, styles.primaryButtonCenter]}
        onPress={onNewNote}
        accessibilityRole="button"
      >
        <Text style={styles.primaryButtonText}>Write your first note</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      style={styles.list}
      data={sortedNotes}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      ListEmptyComponent={emptyComponent}
      contentContainerStyle={sortedNotes.length === 0 ? styles.listContentEmpty : styles.listContent}
      keyboardShouldPersistTaps="handled"
      ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
      renderItem={({ item }) => {
        const st = statusStyle(item.status);
        const formattedDate = new Date(item.createdAt).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });

        return (
          <View style={styles.noteCard}>
            <View style={styles.noteCardTop}>
              <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                <Text style={[styles.statusPillText, { color: st.text }]}>{statusLabel(item.status)}</Text>
              </View>
              <Text style={styles.dateLine}>{formattedDate}</Text>
            </View>
            {item.location ? (
              <Text style={styles.pageLine}>Page {item.location}</Text>
            ) : null}
            <Text style={styles.preview}>{notePreview(item.transcriptText)}</Text>
            <View style={styles.noteActions}>
              <TouchableOpacity
                style={styles.secondaryOutlineButton}
                onPress={() => onEditNote(item.id)}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryOutlineText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryOutlineButton}
                onPress={() => void saveToVault(item.id, item.createdAt, item.location)}
                disabled={!book.title.trim()}
                accessibilityRole="button"
              >
                <Text style={[styles.secondaryOutlineText, !book.title.trim() && styles.disabledText]}>
                  Save to vault
                </Text>
              </TouchableOpacity>
            </View>
            {item.status === "failed" && item.audioUri ? (
              <TouchableOpacity
                style={styles.tertiaryButton}
                onPress={() => void retryTranscription(item.id, item.audioUri)}
                accessibilityRole="button"
              >
                <Text style={styles.linkAccent}>Retry transcription</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={() => confirmDelete(item.id, !!item.audioUri)}
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Text style={styles.deleteLink}>Delete note</Text>
            </TouchableOpacity>
          </View>
        );
      }}
    />
  );
}

const shadowCard =
  Platform.OS === "ios"
    ? {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      }
    : { elevation: 1 };

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 32,
  },
  listContentEmpty: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space.md,
    gap: space.sm,
  },
  backLink: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.accent,
  },
  primaryButtonSmall: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: space.md,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 12,
    paddingHorizontal: space.md,
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: space.sm,
  },
  primaryButtonCenter: {
    alignSelf: "center",
  },
  primaryButtonText: {
    color: colors.inverse,
    fontSize: 15,
    fontWeight: "600",
  },
  titleBlock: {
    marginBottom: space.md,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3,
  },
  authorLine: {
    marginTop: 6,
    fontSize: 16,
    color: colors.textMuted,
  },
  notesHeading: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: colors.textSubtle,
    marginBottom: space.sm,
  },
  notesCount: {
    fontWeight: "600",
    color: colors.textMuted,
  },
  noteCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    ...shadowCard,
    gap: space.sm,
  },
  noteCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
  },
  statusPill: {
    borderRadius: radius.lg,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  dateLine: {
    fontSize: 12,
    color: colors.textSubtle,
  },
  pageLine: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  preview: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  noteActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    marginTop: space.xs,
  },
  secondaryOutlineButton: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: space.md,
    backgroundColor: colors.bg,
  },
  secondaryOutlineText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.accent,
  },
  disabledText: {
    opacity: 0.4,
  },
  tertiaryButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  linkAccent: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.exported,
  },
  deleteLink: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.danger,
    marginTop: space.xs,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    gap: space.sm,
    paddingVertical: space.xl,
  },
  emptyNotes: {
    alignItems: "center",
    paddingVertical: space.xl,
    paddingHorizontal: space.sm,
    gap: space.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    marginBottom: space.sm,
    textAlign: "center",
    maxWidth: 320,
    alignSelf: "center",
  },
  screenSubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
});
