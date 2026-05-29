/**
 * Shared CMS types.
 *
 * The Payload adapter (payload.ts) maps raw Payload docs into these
 * frontend-facing shapes. Keep this layer thin — add a type here when you
 * expose a new collection/global to the frontend, then implement it in
 * payload.ts and (if it should be cached) wrap it in cached.ts.
 */

/** A normalized image, handy when mapping `media` uploads for the frontend. */
export interface CMSImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  focalX?: number;
  focalY?: number;
}

/** A resolved redirect rule consumed by `src/proxy.ts`. */
export interface Redirect {
  /** Source path, e.g. "/old-page". */
  from: string;
  /** Destination — a path ("/new") or absolute URL ("https://…"). */
  to: string;
  /** HTTP status: 301 permanent, 302 temporary. */
  type: "301" | "302";
}

/** Public analytics IDs managed in Payload's Site Settings global. */
export interface AnalyticsSettings {
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  metaPixelId?: string;
  posthogKey?: string;
  posthogHost?: string;
}

/** Starter-level global settings exposed to the frontend. */
export interface SiteSettings {
  analytics: AnalyticsSettings;
}

/** Options for fetchers that vary based on draft mode (Live Preview). */
export interface CMSFetchOptions {
  /** When true, fetch the latest draft revision instead of the published one. */
  draft?: boolean;
}

/** The CMS adapter interface each implementation must satisfy. */
export interface CMSAdapter {
  getSiteSettings(): Promise<SiteSettings>;
  getRedirects(): Promise<Redirect[]>;
}
