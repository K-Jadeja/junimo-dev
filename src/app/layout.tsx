import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { PageTransition } from "@/components/page-transition";
import { ThemePersistence } from "@/components/theme-persistence";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
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
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: [{ url: "/favicon.ico", type: "image/x-icon" }],
    apple: [{ url: "/favicon.png", type: "image/png", sizes: "512x512" }],
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
      <body className={inter.variable}>
        <ThemePersistence />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
