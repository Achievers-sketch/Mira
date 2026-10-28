import Link from "next/link";
import { SITE } from "@/config/site";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="text-xl font-extrabold text-brand-strong">Mira</p>
          <p className="mt-2 text-muted">{SITE.tagline}</p>
          <p className="mt-3 text-sm">
            Contact:{" "}
            <a className="font-semibold underline" href={`mailto:${SITE.supportEmail}`}>
              {SITE.supportEmail}
            </a>
          </p>
        </div>
        <nav aria-label="Footer">
          <p className="font-semibold">Mira</p>
          <ul className="mt-2 space-y-1 text-muted">
            <li><Link className="hover:underline" href="/pricing">Pricing</Link></li>
            <li><Link className="hover:underline" href="/safety">Safety</Link></li>
            <li><Link className="hover:underline" href="/privacy">Privacy</Link></li>
            <li><Link className="hover:underline" href="/terms">Terms</Link></li>
          </ul>
        </nav>
        <div className="rounded-xl border-2 border-warn-border bg-warn-bg p-4 text-sm">
          <p className="font-semibold">Mira is not an emergency service.</p>
          <p className="mt-1">
            If you or someone else may be in immediate danger, contact your local emergency
            services now. See our <Link className="underline" href="/safety">safety page</Link>.
          </p>
        </div>
      </div>
      <p className="border-t border-border px-4 py-4 text-center text-sm text-muted">
        © Mira. Mira provides general wellbeing support and does not
        replace professional care.
      </p>
    </footer>
  );
}
