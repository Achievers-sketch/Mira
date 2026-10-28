import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/site/AuthLayout";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export const metadata: Metadata = { title: "Sign In" };

export default function SignIn() {
  return (
    <AuthLayout title="Sign in" subtitle="Welcome back.">
      <div className="mb-5">
        <Alert tone="warning" title="Sign-in is not live yet">
          Accounts will be enabled in the next stage of development. This form is a layout only.
        </Alert>
      </div>
      <form className="space-y-4" aria-describedby="signin-note">
        <Field label="Email" type="email" name="email" autoComplete="email" disabled />
        <Field label="Password" type="password" name="password" autoComplete="current-password" disabled />
        <Button type="submit" className="w-full" disabled>Sign in</Button>
      </form>
      <p id="signin-note" className="mt-4 text-center text-sm text-muted">
        New to Mira? <Link className="font-semibold underline" href="/register">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
