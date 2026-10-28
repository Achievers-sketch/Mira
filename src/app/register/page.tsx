import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/site/AuthLayout";
import { AuthForm } from "@/components/site/AuthForm";
import { SetupNotice } from "@/components/site/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signUp } from "@/app/auth/actions";

export const metadata: Metadata = { title: "Create an account" };

export default function Register() {
  return (
    <AuthLayout title="Create your free account" subtitle="Mira Free. No payment details needed.">
      {isSupabaseConfigured() ? <AuthForm mode="register" action={signUp} /> : <SetupNotice />}
      <p className="mt-4 text-center text-sm text-muted">
        Already have an account? <Link className="font-semibold underline" href="/sign-in">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
