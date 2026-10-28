"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { registerSchema, signInSchema, toFieldErrors, type FieldErrors } from "@/lib/validation/auth";

export interface FormState {
  errors?: FieldErrors;
  message?: string;
  ok?: boolean;
  /** Echoed back so the form keeps what the user typed (never the password). */
  values?: { name?: string; email?: string };
}

const NOT_CONFIGURED: FormState = {
  message: "Accounts are not set up on this deployment yet. Please try again later.",
};

function typed(fd: FormData) {
  const str = (k: string) => (typeof fd.get(k) === "string" ? (fd.get(k) as string).slice(0, 254) : undefined);
  return { name: str("name"), email: str("email") };
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), values: typed(formData) };

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.name },
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    // Generic message: don't reveal internals or whether an email is already registered.
    return { message: "We couldn't create your account. Check your details and try again.", values: typed(formData) };
  }
  if (data.session) redirect("/dashboard");
  return { ok: true, message: "Check your email to confirm your address, then sign in." };
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), values: typed(formData) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { message: "Incorrect email or password.", values: typed(formData) };
  redirect("/dashboard");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
