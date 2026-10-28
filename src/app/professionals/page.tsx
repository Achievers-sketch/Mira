import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/ComingSoon";

export const metadata: Metadata = { title: "Find a Professional" };

export default function Page() {
  return (
    <ComingSoon
      title="Find a Professional"
      intro="A directory of counsellors and psychologists whose qualifications have been verified, with filters for language, availability and format."
      planNote="This is part of Mira Pro, which is coming soon. No providers are listed yet."
    />
  );
}
