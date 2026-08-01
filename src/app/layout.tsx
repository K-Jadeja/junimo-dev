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
  description: "Krishnasinh Jadeja is a Founding Engineer building ambitious AI products from interface to infrastructure.",
  metadataBase: new URL("https://krishnasinh-jadeja.dev"),
  openGraph: {
    title: "Krishnasinh Jadeja - Founding Engineer",
    description: "Building ambitious AI products from interface to infrastructure.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
  themeColor: "#fbfbf9",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={instrumentSans.variable}>{children}</body>
    </html>
  );
}
