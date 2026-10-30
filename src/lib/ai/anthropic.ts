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
    },
  };
}
