"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Dialog } from "@/components/ui/Dialog";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/components/ui/cn";
import { CrisisContactList } from "@/components/site/CrisisContacts";
import type { CrisisContact } from "@/lib/chat/queries";
import {
  canSpeak,
  describeRecognitionError,
  getRecognitionCtor,
  speak,
  stopSpeaking,
  type RecognitionLike,
} from "@/lib/speech/browser";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SENTINEL = "[[MIRA_ERROR]]";
const MAX = 2000;

export function ChatPanel({
  conversationId: initialId,
  initialMessages,
  crisisContacts,
  configured,
  supportEmail,
}: {
  conversationId: string | null;
  initialMessages: Msg[];
  crisisContacts: CrisisContact[];
  configured: boolean;
  supportEmail: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [conversationId, setConversationId] = useState<string | null>(initialId);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crisis, setCrisis] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Voice (browser Web Speech API). Detected after mount so server and client markup match.
  const noSubscribe = () => () => {};
  const canListen = useSyncExternalStore(noSubscribe, () => getRecognitionCtor() !== null, () => false);
  const canTalk = useSyncExternalStore(noSubscribe, canSpeak, () => false);
  const [listening, setListening] = useState(false);
  const [readAloud, setReadAloud] = useState(false);
  const recRef = useRef<RecognitionLike | null>(null);
  const baseRef = useRef("");

  useEffect(() => {
    return () => {
      recRef.current?.abort();
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  function toggleListening() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    stopSpeaking();
    setError(null);
    const rec = new Ctor();
    rec.lang = navigator.language || "en-NG";
    rec.continuous = false;
    rec.interimResults = true;
    baseRef.current = input ? input.trimEnd() + " " : "";
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setInput((baseRef.current + text).slice(0, MAX));
    };
    rec.onerror = (e) => {
      if (e.error !== "aborted") setError(describeRecognitionError(e.error));
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setError(describeRecognitionError("other"));
    }
  }

  function toggleReadAloud() {
    if (readAloud) stopSpeaking();
    setReadAloud(!readAloud);
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    recRef.current?.stop();
    stopSpeaking();
    setError(null);
    setBusy(true);
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);

    const fail = (msg: string) => {
      setError(msg);
      setMessages((m) => (m[m.length - 1]?.content === "" ? m.slice(0, -1) : m));
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conversationId ?? undefined, message: text }),
      });

      if (!res.ok) {
        let msg = "Something went wrong. Please try again.";
        try {
          msg = (await res.json()).error?.message ?? msg;
        } catch {}
        if (res.status === 401) msg = "Your session has ended. Please sign in again.";
        setInput(text);
        setMessages((m) => m.slice(0, -2));
        setError(msg);
        return;
      }

      const newId = res.headers.get("X-Conversation-Id");
      if (newId && newId !== conversationId) {
        setConversationId(newId);
        window.history.replaceState(null, "", `/talk?c=${newId}`);
      }
      if (res.headers.get("X-Mira-Safety") === "crisis") setCrisis(true);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      let broke = false;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const idx = acc.indexOf(SENTINEL);
        const shown = idx === -1 ? acc : acc.slice(0, idx).trimEnd();
        if (idx !== -1) broke = true;
        setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: shown }]);
      }
      if (broke) {
        const empty = acc.slice(0, acc.indexOf(SENTINEL)).trim() === "";
        if (empty) fail("Mira couldn't reply just now. Your message wasn't counted. Please try again.");
        else setError("Mira's reply was cut short. You can send your message again.");
      } else if (readAloud) {
        speak(acc);
      }
      router.refresh();
    } catch {
      fail("Couldn't reach Mira. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-12rem)] min-h-[28rem] flex-col rounded-2xl border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <p className="text-sm text-muted">
          Mira is an AI, not a therapist or an emergency service.
        </p>
        <Button variant="secondary" className="min-h-9 px-4 py-1 text-sm" onClick={() => setHelpOpen(true)}>
          Request human support
        </Button>
      </div>

      {crisis && (
        <div className="border-b border-border p-4">
          <Alert tone="warning" title="If you may be in danger, please get help now">
            <p className="mb-2">
              Contact your local emergency services, or reach out to someone you trust right now.
            </p>
            <CrisisContactList contacts={crisisContacts} />
          </Alert>
        </div>
      )}

      {!configured && (
        <div className="border-b border-border p-4">
          <Alert tone="warning" title="Chat isn't switched on yet">
            The AI behind Mira hasn&apos;t been connected on this site, so replies aren&apos;t available.
          </Alert>
        </div>
      )}

      <div
        role="log"
        aria-live="polite"
        aria-busy={busy}
        aria-label="Conversation with Mira"
        className="flex-1 space-y-3 overflow-y-auto p-4"
      >
        {messages.length === 0 && (
          <p className="text-muted">
            Hi, I&apos;m Mira. What&apos;s on your mind today? You can start anywhere.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5",
                m.role === "user" ? "bg-brand text-on-brand" : "bg-brand-soft",
              )}
            >
              <span className="sr-only">{m.role === "user" ? "You: " : "Mira: "}</span>
              {m.content || (busy && i === messages.length - 1 ? <Spinner label="Mira is thinking" /> : null)}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {error && (
        <div className="px-4 pb-2">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <form
        className="flex items-end gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <div className="flex-1">
          <label htmlFor="chat-input" className="sr-only">
            Message Mira
          </label>
          <textarea
            id="chat-input"
            rows={2}
            value={input}
            maxLength={MAX}
            disabled={!configured}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Type your message. Enter to send, Shift+Enter for a new line."
            className="w-full resize-none rounded-lg border-2 border-border bg-background px-3 py-2 text-base"
          />
          {input.length > MAX - 200 && (
            <p className="text-sm text-muted">
              {MAX - input.length} characters left
            </p>
          )}
        </div>
        {canListen && (
          <Button
            type="button"
            variant="secondary"
            onClick={toggleListening}
            disabled={busy || !configured}
            aria-pressed={listening}
            aria-label={listening ? "Stop voice input" : "Speak your message"}
          >
            {listening ? "Stop" : "Speak"}
          </Button>
        )}
        <Button type="submit" disabled={busy || !configured || input.trim() === ""}>
          Send
        </Button>
      </form>

      {(canListen || canTalk) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-4 py-2 text-sm text-muted">
          {canTalk && (
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={readAloud} onChange={toggleReadAloud} className="size-4" />
              Read Mira&apos;s replies aloud
            </label>
          )}
          {listening && <span role="status">Listening…</span>}
          <span>
            Voice uses your browser&apos;s speech service, which may process audio outside Mira.
            Mira never stores audio.
          </span>
        </div>
      )}

      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} title="Human support">
        <p>
          Human support sessions, peer support and professional appointments are{" "}
          <strong>coming soon</strong>. They aren&apos;t available yet, so we can&apos;t arrange them for you today.
        </p>
        <p className="mt-3">
          For general questions you can email{" "}
          <a className="font-semibold underline" href={`mailto:${supportEmail}`}>
            {supportEmail}
          </a>
          . This inbox is <strong>not monitored for emergencies</strong>.
        </p>
        <p className="mt-3">
          If you may be in danger, contact your local emergency services now.
        </p>
      </Dialog>
    </div>
  );
}
