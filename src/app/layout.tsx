import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";

const vodafone = localFont({
  src: [
    { path: "../../public/fonts/VodafoneLt.ttf", weight: "300", style: "normal" },
    { path: "../../public/fonts/VodafoneRg.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/VodafoneRg_Bd.ttf", weight: "700", style: "normal" },
    { path: "../../public/fonts/VodafoneExB.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-vodafone",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Best of the Best 2026 — Votes",
  description: "Vote du public et notation du jury pour Vodacom Best of the Best 2026.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={vodafone.variable}>
      <body>{children}</body>
    </html>
  );
}
