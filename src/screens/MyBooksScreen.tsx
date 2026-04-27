import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius, space } from "../theme/tokens";
import { useBookStore } from "../store/useBookStore";
import { useNoteStore } from "../store/useNoteStore";
import { UNCATEGORIZED_BOOK_ID } from "../types/book";

type MyBooksScreenProps = {
  onOpenBook: (bookId: string) => void;
};

const SHEET_SLIDE_PX = Math.min(Dimensions.get("window").height * 0.45, 480);

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
  const [addBookSheetOpen, setAddBookSheetOpen] = useState(false);
  const closeSheetAnimating = useRef(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SHEET_SLIDE_PX)).current;

  const [editBookSheetOpen, setEditBookSheetOpen] = useState(false);
  const editCloseSheetAnimating = useRef(false);
  const editBackdropOpacity = useRef(new Animated.Value(0)).current;
  const editSheetTranslateY = useRef(new Animated.Value(SHEET_SLIDE_PX)).current;
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

  useLayoutEffect(() => {
    if (!addBookSheetOpen) return;
    backdropOpacity.setValue(0);
    sheetTranslateY.setValue(SHEET_SLIDE_PX);
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [addBookSheetOpen]);

  useLayoutEffect(() => {
    if (!editBookSheetOpen) return;
    editBackdropOpacity.setValue(0);
    editSheetTranslateY.setValue(SHEET_SLIDE_PX);
    Animated.parallel([
      Animated.timing(editBackdropOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(editSheetTranslateY, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [editBookSheetOpen]);

  const dismissAddBookSheet = () => {
    if (closeSheetAnimating.current || !addBookSheetOpen) return;
    closeSheetAnimating.current = true;
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: SHEET_SLIDE_PX,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      closeSheetAnimating.current = false;
      if (finished) {
        setAddBookSheetOpen(false);
        setTitle("");
        setAuthor("");
      }
    });
  };

  const dismissEditBookSheet = () => {
    if (editCloseSheetAnimating.current || !editBookSheetOpen) return;
    editCloseSheetAnimating.current = true;
    Animated.parallel([
      Animated.timing(editBackdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(editSheetTranslateY, {
        toValue: SHEET_SLIDE_PX,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      editCloseSheetAnimating.current = false;
      if (finished) {
        setEditBookSheetOpen(false);
        setEditingBookId(null);
        setEditingTitle("");
        setEditingAuthor("");
      }
    });
  };

  const submitNewBook = () => {
    const result = createBook({ title, author });
    if (!result.ok) {
      if (result.reason === "duplicate") {
        Alert.alert("Duplicate book", "A book with this title and author already exists.");
      } else {
        Alert.alert("Missing title", "Enter a book title.");
      }
      return;
    }
    dismissAddBookSheet();
  };

  const openBook = (bookId: string) => {
    markBookOpened(bookId);
    onOpenBook(bookId);
  };

  const beginEdit = (bookId: string, currentTitle: string, currentAuthor: string) => {
    setEditingBookId(bookId);
    setEditingTitle(currentTitle);
    setEditingAuthor(currentAuthor);
    setEditBookSheetOpen(true);
  };

  const submitEditBook = () => {
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
    dismissEditBookSheet();
  };

  const confirmDeleteFromSheet = () => {
    if (!editingBookId) return;
    const bookIdToDelete = editingBookId;
    const label = editingTitle.trim() || "this book";
    Alert.alert("Delete book?", `Delete “${label}” and move its notes to Uncategorized?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const result = deleteBook(bookIdToDelete);
          if (!result.ok) {
            Alert.alert("Could not delete", "This book cannot be deleted.");
            return;
          }
          moveNotesToBook(bookIdToDelete, UNCATEGORIZED_BOOK_ID);
          dismissEditBookSheet();
        },
      },
    ]);
  };

  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.headerTopRow}>
        <View style={styles.headerTitleColumn}>
          <Text style={styles.screenTitle}>My Books</Text>
          <Text style={styles.screenSubtitle}>Choose a book, then add notes as you read.</Text>
        </View>
        <TouchableOpacity
          style={styles.addBookTopButton}
          onPress={() => setAddBookSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Add book"
        >
          <Text style={styles.addBookTopButtonText}>Add Book</Text>
        </TouchableOpacity>
      </View>
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

  const listIntro = (
    <Text style={[styles.sectionLabel, { marginTop: space.sm, marginBottom: space.xs }]}>All books</Text>
  );

  const addBookSheet = (
    <Modal visible={addBookSheetOpen} animationType="none" transparent onRequestClose={dismissAddBookSheet}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.sheetKeyboardOuter}
      >
        <View style={styles.sheetModalRoot}>
          <Animated.View style={[styles.sheetBackdropWrap, { opacity: backdropOpacity }]}>
            <Pressable
              style={styles.sheetBackdropDim}
              onPress={dismissAddBookSheet}
              accessibilityRole="button"
              accessibilityLabel="Dismiss"
            />
          </Animated.View>
          <Animated.View style={[styles.sheetFloating, { transform: [{ translateY: sheetTranslateY }] }]}>
            <View style={styles.sheetPanel}>
              <SafeAreaView edges={["bottom"]} style={styles.sheetSafe}>
                <Text style={styles.sheetTitle}>Add book</Text>
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
                <TouchableOpacity style={styles.primaryButton} onPress={submitNewBook} accessibilityRole="button">
                  <Text style={styles.primaryButtonText}>Add Book</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sheetCancelButton} onPress={dismissAddBookSheet} accessibilityRole="button">
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
              </SafeAreaView>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const editBookSheet = (
    <Modal visible={editBookSheetOpen} animationType="none" transparent onRequestClose={dismissEditBookSheet}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.sheetKeyboardOuter}
      >
        <View style={styles.sheetModalRoot}>
          <Animated.View style={[styles.sheetBackdropWrap, { opacity: editBackdropOpacity }]}>
            <Pressable
              style={styles.sheetBackdropDim}
              onPress={dismissEditBookSheet}
              accessibilityRole="button"
              accessibilityLabel="Dismiss"
            />
          </Animated.View>
          <Animated.View style={[styles.sheetFloating, { transform: [{ translateY: editSheetTranslateY }] }]}>
            <View style={styles.sheetPanel}>
              <SafeAreaView edges={["bottom"]} style={styles.sheetSafe}>
                <Text style={styles.sheetTitle}>Edit Book</Text>
                <Text style={styles.fieldLabel}>Title</Text>
                <TextInput
                  value={editingTitle}
                  onChangeText={setEditingTitle}
                  placeholder="Book title"
                  placeholderTextColor={colors.textSubtle}
                  style={styles.input}
                  accessibilityLabel="Book title"
                />
                <Text style={styles.fieldLabel}>Author</Text>
                <TextInput
                  value={editingAuthor}
                  onChangeText={setEditingAuthor}
                  placeholder="Optional"
                  placeholderTextColor={colors.textSubtle}
                  style={styles.input}
                  accessibilityLabel="Author name"
                />
                <TouchableOpacity style={styles.primaryButton} onPress={submitEditBook} accessibilityRole="button">
                  <Text style={styles.primaryButtonText}>Save changes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sheetCancelButton} onPress={dismissEditBookSheet} accessibilityRole="button">
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sheetDeleteLinkWrap}
                  onPress={confirmDeleteFromSheet}
                  accessibilityRole="button"
                  accessibilityLabel="Delete book"
                >
                  <Text style={styles.sheetDeleteLinkText}>Delete book</Text>
                </TouchableOpacity>
              </SafeAreaView>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <>
      <FlatList
      style={styles.list}
      data={books}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <>
          {header}
          {continueSection}
          {listIntro}
        </>
      }
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
      renderItem={({ item }) => {
        const noteCount = noteCountByBook.get(item.id) ?? 0;
        const isSystem = !!item.isSystem;

        return (
          <View style={styles.card}>
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
              </View>
            ) : (
              <Text style={styles.systemHint}>Notes land here when you delete a book.</Text>
            )}
          </View>
        );
      }}
    />
      {addBookSheet}
      {editBookSheet}
    </>
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
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: space.sm,
  },
  headerTitleColumn: {
    flex: 1,
    minWidth: 0,
  },
  addBookTopButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: space.md,
    marginTop: 2,
  },
  addBookTopButtonText: {
    color: colors.inverse,
    fontSize: 15,
    fontWeight: "600",
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
  sheetDeleteLinkWrap: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: space.md,
  },
  sheetDeleteLinkText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.danger,
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
  systemHint: {
    marginTop: space.sm,
    fontSize: 13,
    color: colors.textSubtle,
    fontStyle: "italic",
  },
  sheetKeyboardOuter: {
    flex: 1,
  },
  sheetModalRoot: {
    flex: 1,
  },
  sheetBackdropWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetBackdropDim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheetFloating: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "85%",
  },
  sheetPanel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    ...shadowCard,
  },
  sheetSafe: {
    padding: space.md,
    paddingTop: space.lg,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: space.md,
  },
  sheetCancelButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: space.xs,
  },
});
