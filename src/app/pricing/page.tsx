import type { Metadata } from "next";
import { PLANS } from "@/config/site";
import { PlanCard } from "@/components/site/PlanCard";
import { Alert } from "@/components/ui/Alert";

export const metadata: Metadata = { title: "Pricing" };

const ROWS: Array<[string, string, string, string]> = [
  ["AI wellbeing chat", "Yes", "Yes", "Yes"],
  ["Voice input and read-aloud", "Yes", "Yes", "Yes"],
  ["General wellbeing resources", "Yes", "Yes", "Yes"],
  ["Peer support", "Limited / community", "Expanded access", "Expanded access"],
  ["Human support sessions", "Not included initially", "Monthly allowance", "Monthly allowance"],
  ["Professional appointments", "Browse resources", "Browse and request eligible appointments", "Verified directory and booking"],
];

export default function Pricing() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl font-extrabold">Pricing</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        Mira Free launches first. Plus and Pro are built in stages and will open later. Prices
        are not set yet and will be decided after we measure real costs.
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {PLANS.map((p) => (
          <PlanCard key={p.id} plan={p} />
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Alert title="Consultation fees are separate">
          A Pro subscription gives you access to the professional directory and booking.
          Consultation fees are paid separately, and each fee is shown before you confirm.
        </Alert>
        <Alert title="Safety information is always free">
          Crisis guidance and verified emergency contacts are never behind a paywall.
        </Alert>
      </div>

      <h2 className="mt-12 text-2xl font-bold">Compare plans</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[40rem] text-left">
          <caption className="sr-only">Feature comparison of Mira Free, Plus and Pro</caption>
          <thead>
            <tr className="border-b border-border bg-brand-soft">
              <th scope="col" className="p-3">Feature</th>
              <th scope="col" className="p-3">Free</th>
              <th scope="col" className="p-3">Plus (coming soon)</th>
              <th scope="col" className="p-3">Pro (coming soon)</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([f, a, b, c]) => (
              <tr key={f} className="border-b border-border last:border-0">
                <th scope="row" className="p-3 font-semibold">{f}</th>
                <td className="p-3">{a}</td>
                <td className="p-3">{b}</td>
                <td className="p-3">{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
