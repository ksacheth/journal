import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import GlobalErrorHandler from "@/components/GlobalErrorHandler";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Journal - Capture Your Thoughts",
  description: "A beautiful journal app to track your moods, thoughts, and daily reflections",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GlobalErrorHandler />
        {children}
      </body>
    </html>
  );
}
