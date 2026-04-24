import { Directory, File } from "expo-file-system";
import { Alert } from "react-native";

import { buildRelativeNotePath } from "./noteFilePath";

/** Last directory returned from the system picker (iOS needs this for the current session). */
let sessionVaultRoot: Directory | null = null;

export function rememberVaultDirectoryFromPicker(directory: Directory): void {
  sessionVaultRoot = directory;
}

function resolveVaultRoot(vaultRootUri: string): Directory {
  if (sessionVaultRoot?.uri === vaultRootUri) {
    return sessionVaultRoot;
  }
  return new Directory(vaultRootUri);
}

function normalizeField(value: string | null | undefined): string {
  return value?.replace(/\s+/g, " ").trim() || "";
}

/**
 * Writes markdown under the chosen vault root.
 * On iOS, access to a previously picked folder may stop after the app restarts; pick the folder again if save fails.
 */
export async function saveNoteToVault(params: {
  vaultRootUri: string;
  markdown: string;
  createdAt: string;
  bookTitle?: string | null;
  pageNumber?: string | null;
}): Promise<boolean> {
  const vaultRootUri = params.vaultRootUri.trim();
  const normalizedBookTitle = normalizeField(params.bookTitle);
  const normalizedPageNumber = normalizeField(params.pageNumber);
  if (!vaultRootUri) {
    Alert.alert("Vault", "Choose a notes folder in Settings first.");
    return false;
  }
  if (!normalizedBookTitle) {
    Alert.alert("Missing title", "Add a book title before saving to vault.");
    return false;
  }

  const relative = buildRelativeNotePath("", params.createdAt, normalizedBookTitle, normalizedPageNumber);
  const segments = relative.split("/").filter(Boolean);
  if (segments.length === 0) {
    Alert.alert("Vault", "Could not build a file name for this note.");
    return false;
  }

  const fileName = segments[segments.length - 1]!;
  const dirSegments = segments.slice(0, -1);

  try {
    let dir = resolveVaultRoot(vaultRootUri);
    if (!dir.exists) {
      sessionVaultRoot = null;
      Alert.alert(
        "Vault access expired",
        "Could not access the selected notes folder. Choose the folder again in Settings (iOS may reset folder permissions after app restart)."
      );
      return false;
    }
    for (const part of dirSegments) {
      const next = new Directory(dir, part);
      if (!next.exists) {
        next.create({ idempotent: true });
      }
      dir = next;
    }

    const outFile = new File(dir, fileName);
    outFile.create({ overwrite: true });
    outFile.write(params.markdown);

    Alert.alert("Saved", `Note saved as ${fileName}.`);
    return true;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    Alert.alert(
      "Could not save",
      `${message}\n\nIf you recently restarted the app, choose the notes folder again in Settings (iOS limits access to the last picked folder for one session).`
    );
    return false;
  }
}
