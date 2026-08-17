import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import "@yami/design-system/styles/fonts.css";
import "@yami/design-system/tokens.css";
import "./globals.css";

const yamiFont = localFont({
  src: [
    { path: "../../../packages/design-system/assets/fonts/GT-Walsheim-Regular.woff2", weight: "400" },
    { path: "../../../packages/design-system/assets/fonts/GT-Walsheim-Medium.woff2", weight: "500" },
    { path: "../../../packages/design-system/assets/fonts/GT-Walsheim-Bold.woff2", weight: "700" },
  ],
  variable: "--font-yami",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TOPIC GENERATOR",
  description: "Analyze a shopping keyword and generate an evidence-backed Topic page plan.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" className={yamiFont.variable}>
      <body>{children}</body>
    </html>
  );
}
