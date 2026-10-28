export const SITE = {
  name: "Mira",
  tagline: "Someone to talk to. Support when you need it.",
  description:
    "Explore wellbeing resources, talk with Mira, or connect with a human support provider when you're ready.",
  supportEmail: "miraaisupport@gmail.com",
  market: "Nigeria",
  currency: "NGN",
} as const;

/**
 * Feature flags. Plus and Pro are fully planned but NOT activated at launch.
 * Flip a flag to true only when the feature is built, tested and reviewed.
 * (Later phases will enforce these server-side as well; this file is display config only.)
 */
export const FEATURE_FLAGS = {
  free: true,
  plus: false,
  pro: false,
} as const;

export type PlanId = "free" | "plus" | "pro";

export interface Plan {
  id: PlanId;
  name: string;
  purpose: string;
  /** Price in NGN, or null when not yet decided. Configurable; no invented prices. */
  priceNgn: number | null;
  priceNote: string;
  features: string[];
  active: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Mira Free",
    purpose: "AI-powered first-line support, accessible to everyone.",
    priceNgn: 0,
    priceNote: "Free to use, with fair-use limits",
    features: [
      "AI wellbeing chat",
      "Voice input and read-aloud",
      "General wellbeing resources",
      "Support navigation and recommendations",
      "Limited or community-based peer support",
      "Accessibility options",
    ],
    active: FEATURE_FLAGS.free,
  },
  {
    id: "plus",
    name: "Mira Plus",
    purpose: "AI support plus access to human conversations.",
    priceNgn: null,
    priceNote: "Pricing to be announced",
    features: [
      "Everything in Free",
      "Expanded access to peer support",
      "A defined monthly allowance of human support sessions",
      "Browse and request eligible appointments",
      "Audio or video calls with confirmations and reminders",
    ],
    active: FEATURE_FLAGS.plus,
  },
  {
    id: "pro",
    name: "Mira Pro",
    purpose: "Structured appointments with verified professionals.",
    priceNgn: null,
    priceNote: "Pricing to be announced. Consultation fees are paid separately.",
    features: [
      "Everything in Plus",
      "Directory of verified counsellors and psychologists",
      "Appointment booking, rescheduling and cancellation",
      "Appointment history and reminders",
      "Consultation payments handled separately from your subscription",
    ],
    active: FEATURE_FLAGS.pro,
  },
];

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/talk", label: "Talk to Mira" },
  { href: "/support", label: "Explore Support" },
  { href: "/professionals", label: "Find a Professional" },
  { href: "/appointments", label: "Appointments" },
  { href: "/pricing", label: "Pricing" },
] as const;
