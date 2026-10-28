import { FEATURE_FLAGS, type PlanId } from "@/config/site";

export interface Entitlements {
  plan: PlanId;
  /** True when the user's stored plan is higher than what is currently switched on. */
  planNotYetAvailable: boolean;
  aiChat: boolean;
  monthlyAiMessageLimit: number | null;
  humanSupportSessionsPerMonth: number;
  browseProfessionals: boolean;
  bookAppointments: boolean;
}

export interface PlanRow {
  id: string;
  active: boolean;
  monthly_ai_message_limit: number | null;
  monthly_human_sessions: number;
}

export interface SubscriptionRow {
  plan_id: string;
  status: string;
}

const FREE: Omit<Entitlements, "planNotYetAvailable"> = {
  plan: "free",
  aiChat: true,
  monthlyAiMessageLimit: null,
  humanSupportSessionsPerMonth: 0,
  browseProfessionals: false,
  bookAppointments: false,
};

function isPlanId(v: string): v is PlanId {
  return v === "free" || v === "plus" || v === "pro";
}

/**
 * Pure function: turns stored subscription + plan data into what the user may do.
 * Fails closed: unknown/inactive/non-active subscriptions get Free. A plan whose feature
 * flag is off is never granted, even if a row says otherwise.
 */
export function resolveEntitlements(
  subscription: SubscriptionRow | null,
  plan: PlanRow | null,
  freePlan: PlanRow | null,
  flags: Record<PlanId, boolean> = FEATURE_FLAGS,
): Entitlements {
  const base = {
    ...FREE,
    monthlyAiMessageLimit: freePlan?.monthly_ai_message_limit ?? null,
    planNotYetAvailable: false,
  };

  if (!subscription || !plan || subscription.status !== "active") return base;
  if (!isPlanId(plan.id) || plan.id !== subscription.plan_id) return base;
  if (plan.id === "free") return base;

  if (!flags[plan.id] || !plan.active) {
    return { ...base, planNotYetAvailable: true };
  }

  return {
    plan: plan.id,
    planNotYetAvailable: false,
    aiChat: true,
    monthlyAiMessageLimit: plan.monthly_ai_message_limit,
    humanSupportSessionsPerMonth: plan.monthly_human_sessions,
    browseProfessionals: true,
    bookAppointments: plan.id === "pro" || plan.monthly_human_sessions > 0,
  };
}
