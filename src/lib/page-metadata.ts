import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { cms } from "@/lib/cms";

/**
 * Generate metadata for a static page, pulling overrides from the CMS.
 * Falls back to the provided defaults if no CMS entry exists.
 *
 * Reads draft mode so previews see draft titles / descriptions / OG images.
 */
export async function pageMetadata(
  path: string,
  defaults: { title: string; description: string },
): Promise<Metadata> {
  const { isEnabled: isDraft } = await draftMode();
  const page = await cms.getPage(path, { draft: isDraft });
  return {
    title: page?.metaTitle || defaults.title,
    description: page?.metaDescription || defaults.description,
    ...(page?.ogImage && {
      openGraph: { images: [{ url: page.ogImage.url }] },
    }),
  };
}
