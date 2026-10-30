import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * Refreshes the Supabase session cookie and redirects signed-out visitors away from private pages.
 * This is an optimistic first check only. Every protected page and action re-checks on the server
 * (see src/lib/auth/dal.ts), and the database enforces Row Level Security.
 */
export async function proxy(request: NextRequest) {
  const cfg = getSupabaseConfig();
  let response = NextResponse.next({ request });
  if (!cfg) return response;

  const supabase = createServerClient(cfg.url, cfg.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  if (!data.user && (path.startsWith("/dashboard") || path.startsWith("/talk"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (data.user && (path === "/sign-in" || path === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/talk/:path*", "/sign-in", "/register"],
};
