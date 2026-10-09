import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "One Tree, Two Visits",
  description: "Leave your phone behind. Visit one familiar place. Notice something new.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <header className="site-header">
            <Link href="/" className="wordmark" aria-label="One Tree, Two Visits home">
              <span className="wordmark-symbol" aria-hidden="true">◉</span>
              <span>one tree<span className="wordmark-comma">,</span> two visits</span>
            </Link>
            <span className="header-note">A small ritual for noticing</span>
          </header>
          {children}
          <footer className="site-footer">
            <span>Made for moments without a feed.</span>
            <span>Listen. Leave. Return.</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
