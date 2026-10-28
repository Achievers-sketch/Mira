import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resolveEntitlements, type Entitlements } from "@/lib/entitlements";

export type Role = "user" | "peer_supporter" | "professional" | "admin";

export interface CurrentUser {
  id: string;
  email: string | null;
  displayName: string;
  roles: Role[];
  entitlements: Entitlements;
}

/** Verified user (asks Supabase Auth, not just the cookie). Returns null if signed out or unconfigured. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const uid = data.user.id;

  const [profile, roles, sub, freePlan] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", uid).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", uid),
    supabase
      .from("subscriptions")
      .select("plan_id,status")
      .eq("user_id", uid)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("plans")
      .select("id,active,monthly_ai_message_limit,monthly_human_sessions")
      .eq("id", "free")
      .maybeSingle(),
  ]);

  const planRow = sub.data
    ? (
        await supabase
          .from("plans")
          .select("id,active,monthly_ai_message_limit,monthly_human_sessions")
          .eq("id", sub.data.plan_id)
          .maybeSingle()
      ).data
    : null;

  return {
    id: uid,
    email: data.user.email ?? null,
    displayName: profile.data?.display_name ?? "",
    roles: (roles.data ?? []).map((r) => r.role as Role),
    entitlements: resolveEntitlements(sub.data ?? null, planRow ?? null, freePlan.data ?? null),
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requireRole(role: Role): Promise<CurrentUser> {
  const user = await requireUser();
  if (!user.roles.includes(role)) redirect("/dashboard");
  return user;
}
