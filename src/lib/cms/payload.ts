import { cache } from "react";
import { getPayload } from "payload";
import config from "@payload-config";
import type { CMSAdapter, Redirect, SiteSettings } from "./types";

const getClient = cache(() => getPayload({ config }));

/**
 * Raw, uncached Payload adapter. Exposed via `@/lib/cms` as `uncachedCms`.
 * Public reads should go through the cached adapter (cached.ts) instead so
 * they don't wake Neon on every request.
 */
export const cms: CMSAdapter = {
  async getSiteSettings(): Promise<SiteSettings> {
    const payload = await getClient();
    const settings = await payload.findGlobal({
      slug: "site-settings",
      depth: 0,
    });

    return {
      analytics: {
        googleAnalyticsId:
          settings.analytics?.googleAnalyticsId || undefined,
        googleTagManagerId:
          settings.analytics?.googleTagManagerId || undefined,
        metaPixelId: settings.analytics?.metaPixelId || undefined,
        posthogKey: settings.analytics?.posthogKey || undefined,
        posthogHost:
          settings.analytics?.posthogHost || "https://us.i.posthog.com",
      },
    };
  },

  async getRedirects(): Promise<Redirect[]> {
    const payload = await getClient();
    const { docs } = await payload.find({
      collection: "redirects",
      depth: 1, // populate the reference so we can read the target's URL
      limit: 1000,
      pagination: false,
    });

    const redirects: Redirect[] = [];
    for (const doc of docs) {
      if (!doc.from) continue;

      let to: string | null | undefined;
      if (doc.to?.type === "custom") {
        to = doc.to.url;
      } else {
        const ref = doc.to?.reference?.value;
        if (ref && typeof ref === "object" && "url" in ref) {
          to = (ref as { url?: string | null }).url;
        }
      }
      if (!to) continue;

      redirects.push({ from: doc.from, to, type: doc.type });
    }
    return redirects;
  },
};
