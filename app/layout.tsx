import type { Metadata } from "next";
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobPilot",
  description:
    "AI-assisted application drafting and ATS autofill for SWE internship and new-grad roles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        <ClerkProvider>
          <div className="border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 sm:px-8 lg:px-10">
              <div>
                <p className="text-sm font-semibold tracking-tight text-slate-900">
                  JobPilot
                </p>
                <p className="text-xs text-slate-500">
                  Save your profile once. Reuse it for every application.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Show
                  when="signed-in"
                  fallback={
                    <>
                      <SignInButton mode="redirect" />
                      <SignUpButton mode="redirect" />
                    </>
                  }
                >
                  <div className="flex items-center gap-3">
                    <Link
                      href="/"
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/succeed"
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Succeed
                    </Link>
                    <Link
                      href="/drafts"
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Drafts
                    </Link>
                    <Link
                      href="/profile"
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Profile
                    </Link>
                    <UserButton />
                  </div>
                </Show>
              </div>
            </div>
          </div>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
