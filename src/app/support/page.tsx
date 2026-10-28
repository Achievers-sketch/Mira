import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/ComingSoon";

export const metadata: Metadata = { title: "Explore Support" };

export default function Page() {
  return (
    <ComingSoon
      title="Explore Support"
      intro="Verified wellbeing resources and ways to reach a trusted person or request human support."
      planNote="Resources will only be listed once they have been checked by a Mira administrator."
    />
  );
}
