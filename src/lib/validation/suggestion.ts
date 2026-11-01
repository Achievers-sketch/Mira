import { z } from "zod";

export const SUGGESTION_CATEGORIES = [
  { value: "tone", label: "How Mira talks to me" },
  { value: "safety", label: "Safety and crisis support" },
  { value: "features", label: "Something Mira should be able to do" },
  { value: "voice", label: "Voice and accessibility" },
  { value: "privacy", label: "Privacy" },
  { value: "other", label: "Something else" },
] as const;

export const suggestionSchema = z.object({
  category: z.enum(SUGGESTION_CATEGORIES.map((c) => c.value) as [string, ...string[]], {
    message: "Choose what your suggestion is about.",
  }),
  message: z
    .string()
    .trim()
    .min(10, "Please write at least 10 characters.")
    .max(1000, "Please keep it to 1000 characters or fewer."),
  followUp: z.boolean(),
});
