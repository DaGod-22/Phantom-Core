import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GG Lounge — Phantom Core",
  description: "A game lounge, creative playground and web hub built in DaGod's style.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
