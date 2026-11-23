import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { SiteFooter } from "../components/site-footer.tsx";
import { SiteHeader } from "../components/site-header.tsx";
import { copy } from "../content/copy.ts";
import { siteName } from "../content/site.ts";
import "./globals.css";

// Self-hosted at build time by next/font: no request to a font host from the visitor's browser.
const display = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-display",
});
const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-body" });
const code = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-code" });

export const metadata: Metadata = {
  title: { default: copy.meta.title, template: `%s · ${siteName}` },
  description: copy.meta.description,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f2ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1013" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${code.variable}`}>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter year={new Date().getUTCFullYear()} />
      </body>
    </html>
  );
}
