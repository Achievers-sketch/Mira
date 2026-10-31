/**
 * Parses an OpenAI-style streaming response (server-sent events) and yields the text deltas.
 * Pure and dependency-free so it can be unit tested. Accepts any async iterable of bytes.
 * Handles events split across network chunks (including mid-character), CRLF line endings,
 * a final event without a trailing newline, and ignores comments and malformed lines.
 */
export async function* sseTextDeltas(source: AsyncIterable<Uint8Array>): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let buffer = "";

  function parse(line: string): { done: boolean; text?: string } {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) return { done: false };
    const data = trimmed.slice(5).trim();
    if (data === "[DONE]") return { done: true };
    let json: { error?: { message?: unknown }; choices?: Array<{ delta?: { content?: unknown } }> };
    try {
      json = JSON.parse(data);
    } catch {
      return { done: false }; // partial or garbled line
    }
    if (json.error) throw new Error(String(json.error.message ?? "stream error"));
    const text = json.choices?.[0]?.delta?.content;
    return { done: false, text: typeof text === "string" && text.length > 0 ? text : undefined };
  }

  for await (const chunk of source) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const r = parse(line);
      if (r.text) yield r.text;
      if (r.done) return;
    }
  }
  buffer += decoder.decode();
  if (buffer) {
    const r = parse(buffer);
    if (r.text) yield r.text;
  }
}

/** Adapts a web ReadableStream (what fetch returns) to an async iterable of bytes. */
export async function* readableToAsyncIterable(stream: ReadableStream<Uint8Array>): AsyncGenerator<Uint8Array> {
  const reader = stream.getReader();
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return;
      if (value) yield value;
    }
  } finally {
    reader.releaseLock();
  }
}
