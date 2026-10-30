import type { CrisisContact } from "@/lib/chat/queries";

export function CrisisContactList({ contacts }: { contacts: CrisisContact[] }) {
  if (contacts.length === 0) {
    return (
      <p>
        No verified crisis contacts have been published yet. Please contact your local emergency
        services or go to the nearest emergency department.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {contacts.map((c) => (
        <li key={c.id}>
          <span className="font-semibold">{c.label}:</span>{" "}
          <a className="underline" href={`tel:${c.phone.replace(/[^+\d]/g, "")}`}>{c.phone}</a>
          {c.notes && <span className="text-muted"> ({c.notes})</span>}
        </li>
      ))}
    </ul>
  );
}
