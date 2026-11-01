"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/auth/actions";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

export function AuthForm({ mode, action }: { mode: "sign-in" | "register"; action: Action }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const register = mode === "register";

  if (state.ok) {
    return (
      <Alert title="Almost there">
        <span role="status">{state.message}</span>
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.message && <Alert tone="error">{state.message}</Alert>}
      {register && (
        <Field label="Name" name="name" autoComplete="name" defaultValue={state.values?.name} error={state.errors?.name} required />
      )}
      <Field
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        defaultValue={state.values?.email}
        error={state.errors?.email}
        required
      />
      <Field
        label="Password"
        type="password"
        name="password"
        autoComplete={register ? "new-password" : "current-password"}
        hint={register ? "At least 8 characters." : undefined}
        error={state.errors?.password}
        required
      />
      {register && (
        <label className="flex items-start gap-3">
          <input type="checkbox" name="researchConsent" className="mt-1 size-5" />
          <span>
            Optional: allow Mira to use my <strong>de-identified</strong> chats to improve the service.
            <span className="block text-sm text-muted">
              Off unless you tick it. You can withdraw any time from your dashboard.
            </span>
          </span>
        </label>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Spinner label={register ? "Creating account" : "Signing in"} /> : register ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}
