import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/site/AuthLayout";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export const metadata: Metadata = { title: "Create an account" };

export default function Register() {
  return (
    <AuthLayout title="Create your free account" subtitle="Mira Free. No payment details needed.">
      <div className="mb-5">
        <Alert tone="warning" title="Registration is not live yet">
          Accounts will be enabled in the next stage of development. This form is a layout only.
        </Alert>
      </div>
      <form className="space-y-4">
        <Field label="Name" name="name" autoComplete="name" disabled />
        <Field label="Email" type="email" name="email" autoComplete="email" disabled />
        <Field
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          hint="At least 8 characters."
          disabled
        />
        <Button type="submit" className="w-full" disabled>Create account</Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        Already have an account? <Link className="font-semibold underline" href="/sign-in">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
