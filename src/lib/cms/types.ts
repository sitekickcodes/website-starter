/**
 * Shared CMS content types.
 *
 * These interfaces define the shape of data returned to frontend pages.
 * The Payload adapter (payload.ts) maps raw Payload docs to these types.
 */

export interface CMSImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  focalX?: number;
  focalY?: number;
}

export interface Page {
  id: string;
  path: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: CMSImage;
}

export interface SiteSettings {
  siteName: string;
  siteDescription?: string;
  favicon?: CMSImage;
  ogImage?: CMSImage;
  contact?: {
    businessName?: string;
    email?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  headScripts?: string;
  bodyScripts?: string;
}

export interface AnalyticsSettings {
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  x?: string;
  google?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
}

/** Options for CMS fetchers that vary based on draft mode. */
export interface CMSFetchOptions {
  /** When true, fetch the latest draft revision (used inside Live Preview). */
  draft?: boolean;
}

/** The CMS adapter interface that each implementation must satisfy. */
export interface CMSAdapter {
  getPage(path: string, opts?: CMSFetchOptions): Promise<Page | null>;
  getSiteSettings(): Promise<SiteSettings>;
  getAnalytics(): Promise<AnalyticsSettings>;
  getSocialLinks(): Promise<SocialLinks>;
}
