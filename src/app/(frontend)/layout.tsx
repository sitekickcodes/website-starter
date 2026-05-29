import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BotIdClient } from "botid/client";
import { PostHogProvider } from "@/components/tracking/posthog-provider";
import { cms } from "@/lib/cms";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Sitekick Starter";

// BotID-protected routes. Add your form / mutation endpoints here as you
// build them, e.g. { path: "/api/contact", method: "POST" }.
const protectedRoutes: { path: string; method: "GET" | "POST" }[] = [];

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: "A Next.js + Payload CMS starter.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { analytics } = await cms.getSiteSettings();
  const gaId = analytics.googleAnalyticsId;
  const gtmId = analytics.googleTagManagerId;
  const fbPixelId = analytics.metaPixelId;

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {protectedRoutes.length > 0 && (
          <BotIdClient protect={protectedRoutes} />
        )}
        {gtmId && <GoogleTagManager gtmId={gtmId} />}
      </head>
      <body className="antialiased">
        <PostHogProvider
          posthogKey={analytics.posthogKey}
          posthogHost={analytics.posthogHost}
        >
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:border focus:bg-background focus:px-4 focus:py-2 focus:text-sm"
          >
            Skip to content
          </a>
          <main id="main">{children}</main>
        </PostHogProvider>

        <Analytics />
        <SpeedInsights />
        {gaId && <GoogleAnalytics gaId={gaId} />}
        {fbPixelId && (
          <script
            // Meta Pixel base code — fires a PageView on load.
            dangerouslySetInnerHTML={{
              __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${fbPixelId}');fbq('track','PageView');`,
            }}
          />
        )}
      </body>
    </html>
  );
}
