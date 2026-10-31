import "server-only";
import type { ModelClient } from "@/lib/chat/service";
import { readableToAsyncIterable, sseTextDeltas } from "./sse";

export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export function isGroqConfigured() {
  return Boolean(process.env.GROQ_API_KEY);
}

/** Groq exposes an OpenAI-compatible chat completions API. */
export function createGroqClient(): ModelClient {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;
  const baseUrl = (process.env.GROQ_BASE_URL || DEFAULT_GROQ_BASE_URL).replace(/\/+$/, "");

  return {
    async *stream({ system, messages }) {
      try {
        const res = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            stream: true,
            max_completion_tokens: 700,
            temperature: 0.6,
            messages: [{ role: "system", content: system }, ...messages],
          }),
        });
        if (!res.ok || !res.body) {
          let detail = "";
          try {
            detail = (await res.text()).slice(0, 300);
          } catch {}
          throw Object.assign(new Error(detail || res.statusText), { status: res.status });
        }
        yield* sseTextDeltas(readableToAsyncIterable(res.body));
      } catch (err) {
        // Server-side diagnostics only: never logs the API key or the user's messages.
        const e = err as { name?: string; status?: number; message?: string };
        console.error(
          `[mira] model call failed: provider=groq model=${model} name=${e.name} status=${e.status} message=${String(e.message).slice(0, 300)}`,
        );
        throw err;
      }
    },
  };
}
