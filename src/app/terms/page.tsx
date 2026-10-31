import type { Metadata } from "next";
import { SITE } from "@/config/site";

export const metadata: Metadata = { title: "Terms" };

export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <h1 className="text-4xl font-extrabold">Terms of use</h1>
      <p className="text-sm text-muted">Draft terms, being finalised with legal review.</p>

      <section>
        <h2 className="text-2xl font-bold">Using Mira</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Mira provides general wellbeing support, not medical, psychological or emergency care.</li>
          <li>AI responses may be inaccurate and should not be relied on for clinical decisions.</li>
          <li>Human support providers are independent of the AI assistant and are shown with their verified role.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Plans and payments</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Plan features, prices and limits may change and will be shown before you pay.</li>
          <li>Subscription fees and consultation fees are separate unless a plan clearly says otherwise.</li>
          <li>Cancellation and refund rules will be published before paid features open.</li>
        </ul>
      </section>

      <p>
        Questions:{" "}
        <a className="font-semibold underline" href={`mailto:${SITE.supportEmail}`}>
          {SITE.supportEmail}
        </a>
      </p>
    </div>
  );
}
