"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

/** Deletes one of the signed-in user's own conversations (messages are removed with it). */
export async function deleteConversation(formData: FormData) {
  await requireUser();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (id.success) {
    const supabase = await createClient();
    await supabase.from("conversations").delete().eq("id", id.data); // RLS: own rows only
  }
  redirect("/talk");
}
