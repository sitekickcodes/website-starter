import type { CollectionConfig } from "payload";

const isHomepage = (data: Record<string, unknown> | undefined) =>
  data?.path === "/";

export const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    group: "SEO",
    useAsTitle: "displayName",
    defaultColumns: ["displayName", "path", "updatedAt"],
    description:
      "Manage how each page appears in search engines and social media.",
    pagination: { defaultLimit: 50 },
    livePreview: {
      // Route through /api/draft so the iframe enables draftMode and bypasses
      // the ISR cache — the adapter then fetches the latest unpublished draft
      // instead of the published version.
      url: ({ data }) => {
        const path = (data?.path as string) || "/";
        const secret = process.env.PAYLOAD_SECRET || "";
        return `/api/draft?secret=${encodeURIComponent(secret)}&url=${encodeURIComponent(path)}`;
      },
      breakpoints: [
        { label: "Mobile", name: "mobile", width: 375, height: 667 },
        { label: "Tablet", name: "tablet", width: 768, height: 1024 },
        { label: "Desktop", name: "desktop", width: 1440, height: 900 },
      ],
    },
  },
  versions: {
    drafts: { autosave: { interval: 375 } },
    maxPerDoc: 10,
  },
  defaultSort: "sortOrder",
  access: {
    read: () => true,
    create: () => false,
    delete: () => false,
  },
  hooks: {
    afterRead: [
      async ({ doc, req }) => {
        // Ensure displayName is always set for the list view
        if (doc.path === "/") {
          const siteSettings = await req.payload.findGlobal({
            slug: "site-settings",
          });
          return {
            ...doc,
            displayName: "Home",
            metaTitle: siteSettings.siteName || doc.metaTitle,
            metaDescription:
              siteSettings.siteDescription || doc.metaDescription,
            ogImage: siteSettings.ogImage || doc.ogImage,
          };
        }
        return {
          ...doc,
          displayName: doc.displayName || doc.metaTitle,
        };
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        // Bulk-operation escape hatch (matches Payload's official template).
        if (req.context.disableRevalidate) return doc;

        // CRITICAL: only invalidate when the document is actually published.
        // Pages collection has autosave drafts on a 375ms interval, so
        // without this gate every keystroke during editing busts the public
        // cache and wakes Neon. See CLAUDE.md > "Cache + Draft Mode pattern".
        const status = (doc as { _status?: string })._status;
        const prevStatus = (previousDoc as { _status?: string } | undefined)
          ?._status;
        const justPublished = status === "published";
        const justUnpublished =
          prevStatus === "published" && status !== "published";
        if (!justPublished && !justUnpublished) return doc;

        try {
          const { revalidatePath, revalidateTag } = await import("next/cache");
          // Tag bust flushes cms.getPage unstable_cache; path bust flushes
          // prerendered HTML. Both are required.
          revalidateTag(`cms:page:${doc.path}`, "max");
          revalidatePath(doc.path || "/", "layout");
          req.payload.logger.info(
            `[revalidate] page: ${doc.path}${justUnpublished ? " (unpublished)" : ""}`,
          );
        } catch {}
        return doc;
      },
    ],
    beforeChange: [
      async ({ data, req }) => {
        // Set displayName for all pages
        if (data.path === "/") {
          data.displayName = "Home";
        } else {
          data.displayName = data.metaTitle;
        }

        if (data.path !== "/") return data;

        // Sync homepage fields from site settings
        const siteSettings = await req.payload.findGlobal({
          slug: "site-settings",
        });
        return {
          ...data,
          metaTitle: siteSettings.siteName || data.metaTitle,
          metaDescription: siteSettings.siteDescription || data.metaDescription,
          ogImage:
            (typeof siteSettings.ogImage === "object"
              ? siteSettings.ogImage?.id
              : siteSettings.ogImage) || data.ogImage,
        };
      },
    ],
  },
  fields: [
    {
      name: "displayName",
      type: "text",
      admin: { hidden: true },
    },
    {
      name: "path",
      label: "Page URL",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true },
    },
    // Homepage notice
    {
      type: "ui",
      name: "homepageNotice",
      label: " ",
      admin: {
        condition: (data) => isHomepage(data),
        components: {
          Field: "@/components/payload/homepage-notice#HomepageNotice",
        },
      },
    },
    {
      name: "metaTitle",
      label: "Page Title",
      type: "text",
      required: true,
      admin: {
        description:
          'Shown in browser tabs and search results. Keep under 60 characters. " | Site Name" is added automatically.',
      },
      access: {
        update: ({ doc }) => doc?.path !== "/",
      },
    },
    {
      name: "metaDescription",
      label: "Description",
      type: "textarea",
      admin: {
        description:
          "Shown below the title in search results. Aim for 120–160 characters.",
      },
      access: {
        update: ({ doc }) => doc?.path !== "/",
      },
    },
    // Search preview
    {
      type: "ui",
      name: "searchPreview",
      label: " ",
      admin: {
        components: {
          Field: "@/components/payload/search-preview#SearchPreview",
        },
      },
    },
    {
      name: "sortOrder",
      type: "number",
      admin: { hidden: true },
    },
    // OG image — read-only on homepage (inherited from Site Settings)
    {
      name: "ogImage",
      label: "Social Sharing Image",
      type: "upload",
      relationTo: "media",
      admin: {
        description:
          "Image shown when this page is shared on social media. Recommended: 1200×630px.",
      },
      access: {
        update: ({ doc }) => doc?.path !== "/",
      },
    },
  ],
};
