import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";

export function ComingSoon({
  title,
  intro,
  planNote,
}: {
  title: string;
  intro: string;
  planNote: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Badge tone="soon">Not live yet</Badge>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-4 text-lg text-muted">{intro}</p>
      <div className="mt-6">
        <Alert title="Status" tone="warning">
          {planNote} This page is a placeholder. Nothing here is connected to a live service yet.
        </Alert>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/pricing">See plans</ButtonLink>
        <ButtonLink href="/safety" variant="secondary">Safety information</ButtonLink>
      </div>
    </div>
  );
}
