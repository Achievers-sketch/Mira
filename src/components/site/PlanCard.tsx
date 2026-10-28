import type { Plan } from "@/config/site";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ButtonLink, Button } from "@/components/ui/Button";

export function formatPrice(plan: Plan) {
  if (plan.priceNgn === null) return "To be announced";
  if (plan.priceNgn === 0) return "₦0";
  return `₦${plan.priceNgn.toLocaleString("en-NG")}`;
}

export function PlanCard({ plan }: { plan: Plan }) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-bold">{plan.name}</h3>
        {plan.active ? <Badge tone="live">Available</Badge> : <Badge tone="soon">Coming soon</Badge>}
      </div>
      <p className="mt-2 text-muted">{plan.purpose}</p>
      <p className="mt-4 text-3xl font-extrabold">{formatPrice(plan)}</p>
      <p className="text-sm text-muted">{plan.priceNote}</p>
      <ul className="mt-5 flex-1 space-y-2">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2">
            <span aria-hidden="true" className="text-brand-strong">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        {plan.active ? (
          <ButtonLink href="/register" className="w-full">Create free account</ButtonLink>
        ) : (
          <Button variant="secondary" className="w-full" disabled aria-disabled="true">
            Coming soon
          </Button>
        )}
      </div>
    </Card>
  );
}
