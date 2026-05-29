/**
 * CMS layer — import from here, never directly from ./payload.
 *
 * `cms` is the cached adapter (wraps the Payload local API in unstable_cache)
 * so public visitors don't wake Neon. `uncachedCms` is the raw adapter for the
 * rare case you need fresh-from-Payload data outside of draft mode.
 *
 * See CLAUDE.md > "Cache + Draft Mode pattern" for the architecture.
 */
export type { CMSImage, Redirect, CMSAdapter, CMSFetchOptions } from "./types";
export { cachedAdapter as cms, CMS_TAGS } from "./cached";
export { cms as uncachedCms } from "./payload";
