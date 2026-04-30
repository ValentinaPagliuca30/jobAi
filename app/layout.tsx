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
import { SidebarNav } from "@/components/sidebar-nav";
import { buttonClasses } from "@/components/ui/button";
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
      <body className="min-h-full bg-background text-foreground">
        <ClerkProvider>
          <Show
            when="signed-in"
            fallback={
              <div className="flex min-h-screen flex-col">
                <header className="border-b border-border">
                  <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
                    <Link href="/" className="flex flex-col">
                      <span className="text-sm font-semibold tracking-tight">
                        JobPilot
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Save your profile once. Reuse it for every application.
                      </span>
                    </Link>
                    <div className="flex items-center gap-2">
                      <SignInButton mode="redirect">
                        <button className={buttonClasses("ghost", "sm")}>
                          Sign in
                        </button>
                      </SignInButton>
                      <SignUpButton mode="redirect">
                        <button className={buttonClasses("default", "sm")}>
                          Sign up
                        </button>
                      </SignUpButton>
                    </div>
                  </div>
                </header>
                <main className="flex-1">{children}</main>
              </div>
            }
          >
            <div className="flex min-h-screen">
              <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
                <div className="flex h-14 items-center border-b border-border px-4">
                  <Link href="/" className="flex flex-col">
                    <span className="text-sm font-semibold tracking-tight">
                      JobPilot
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Apply once, reuse everywhere
                    </span>
                  </Link>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  <SidebarNav />
                </div>
                <div className="border-t border-border p-3">
                  <UserButton
                    appearance={{ elements: { rootBox: "w-full" } }}
                  />
                </div>
              </aside>
              <div className="flex flex-1 flex-col">
                <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
                  <Link href="/" className="text-sm font-semibold">
                    JobPilot
                  </Link>
                  <UserButton />
                </header>
                <main className="flex-1">{children}</main>
              </div>
            </div>
          </Show>
        </ClerkProvider>
      </body>
    </html>
  );
}
