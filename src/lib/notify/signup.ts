import "server-only";
import { SITE } from "@/config/site";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";

/**
 * Tells the Mira support inbox that someone registered. Deliberately contains NO personal data
 * (no name, no email, no chat content), only the time and a running total. Skipped silently when
 * no email provider key is configured. Never throws: signing up must not depend on it.
 */
export async function notifyNewRegistration(): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    let total = "unknown";
    if (isAdminClientConfigured()) {
      const { count } = await createAdminClient().from("profiles").select("id", { count: "exact", head: true });
      if (count !== null) total = String(count);
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.ALERT_EMAIL_FROM ?? "Mira <onboarding@resend.dev>",
        to: [process.env.ALERT_EMAIL_TO ?? SITE.supportEmail],
        subject: "New Mira registration",
        text: `A new person registered on Mira.\nTime (UTC): ${new Date().toISOString()}\nRegistered accounts: ${total}\n\nNo personal details are included in this alert.`,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error(`[mira] signup alert failed: status=${res.status}`);
  } catch (e) {
    console.error(`[mira] signup alert failed: ${e instanceof Error ? e.name : "error"}`);
  }
}
