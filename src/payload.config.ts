import { vercelPostgresAdapter } from "@payloadcms/db-vercel-postgres";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { resendAdapter } from "@payloadcms/email-resend";
import { importExportPlugin } from "@payloadcms/plugin-import-export";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

import { Users } from "./collections/Users.ts";
import { Media } from "./collections/Media.ts";
import { Pages } from "./collections/Pages.ts";
import { ContactSubmissions } from "./collections/ContactSubmissions.ts";
import { NewsletterSubmissions } from "./collections/NewsletterSubmissions.ts";
import { SiteSettings } from "./globals/SiteSettings.ts";
import { syncPages } from "./lib/syncPages.ts";

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
    components: {
      providers: ["@/components/payload/AdminTitleProvider.tsx"],
    },
    theme: "dark",
  },
  collections: [Pages, Media, ContactSubmissions, NewsletterSubmissions, Users],
  onInit: async (payload) => {
    await syncPages(payload);
  },
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
      // can suspend. The Vercel runtime freezes the event loop between
      // invocations so this is a hint — the real timeout enforcement happens
      // server-side via `idle_session_timeout` (set on the database itself).
      // See CLAUDE.md > "Neon Connection Tuning".
      idleTimeoutMillis: 1000,
      max: 5,
    },
  }),
  ...(process.env.RESEND_API_KEY
    ? {
        email: resendAdapter({
          defaultFromAddress: "hello@mail.sitekick.co",
          defaultFromName: "Sitekick",
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
    importExportPlugin({
      collections: [
        { slug: "users" },
        { slug: "media" },
        { slug: "contact-submissions" },
        { slug: "newsletter-submissions" },
      ],
    }),
  ],
});
