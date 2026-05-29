import { vercelPostgresAdapter } from "@payloadcms/db-vercel-postgres";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { resendAdapter } from "@payloadcms/email-resend";
import { importExportPlugin } from "@payloadcms/plugin-import-export";
import { redirectsPlugin } from "@payloadcms/plugin-redirects";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

import { Users } from "./collections/Users.ts";
import { Media } from "./collections/Media.ts";
import { SiteSettings } from "./globals/SiteSettings.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    avatar: {
      Component: "@/components/payload/AdminAvatar.tsx",
    },
    meta: {
      titleSuffix: "— Admin",
    },
    theme: "dark",
  },
  collections: [Media, Users],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: vercelPostgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || "",
      // Aggressive idle timeout so connections close fast and Neon's compute
      // can suspend. See CLAUDE.md > "Neon Connection Tuning".
      idleTimeoutMillis: 1000,
      max: 5,
    },
  }),
  ...(process.env.RESEND_API_KEY
    ? {
        email: resendAdapter({
          defaultFromAddress:
            process.env.RESEND_FROM_EMAIL || "hello@example.com",
          defaultFromName: process.env.NEXT_PUBLIC_SITE_NAME || "Sitekick",
          apiKey: process.env.RESEND_API_KEY,
        }),
      }
    : {}),
  sharp,
  plugins: [
    vercelBlobStorage({
      collections: {
        media: {
          disablePayloadAccessControl: true,
          prefix: "media",
        },
      },
      token: process.env.BLOB_READ_WRITE_TOKEN || "",
      addRandomSuffix: false,
      access: "public",
      clientUploads: true,
    }),
    // Official redirects plugin. `collections` are the doc types a redirect can
    // point to via an internal reference — we seed it with `media` so the
    // reference field has a valid target in the base starter. As you add
    // content collections (pages, posts, …), add their slugs here so editors
    // can redirect to them. Custom-URL redirects (the common SEO case) work out
    // of the box regardless. Enforcement lives in src/proxy.ts.
    redirectsPlugin({
      collections: ["media"],
      redirectTypes: ["301", "302"],
      overrides: {
        admin: { group: "Admin" },
        hooks: {
          // Bust the cached redirects list so middleware picks up edits without
          // a deploy. Dynamic import because the Payload CLI loads this config
          // outside Next.js during migrations.
          afterChange: [
            async ({ req }) => {
              if (req.context?.disableRevalidate) return;
              try {
                const { revalidateTag } = await import("next/cache");
                revalidateTag("cms:redirects", "max");
              } catch {}
            },
          ],
          afterDelete: [
            async () => {
              try {
                const { revalidateTag } = await import("next/cache");
                revalidateTag("cms:redirects", "max");
              } catch {}
            },
          ],
        },
      },
    }),
    importExportPlugin({
      collections: [{ slug: "users" }, { slug: "media" }],
    }),
  ],
});
