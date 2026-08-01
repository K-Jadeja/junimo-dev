import type { Metadata, Viewport } from "next";
import { DM_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Krishnasinh Jadeja — Founding Engineer",
  description: "Krishnasinh Jadeja is a Founding Engineer building ambitious AI products from interface to infrastructure.",
  metadataBase: new URL("https://krishnasinh-jadeja.dev"),
  openGraph: {
    title: "Krishnasinh Jadeja — Founding Engineer",
    description: "Building ambitious AI products from interface to infrastructure.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
  themeColor: "#f3f1ea",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${instrumentSans.variable} ${dmMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
