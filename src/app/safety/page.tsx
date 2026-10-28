import type { Metadata } from "next";
import { SITE } from "@/config/site";
import { Alert } from "@/components/ui/Alert";

export const metadata: Metadata = { title: "Safety" };

export default function Safety() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <h1 className="text-4xl font-extrabold">Safety</h1>

      <Alert tone="warning" title="If you may be in immediate danger">
        Contact your local emergency services now, or go to the nearest emergency department.
        If you can, tell someone you trust where you are and how you feel.
      </Alert>

      <section>
        <h2 className="text-2xl font-bold">Crisis contacts</h2>
        <p className="mt-2">
          Mira will list crisis lines and emergency contacts here once each one has been checked
          and approved by a Mira administrator. We do not display numbers we have not verified.
          This list is not yet published.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold">What Mira is and is not</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Mira offers general, non-clinical wellbeing support and information.</li>
          <li>Mira does not diagnose, prescribe medication or replace professional care.</li>
          <li>Mira is not an emergency service and cannot send help to your location.</li>
          <li>The AI can make mistakes. It will not be the only support we point you to.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Human support and verification</h2>
        <p className="mt-2">
          Peers, mentors, counsellors and psychologists are different roles. A provider is only
          shown as verified after a Mira administrator has reviewed their qualifications. Peer
          supporters are never presented as qualified mental-health professionals unless that is
          verified.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Safeguarding</h2>
        <p className="mt-2">
          Mira will operate central safeguarding policies, with reporting, moderation and
          escalation procedures. Safety information is never placed behind a paywall.
        </p>
      </section>

      <p>
        Questions or concerns about safety on Mira:{" "}
        <a className="font-semibold underline" href={`mailto:${SITE.supportEmail}`}>
          {SITE.supportEmail}
        </a>
        . This address is not monitored for emergencies.
      </p>
    </div>
  );
}
