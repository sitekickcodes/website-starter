/**
 * Cross-request caching layer over the Payload adapter.
 *
 * **Why this file exists.** Pages call `await draftMode()` to support live
 * preview. In Next.js 16, calling that API forces the page to render
 * dynamically on every request — which would wake Neon on every page hit.
 * `revalidate = false` does NOT save you from this; the page still runs the
 * function body, it just doesn't go through ISR.
 *
 * To keep Neon asleep we wrap every Payload local-API call in
 * `unstable_cache`. Public visitors hit the cached entry — no Neon. Live
 * preview requests (draft cookie set) bypass the cache and query Payload
 * directly so editors see drafts immediately.
 *
 * **Invalidation.** Each cached method is tagged. Collection / global
 * `afterChange` hooks call `revalidateTag(tag, "max")` so edits in /admin
 * show up on the public site without a deploy.
 *
 * **CRITICAL pattern.** Each cached function is created ONCE at module load
 * with `unstable_cache(fn, keyParts, options)`. Args are passed to the
 * returned function and become part of the cache key automatically. Do NOT
 * wrap unstable_cache in a per-call closure — that creates a fresh cache
 * binding per call and Next can't dedupe reliably across requests.
 *
 * If you add a new cms method that hits Neon, wrap it here. If you add a
 * new collection or global, add a corresponding `revalidateTag` call in
 * its `afterChange` hook. See CLAUDE.md > "Cache + Draft Mode pattern".
 */
import { unstable_cache } from "next/cache";

import { cms as basePayloadAdapter } from "./payload";
import type { CMSAdapter, CMSFetchOptions } from "./types";

// --------------------------------------------------------------------------
// Tags. Keep in sync with the revalidateTag calls in collection/global hooks.
// --------------------------------------------------------------------------
export const CMS_TAGS = {
  siteSettings: "cms:site-settings",
  socialLinks: "cms:social-links",
  analytics: "cms:analytics",
  /** Per-page tag — `cms:page:/about`, `cms:page:/contact`, etc. */
  page: (path: string) => `cms:page:${path}`,
} as const;

// --------------------------------------------------------------------------
// Wrappers. Module-level. Args (where present) become part of the cache key.
// --------------------------------------------------------------------------

const cachedGetPage = unstable_cache(
  async (path: string) => basePayloadAdapter.getPage(path),
  ["cms:page"],
  // Static "any" tag so wholesale invalidation is possible. Per-path
  // invalidation works because afterChange uses `cms:page:${path}`.
  { revalidate: false, tags: ["cms:page:any"] },
);

const cachedGetSiteSettings = unstable_cache(
  async () => basePayloadAdapter.getSiteSettings(),
  ["cms:site-settings"],
  { revalidate: false, tags: [CMS_TAGS.siteSettings] },
);

const cachedGetAnalytics = unstable_cache(
  async () => basePayloadAdapter.getAnalytics(),
  ["cms:analytics"],
  { revalidate: false, tags: [CMS_TAGS.analytics] },
);

const cachedGetSocialLinks = unstable_cache(
  async () => basePayloadAdapter.getSocialLinks(),
  ["cms:social-links"],
  { revalidate: false, tags: [CMS_TAGS.socialLinks] },
);

// --------------------------------------------------------------------------
// Adapter. Methods that take a `draft` flag bypass the cache when set so
// live preview always sees fresh data.
// --------------------------------------------------------------------------
export const cachedAdapter: CMSAdapter = {
  async getPage(path: string, opts?: CMSFetchOptions) {
    if (opts?.draft) return basePayloadAdapter.getPage(path, opts);
    return cachedGetPage(path);
  },

  getSiteSettings: () => cachedGetSiteSettings(),
  getAnalytics: () => cachedGetAnalytics(),
  getSocialLinks: () => cachedGetSocialLinks(),
};
