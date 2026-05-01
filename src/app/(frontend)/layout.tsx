import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { draftMode } from "next/headers";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Analytics } from "@vercel/analytics/next";
import { BotIdClient } from "botid/client";
import { AutoBreadcrumbJsonLd } from "@/components/auto-breadcrumb-jsonld";
import { PostHogProvider } from "@/components/tracking/posthog-provider";
import { cms } from "@/lib/cms";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

export async function generateMetadata(): Promise<Metadata> {
  const { isEnabled: isDraft } = await draftMode();
  const [settings, homepage] = await Promise.all([
    cms.getSiteSettings(),
    cms.getPage("/", { draft: isDraft }),
  ]);
  const siteName = settings.siteName || "My Site";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: homepage?.metaDescription || settings.siteDescription,
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName,
      images: homepage?.ogImage
        ? [{ url: homepage.ogImage.url }]
        : settings.ogImage
          ? [{ url: settings.ogImage.url }]
          : [{ url: "/og/og-default.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, analytics] = await Promise.all([
    cms.getSiteSettings(),
    cms.getAnalytics(),
  ]);
  const gaId = analytics.googleAnalyticsId;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    >
      <head>
        {settings.headScripts && (
          <script dangerouslySetInnerHTML={{ __html: settings.headScripts }} />
        )}
      </head>
      <body className="antialiased">
        <PostHogProvider>
          <a href="#main" className="skip-to-content">
            Skip to content
          </a>
          <Header />
          <AutoBreadcrumbJsonLd />
          <main id="main">{children}</main>
          <Footer />
        </PostHogProvider>
        <Analytics />
        {gaId && (
          <GoogleAnalytics gaId={gaId} />
        )}
        {settings.bodyScripts && (
          <script dangerouslySetInnerHTML={{ __html: settings.bodyScripts }} />
        )}
        <BotIdClient protect={[{ path: "/api/contact", method: "POST" }]} />
      </body>
    </html>
  );
}
