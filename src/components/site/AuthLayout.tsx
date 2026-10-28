import { Card } from "@/components/ui/Card";

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <p className="mt-2 text-muted">{subtitle}</p>
      <Card className="mt-6">{children}</Card>
    </div>
  );
}
