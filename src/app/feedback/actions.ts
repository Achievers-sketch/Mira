"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { suggestionSchema } from "@/lib/validation/suggestion";
import { toFieldErrors, type FieldErrors } from "@/lib/validation/auth";

export interface SuggestionState {
  ok?: boolean;
  message?: string;
  errors?: FieldErrors;
  values?: { category: string; message: string; followUp: boolean };
}

export async function submitSuggestion(_prev: SuggestionState, fd: FormData): Promise<SuggestionState> {
  const user = await requireUser();
  const values = {
    category: String(fd.get("category") ?? ""),
    message: String(fd.get("message") ?? ""),
    followUp: fd.get("followUp") === "on",
  };
  const parsed = suggestionSchema.safeParse(values);
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.from("suggestions").insert({
    user_id: user.id, // RLS also requires this to be the signed-in user
    category: parsed.data.category,
    message: parsed.data.message,
    follow_up_ok: parsed.data.followUp,
  });
  if (error) {
    const limited = error.message.includes("suggestion_limit");
    console.error(`[mira] suggestion insert failed: code=${error.code}`);
    return {
      values,
      message: limited
        ? "You've sent 5 suggestions today. Thank you! Please try again tomorrow."
        : "We couldn't save your suggestion just now. Please try again.",
    };
  }
  revalidatePath("/feedback");
  return { ok: true };
}
