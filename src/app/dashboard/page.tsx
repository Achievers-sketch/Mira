import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/dal";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Suspense fallback={<Spinner label="Loading your dashboard" />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  const user = await requireUser();
  const e = user.entitlements;

  return (
    <>
      <h1 className="text-3xl font-extrabold">
        Welcome{user.displayName ? `, ${user.displayName}` : ""}
      </h1>
      <p className="mt-1 text-muted">{user.email}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold">Your plan</h2>
          <p className="mt-2">
            <Badge tone="live">Mira {e.plan.charAt(0).toUpperCase() + e.plan.slice(1)}</Badge>
          </p>
          <ul className="mt-4 space-y-1 text-muted">
            <li>AI chat: {e.aiChat ? "included (opens in the next update)" : "not included"}</li>
            <li>
              Monthly AI message limit:{" "}
              {e.monthlyAiMessageLimit === null ? "not set" : e.monthlyAiMessageLimit}
            </li>
            <li>Human support sessions: {e.humanSupportSessionsPerMonth} per month</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Account roles</h2>
          <p className="mt-2 flex flex-wrap gap-2">
            {user.roles.length === 0 ? (
              <span className="text-muted">None</span>
            ) : (
              user.roles.map((r) => (
                <Badge key={r} tone="neutral">
                  {r.replace("_", " ")}
                </Badge>
              ))
            )}
          </p>
          <p className="mt-4 text-sm text-muted">Roles are separate from plans and can only be changed by an administrator.</p>
        </Card>
      </div>

      {e.planNotYetAvailable && (
        <div className="mt-6">
          <Alert tone="warning" title="Your plan isn't available yet">
            Plus and Pro are coming soon, so you have Free access for now.
          </Alert>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/talk">Talk to Mira</ButtonLink>
        <ButtonLink href="/safety" variant="secondary">Safety information</ButtonLink>
      </div>
    </>
  );
}
