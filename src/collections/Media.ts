import type { CollectionConfig } from "payload";
import { list, del } from "@vercel/blob";
import {
  generateAltText,
  altTextFromFilename,
} from "../lib/generateAltText.ts";

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    group: "Content",
    description:
      "Images and graphics. Alt text is auto-generated on upload.",
    pagination: { defaultLimit: 50 },
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "alt",
      label: "Alt Text",
      type: "text",
      admin: {
        description:
          "A short description of the image for screen readers and SEO. Auto-generated on upload, but you can edit it.",
      },
    },
    {
      name: "generateAltText",
      type: "ui",
      admin: {
        disableListColumn: true,
        components: {
          Field: "@/components/payload/GenerateAltTextButton.tsx",
        },
      },
    },
  ],
  hooks: {
    afterError: [
      ({ req }) => {
        if (req.method !== "POST") return;

        const filename = req.file?.name;
        if (!filename) return;

        const blobPathname = `media/${filename}`;

        (async () => {
          try {
            const result = await list({ prefix: blobPathname, limit: 100 });
            if (result.blobs.length === 0) return;

            const { docs } = await req.payload.find({
              collection: "media",
              limit: 1,
              depth: 0,
              where: { filename: { equals: filename } },
            });

            if (docs.length > 0) return;

            for (const blob of result.blobs) {
              await del(blob.url);
            }

            req.payload.logger.info(
              `[Media] Cleaned orphan blob: ${blobPathname}`,
            );
          } catch {
            // Silent — cleanup is best-effort
          }
        })();
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== "create") return doc;
        if (doc.alt) return doc;
        if (!doc.mimeType?.startsWith("image/")) return doc;

        const isSvg = doc.mimeType === "image/svg+xml";

        if (isSvg) {
          const altText = altTextFromFilename(doc.filename as string);
          if (altText) {
            try {
              await req.payload.update({
                collection: "media",
                id: doc.id,
                data: { alt: altText },
              });
            } catch (error) {
              req.payload.logger.warn(
                `[Media] Failed to save SVG alt text for ${doc.filename}: ${error}`,
              );
            }
          }
          return doc;
        }

        const thumbUrl = (doc.sizes as Record<string, any>)?.thumbnail?.url;
        const imageUrl = thumbUrl || doc.url;
        if (!imageUrl) return doc;

        const fullUrl = (imageUrl as string).startsWith("http")
          ? (imageUrl as string)
          : `${process.env.NEXT_PUBLIC_SITE_URL || ""}${imageUrl}`;

        try {
          const altText = await generateAltText(fullUrl, doc.filename as string);
          if (altText) {
            await req.payload.update({
              collection: "media",
              id: doc.id,
              data: { alt: altText },
            });
          }
        } catch (error) {
          req.payload.logger.warn(
            `[Media] Failed to generate alt text for ${doc.filename}: ${error}`,
          );
        }

        return doc;
      },
    ],
  },
  upload: {
    mimeTypes: ["image/*"],
    imageSizes: [
      {
        name: "thumbnail",
        width: 400,
        height: undefined,
        position: "centre",
      },
      {
        name: "card",
        width: 768,
        height: 1024,
        position: "centre",
      },
      {
        name: "desktop",
        width: 1920,
        height: undefined,
        position: "centre",
      },
    ],
    adminThumbnail: ({ doc }) => {
      const sizes = doc?.sizes as Record<string, { url?: string | null }> | undefined;
      return sizes?.thumbnail?.url || sizes?.desktop?.url || (doc?.url as string) || "";
    },
  },
};
