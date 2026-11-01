import { connection, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { isAdminClientConfigured } from "@/lib/supabase/admin";
import { buildExport } from "@/lib/research/export";

export async function GET() {
  await connection(); // always per-request: never prerendered or cached
  const user = await getCurrentUser();
  // Same response for signed-out and non-admin users so the route's existence isn't revealed.
  if (!user || !user.roles.includes("admin")) return new NextResponse("Not found", { status: 404 });
  if (!isAdminClientConfigured()) return new NextResponse("Not configured", { status: 503 });

  const { jsonl, rows } = await buildExport();
  console.log(`[mira] research export downloaded: rows=${rows}`); // no content, no identities
  return new NextResponse(jsonl, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Content-Disposition": `attachment; filename="mira-research-${new Date().toISOString().slice(0, 10)}.jsonl"`,
      "Cache-Control": "no-store",
    },
  });
}
