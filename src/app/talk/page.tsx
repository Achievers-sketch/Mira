import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/ComingSoon";

export const metadata: Metadata = { title: "Talk to Mira" };

export default function Page() {
  return (
    <ComingSoon
      title="Talk to Mira"
      intro="A place to talk through stress, studies, work, relationships, sleep or anything on your mind, by typing or speaking."
      planNote="AI chat is part of Mira Free and is the next feature being built."
    />
  );
}
