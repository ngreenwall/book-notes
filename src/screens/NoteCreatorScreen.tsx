import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { File } from "expo-file-system";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { buildMarkdownNote } from "../lib/markdown";
import { transcribeAudio } from "../lib/transcribe";
import { useBookStore } from "../store/useBookStore";
import { colors, radius, space } from "../theme/tokens";
import { useNoteStore } from "../store/useNoteStore";

function deleteAudioFile(audioUri: string | undefined): void {
  if (!audioUri) return;
  try {
    const file = new File(audioUri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // scratch file may already be gone
  }
}

type NoteCreatorScreenProps = {
  mode: "new" | "edit";
  noteId: string | null;
  bookId: string;
  onClose: () => void;
  onSaved: () => void;
};

/** Snapshot for dirty-check: metadata trimmed to match persisted values; note body unchanged. */
function serializeFormSnapshot(pageNumber: string, noteBody: string): string {
  return JSON.stringify({
    pageNumber: pageNumber.trim(),
    noteBody,
  });
}

export function NoteCreatorScreen({ mode, noteId, bookId, onClose, onSaved }: NoteCreatorScreenProps) {
  const createNote = useNoteStore((s) => s.createNote);
  const updateNote = useNoteStore((s) => s.updateNote);
  const getNoteById = useNoteStore((s) => s.getNoteById);
  const noteFromStore = useNoteStore((s) => (noteId ? s.notes.find((n) => n.id === noteId) : undefined));
  const activeBook = useBookStore((s) => s.getBookById(bookId));

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const [pageNumber, setPageNumber] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  /** Latest recording URI not yet committed to the store (cleared after Save). */
  const [pendingAudioUri, setPendingAudioUri] = useState<string | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<string>("");

  const transcribeAbortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const storedAudioUriRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      transcribeAbortRef.current?.abort();
    };
  }, []);

  const resetFromNote = useCallback(
    (id: string) => {
      const note = getNoteById(id);
      if (!note) return;
      storedAudioUriRef.current = note.audioUri;
      setPageNumber(note.location ?? "");
      setNoteBody(note.transcriptText ?? "");
      setPendingAudioUri(null);
      setTranscribeError(note.status === "failed" ? note.errorMessage ?? "Transcription failed." : null);
      setInitialSnapshot(
        serializeFormSnapshot(note.location ?? "", note.transcriptText ?? "")
      );
    },
    [getNoteById]
  );

  useEffect(() => {
    if (mode === "edit" && noteId) {
      resetFromNote(noteId);
      return;
    }
    if (mode === "new") {
      storedAudioUriRef.current = undefined;
      setPageNumber("");
      setNoteBody("");
      setPendingAudioUri(null);
      setTranscribeError(null);
      setInitialSnapshot(serializeFormSnapshot("", ""));
    }
  }, [mode, noteId, resetFromNote]);

  const isDirty = () => {
    return serializeFormSnapshot(pageNumber, noteBody) !== initialSnapshot || !!pendingAudioUri;
  };

  const requestClose = () => {
    if (!isDirty()) {
      onClose();
      return;
    }
    Alert.alert("Discard changes?", "You have unsaved edits.", [
      { text: "Keep editing", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => {
          if (mode === "new" && pendingAudioUri) {
            deleteAudioFile(pendingAudioUri);
          }
          if (mode === "edit" && pendingAudioUri && pendingAudioUri !== storedAudioUriRef.current) {
            deleteAudioFile(pendingAudioUri);
          }
          onClose();
        },
      },
    ]);
  };

  const startRecording = async () => {
    setTranscribeError(null);
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

  const stopAndTranscribe = async () => {
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

      setIsTranscribing(true);
      transcribeAbortRef.current?.abort();
      const controller = new AbortController();
      transcribeAbortRef.current = controller;

      try {
        const transcriptText = await transcribeAudio(audioUri, controller.signal);
        if (controller.signal.aborted) {
          return;
        }

        const trimmed = transcriptText.trim();
        if (!trimmed) {
          Alert.alert(
            "No speech detected",
            "The transcript was empty. Try again or speak closer to the microphone."
          );
          deleteAudioFile(audioUri);
          return;
        }

        setNoteBody((prev) => {
          const p = prev.trim();
          if (!p) return trimmed;
          return `${p}\n\n${trimmed}`;
        });
        setPendingAudioUri((prev) => {
          if (prev && prev !== audioUri) {
            deleteAudioFile(prev);
          }
          return audioUri;
        });
        setTranscribeError(null);
      } catch (error) {
        if (!controller.signal.aborted) {
          setTranscribeError(String(error));
          setPendingAudioUri(audioUri);
          Alert.alert("Transcription failed", String(error));
        }
      } finally {
        if (transcribeAbortRef.current === controller) {
          transcribeAbortRef.current = null;
        }
        if (isMountedRef.current) {
          setIsTranscribing(false);
        }
      }
    } catch (error) {
      Alert.alert("Recording error", String(error));
    }
  };

  const retryTranscription = async () => {
    const uri = pendingAudioUri ?? storedAudioUriRef.current;
    if (!uri) {
      Alert.alert("Nothing to transcribe", "Record audio first, or this note has no saved recording.");
      return;
    }
    setIsTranscribing(true);
    setTranscribeError(null);
    transcribeAbortRef.current?.abort();
    const controller = new AbortController();
    transcribeAbortRef.current = controller;
    try {
      const transcriptText = await transcribeAudio(uri, controller.signal);
      if (controller.signal.aborted) return;
      const trimmed = transcriptText.trim();
      if (!trimmed) {
        Alert.alert("No speech detected", "The transcript was empty. Try speaking again.");
        return;
      }
      setNoteBody((prev) => {
        const p = prev.trim();
        if (!p) return trimmed;
        return `${p}\n\n${trimmed}`;
      });
    } catch (error) {
      if (!controller.signal.aborted) {
        setTranscribeError(String(error));
        Alert.alert("Transcription failed", String(error));
      }
    } finally {
      if (transcribeAbortRef.current === controller) {
        transcribeAbortRef.current = null;
      }
      if (isMountedRef.current) {
        setIsTranscribing(false);
      }
    }
  };

  const saveNote = () => {
    const normalizedPage = pageNumber.trim() || undefined;
    const bookTitle = activeBook?.title ?? "";
    const author = activeBook?.author ?? "";
    if (!bookId.trim() || !bookTitle.trim()) {
      Alert.alert("Book required", "Open a valid book before creating or editing notes.");
      return;
    }

    if (mode === "new") {
      const createdAt = new Date().toISOString();
      const noteMarkdown = buildMarkdownNote({
        bookTitle,
        author,
        location: normalizedPage,
        createdAt,
        transcriptText: noteBody,
      });
      createNote({
        bookId,
        location: normalizedPage,
        audioUri: pendingAudioUri ?? undefined,
        transcriptText: noteBody,
        noteMarkdown,
        createdAt,
        status: "ready",
      });
      setPageNumber(normalizedPage ?? "");
      setInitialSnapshot(serializeFormSnapshot(normalizedPage ?? "", noteBody));
      setPendingAudioUri(null);
      Alert.alert("Saved", "Note added to this book.", [{ text: "OK", onPress: onSaved }]);
      return;
    }

    if (!noteId) return;
    const existing = getNoteById(noteId);
    if (!existing) return;

    const finalAudioUri = pendingAudioUri ?? existing.audioUri;
    if (pendingAudioUri && existing.audioUri && pendingAudioUri !== existing.audioUri) {
      deleteAudioFile(existing.audioUri);
    }

    const noteMarkdown = buildMarkdownNote({
      bookTitle,
      author,
      location: normalizedPage,
      createdAt: existing.createdAt,
      transcriptText: noteBody,
    });

    updateNote(noteId, {
      bookId,
      location: normalizedPage,
      transcriptText: noteBody,
      noteMarkdown,
      audioUri: finalAudioUri,
      status: existing.status === "exported" ? "exported" : "ready",
      errorMessage: undefined,
    });

    storedAudioUriRef.current = finalAudioUri;
    setPendingAudioUri(null);
    setTranscribeError(null);
    setPageNumber(normalizedPage ?? "");
    setInitialSnapshot(serializeFormSnapshot(normalizedPage ?? "", noteBody));
    Alert.alert("Saved", "Note updated.", [{ text: "OK", onPress: onSaved }]);
  };

  const title = mode === "new" ? "New note" : "Edit note";
  const canRetryTranscription = !!pendingAudioUri || !!(mode === "edit" && noteFromStore?.audioUri);

  if (mode === "edit" && noteId && !noteFromStore) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Note not found</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onClose} accessibilityRole="button">
          <Text style={styles.primaryButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const recordingDisabled = recorderState.isRecording || isTranscribing;
  const stopDisabled = !recorderState.isRecording || isTranscribing;
  const saveDisabled = isTranscribing;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.stack}>
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>{title}</Text>
          <TouchableOpacity onPress={requestClose} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.closeLink}>Close</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bookCard}>
          <Text style={styles.bookLabel}>BOOK</Text>
          <Text style={styles.bookTitleText}>{activeBook?.title ?? "Unknown book"}</Text>
          {activeBook?.author ? <Text style={styles.bookAuthorText}>{activeBook.author}</Text> : null}
        </View>

        <Text style={styles.fieldHeading}>Page</Text>
        <TextInput
          value={pageNumber}
          onChangeText={setPageNumber}
          placeholder="Page number (optional)"
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
        />

        <Text style={styles.fieldHeading}>Note</Text>
        <TextInput
          multiline
          value={noteBody}
          onChangeText={setNoteBody}
          placeholder="Type your note, or record below."
          placeholderTextColor={colors.textSubtle}
          style={[styles.input, styles.noteInput]}
        />

        {transcribeError ? <Text style={styles.errorText}>{transcribeError}</Text> : null}

        <View style={styles.recordingRow}>
          <TouchableOpacity
            style={[styles.outlineButton, recordingDisabled && styles.buttonDisabled]}
            onPress={() => void startRecording()}
            disabled={recordingDisabled}
            accessibilityRole="button"
          >
            <Text style={styles.outlineButtonText}>Start recording</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.outlineButton, stopDisabled && styles.buttonDisabled]}
            onPress={() => void stopAndTranscribe()}
            disabled={stopDisabled}
            accessibilityRole="button"
          >
            <Text style={styles.outlineButtonText}>Stop & transcribe</Text>
          </TouchableOpacity>
        </View>

        {isTranscribing ? (
          <View style={styles.transcribingRow}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.transcribingText}>Transcribing…</Text>
          </View>
        ) : (
          <Text style={styles.hintText}>New transcript text is appended when the note field is not empty.</Text>
        )}

        {canRetryTranscription ? (
          <TouchableOpacity
            style={[styles.linkButton, isTranscribing && styles.buttonDisabled]}
            onPress={() => void retryTranscription()}
            disabled={isTranscribing}
            accessibilityRole="button"
          >
            <Text style={styles.linkButtonText}>Retry transcription</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, styles.saveButton, saveDisabled && styles.buttonDisabled]}
          onPress={saveNote}
          disabled={saveDisabled}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Save note</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 32,
  },
  stack: {
    gap: space.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: space.sm,
    marginBottom: space.xs,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3,
  },
  closeLink: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textMuted,
  },
  bookCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    backgroundColor: colors.surfaceWarm,
    marginBottom: space.xs,
  },
  bookLabel: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  bookTitleText: {
    fontWeight: "700",
    fontSize: 17,
    color: colors.text,
    marginTop: 4,
  },
  bookAuthorText: {
    color: colors.textMuted,
    marginTop: 4,
    fontSize: 15,
  },
  fieldHeading: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  noteInput: {
    minHeight: 160,
    textAlignVertical: "top",
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  recordingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    marginTop: space.xs,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingVertical: 11,
    paddingHorizontal: space.md,
    backgroundColor: colors.bg,
    flexGrow: 1,
    minWidth: 140,
    alignItems: "center",
  },
  outlineButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.accent,
  },
  transcribingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginTop: space.xs,
  },
  transcribingText: {
    color: colors.text,
    fontSize: 14,
  },
  hintText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  linkButton: {
    alignSelf: "flex-start",
    paddingVertical: space.xs,
  },
  linkButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.exported,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 14,
    paddingHorizontal: space.md,
    alignItems: "center",
  },
  saveButton: {
    marginTop: space.sm,
  },
  primaryButtonText: {
    color: colors.inverse,
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  emptyState: {
    gap: space.md,
    paddingVertical: space.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
});
