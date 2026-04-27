import React, { useCallback, useLayoutEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius, space } from "../theme/tokens";
import { NoteCreatorScreen } from "./NoteCreatorScreen";

const SHEET_SLIDE_PX = Math.min(Dimensions.get("window").height * 0.45, 480);
const WINDOW_H = Dimensions.get("window").height;
const SHEET_BODY_HEIGHT = Math.floor(WINDOW_H * 0.9);

export type NoteCreatorSheetPayload = { mode: "new" } | { mode: "edit"; noteId: string };

type NoteCreatorSheetProps = {
  creator: NoteCreatorSheetPayload;
  bookId: string;
  onFullyClosed: (reason: "dismiss" | "saved") => void;
};

const shadowCard =
  Platform.OS === "ios"
    ? {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      }
    : { elevation: 1 };

export function NoteCreatorSheet({ creator, bookId, onFullyClosed }: NoteCreatorSheetProps) {
  const closeAnimating = useRef(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SHEET_SLIDE_PX)).current;
  const hardwareBackRef = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
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
  }, [backdropOpacity, sheetTranslateY]);

  const dismissWithReason = useCallback(
    (reason: "dismiss" | "saved") => {
      if (closeAnimating.current) return;
      closeAnimating.current = true;
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
        closeAnimating.current = false;
        if (finished) {
          onFullyClosed(reason);
        }
      });
    },
    [backdropOpacity, onFullyClosed, sheetTranslateY]
  );

  const handleHardwareBack = useCallback(() => {
    const fn = hardwareBackRef.current;
    if (fn) {
      fn();
    } else {
      dismissWithReason("dismiss");
    }
  }, [dismissWithReason]);

  const sheetInner = (
    <View style={[styles.sheetPanel, shadowCard]}>
      <SafeAreaView edges={["bottom"]} style={styles.sheetSafe}>
        <View style={styles.sheetBody}>
          <NoteCreatorScreen
            layoutVariant="sheet"
            mode={creator.mode}
            noteId={creator.mode === "edit" ? creator.noteId : null}
            bookId={bookId}
            onClose={() => dismissWithReason("dismiss")}
            onSaved={() => dismissWithReason("saved")}
            onRegisterHardwareBack={(fn) => {
              hardwareBackRef.current = fn;
            }}
          />
        </View>
      </SafeAreaView>
    </View>
  );

  return (
    <Modal visible animationType="none" transparent onRequestClose={handleHardwareBack}>
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.backdropWrap, { opacity: backdropOpacity }]}>
          <Pressable
            style={styles.backdropDim}
            onPress={handleHardwareBack}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheetFloating,
            { height: SHEET_BODY_HEIGHT, transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          {Platform.OS === "ios" ? (
            <KeyboardAvoidingView
              behavior="padding"
              style={styles.sheetKeyboardAvoid}
              keyboardVerticalOffset={0}
            >
              {sheetInner}
            </KeyboardAvoidingView>
          ) : (
            <View style={styles.sheetKeyboardAvoid}>{sheetInner}</View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  sheetKeyboardAvoid: {
    flex: 1,
  },
  backdropWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropDim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheetFloating: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetPanel: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    overflow: "hidden",
  },
  sheetSafe: {
    flex: 1,
  },
  sheetBody: {
    flex: 1,
    paddingHorizontal: space.md,
    paddingTop: space.sm,
  },
});
