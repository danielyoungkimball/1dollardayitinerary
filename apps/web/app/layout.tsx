import React from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "1DollarDayItinerary",
  description: "Get a custom day itinerary for any city for just $1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen">
        {children}
      </body>
    </html>
  );
} 