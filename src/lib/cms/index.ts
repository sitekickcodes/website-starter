/**
 * CMS layer — frontend pages import from here, never directly from Payload.
 *
 * `cms` is the cached adapter (wraps the Payload local API in unstable_cache)
 * so public visitors don't wake Neon. The raw `payloadAdapter` is exported
 * as `uncachedCms` for the rare case where you need fresh-from-Payload data
 * outside of draft mode (e.g., server actions that mutate then read).
 *
 * See CLAUDE.md > "Cache + Draft Mode pattern" for the architecture.
 */

export type {
  Page,
  CMSImage,
  SiteSettings,
  AnalyticsSettings,
  SocialLinks,
  CMSAdapter,
  CMSFetchOptions,
} from "./types";

export { cachedAdapter as cms, CMS_TAGS } from "./cached";
export { cms as uncachedCms } from "./payload";
