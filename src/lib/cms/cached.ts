/**
 * Cross-request caching layer over the Payload adapter.
 *
 * Wrap any frontend-facing Payload read in `unstable_cache` here so public
 * visitors hit the cache instead of waking Neon. Each entry is tagged; the
 * source collection's `afterChange` hook calls `revalidateTag(tag)` so edits
 * in /admin show up without a deploy. See CLAUDE.md > "Cache + Draft Mode".
 *
 * Pattern for adding a cached read:
 *   1. add the method to CMSAdapter (types.ts) + implement in payload.ts
 *   2. create a module-level `unstable_cache(fn, keyParts, { tags })` here
 *   3. expose it on `cachedAdapter`
 *   4. add `revalidateTag("<tag>")` to the source collection's afterChange
 */
import { unstable_cache } from "next/cache";

import { cms as basePayloadAdapter } from "./payload";
import type { CMSAdapter } from "./types";

// Keep these in sync with the `revalidateTag` calls in collection hooks.
export const CMS_TAGS = {
  redirects: "cms:redirects",
} as const;

const cachedGetRedirects = unstable_cache(
  async () => basePayloadAdapter.getRedirects(),
  ["cms:redirects"],
  { revalidate: false, tags: [CMS_TAGS.redirects] },
);

export const cachedAdapter: CMSAdapter = {
  getRedirects: () => cachedGetRedirects(),
};
