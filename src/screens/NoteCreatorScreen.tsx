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
  Button,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { buildMarkdownNote } from "../lib/markdown";
import { transcribeAudio } from "../lib/transcribe";
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
  onClose: () => void;
  onSaved: () => void;
};

const inputStyle = {
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 10,
  padding: 12,
} as const;

/** Snapshot for dirty-check: metadata trimmed to match persisted values; note body unchanged. */
function serializeFormSnapshot(bookTitle: string, author: string, pageNumber: string, noteBody: string): string {
  return JSON.stringify({
    bookTitle: bookTitle.trim(),
    author: author.trim(),
    pageNumber: pageNumber.trim(),
    noteBody,
  });
}

export function NoteCreatorScreen({ mode, noteId, onClose, onSaved }: NoteCreatorScreenProps) {
  const createNote = useNoteStore((s) => s.createNote);
  const updateNote = useNoteStore((s) => s.updateNote);
  const getNoteById = useNoteStore((s) => s.getNoteById);
  const noteFromStore = useNoteStore((s) => (noteId ? s.notes.find((n) => n.id === noteId) : undefined));

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");
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
      setBookTitle(note.bookTitle ?? "");
      setAuthor(note.author ?? "");
      setPageNumber(note.location ?? "");
      setNoteBody(note.transcriptText ?? "");
      setPendingAudioUri(null);
      setTranscribeError(note.status === "failed" ? note.errorMessage ?? "Transcription failed." : null);
      setInitialSnapshot(
        serializeFormSnapshot(note.bookTitle ?? "", note.author ?? "", note.location ?? "", note.transcriptText ?? "")
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
      setBookTitle("");
      setAuthor("");
      setPageNumber("");
      setNoteBody("");
      setPendingAudioUri(null);
      setTranscribeError(null);
      setInitialSnapshot(serializeFormSnapshot("", "", "", ""));
    }
  }, [mode, noteId, resetFromNote]);

  const isDirty = () => {
    return serializeFormSnapshot(bookTitle, author, pageNumber, noteBody) !== initialSnapshot || !!pendingAudioUri;
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
    const normalizedBookTitle = bookTitle.trim() || undefined;
    const normalizedAuthor = author.trim() || undefined;
    const normalizedPage = pageNumber.trim() || undefined;

    if (mode === "new") {
      const createdAt = new Date().toISOString();
      const noteMarkdown = buildMarkdownNote({
        bookTitle: normalizedBookTitle,
        author: normalizedAuthor,
        location: normalizedPage,
        createdAt,
        transcriptText: noteBody,
      });
      createNote({
        bookTitle: normalizedBookTitle,
        author: normalizedAuthor,
        location: normalizedPage,
        audioUri: pendingAudioUri ?? undefined,
        transcriptText: noteBody,
        noteMarkdown,
        createdAt,
        status: "ready",
      });
      setBookTitle(normalizedBookTitle ?? "");
      setAuthor(normalizedAuthor ?? "");
      setPageNumber(normalizedPage ?? "");
      setInitialSnapshot(
        serializeFormSnapshot(normalizedBookTitle ?? "", normalizedAuthor ?? "", normalizedPage ?? "", noteBody)
      );
      setPendingAudioUri(null);
      Alert.alert("Saved", "Note added to Your Notes.", [{ text: "OK", onPress: onSaved }]);
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
      bookTitle: normalizedBookTitle,
      author: normalizedAuthor,
      location: normalizedPage,
      createdAt: existing.createdAt,
      transcriptText: noteBody,
    });

    updateNote(noteId, {
      bookTitle: normalizedBookTitle,
      author: normalizedAuthor,
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
    setBookTitle(normalizedBookTitle ?? "");
    setAuthor(normalizedAuthor ?? "");
    setPageNumber(normalizedPage ?? "");
    setInitialSnapshot(
      serializeFormSnapshot(normalizedBookTitle ?? "", normalizedAuthor ?? "", normalizedPage ?? "", noteBody)
    );
    Alert.alert("Saved", "Note updated.", [{ text: "OK", onPress: onSaved }]);
  };

  const title = mode === "new" ? "New note" : "Edit note";
  const canRetryTranscription = !!pendingAudioUri || !!(mode === "edit" && noteFromStore?.audioUri);

  if (mode === "edit" && noteId && !noteFromStore) {
    return (
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>Note not found</Text>
        <Button title="Close" onPress={onClose} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
          <Text style={{ fontSize: 22, fontWeight: "700" }}>{title}</Text>
          <Button title="Close" onPress={requestClose} color="#666" />
        </View>

        <TextInput value={bookTitle} onChangeText={setBookTitle} placeholder="Book title" style={inputStyle} />
        <TextInput value={author} onChangeText={setAuthor} placeholder="Author (optional)" style={inputStyle} />
        <TextInput
          value={pageNumber}
          onChangeText={setPageNumber}
          placeholder="Page number (optional)"
          style={inputStyle}
        />

        <Text style={{ fontSize: 15, fontWeight: "600" }}>Note</Text>
        <TextInput
          multiline
          value={noteBody}
          onChangeText={setNoteBody}
          placeholder="Type your note, or use Start recording below."
          style={{ ...inputStyle, minHeight: 160, textAlignVertical: "top" }}
        />

        {transcribeError ? <Text style={{ color: "crimson", fontSize: 13 }}>{transcribeError}</Text> : null}

        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <Button
            title="Start recording"
            onPress={() => void startRecording()}
            disabled={recorderState.isRecording || isTranscribing}
          />
          <Button
            title="Stop & transcribe"
            onPress={() => void stopAndTranscribe()}
            disabled={!recorderState.isRecording || isTranscribing}
          />
        </View>

        {isTranscribing ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <ActivityIndicator />
            <Text style={{ color: "#333" }}>Transcribing…</Text>
          </View>
        ) : (
          <Text style={{ color: "#666", fontSize: 13 }}>
            New transcript text is appended to your note when the field is not empty.
          </Text>
        )}

        {canRetryTranscription ? (
          <Button title="Retry transcription" onPress={() => void retryTranscription()} disabled={isTranscribing} />
        ) : null}

        <Button title="Save note" onPress={saveNote} disabled={isTranscribing} />
      </View>
    </ScrollView>
  );
}
