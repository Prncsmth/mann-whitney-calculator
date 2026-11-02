import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { APP_NAME, APP_SUBTITLE } from "@/constants/app";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
/** Serif display face for headings (misty-forest theme). */
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: `${APP_SUBTITLE}. Computes ranks, U statistics, exact and asymptotic p-values, effect sizes, and a seven-step analysis in the browser.`,
};

export const viewport: Viewport = {
  themeColor: "#0d1513", // matches the dark sidebar / mobile header
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
