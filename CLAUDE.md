# Sitekick Payload Starter — Project Rules

## Stack

- Next.js 16 (App Router, React Server Components, TypeScript)
- Payload CMS 3 (headless CMS at /admin, dark theme)
- Neon Postgres via @payloadcms/db-vercel-postgres
- Vercel Blob for file/image storage
- Tailwind CSS v4 with CSS variables
- shadcn/ui with Base UI
- Bun as package manager (not npm/yarn/pnpm)
- Resend for transactional emails
- Anthropic Claude (Haiku) for AI alt text generation
- Deployed on Vercel
- 1Password CLI for env var management

## Commands

- Use `bun` for all package operations: `bun add`, `bun install`, `bun run`
- Use `bunx` instead of `npx` for one-off commands
- Add shadcn components with: `bunx shadcn@latest add <component>`
- Pull env vars with: `bun run env:pull`

## Project Structure

- `src/app/(frontend)/` — site pages and layouts
- `src/app/(payload)/` — Payload admin and API routes (auto-generated, do not modify)
- `src/app/api/` — custom API routes (forms, uploads, cron jobs)
- `src/collections/` — Payload CMS collection configs
- `src/globals/` — Payload CMS global configs (Site Settings)
- `src/lib/cms/` — CMS layer (types, Payload adapter, index)
- `src/components/layout/` — site-wide layout: header, footer, nav
- `src/components/marketing/` — newsletter forms
- `src/components/contact/` — contact form
- `src/components/tracking/` — analytics and tracking components
- `src/components/payload/` — Payload admin panel customizations
- `src/components/ui/` — shadcn/ui primitives (do not put app-specific components here)
- `src/lib/` — shared utilities
- `src/hooks/` — custom React hooks
- `public/images/`, `public/icons/`, `public/videos/`, `public/fonts/`, `public/og/` — static assets

## CMS Layer

- Frontend pages import from `@/lib/cms` — never directly from Payload
- `src/lib/cms/types.ts` defines shared interfaces: `Page`, `CMSImage`, `SiteSettings`, `AnalyticsSettings`, `SocialLinks`, `CMSAdapter`, `CMSFetchOptions`
- `src/lib/cms/payload.ts` implements the raw Payload local-API adapter
- `src/lib/cms/cached.ts` wraps every adapter method in `unstable_cache` so public visitors don't wake Neon — see "Cache + Draft Mode pattern" below
- `src/lib/cms/index.ts` exports the cached adapter as `cms` (default), and the raw one as `uncachedCms` for the rare case where you need fresh-from-Payload data
- When adding new content types: update types.ts → implement in payload.ts → wrap in cached.ts → add `revalidateTag` to the source's afterChange hook

## Coding Conventions

- Use TypeScript strict mode for all files
- Use functional components with arrow functions
- Use `cn()` from `@/lib/utils` for conditional class merging
- Prefer server components by default; only add "use client" when needed
- Use `@/` import alias for all project imports
- Keep components small and composable
- Organize components into domain folders (`layout/`, `marketing/`, `contact/`, etc.) — never place app-specific components at the top level of `src/components/`

## Styling

- Use Tailwind utility classes for styling
- Always use Tailwind's default scale for spacing, sizing, max-width, breakpoints, and all other measurements — do not use arbitrary values (`w-[347px]`) when a Tailwind token exists
- Use the pre-built typography classes from globals.css: `.h1`-`.h6`, `.body-lg`, `.body-md`, `.body-sm`, `.type-lead`, `.type-button`, `.type-eyebrow`, `.type-caption`, `.type-overline`, `.type-quote`
- All font sizes must be 12px (0.75rem) minimum for accessibility
- Three font families are registered as CSS variables: `--font-display` (headings, quotes), `--font-sans` (body, UI), `--font-mono` (code) — see `globals.css` and `layout.tsx` for the actual typefaces
- Breakpoints follow Tailwind defaults: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px), `2xl` (1536px) — design mobile-first

## Animations

- Use `AnimateOnScroll` component for scroll-triggered fade-up reveals on sections
- Use `.stagger-item` class with `animationDelay` for staggered list items inside `AnimateOnScroll`
- Use `.hero-text-reveal` with staggered delays for hero text entrance
- Use `.hero-image-reveal` for hero image zoom-in
- Mobile animations are opacity-only (no transforms) to avoid Safari jank
- Always include `@media (prefers-reduced-motion: reduce)` fallbacks

## Figma MCP / Design Implementation

- When translating Figma designs, always check for an existing component or utility class before creating anything new
- Map Figma text styles to the typography classes in globals.css first (`.h1`-`.h6`, `.body-*`, `.type-*`)
- Map Figma colors, spacing, and other tokens to existing Tailwind theme values before adding custom ones
- If a design element matches a common UI pattern, check shadcn/ui first
- If no local component exists but shadcn has one, install it first, then customize — do not build from scratch

## Payload CMS

- Collections live in `src/collections/` and are registered in `src/payload.config.ts`
- Globals live in `src/globals/` and are registered in `src/payload.config.ts`
- After changing collections/globals, run `bun run generate:types` to update `src/payload-types.ts`
- Use `payload.db.drizzle` for custom database queries outside Payload collections
- Media uploads go to Vercel Blob automatically — do not store uploads locally
- The (payload) route group files are auto-generated — do not edit them manually
- Admin theme is locked to dark mode
- Admin title dynamically shows the business name from the Site Settings global
- Form submission collections (Contact, Newsletter) use custom `ui` field components for read-only card views instead of default dimmed fields
- **Do NOT add custom `beforeChange` hooks that modify filenames** — with `clientUploads`, the file is already in Blob before hooks run, causing filename mismatches and 400 errors

### Schema Changes

When changing field names, adding/removing fields, or modifying collection/global schemas that affect the database:

1. Make the schema change in the code (collection/global config)
2. Run `bunx payload migrate:create` to generate a migration file in `src/migrations/`
3. Commit the migration file alongside the schema change
4. Push — the build script runs `payload migrate --disable-transpile && next build` which applies pending migrations before the build starts

This is Payload's recommended workflow. The migration runs automatically on every deploy.

**NEVER** run `bun dev` against the production database — it writes a `batch = -1` marker to `payload_migrations` that triggers an interactive prompt on the next build, blocking deployment. Always use a local database for development.

Note: Migration files must use `import { sql } from 'drizzle-orm'` (not from `@payloadcms/db-vercel-postgres`) to avoid ESM re-export issues on Vercel.

### Media Uploads

- `clientUploads: true` — files upload directly from browser to Vercel Blob (no size limit)
- `disablePayloadAccessControl: true` — files served directly from Blob CDN (no proxy through Payload)
- `addRandomSuffix: false` — required to avoid Payload CDN race condition bug (#14709)
- `afterError` hook auto-cleans orphan blobs when an upload fails
- `afterChange` hook auto-generates alt text via Claude (fire-and-forget, uses thumbnail)
- `scripts/clean-orphan-blobs.mjs` — manual bulk orphan cleanup (dry run by default, `--delete` to execute)
- `/api/cron/clean-blobs` — API endpoint for manual orphan cleanup
- `/api/cron/backfill-alt-text` — regenerate alt text for all images (`?all=true` to overwrite existing)

## Cache & Revalidation

- **No time-based ISR** — public pages set `export const revalidate = false` (cache forever) and invalidate on-demand when CMS content changes
- Every collection and global has an `afterChange` hook that calls BOTH `revalidateTag()` (busts the cms unstable_cache layer) AND `revalidatePath()` (busts prerendered HTML)
- **Dynamic import required**: hooks must use `await import("next/cache")` (not static `import from "next/cache"`) because the Payload CLI loads collection configs outside Next.js during migrations

### Cache + Draft Mode pattern (CRITICAL — read before touching pages)

Public pages call `await draftMode()` to power live preview. In Next.js 16, that opts the page into dynamic rendering on every request — meaning the page function body runs and would normally hit Neon for every visitor. To prevent that, **all CMS data fetches go through `unstable_cache`** in `src/lib/cms/cached.ts`.

```
Page (await draftMode + revalidate=false)
   │
   ├──► cms.getPage("/about")                   ← @/lib/cms = cached adapter
   │       │
   │       ├── if (opts?.draft) → uncachedCms.getPage()  (LIVE preview, hits Neon)
   │       └── else            → unstable_cache(...)      (PUBLIC visit, no Neon)
   │                                       └── tag: "cms:page:/about"
   │
   └──► CMS edit fires afterChange hook ─► revalidateTag(tag, "max") + revalidatePath(path)
```

**Rules:**
- **Pages always import from `@/lib/cms`**, never directly from `./cms/payload`. The export `cms` is the cached adapter; `uncachedCms` exists for fresh-from-Payload reads.
- **Pages MAY call `await draftMode()`** and pass `{ draft: isDraft }` into cms methods that accept it (currently `getPage`). The cached adapter bypasses cache when draft is true.
- **NEVER call other dynamic Next APIs** (`cookies()`, `headers()`, `unstable_noStore()`) in public-page server components — they have the same dynamic-render side effect but no draft-bypass escape hatch.
- **`afterChange` hooks must call both** `revalidateTag(tag, "max")` (busts the data cache) **and** `revalidatePath(path)` (busts prerendered HTML). Path alone won't flush `unstable_cache`.
- **Collections / globals with drafts enabled** must gate revalidation on `doc._status === 'published'` — without this, every autosave keystroke (375ms interval) busts the cache and wakes Neon.
- **Always include `req.context.disableRevalidate` escape hatch** so bulk imports / migrations / scripts can skip the cache-bust storm.

If you ever see `cache-control: max-age=0, must-revalidate` on a public page response, it means a dynamic API was called somewhere and the cache wrapper isn't doing its job. Trace it down before shipping.

### Draft Mode + Live Preview

- `Pages` collection has `versions: { drafts: { autosave } }` enabled. Live Preview routes through `/api/draft?secret=$PAYLOAD_SECRET&url=<path>` which enables Next.js draftMode (cookie set), so the cached adapter falls through to the raw Payload local API and the editor sees the latest autosaved draft instantly.
- `/api/exit-draft` disables draft mode for users who want to opt out.
- Both routes have a same-origin guard on the redirect target. `/api/draft` also requires the `PAYLOAD_SECRET` env var.

### Adding Revalidation to New Collections / Globals

Mirror Payload's official `templates/website` `revalidatePage` / `revalidateFooter` hooks. Two required gates plus the dual invalidation:

```typescript
afterChange: [
  async ({ doc, req }) => {
    if (req.context.disableRevalidate) return doc;
    try {
      const { revalidatePath, revalidateTag } = await import("next/cache");
      // Tag bust: flushes the cms.* unstable_cache so the next read hits Payload.
      revalidateTag("cms:your-collection", "max");
      // Path bust: flushes the prerendered HTML on affected pages.
      revalidatePath("/");
      revalidatePath("/your-page");
      if (doc.slug) revalidatePath(`/your-page/${doc.slug}`);
    } catch {}
    return doc;
  },
],
```

For collections / globals **with drafts enabled** (`versions: { drafts: ... }`), add a status gate. **This is critical for autosave-enabled drafts**: without it, every keystroke during editing busts the cache and wakes Neon.

```typescript
afterChange: [
  async ({ doc, previousDoc, req }) => {
    if (req.context.disableRevalidate) return doc;
    const status = doc._status;
    const prevStatus = previousDoc?._status;
    const justPublished = status === "published";
    const justUnpublished = prevStatus === "published" && status !== "published";
    if (!justPublished && !justUnpublished) return doc;
    // ...revalidateTag + revalidatePath as above
    return doc;
  },
],
```

## Neon Connection Tuning (CRITICAL for keeping compute suspended)

For low-traffic Neon serverless setups, the default `@payloadcms/db-vercel-postgres` setup keeps compute awake far longer than necessary because Vercel's frozen runtime prevents app-side pool timeouts from firing. Three settings matter, and **all three are required**:

1. **`POSTGRES_URL`: pooler URL is fine, direct works too**

   Pooler URL (`ep-XXX-pooler.region.aws.neon.tech`) routes through Neon's internal pgbouncer. Connection multiplexing is good if you ever scale up. Either pooler or direct works as long as the next two settings are in place — Postgres-side timeout makes the difference, not the routing.

2. **Pool config in payload.config.ts**

   ```ts
   db: vercelPostgresAdapter({
     pool: {
       connectionString: process.env.POSTGRES_URL,
       idleTimeoutMillis: 1000,
       max: 5,
     },
   }),
   ```

3. **`idle_session_timeout` on the database itself (the actual fix)**

   ```sql
   ALTER DATABASE neondb SET idle_session_timeout = '5s';
   ```

   Vercel's serverless runtime freezes the JS event loop between invocations, so the app-side `idleTimeoutMillis` doesn't fire reliably. Setting `idle_session_timeout` server-side means **Postgres itself kills any backend connection that's been idle for 5s**, regardless of what the client does. This is what lets compute actually suspend. Without it, zombie connections from frozen Vercel functions hold the compute awake indefinitely.

   This setting is per-database and persists across deploys — set it once via SQL and forget about it. Verify with:

   ```sql
   SELECT unnest(setconfig) FROM pg_db_role_setting
   JOIN pg_database ON pg_database.oid = setdatabase
   WHERE datname = 'neondb';
   ```

**Why this isn't in Payload's official docs:** Payload's `templates/with-vercel-postgres` ships with bare `pool: { connectionString }` and no Postgres tuning. That's fine for traditional production apps with steady traffic where compute is always-on anyway. For low-traffic Neon scale-to-zero, the community has converged on the three settings above as the canonical workaround. See GH issues #5075 and #7254 for the upstream discussion.

**Verification:** after deploying, run `neon operations list --project-id <id>` — suspend gaps should grow from minutes to hours during quiet periods. If still seeing frequent wakes, query `pg_stat_activity` to find what's connecting (any external `client_addr` with `state = idle` for >5s indicates `idle_session_timeout` isn't applied).

## Performance

- Critical-CH headers are scoped to `/admin` only via post-withPayload config override (prevents ~800ms Chromium first-visit penalty on public pages)
- Hero images use `quality={60}` for smaller payloads
- Image formats: avif + webp via next.config
- Below-fold client components should be lazy-loaded with `next/dynamic`

## Environment Variables

- Never commit secrets to git
- All env vars are documented in `.env.example` with 1Password `op://` references
- `NEXT_PUBLIC_` prefixed vars are exposed to the browser — only use for non-sensitive values
- Google Analytics ID is managed in CMS Site Settings (not env vars)

## ESLint

- Pinned to `^9`. Do not bump to ESLint 10 — `eslint-plugin-react@7.37.x`
  (latest, pulled in transitively by `eslint-config-next`) still calls the
  deprecated `context.getFilename()` API that ESLint 10 removed, so every
  rule using filenames throws on load and `bun run lint` dies before it
  checks a single file. Stay on 9 until the upstream plugin ecosystem
  catches up.

## Git

- Do not commit `.env.local` or any `.env` files (except `.env.example`)
- Do not commit `node_modules/` or `.next/`
- Use descriptive commit messages
- Batch pushes to reduce Vercel build minutes — commit frequently, push in batches
