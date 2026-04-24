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

/**
 * Writes markdown under the chosen vault root and optional subfolder path.
 * On iOS, access to a previously picked folder may stop after the app restarts; pick the folder again if save fails.
 */
export async function saveNoteToVault(params: {
  vaultRootUri: string;
  vaultSubfolder: string;
  markdown: string;
  createdAt: string;
  bookTitle?: string | null;
}): Promise<boolean> {
  const vaultRootUri = params.vaultRootUri.trim();
  if (!vaultRootUri) {
    Alert.alert("Vault", "Choose a vault folder under History first.");
    return false;
  }

  const relative = buildRelativeNotePath(params.vaultSubfolder, params.createdAt, params.bookTitle);
  const segments = relative.split("/").filter(Boolean);
  if (segments.length === 0) {
    Alert.alert("Vault", "Could not build a file name for this note.");
    return false;
  }

  const fileName = segments[segments.length - 1]!;
  const dirSegments = segments.slice(0, -1);

  try {
    let dir = resolveVaultRoot(vaultRootUri);
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
      `${message}\n\nIf you recently restarted the app, choose the vault folder again (iOS limits access to the last picked folder for one session).`
    );
    return false;
  }
}
