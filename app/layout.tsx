import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { PostHogIdentity } from "./components/posthog-identity";
import "./globals.css";

const inter = localFont({
  src: "./fonts/InterVariable.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900"
});

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
  const xPixelId = process.env.NEXT_PUBLIC_X_PIXEL_ID?.trim() || "o6ml8";

  return (
    <html lang="en" className={inter.variable}>
      <body>
        {xPixelId && /^[a-zA-Z0-9_-]+$/.test(xPixelId) ? (
          <Script id="x-ads-pixel" strategy="beforeInteractive">
            {`!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments)},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');twq('config',${JSON.stringify(xPixelId)});`}
          </Script>
        ) : null}
        <PostHogIdentity />
        {children}
      </body>
    </html>
  );
}
