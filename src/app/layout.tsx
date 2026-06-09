import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Bowlby_One } from "next/font/google";

import "./globals.css";
import "flag-icons/css/flag-icons.min.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bowlbyOne = Bowlby_One({
  variable: "--font-bowlby-one",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Polla Mundialista Anbus 2026",
  description: "Polla Mundialista Anbus 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bowlbyOne.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
