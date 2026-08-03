import type { Metadata, Viewport } from "next";
import { PageTransition } from "@/components/page-transition";
import "./globals.css";

export const metadata: Metadata = {
  title: "Krishnasinh Jadeja - Founding Engineer",
  description: "Krishnasinh Jadeja is a founding engineer working across AI products, real-time systems and media infrastructure.",
  metadataBase: new URL("https://junimo.dev"),
  openGraph: {
    title: "Krishnasinh Jadeja - Founding Engineer",
    description: "Founding engineer working across AI products, real-time systems and media infrastructure.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark light",
  themeColor: "#0d0e0d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><PageTransition>{children}</PageTransition></body>
    </html>
  );
}
