import { SITE, PLANS } from "@/config/site";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { PlanCard } from "@/components/site/PlanCard";

const HOW = [
  { t: "Say what is on your mind", d: "Type, or speak if that is easier. Start wherever feels comfortable." },
  { t: "Explore your options", d: "Mira helps you find resources, trusted people and appropriate support." },
  { t: "Reach a human when ready", d: "Request human support, and in time, verified counsellors and psychologists." },
];

const ACCESS = [
  "Voice input and read-aloud responses",
  "Adjustable text size and clear contrast",
  "Keyboard and screen-reader friendly navigation",
  "Plain language, short paragraphs",
];

export default function Home() {
  return (
    <>
      <section className="bg-brand-soft">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
            {SITE.tagline}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted md:text-xl">{SITE.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/talk">Start a Conversation</ButtonLink>
            <ButtonLink href="/professionals" variant="secondary">Find Human Support</ButtonLink>
          </div>
          <div className="mt-8 max-w-2xl">
            <Alert tone="warning" title="Early preview">
              Mira is being built in stages. The AI chat and human support features are not live
              yet, and Mira is not an emergency service.
            </Alert>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="how">
        <h2 id="how" className="text-3xl font-bold">How Mira works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {HOW.map((s, i) => (
            <li key={s.t}>
              <Card className="h-full">
                <p className="text-sm font-bold text-brand-strong">Step {i + 1}</p>
                <h3 className="mt-1 text-xl font-bold">{s.t}</h3>
                <p className="mt-2 text-muted">{s.d}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14" aria-labelledby="access">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 id="access" className="text-3xl font-bold">Built to be easy to use</h2>
            <p className="mt-3 text-muted">
              Mira is designed for students, graduates, working adults and older adults,
              including people who prefer speaking to typing.
            </p>
          </div>
          <ul className="space-y-2">
            {ACCESS.map((a) => (
              <li key={a} className="flex gap-2">
                <span aria-hidden="true" className="text-brand-strong">✓</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-6" aria-labelledby="plans">
        <h2 id="plans" className="text-3xl font-bold">Plans</h2>
        <p className="mt-2 text-muted">Start free. Plus and Pro are coming soon.</p>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {PLANS.map((p) => (
            <PlanCard key={p.id} plan={p} />
          ))}
        </div>
      </section>
    </>
  );
}
