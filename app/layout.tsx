import type { Metadata } from "next";
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobPilot",
  description:
    "AI-assisted application drafting and ATS autofill for SWE internship and new-grad roles.",
};

// Sets the theme class synchronously before the page paints, so dark mode
// doesn't flash light first. Reads the user's last choice from localStorage,
// falls back to the OS preference. Kept inline because Next.js streams the
// document and any external script would arrive after first paint.
const setInitialThemeScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored === 'dark' || stored === 'light' ? stored : (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.dataset.theme = 'dark';
  } catch (_) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: setInitialThemeScript }} />
      </head>
      <body className="min-h-full">
        <ClerkProvider>
          <header className="app-topbar">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3 sm:px-8 lg:px-10">
              <Link href="/" className="app-brand">
                <span className="app-brand-mark">
                  <Logo size={22} />
                </span>
                <span className="app-brand-name">JobPilot</span>
              </Link>

              <nav className="flex items-center gap-1">
                <Show
                  when="signed-in"
                  fallback={
                    <div className="flex items-center gap-2">
                      <SignInButton mode="redirect" />
                      <SignUpButton mode="redirect" />
                      <span className="ml-2">
                        <ThemeToggle />
                      </span>
                    </div>
                  }
                >
                  <Link href="/" className="nav-link">
                    Home
                  </Link>
                  <Link href="/succeed" className="nav-link">
                    Succeed
                  </Link>
                  <Link href="/drafts" className="nav-link">
                    Drafts
                  </Link>
                  <Link href="/profile" className="nav-link">
                    Profile
                  </Link>
                  <span className="ml-2">
                    <ThemeToggle />
                  </span>
                  <span className="ml-1">
                    <UserButton />
                  </span>
                </Show>
              </nav>
            </div>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
