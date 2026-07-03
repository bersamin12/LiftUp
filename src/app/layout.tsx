import type { Metadata } from "next";
import { Nunito, Bitter } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const bitter = Bitter({
  variable: "--font-bitter",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "LiftUp — Community Donation Drives",
  description: "LiftUp connects residents with unwanted items to local charity pickup drives across Singapore.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} ${bitter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
