import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tom Zaragoza",
  description: "building things",
  metadataBase: new URL("https://tomzaragoza.com"),
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Tom Zaragoza",
    description: "building things",
    url: "https://tomzaragoza.com",
    siteName: "Tom Zaragoza",
    type: "website"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#151515" }
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
