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
- Deployed on Vercel — env vars pulled via Vercel CLI

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

### Edge-404 middleware for dynamic routes (add when needed)

The starter has no dynamic routes today, so there's no middleware. The moment you add a `[slug]` or `[id]` route under `(frontend)/` that fetches from a CMS collection (events, posts, products, etc.), **add this pattern at the same time**.

**The problem.** Crawlers will discover URLs that no longer exist (slug rename, event archived, post deleted). Each dead-slug hit goes to the dynamic page route, fires a lambda, opens a Neon connection through the pooler, and pgbouncer holds the backend warm for ~10 minutes. New dead-slug discoveries arriving every few minutes mean compute never suspends. The cache layer doesn't help here because dead slugs don't have a cache entry to hit.

**The fix.** Edge middleware fetches a static slug-list endpoint (itself edge-cached and busted by `afterChange` on the source collection) and returns a 410 Gone for unknown slugs without firing the page lambda.

Two files plus a hook tweak:

1. **`src/app/api/<resource>/valid-slugs/route.ts`** — a `force-static` route that returns `[slug, slug, ...]` for the resource. Edge-cached for a day with `s-maxage=86400, stale-while-revalidate=3600`.

2. **`src/middleware.ts`** — matches `/<resource>/:slug`, fetches the slug list (in-memory cached for 60s per function instance to avoid hammering on every request), returns a static 410 Gone HTML response for unknown slugs. Fails open if the slug list endpoint is briefly down (so we don't accidentally 404 valid pages).

3. **`<Collection>.afterChange`** — bust the slug list when the collection list changes structurally (creates, deletes, slug renames, status changes that hide the page). Add `revalidatePath("/api/<resource>/valid-slugs")` next to the existing tag/path busts.

Use **410 Gone**, not 404 — Google deindexes 410s faster, since 404s are treated as potentially temporary. The body can be styled identically to a 404; the status code is the SEO signal.

Reference implementation: see `live-from-the-divide` repo — `src/middleware.ts`, `src/app/api/events/valid-slugs/route.ts`, and `src/collections/Events.ts` (the `afterChange` hook calls `revalidatePath("/api/events/valid-slugs")`).

## Neon Connection Tuning

Use Neon's **pooled** endpoint, per Payload's recommendation for serverless deployments. The granular `unstable_cache` layer (see "Cache + Draft Mode pattern" above) is what keeps compute suspended — not the connection-string choice. Two settings to know:

1. **`POSTGRES_URL` host: use the POOLED endpoint (`-pooler`)**

   ```env
   POSTGRES_URL="postgresql://user:pass@ep-XXX-pooler.region.aws.neon.tech/neondb?sslmode=require"
   ```

   The pooled host routes through Neon's internal pgbouncer in transaction mode, which multiplexes many short-lived serverless function connections onto a smaller pool of backend Postgres connections. This is what Payload recommends for Vercel-style deployments.

   Caveat to know: Neon's pgbouncer holds each backend connection open for ~10 minutes after the last query (its `server_idle_timeout` default), which can delay `suspend_timeout` from firing if queries are happening regularly. **In practice this doesn't matter** — the cache scheme means public visitors never hit Neon, and CMS edits happen in bursts with long quiet periods, so compute does suspend cleanly between editing sessions.

   This is a deliberate trade-off. The direct endpoint forces more aggressive suspension but loses pgbouncer's multiplexing benefit. With the cache layer doing its job, there's nothing for the pooler's backend-hold to keep warm — pooler wins.

2. **`idleTimeoutMillis: 1000` + `max: 5` in the adapter pool config**

   ```ts
   db: vercelPostgresAdapter({
     pool: {
       connectionString: process.env.POSTGRES_URL,
       idleTimeoutMillis: 1000,
       max: 5,
     },
   }),
   ```

   Default is ~10s. Setting to 1s means a connection used for one request closes ~immediately on the **app side**. Neon's pgbouncer keeps its own backend connection longer regardless, but closing app-side fast still helps with serverless cold-restart hygiene and avoids the app-side pool accumulating dead handles.

**Why we don't use `@neondatabase/serverless` HTTP driver directly:** Payload requires transactions for atomic writes. The HTTP-only driver doesn't support transactions. `@vercel/postgres` (used by the adapter) already imports from `@neondatabase/serverless` under the hood and uses its WebSocket Pool mode, which IS the right call.

**Optional: `idle_session_timeout` on the database**

```sql
ALTER DATABASE neondb SET idle_session_timeout = '5s';
```

Forces Postgres itself to kill backend connections idle >5s, regardless of what the client does. Useful as a belt-and-suspenders measure on low-traffic deployments where you want maximum aggressive suspension. Not strictly required if the cache layer is solid — public visitors don't hit Neon anyway, so there's nothing for this to clean up most of the time. Set once via SQL, persists across deploys.

**Verification — what to actually check:** the real cache-health signal is `pg_stat_activity`. During quiet periods you should see zero application connections holding Neon open (only Neon-internal `pgbouncer` and similar). If a long-lived backend with an app `application_name` shows up, something is bypassing the cache layer (a server component calling a non-cached method, a forgotten `cookies()`/`headers()` call forcing dynamic rendering on a cached page, etc.) — trace it down.

```sql
SELECT application_name, state, COUNT(*),
       MAX(EXTRACT(EPOCH FROM (NOW() - state_change)))::int AS max_idle_s
FROM pg_stat_activity WHERE datname = 'neondb'
GROUP BY application_name, state ORDER BY 3 DESC;
```

After deploying, `neon operations list --project-id <id>` should show suspend gaps growing from minutes to hours during quiet periods.

## Performance

- Critical-CH headers are scoped to `/admin` only via post-withPayload config override (prevents ~800ms Chromium first-visit penalty on public pages)
- Hero images use `quality={60}` for smaller payloads
- Image formats: avif + webp via next.config
- Below-fold client components should be lazy-loaded with `next/dynamic`

### Cron alignment (when adding daily crons)

The starter ships with `crons: []` in `vercel.json`. When a project adds multiple daily crons (event sync, review sync, blob cleanup, etc.), **align them to the same UTC hour**.

```json
"crons": [
  { "path": "/api/sync-events",  "schedule": "0 6 * * *" },
  { "path": "/api/sync-reviews", "schedule": "0 6 * * *" },
  { "path": "/api/cron/clean-blobs", "schedule": "0 6 * * *" }
]
```

Each cron wakes Neon — splitting them across multiple hours means multiple wake windows per day, each holding compute warm for ~10 minutes (pgbouncer's `server_idle_timeout`). Aligning them to one hour means one wake window per day instead of three or four.

`0 6 * * *` (06:00 UTC) is a sensible default for North American venues / sites — it's midnight Mountain, 11pm Pacific, 1am Central, 2am Eastern. Pick whatever quiet hour suits the audience; the principle is "all the same hour" not "this specific hour."

## Environment Variables

- Never commit secrets to git
- All env vars are documented in `.env.example`. Pull from Vercel with
  `bun run env:pull` (wraps `vercel env pull .env.local`)
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
