/**
 * Conservative crisis-language detector. It errs on the side of showing support information.
 * It is ONE layer: the model is also instructed to handle distress, and a qualified professional
 * must review these patterns before launch. It is not a clinical tool.
 */
const CRISIS_PATTERNS: RegExp[] = [
  /\bsuicid/i,
  /\bkill(ing)? (myself|my ?self)\b/i,
  /\bend(ing)? (my|this) (own )?life\b/i,
  /\btake my (own )?life\b/i,
  /\b(want|wanna|wish|going|plan(ning)?) (to|2) die\b/i,
  /\bwish i (was|were) (dead|never born)\b/i,
  /\b(better|best) off dead\b/i,
  /\bbetter off without me\b/i,
  /\b(don'?t|do not|no longer|dont) want to (live|be alive|exist|wake up)\b/i,
  /\bno (reason|point) (to|in) (live|living|going on|being alive)\b/i,
  /\bcan'?t (go on|do this anymore|take (it|this) anymore)\b/i,
  /\bend it all\b/i,
  /\b(hurt|harm|cut|cutting|burn|burning) (myself|my ?self)\b/i,
  /\bself[- ]?harm/i,
  /\boverdos(e|ing)\b/i,
  /\b(kill|hurt|attack|stab|shoot) (him|her|them|someone|somebody|people)\b/i,
  /\b(he|she|they|someone|somebody) (?:(?:is|are|will|going to|gonna|wants?) )*(?:to )?(kill|hurt|beat|rape|abuse|attack) me\b/i,
  /\bi(?:'m| am) (being )?(abused|raped|assaulted|beaten)\b/i,
  /\bi (wan|go|want make i) (die|kill myself)\b/i,
  /\bi no wan live\b/i,
];

export function detectCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some((re) => re.test(text));
}
