import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import "./globals.css";

const yamiFont = localFont({
  src: [
    { path: "../../../packages/design-system/assets/fonts/GT-Walsheim-Regular.woff2", weight: "400" },
    { path: "../../../packages/design-system/assets/fonts/GT-Walsheim-Medium.woff2", weight: "500" },
    { path: "../../../packages/design-system/assets/fonts/GT-Walsheim-Bold.woff2", weight: "700" }
  ],
  variable: "--font-yami",
  display: "swap"
});

export const metadata: Metadata = {
  title: "YAMI Canvas",
  description: "由 AI 驱动的 YAMI 设计系统与原型制作平台"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="zh-CN" className={yamiFont.variable}><body>{children}</body></html>;
}
