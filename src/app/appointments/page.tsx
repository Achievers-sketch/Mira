import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/ComingSoon";

export const metadata: Metadata = { title: "Appointments" };

export default function Page() {
  return (
    <ComingSoon
      title="Appointments"
      intro="Book, reschedule and review your sessions, with confirmations and reminders."
      planNote="Booking is part of Mira Plus and Pro, which are coming soon."
    />
  );
}
