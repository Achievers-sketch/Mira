import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/site/AuthLayout";
import { AuthForm } from "@/components/site/AuthForm";
import { SetupNotice } from "@/components/site/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signIn } from "@/app/auth/actions";

export const metadata: Metadata = { title: "Sign In" };

export default function SignIn() {
  return (
    <AuthLayout title="Sign in" subtitle="Welcome back.">
      {isSupabaseConfigured() ? <AuthForm mode="sign-in" action={signIn} /> : <SetupNotice />}
      <p className="mt-4 text-center text-sm text-muted">
        New to Mira? <Link className="font-semibold underline" href="/register">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
