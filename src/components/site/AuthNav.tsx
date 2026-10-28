import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { signOut } from "@/app/auth/actions";

const btn =
  "inline-flex min-h-11 items-center rounded-full bg-brand px-5 font-semibold text-on-brand hover:bg-brand-strong";

export function SignInLink() {
  return (
    <Link href="/sign-in" className={btn}>
      Sign In
    </Link>
  );
}

/** Streams in after the static shell: shows Dashboard/Sign out when signed in. */
export async function AuthNav() {
  const user = await getCurrentUser();
  if (!user) return <SignInLink />;
  return (
    <span className="flex items-center gap-2">
      <Link href="/dashboard" className="rounded-lg px-3 py-2 font-medium hover:bg-brand-soft">
        Dashboard
      </Link>
      <form action={signOut}>
        <button type="submit" className={btn}>
          Sign out
        </button>
      </form>
    </span>
  );
}
