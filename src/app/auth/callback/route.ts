import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Email-confirmation / magic-link return point. Always redirects to a fixed internal path. */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code");
  if (!isSupabaseConfigured() || !code) return NextResponse.redirect(`${origin}/sign-in`);

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(`${origin}${error ? "/sign-in" : "/dashboard"}`);
}
