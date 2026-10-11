import type { Metadata } from "next";
import Link from "next/link";
import { Github, ArrowUpRight } from "lucide-react";
import { Host_Grotesk } from "next/font/google";
import "./globals.css";

const grotesk = Host_Grotesk({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-host-grotesk",
});

export const metadata: Metadata = {
  title: "Hover — Time to connect with yourself",
  description: "Select a place, leave your phone at your desk, and make room to notice the world again.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={grotesk.variable}>
      <body>
        <div className="site-shell">
          <header className="site-header">
            <Link href="/" className="wordmark" aria-label="Hover home">hover<span className="wordmark-period">.</span></Link>
            <nav className="site-nav" aria-label="Main navigation">
              <span className="nav-placeholder" aria-disabled="true" title="GitHub link coming soon"><Github size={17} aria-hidden="true" /> GitHub</span>
              <Link href="/#how-it-works">How it works</Link>
              <span className="nav-placeholder" aria-disabled="true" title="Dev blog link coming soon">Dev blog <ArrowUpRight size={15} aria-hidden="true" /></span>
            </nav>
          </header>
          {children}
          <footer className="site-footer">
            <span>© Hover. A little room to notice.</span>
            <span>Leave the screen. Come back with a story.</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
