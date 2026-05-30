import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "@/styles/globals.css";
import { AuthProvider } from "@/contexts/auth-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "RecruitAI",
  description: "AI-assisted recruitment workspace where math decides and AI explains.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${inter.variable} min-h-screen bg-neutral-50 font-sans text-neutral-900`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
