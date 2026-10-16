import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { isDemoMode } from "@/server/env";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Enablement Hub",
  description: "Centralized platform for AI tool selection, prompt governance, cost optimization, and adoption analytics.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const demo = isDemoMode();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-demo-mode={demo ? "true" : "false"}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
