// Browser speech helpers (Web Speech API). Feature-detected: when unsupported the UI simply hides
// the voice controls and text chat keeps working. Mira's servers never receive or store audio.

interface RecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<RecognitionResultLike>;
}
export interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => RecognitionLike;

export function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Strip characters that read badly aloud (markdown marks, URLs). */
export function toSpeakable(text: string): string {
  return text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[*_`#>~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function speak(text: string): void {
  if (!canSpeak()) return;
  const clean = toSpeakable(text);
  if (!clean) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking(): void {
  if (canSpeak()) window.speechSynthesis.cancel();
}

export function describeRecognitionError(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access is blocked. Allow it in your browser settings, or type instead.";
    case "no-speech":
      return "I didn't hear anything. Try again, or type your message.";
    case "audio-capture":
      return "No microphone was found. You can type your message instead.";
    case "network":
      return "Voice input needs an internet connection. You can type instead.";
    default:
      return "Voice input stopped. You can try again or type instead.";
  }
}
