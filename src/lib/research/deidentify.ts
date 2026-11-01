// Best-effort de-identification for research exports. This REDUCES but cannot eliminate the risk
// that free text identifies someone, so exports are admin-only, consent-gated, and never emailed.

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const URL_RE = /\bhttps?:\/\/\S+|\bwww\.\S+/gi;
// Phone-like: optional +, then 8+ digits allowing spaces, dashes, parentheses.
const PHONE = /(?<![\w])\+?\d[\d\s().-]{6,}\d(?![\w])/g;
const LONG_DIGITS = /\b\d{6,}\b/g;
const HANDLE = /(?<![\w])@[A-Za-z0-9_]{3,}/g;

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Words from the user's own name/email local part that should be masked wherever they appear. */
export function selfTokens(displayName: string, email: string | null): string[] {
  const parts = displayName.split(/\s+/);
  if (email) parts.push(email.split("@")[0]);
  return [...new Set(parts.map((p) => p.trim()).filter((p) => p.length >= 3))];
}

export function deidentify(text: string, tokens: string[] = []): string {
  let out = text
    .replace(EMAIL, "[email]")
    .replace(URL_RE, "[link]")
    .replace(HANDLE, "[handle]")
    .replace(PHONE, "[number]")
    .replace(LONG_DIGITS, "[number]");
  for (const t of tokens) {
    out = out.replace(new RegExp(`\\b${escapeRe(t)}\\b`, "gi"), "[name]");
  }
  return out;
}

/** Coarse month only (YYYY-MM) so exact times cannot be matched to a person. */
export function coarseMonth(iso: string): string {
  return iso.slice(0, 7);
}
