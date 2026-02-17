import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
  title: "MeetingCost - See What Your Meetings Really Cost",
  description:
    "Live meeting cost calculator. Track attendees, hourly rates and elapsed time to reveal the true price of every meeting.",
  openGraph: {
    title: "MeetingCost - See What Your Meetings Really Cost",
    description:
      "Live meeting cost calculator. Track attendees, hourly rates and elapsed time to reveal the true price of every meeting.",
    type: "website",
    url: "https://meeting-cost.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "MeetingCost - See What Your Meetings Really Cost",
    description:
      "Live meeting cost calculator. Attendees x hourly rate x time = reality check.",
  },
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
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
