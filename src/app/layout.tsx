import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE } from "@/config/site";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Suspense } from "react";
import { AuthNav, SignInLink } from "@/components/site/AuthNav";

export const metadata: Metadata = {
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-on-brand"
        >
          Skip to main content
        </a>
        <Header
          authSlot={
            <Suspense fallback={<SignInLink />}>
              <AuthNav />
            </Suspense>
          }
          authSlotMobile={
            <Suspense fallback={<SignInLink />}>
              <AuthNav />
            </Suspense>
          }
        />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
