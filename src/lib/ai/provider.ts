import "server-only";
import type { ModelClient } from "@/lib/chat/service";
import { createModelClient as createAnthropicClient, isAnthropicConfigured } from "./anthropic";
import { createGroqClient, isGroqConfigured } from "./groq";

export type AiProvider = "groq" | "anthropic";

/**
 * Picks the AI provider. AI_PROVIDER ("groq" | "anthropic") wins if it is set and configured;
 * otherwise falls back to whichever provider has a key. Returns null if neither is configured.
 */
export function getProvider(): AiProvider | null {
  const wanted = (process.env.AI_PROVIDER || "").toLowerCase();
  if (wanted === "groq") return isGroqConfigured() ? "groq" : null;
  if (wanted === "anthropic") return isAnthropicConfigured() ? "anthropic" : null;
  if (isGroqConfigured()) return "groq";
  if (isAnthropicConfigured()) return "anthropic";
  return null;
}

export function isAiConfigured() {
  return getProvider() !== null;
}

export function createModelClient(): ModelClient {
  const provider = getProvider();
  if (provider === "groq") return createGroqClient();
  if (provider === "anthropic") return createAnthropicClient();
  throw new Error("No AI provider configured");
}
