import {
  ExpoSpeechRecognitionModule,
  TaskHintIOS,
} from "expo-speech-recognition";
import { Platform } from "react-native";

function normalizeFileUri(uri: string): string {
  const trimmed = uri.trim();
  if (trimmed.startsWith("file://")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return `file://${trimmed}`;
  }
  return trimmed;
}

function transcribeFileWithSpeechRecognition(
  uri: string,
  requiresOnDeviceRecognition: boolean
): Promise<string> {
  return new Promise((resolve, reject) => {
    const finalParts: string[] = [];
    let latestPartial = "";
    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const subscriptions: { remove: () => void }[] = [];

    const clearTimer = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const cleanup = () => {
      clearTimer();
      subscriptions.forEach((s) => s.remove());
      subscriptions.length = 0;
    };

    const finish = (text: string) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {
        /* ignore */
      }
      const trimmed = text.trim();
      if (!trimmed) {
        reject(
          new Error(
            "No speech detected in this recording. Try again, speak a bit longer, or check the microphone."
          )
        );
        return;
      }
      resolve(trimmed);
    };

    const fail = (message: string) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {
        /* ignore */
      }
      reject(new Error(message));
    };

    subscriptions.push(
      ExpoSpeechRecognitionModule.addListener("result", (ev) => {
        const t = ev.results[0]?.transcript ?? "";
        if (ev.isFinal && t) {
          finalParts.push(t);
        } else if (!ev.isFinal && t) {
          latestPartial = t;
        }
      })
    );

    subscriptions.push(
      ExpoSpeechRecognitionModule.addListener("error", (ev) => {
        if (ev.error === "aborted") {
          return;
        }
        fail(ev.message || ev.error);
      })
    );

    subscriptions.push(
      ExpoSpeechRecognitionModule.addListener("end", () => {
        const combined =
          finalParts.length > 0 ? finalParts.join(" ") : latestPartial;
        finish(combined);
      })
    );

    timeoutId = setTimeout(() => {
      fail("Speech recognition timed out.");
    }, 180_000);

    try {
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: true,
        requiresOnDeviceRecognition,
        addsPunctuation: true,
        iosTaskHint: TaskHintIOS.dictation,
        audioSource: { uri },
      });
    } catch (e) {
      fail(e instanceof Error ? e.message : String(e));
    }
  });
}

export async function transcribeAudio(audioUri: string): Promise<string> {
  if (Platform.OS !== "ios") {
    throw new Error(
      "Automatic transcription is only available on iOS. Use the Review tab to type or paste your note on this platform."
    );
  }

  const uri = normalizeFileUri(audioUri);

  const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  if (!perm.granted) {
    throw new Error(
      "Speech recognition or microphone access was denied. Enable both in Settings → Book Notes Voice."
    );
  }

  const onDeviceSupported =
    ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();

  if (onDeviceSupported) {
    try {
      return await transcribeFileWithSpeechRecognition(uri, true);
    } catch {
      return await transcribeFileWithSpeechRecognition(uri, false);
    }
  }

  return await transcribeFileWithSpeechRecognition(uri, false);
}
