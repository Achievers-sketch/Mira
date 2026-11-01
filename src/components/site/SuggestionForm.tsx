"use client";

import { useActionState } from "react";
import { submitSuggestion, type SuggestionState } from "@/app/feedback/actions";
import { SUGGESTION_CATEGORIES } from "@/lib/validation/suggestion";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";

export function SuggestionForm({ email }: { email: string | null }) {
  const [state, action, pending] = useActionState<SuggestionState, FormData>(submitSuggestion, {});

  if (state.ok) {
    return (
      <Alert title="Thank you">
        <span role="status">
          Your suggestion was received. It helps make Mira better for you and for others.
        </span>
      </Alert>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message && <Alert tone="error">{state.message}</Alert>}

      <div className="space-y-1.5">
        <label htmlFor="category" className="block font-semibold">What is it about?</label>
        <select
          id="category"
          name="category"
          defaultValue={state.values?.category ?? ""}
          aria-invalid={state.errors?.category ? true : undefined}
          className="min-h-11 w-full rounded-lg border-2 border-border bg-surface px-3 py-2 text-base"
          required
        >
          <option value="" disabled>Choose one…</option>
          {SUGGESTION_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        {state.errors?.category && <p className="text-sm font-semibold text-danger">{state.errors.category}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="message" className="block font-semibold">Your suggestion</label>
        <textarea
          id="message"
          name="message"
          rows={6}
          maxLength={1000}
          defaultValue={state.values?.message}
          aria-invalid={state.errors?.message ? true : undefined}
          aria-describedby="message-hint"
          className="w-full rounded-lg border-2 border-border bg-surface px-3 py-2 text-base"
          required
        />
        <p id="message-hint" className="text-sm text-muted">
          Please don&apos;t include your health details or anyone else&apos;s personal information. For
          urgent help, use the Safety page instead.
        </p>
        {state.errors?.message && <p className="text-sm font-semibold text-danger">{state.errors.message}</p>}
      </div>

      <label className="flex items-start gap-3">
        <input type="checkbox" name="followUp" defaultChecked={state.values?.followUp} className="mt-1 size-5" />
        <span>
          You may contact me about this suggestion
          {email ? <span className="block text-sm text-muted">We&apos;d use {email}.</span> : null}
        </span>
      </label>

      <Button type="submit" disabled={pending}>
        {pending ? <Spinner label="Sending" /> : "Send suggestion"}
      </Button>
    </form>
  );
}
