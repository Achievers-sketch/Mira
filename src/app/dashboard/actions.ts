"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

/** Turns the user's research consent on or off. RLS limits this to their own profile row. */
export async function setResearchConsent(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ research_consent: formData.get("consent") === "yes" })
    .eq("id", user.id);
  revalidatePath("/dashboard");
}
