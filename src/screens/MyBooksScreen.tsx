import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { colors, radius, space } from "../theme/tokens";
import { useBookStore } from "../store/useBookStore";
import { useNoteStore } from "../store/useNoteStore";
import { UNCATEGORIZED_BOOK_ID } from "../types/book";

type MyBooksScreenProps = {
  onOpenBook: (bookId: string) => void;
};

export function MyBooksScreen({ onOpenBook }: MyBooksScreenProps) {
  const books = useBookStore((s) => s.books);
  const createBook = useBookStore((s) => s.createBook);
  const updateBook = useBookStore((s) => s.updateBook);
  const deleteBook = useBookStore((s) => s.deleteBook);
  const markBookOpened = useBookStore((s) => s.markBookOpened);
  const moveNotesToBook = useNoteStore((s) => s.moveNotesToBook);
  const notes = useNoteStore((s) => s.notes);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingAuthor, setEditingAuthor] = useState("");

  const lastOpenedBook = useMemo(() => {
    const candidates = books.filter((b) => !!b.lastOpenedAt);
    if (candidates.length === 0) return undefined;
    return [...candidates].sort((a, b) => (a.lastOpenedAt! < b.lastOpenedAt! ? 1 : -1))[0];
  }, [books]);

  const noteCountByBook = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of notes) {
      map.set(n.bookId, (map.get(n.bookId) ?? 0) + 1);
    }
    return map;
  }, [notes]);

  const create = () => {
    const result = createBook({ title, author });
    if (!result.ok) {
      if (result.reason === "duplicate") {
        Alert.alert("Duplicate book", "A book with this title and author already exists.");
      } else {
        Alert.alert("Missing title", "Enter a book title.");
      }
      return;
    }
    setTitle("");
    setAuthor("");
  };

  const openBook = (bookId: string) => {
    markBookOpened(bookId);
    onOpenBook(bookId);
  };

  const beginEdit = (bookId: string, currentTitle: string, currentAuthor: string) => {
    setEditingBookId(bookId);
    setEditingTitle(currentTitle);
    setEditingAuthor(currentAuthor);
  };

  const saveEdit = () => {
    if (!editingBookId) return;
    const result = updateBook(editingBookId, { title: editingTitle, author: editingAuthor });
    if (!result.ok) {
      if (result.reason === "duplicate") {
        Alert.alert("Duplicate book", "A book with this title and author already exists.");
      } else if (result.reason === "system") {
        Alert.alert("System book", "Uncategorized cannot be renamed.");
      } else {
        Alert.alert("Missing title", "Enter a book title.");
      }
      return;
    }
    setEditingBookId(null);
    setEditingTitle("");
    setEditingAuthor("");
  };

  const confirmDelete = (bookId: string, bookTitle: string) => {
    Alert.alert("Delete book?", `Delete “${bookTitle}” and move its notes to Uncategorized?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const result = deleteBook(bookId);
          if (!result.ok) {
            Alert.alert("Could not delete", "This book cannot be deleted.");
            return;
          }
          moveNotesToBook(bookId, UNCATEGORIZED_BOOK_ID);
          if (editingBookId === bookId) {
            setEditingBookId(null);
          }
        },
      },
    ]);
  };

  const header = (
    <View style={styles.headerBlock}>
      <Text style={styles.screenTitle}>My Books</Text>
      <Text style={styles.screenSubtitle}>Choose a book, then add notes as you read.</Text>
    </View>
  );

  const continueSection =
    lastOpenedBook != null ? (
      <View style={[styles.card, styles.cardAccent]}>
        <Text style={styles.sectionLabel}>Continue</Text>
        <Text style={styles.bookTitle}>{lastOpenedBook.title}</Text>
        {lastOpenedBook.author ? (
          <Text style={styles.bookMeta}>by {lastOpenedBook.author}</Text>
        ) : null}
        <TouchableOpacity
          style={[styles.primaryButton, styles.primaryButtonInline]}
          onPress={() => openBook(lastOpenedBook.id)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${lastOpenedBook.title}`}
        >
          <Text style={styles.primaryButtonText}>Resume this book</Text>
        </TouchableOpacity>
      </View>
    ) : null;

  const createSection = (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>New book</Text>
      <Text style={styles.fieldLabel}>Title</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Deep Work"
        placeholderTextColor={colors.textSubtle}
        style={styles.input}
        accessibilityLabel="Book title"
      />
      <Text style={styles.fieldLabel}>Author</Text>
      <TextInput
        value={author}
        onChangeText={setAuthor}
        placeholder="Optional"
        placeholderTextColor={colors.textSubtle}
        style={styles.input}
        accessibilityLabel="Author name"
      />
      <TouchableOpacity style={styles.primaryButton} onPress={create} accessibilityRole="button">
        <Text style={styles.primaryButtonText}>Add book</Text>
      </TouchableOpacity>
    </View>
  );

  const listIntro = (
    <Text style={[styles.sectionLabel, { marginTop: space.sm, marginBottom: space.xs }]}>All books</Text>
  );

  return (
    <FlatList
      style={styles.list}
      data={books}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <>
          {header}
          {continueSection}
          {createSection}
          {listIntro}
        </>
      }
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
      renderItem={({ item }) => {
        const noteCount = noteCountByBook.get(item.id) ?? 0;
        const isEditing = editingBookId === item.id;
        const isSystem = !!item.isSystem;

        return (
          <View style={styles.card}>
            {isEditing ? (
              <>
                <Text style={styles.sectionLabel}>Edit book</Text>
                <Text style={styles.fieldLabel}>Title</Text>
                <TextInput
                  value={editingTitle}
                  onChangeText={setEditingTitle}
                  placeholder="Book title"
                  placeholderTextColor={colors.textSubtle}
                  style={styles.input}
                />
                <Text style={styles.fieldLabel}>Author</Text>
                <TextInput
                  value={editingAuthor}
                  onChangeText={setEditingAuthor}
                  placeholder="Optional"
                  placeholderTextColor={colors.textSubtle}
                  style={styles.input}
                />
                <View style={styles.editActions}>
                  <TouchableOpacity style={styles.primaryButton} onPress={saveEdit} accessibilityRole="button">
                    <Text style={styles.primaryButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => {
                      setEditingBookId(null);
                      setEditingTitle("");
                      setEditingAuthor("");
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.bookRowTop}>
                  <View style={styles.bookTextBlock}>
                    <Text style={styles.bookTitle}>{item.title}</Text>
                    {item.author ? <Text style={styles.bookMeta}>{item.author}</Text> : null}
                  </View>
                  <View style={styles.notePill}>
                    <Text style={styles.notePillText}>
                      {noteCount} {noteCount === 1 ? "note" : "notes"}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.primaryButton, styles.primaryButtonCompact]}
                  onPress={() => openBook(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${item.title}`}
                >
                  <Text style={styles.primaryButtonText}>Open</Text>
                </TouchableOpacity>
                {!isSystem ? (
                  <View style={styles.bookActionsRow}>
                    <TouchableOpacity onPress={() => beginEdit(item.id, item.title, item.author)} accessibilityRole="button">
                      <Text style={styles.linkText}>Edit details</Text>
                    </TouchableOpacity>
                    <Text style={styles.actionDivider}>·</Text>
                    <TouchableOpacity onPress={() => confirmDelete(item.id, item.title)} accessibilityRole="button">
                      <Text style={styles.dangerLinkText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.systemHint}>Notes land here when you delete a book.</Text>
                )}
              </>
            )}
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
  headerBlock: {
    marginBottom: space.md,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    marginTop: space.xs,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    ...shadowCard,
  },
  cardAccent: {
    backgroundColor: colors.surfaceAccent,
    borderColor: colors.borderStrong,
    marginBottom: space.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.textSubtle,
    marginBottom: space.sm,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: space.xs,
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
    marginBottom: space.sm,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 12,
    paddingHorizontal: space.md,
    alignItems: "center",
    marginTop: space.xs,
  },
  primaryButtonInline: {
    marginTop: space.md,
  },
  primaryButtonCompact: {
    marginTop: space.sm,
  },
  primaryButtonText: {
    color: colors.inverse,
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: space.xs,
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "600",
  },
  editActions: {
    gap: space.xs,
  },
  bookRowTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: space.sm,
  },
  bookTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  bookTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  bookMeta: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textMuted,
  },
  notePill: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
  },
  notePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  bookActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: space.sm,
    gap: space.xs,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.accent,
  },
  dangerLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.danger,
  },
  actionDivider: {
    fontSize: 14,
    color: colors.textSubtle,
  },
  systemHint: {
    marginTop: space.sm,
    fontSize: 13,
    color: colors.textSubtle,
    fontStyle: "italic",
  },
});
