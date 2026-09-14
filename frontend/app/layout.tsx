import type { Metadata } from "next";

import { AppShell } from "@/components/layout/AppShell";

import "./globals.css";

export const metadata: Metadata = {
  title: "PHOENIX IT HELPDESK",
  description: "Autonomous AI Agent for IT Helpdesk",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#060708]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}