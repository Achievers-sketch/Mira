import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { ModelClient } from "@/lib/chat/service";

export const DEFAULT_MODEL = "claude-sonnet-5-5";

export function isAnthropicConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function createModelClient(): ModelClient {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  return {
    async *stream({ system, messages }) {
      try {
        const stream = client.messages.stream({
          model,
          max_tokens: 700,
          system,
          messages,
        });
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            yield event.delta.text;
          }
        }
      } catch (err) {
        // Server-side diagnostics only: error type, HTTP status and the API's message.
        // Never logs the API key or the user's messages.
        const e = err as { name?: string; status?: number; message?: string };
        console.error(
          `[mira] model call failed: provider=anthropic model=${model} name=${e.name} status=${e.status} message=${String(e.message).slice(0, 300)}`,
        );
        throw err;
      }
    },
  };
}
