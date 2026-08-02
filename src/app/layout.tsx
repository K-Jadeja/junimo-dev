import type { Metadata, Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

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
  colorScheme: "light",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={instrumentSans.variable}>{children}</body>
    </html>
  );
}
