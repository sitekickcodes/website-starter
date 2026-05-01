import { cache } from "react";
import { getPayload } from "payload";
import config from "@payload-config";
import type {
  CMSAdapter,
  CMSImage,
  SiteSettings,
  AnalyticsSettings,
  SocialLinks,
} from "./types";

const getClient = cache(() => getPayload({ config }));

function toImage(
  doc: Record<string, unknown> | undefined,
): CMSImage | undefined {
  if (!doc || typeof doc !== "object") return undefined;
  const url = doc.url as string | undefined;
  if (!url) return undefined;
  return {
    url,
    alt: (doc.alt as string) || undefined,
    width: (doc.width as number) || undefined,
    height: (doc.height as number) || undefined,
    focalX: (doc.focalX as number) ?? undefined,
    focalY: (doc.focalY as number) ?? undefined,
  };
}

const cachedGetSiteSettings = cache(async () => {
  const payload = await getClient();
  return payload.findGlobal({ slug: "site-settings" });
});

const cachedGetSocialLinks = cache(async (): Promise<SocialLinks> => {
  const doc = await cachedGetSiteSettings();
  return {
    instagram: doc.instagram || undefined,
    facebook: doc.facebook || undefined,
    x: doc.x || undefined,
    google: doc.google || undefined,
    linkedin: doc.linkedin || undefined,
    youtube: doc.youtube || undefined,
    tiktok: doc.tiktok || undefined,
  };
});

export const cms: CMSAdapter = {
  async getPage(path, opts) {
    const payload = await getClient();
    const { docs } = await payload.find({
      collection: "pages",
      where: { path: { equals: path } },
      depth: 1,
      limit: 1,
      // When true, surface the latest autosaved draft instead of the
      // last-published version. The Pages collection enables drafts so this
      // flag is what powers Live Preview inside the admin.
      draft: opts?.draft ?? false,
    });

    const doc = docs[0];
    if (!doc) return null;

    return {
      id: String(doc.id),
      path: doc.path,
      metaTitle: doc.metaTitle || undefined,
      metaDescription: doc.metaDescription || undefined,
      ogImage: toImage(doc.ogImage as Record<string, unknown>),
    };
  },

  async getSiteSettings(): Promise<SiteSettings> {
    const doc = await cachedGetSiteSettings();

    return {
      siteName: doc.siteName,
      siteDescription: doc.siteDescription || undefined,
      favicon: toImage(doc.favicon as Record<string, unknown>),
      ogImage: toImage(doc.ogImage as Record<string, unknown>),
      contact: doc.contact
        ? {
            businessName: doc.contact.businessName || undefined,
            email: doc.contact.email || undefined,
            phone: doc.contact.phone || undefined,
            street: doc.contact.street || undefined,
            city: doc.contact.city || undefined,
            state: doc.contact.state || undefined,
            zip: doc.contact.zip || undefined,
          }
        : undefined,
      headScripts: doc.headScripts || undefined,
      bodyScripts: doc.bodyScripts || undefined,
    };
  },

  async getAnalytics(): Promise<AnalyticsSettings> {
    const doc = await cachedGetSiteSettings();

    return {
      googleAnalyticsId: doc.googleAnalyticsId || undefined,
      googleTagManagerId: doc.googleTagManagerId || undefined,
      facebookPixelId: doc.facebookPixelId || undefined,
    };
  },

  getSocialLinks: cachedGetSocialLinks,
};
