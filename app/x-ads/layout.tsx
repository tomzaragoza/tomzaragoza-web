import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "X Ads course | Tom Zaragoza",
  description:
    "A practical course for software founders who want to plan, launch, track, and improve an X Ads campaign.",
  alternates: {
    canonical: "/x-ads"
  },
  openGraph: {
    title: "X Ads course",
    description:
      "A practical X Ads course for software founders by Tom Zaragoza.",
    url: "https://tomzaragoza.com/x-ads",
    siteName: "Tom Zaragoza",
    type: "website"
  }
};

export default function XAdsLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
