import { Directory, File } from "expo-file-system";

import { rememberVaultDirectoryFromPicker } from "./saveNoteToVault";

const PROBE_PREFIX = ".book-notes-voice-write-probe";

/**
 * Confirms the directory exists and can be written (tiny temp file, then removed).
 */
export async function validateVaultDirectoryWritable(
  dir: Directory
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!dir.exists) {
    return {
      ok: false,
      message:
        "That folder isn’t available or couldn’t be opened. Try another folder, or use Browse → iCloud Drive (or On My iPhone for local-only notes).",
    };
  }

  const probeFile = new File(dir, `${PROBE_PREFIX}-${Date.now()}.tmp`);
  try {
    probeFile.create({ overwrite: true });
    probeFile.write("ok");
    probeFile.delete();
    return { ok: true };
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    try {
      if (probeFile.exists) {
        probeFile.delete();
      }
    } catch {
      // best-effort cleanup
    }
    return {
      ok: false,
      message:
        detail ||
        "Could not write to that folder. Pick a folder you can edit (for example under iCloud Drive or On My iPhone), then try again.",
    };
  }
}

export type PickVaultDirectoryResult =
  | { kind: "picked"; directory: Directory }
  | { kind: "cancelled" }
  | { kind: "invalid"; message: string };

/**
 * Opens the system folder picker, validates access + optional write probe, then
 * registers the directory for session-scoped vault saves.
 */
export async function pickVaultDirectoryWithValidation(): Promise<PickVaultDirectoryResult> {
  let picked: Directory;
  try {
    picked = await Directory.pickDirectoryAsync();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const lower = message.toLowerCase();
    if (lower.includes("cancel") || lower.includes("canceled") || lower.includes("cancelled")) {
      return { kind: "cancelled" };
    }
    return { kind: "invalid", message: message || "Could not open the folder picker." };
  }

  const validated = await validateVaultDirectoryWritable(picked);
  if (!validated.ok) {
    return { kind: "invalid", message: validated.message };
  }

  rememberVaultDirectoryFromPicker(picked);
  return { kind: "picked", directory: picked };
}
