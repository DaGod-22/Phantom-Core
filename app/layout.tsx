import type { Metadata } from "next";
import "./globals.css";
import "./extra.css";

export const metadata: Metadata = {
  title: "Phantom Core — GG Lounge",
  description: "A functional browser gaming lounge, creative lab and web hub.",
  applicationName: "Phantom Core",
  keywords: ["Phantom Core", "GG Lounge", "browser games", "creative lab"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
