import type { Metadata } from "next";
import { SITE } from "@/config/site";
import { Alert } from "@/components/ui/Alert";

export const metadata: Metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <h1 className="text-4xl font-extrabold">Privacy</h1>
      <Alert tone="warning" title="Draft, pending legal review">
        This page describes our intended approach. It is a draft and has not yet been reviewed by
        a lawyer. It will be reviewed against applicable Nigerian data-protection requirements
        before Mira accepts real users.
      </Alert>

      <section>
        <h2 className="text-2xl font-bold">Our approach</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>We aim to collect as little personal and sensitive information as possible.</li>
          <li>Your conversations with Mira are private to your account by default.</li>
          <li>We will not share your conversations with providers or staff without your explicit, recorded consent.</li>
          <li>We do not store raw voice recordings by default.</li>
          <li>We never store raw card details. Payments will be handled by a payment provider.</li>
          <li>Retention periods and deletion options will be stated clearly before launch.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Limits of confidentiality</h2>
        <p className="mt-2">
          We cannot promise absolute confidentiality. For example, if there is a serious risk to
          someone&apos;s safety, escalation procedures may apply. We will explain these limits
          clearly before they matter.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Contact</h2>
        <p className="mt-2">
          Privacy questions:{" "}
          <a className="font-semibold underline" href={`mailto:${SITE.supportEmail}`}>
            {SITE.supportEmail}
          </a>
        </p>
      </section>
    </div>
  );
}
