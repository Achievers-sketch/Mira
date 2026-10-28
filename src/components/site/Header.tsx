"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV } from "@/config/site";
import { cn } from "@/components/ui/cn";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const linkClass = (href: string) =>
    cn(
      "block rounded-lg px-3 py-2 font-medium hover:bg-brand-soft",
      pathname === href && "bg-brand-soft text-brand-strong",
    );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-2xl font-extrabold tracking-tight text-brand-strong">
          Mira
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={linkClass(item.href)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/sign-in"
            className="ml-2 inline-flex min-h-11 items-center rounded-full bg-brand px-5 font-semibold text-on-brand hover:bg-brand-strong"
          >
            Sign In
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-lg border-2 border-border px-4 font-semibold lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close menu" : "Menu"}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Main mobile"
          className="border-t border-border px-4 pb-4 lg:hidden"
        >
          <ul className="mt-2 space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={linkClass(item.href)}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/sign-in"
                className={linkClass("/sign-in")}
                onClick={() => setOpen(false)}
              >
                Sign In
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
