# Safety design (Phase 3) — needs professional review

Mira is a general wellbeing companion, not a clinical service or emergency service.

## Layers
1. **Always-visible framing:** "Mira is an AI, not a therapist or an emergency service" on the chat, footer and Safety page.
2. **Crisis-language detector** (`src/lib/chat/safety.ts`): conservative patterns for self-harm, suicide and danger (English and some Nigerian Pidgin). A match shows a prominent help banner and adds a crisis instruction to that reply's prompt. It errs toward false positives. It will miss things, so it is only one layer.
3. **System prompt** (`src/lib/ai/prompt.ts`): no diagnosis, no medication advice, no claiming to be a therapist, no invented providers/numbers/bookings, no self-harm methods, plain supportive style, treats user text as untrusted.
4. **Verified crisis contacts only:** shown only if an administrator verified and activated them (database policy). None are published yet. The model is told never to quote phone numbers.
5. **Honest product facts:** the model may only say Free is live and Plus/Pro/human sessions are coming soon.
6. **Privacy:** chat rows are readable only by their owner (even admins cannot read them); only server code writes them; users can delete their conversations. Usage is counted separately so deleting chats does not reset limits.

## Provider data terms
Messages are sent to the chosen AI provider (Groq or Anthropic). Free tiers of some providers may retain or train on data. Check the provider's current terms and make sure Mira's privacy page describes them accurately before launch.

## Known limits
- Detector is keyword-based; it can be evaded and can misfire.
- English/Pidgin only so far; other languages are not covered.
- No human monitoring of conversations. Mira cannot send help to anyone.
- Retention: chats are kept until the user deletes them. An automatic retention period is not implemented yet.
- Model behaviour is not guaranteed; the prompt reduces but does not eliminate bad replies.

## Before launch
A qualified professional should review the prompt, detector patterns, banner wording and escalation approach, and administrators must verify real crisis contacts for each launch country.
