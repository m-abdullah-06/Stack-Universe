import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { NextAuthProvider } from "@/components/providers/NextAuthProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stack Universe | Every Developer Has a Universe",
  description:
    "Transform any GitHub profile into a living 3D solar system. Explore the multiverse of developers.",
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    title: "Stack Universe",
    description: "Your GitHub profile as a solar system",
    type: "website",
  },
  verification: {
    google: "7EMfk7sLyyutvyQC6o0Ejle8S7xUKp8imFqLkRotVP4",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="scanlines bg-space-black overflow-hidden font-mono">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-ZGTB120103"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-ZGTB120103');
          `}
        </Script>
        <NextAuthProvider>{children}</NextAuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
