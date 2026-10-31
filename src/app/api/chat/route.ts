import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/dal";
import { isAdminClientConfigured } from "@/lib/supabase/admin";
import { isAiConfigured, createModelClient } from "@/lib/ai/provider";
import { createChatStore } from "@/lib/chat/store";
import { handleChat, MAX_MESSAGE_CHARS } from "@/lib/chat/service";

export const maxDuration = 60;

const bodySchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1).max(MAX_MESSAGE_CHARS * 2),
});

function json(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  // CSRF defence: only same-origin JSON requests.
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) {
    return json(403, "forbidden", "Cross-origin requests are not allowed.");
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json(415, "unsupported", "Send JSON.");
  }

  const user = await getCurrentUser();
  if (!user) return json(401, "unauthenticated", "Please sign in to talk to Mira.");

  if (!isAiConfigured() || !isAdminClientConfigured()) {
    return json(503, "not_configured", "Mira's AI chat isn't set up on this site yet.");
  }

  let parsed;
  try {
    parsed = bodySchema.safeParse(await request.json());
  } catch {
    return json(400, "invalid_json", "Invalid request.");
  }
  if (!parsed.success) return json(400, "invalid_message", "Invalid message.");

  const result = await handleChat(
    { store: createChatStore(), model: createModelClient() },
    user,
    parsed.data,
  );
  if (result.kind === "error") return json(result.status, result.code, result.message);

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of result.stream) controller.enqueue(encoder.encode(chunk));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Conversation-Id": result.conversationId,
      "X-Mira-Safety": result.safety,
    },
  });
}
