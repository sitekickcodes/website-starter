# Sitekick Payload Starter — Project Rules

## What this starter is

A deliberately minimal, **un-opinionated** Next.js + Payload CMS base. It ships
the *infrastructure* — the migration workflow, the Neon-friendly cache/draft
architecture, Vercel Blob uploads with AI alt text, redirects, and analytics
wiring — but **no prebuilt content schema and no design system**. Decide
collections, fields, and visual design per project.

Intentionally NOT included (add per project):

- No content collections beyond `Users` + `Media` (no Pages/Posts/etc.)
- No globals — site config (settings, nav, etc.) is project-specific
- No prebuilt design — no header/footer/nav, no typography classes, no fonts
  beyond **Inter**
- No shadcn/ui components pre-installed — add with `bunx shadcn@latest add <x>`

When a project needs schema or design, build it then. Don't push opinions back
into this starter.

## Stack

- Next.js 16 (App Router, React Server Components, TypeScript), Node 24
- Payload CMS 3 (headless CMS at /admin, dark theme)
- Neon Postgres via @payloadcms/db-vercel-postgres
- Vercel Blob for file/image storage
- Tailwind CSS v4 with CSS variables — **Inter** as the only typeface
- shadcn/ui with Base UI — installed per project, not preinstalled
- Bun as package manager (not npm/yarn/pnpm)
- Resend for transactional/auth email
- Anthropic Claude (Haiku) for AI alt text generation
- Redirects via @payloadcms/plugin-redirects + `src/middleware.ts`
- Analytics (all env-gated): Vercel Analytics + Speed Insights, PostHog,
  Google Analytics, Google Tag Manager, Meta Pixel
- Deployed on Vercel — env vars pulled via Vercel CLI

## Commands

- Use `bun` for all package operations: `bun add`, `bun install`, `bun run`
- Use `bunx` instead of `npx` for one-off commands
- Add shadcn components with: `bunx shadcn@latest add <component>`
- Pull env vars with: `bun run env:pull`

## Project Structure

- `src/app/(frontend)/` — public site: layout, globals.css, home, error,
  not-found, sitemap, robots
- `src/app/(payload)/` — Payload admin and API routes (auto-generated, do not modify)
- `src/app/api/` — custom API routes: `cron/*` (blob + alt-text maintenance),
  `draft` / `exit-draft` (Live Preview), `generate-alt-text`, `redirects`
- `src/collections/` — Payload collections (`Users`, `Media`)
- `src/lib/cms/` — CMS layer (types, Payload adapter, cached wrapper, index)
- `src/lib/` — shared utilities (`utils.ts` → `cn()`, `generateAltText.ts`)
- `src/components/payload/` — admin customizations (`AdminAvatar`, `GenerateAltTextButton`)
- `src/components/tracking/` — analytics (`posthog-provider`)
- `src/components/ui/` — shadcn/ui primitives (empty by default; add per project)
- `src/middleware.ts` — redirect enforcement (see "Redirects")
- `public/images/`, `public/icons/`, `public/videos/`, `public/fonts/`, `public/og/` — static assets

When you add a new domain area, create a folder and update this list.

## Design Philosophy (read before adding any UI)

- **Inter only.** Registered as `--font-sans` in `layout.tsx`. There is no
  `--font-display` or `--font-mono`, and no serif/display face. Keep it standard.
- **No prebuilt typography classes.** There is no `.h1`–`.h6`, `.body-*`, or
  `.type-*`. Style headings and text with Tailwind utilities directly
  (`text-3xl font-semibold tracking-tight`, etc.).
- `globals.css` carries only Tailwind, `tw-animate-css`, the shadcn color/radius
  tokens, and the Inter `--font-sans` mapping. Keep visual decisions in
  components, per project — don't grow a global design system here.
- Add shadcn components on demand: `bunx shadcn@latest add button card dialog`.
  They install into `src/components/ui/`.

## CMS Layer

- Frontend pages and middleware import from `@/lib/cms` — never directly from Payload.
- `src/lib/cms/types.ts` defines shared interfaces: `CMSImage`, `Redirect`,
  `CMSAdapter`, `CMSFetchOptions`.
- `src/lib/cms/payload.ts` implements the raw Payload local-API adapter.
- `src/lib/cms/cached.ts` wraps every adapter method in `unstable_cache` so
  public visitors don't wake Neon — see "Cache + Draft Mode pattern" below.
- `src/lib/cms/index.ts` exports the cached adapter as `cms` (default), and the
  raw one as `uncachedCms` for the rare case where you need fresh-from-Payload data.
- Adding a new cached read: update types.ts → implement in payload.ts → wrap in
  cached.ts (a module-level `unstable_cache` with a tag) → add a matching
  `revalidateTag` to the source collection's `afterChange` hook.

## Coding Conventions

- TypeScript strict mode for all files
- Functional components with arrow functions
- `cn()` from `@/lib/utils` for conditional class merging
- Prefer server components by default; only add "use client" when needed
- Use the `@/` import alias for all project imports
- Keep components small and composable; organize app-specific components into
  domain folders (`marketing/`, `blog/`, `events/`, …) — never at the top level
  of `src/components/`

## Styling

- Tailwind utility classes for everything
- Always use Tailwind's default scale for spacing, sizing, max-width, breakpoints
  — no arbitrary values (`w-[347px]`) when a token exists
- Inter is the only typeface (`--font-sans`); style type with Tailwind utilities
- All font sizes 12px (0.75rem) minimum for accessibility
- Use the shadcn color tokens from `globals.css` (`bg-background`,
  `text-foreground`, `text-muted-foreground`, `bg-primary`, `border-border`, …)
- Tailwind default breakpoints: `sm` 640 / `md` 768 / `lg` 1024 / `xl` 1280 /
  `2xl` 1536 — design mobile-first

## Payload CMS

- Collections live in `src/collections/` and are registered in `src/payload.config.ts`
- Globals (none ship by default) live in `src/globals/` and are registered the same way
- After changing collections/globals, run `bun run generate:types` to update `src/payload-types.ts`
- Use `payload.db.drizzle` for custom database queries outside Payload collections
- Media uploads go to Vercel Blob automatically — do not store uploads locally
- The (payload) route group files are auto-generated — do not edit them manually
- Admin theme is locked to dark mode
- **Do NOT add custom `beforeChange` hooks that modify filenames** — with
  `clientUploads`, the file is already in Blob before hooks run, causing
  filename mismatches and 400 errors

### Schema Changes & Migrations

When changing field names, adding/removing fields, or modifying collection/global
schemas that affect the database:

1. Make the schema change in the code (collection/global config)
2. Run `bunx payload migrate:create` to generate a migration file in `src/migrations/`
3. Commit the migration file alongside the schema change
4. Push — the build script runs `payload migrate --disable-transpile && next build`
   which applies pending migrations before the build starts

**First-time project setup.** This starter ships with **no committed migrations**
(they're project-specific). On a fresh project database, run
`bunx payload migrate:create` once to generate the baseline migration
(Users + Media + Redirects), commit it, then deploy. Local dev against an empty
database auto-creates tables via Drizzle push, so you can start building before
generating the first migration.

**NEVER** run `bun dev` against the production database — it writes a `batch = -1`
marker to `payload_migrations` that triggers an interactive prompt on the next
build, blocking deployment. Use a dedicated dev/staging database (or a throwaway
local one) for development.

Note: Migration files must use `import { sql } from 'drizzle-orm'` (not from
`@payloadcms/db-vercel-postgres`) to avoid ESM re-export issues on Vercel.

### Media Uploads

- `clientUploads: true` — files upload directly from browser to Vercel Blob (no size limit)
- `disablePayloadAccessControl: true` — files served directly from Blob CDN (no proxy through Payload)
- `addRandomSuffix: false` — required to avoid Payload CDN race condition bug (#14709)
- `afterChange` hook auto-generates alt text via Claude (fire-and-forget, uses thumbnail)
- `scripts/clean-orphan-blobs.mjs` — manual bulk orphan cleanup (dry run by default, `--delete` to execute)
- `/api/cron/clean-blobs` — endpoint for orphan cleanup
- `/api/cron/backfill-alt-text` — regenerate alt text for all images (`?all=true` to overwrite existing)
- `/api/cron/backfill-thumbnails` — regenerate missing image sizes

## Redirects

Redirects are managed in /admin via `@payloadcms/plugin-redirects` and enforced
in `src/middleware.ts`.

- **Schema.** The plugin generates a `redirects` collection: `from` (path),
  `to` (an internal reference **or** a custom URL), and a `type` (301/302).
- **Config.** `redirectsPlugin({ collections: ["media"], redirectTypes: ["301", "302"] })`.
  `collections` is the list of doc types a redirect can point to via an internal
  reference — it's seeded with `media` so the reference field has a valid target
  in the base starter. **As you add content collections (pages, posts, …), add
  their slugs here** so editors can redirect to them. Custom-URL redirects (the
  common SEO case: `/old-path` → `/new-path` or an external URL) work regardless.
- **Enforcement.** `src/middleware.ts` fetches `/api/redirects` (backed by
  `cms.getRedirects()` + `unstable_cache`, tag `cms:redirects`, so it doesn't
  wake Neon) and issues the redirect. It fails open — a transient error never
  blocks a request.
- **Invalidation.** The redirects collection's `afterChange`/`afterDelete` hooks
  call `revalidateTag("cms:redirects", "max")`, so edits apply without a deploy.

## Cache & Revalidation

- **No time-based ISR** — public reads go through `unstable_cache` (cache
  forever) and invalidate on-demand when CMS content changes.
- Every collection/global that the frontend reads should bust its cache tag in
  an `afterChange` hook via `revalidateTag(tag, "max")`. Add `revalidatePath()`
  too when a specific prerendered HTML page needs flushing.
- **Dynamic import required**: hooks must use `await import("next/cache")` (not a
  static import) because the Payload CLI loads collection configs outside Next.js
  during migrations.

### Cache + Draft Mode pattern (CRITICAL — read before adding CMS-driven pages)

When a public page calls `await draftMode()` (to power Live Preview), Next.js 16
opts it into dynamic rendering on every request — the page body runs and would
hit Neon for every visitor. To prevent that, **all CMS reads go through
`unstable_cache`** in `src/lib/cms/cached.ts`. The live example today is
redirects; the same shape applies to any collection you add.

```
Reader (page server component / middleware / route handler)
   │
   ├──► cms.getRedirects()                       ← @/lib/cms = cached adapter
   │       │
   │       ├── if (opts?.draft) → uncachedCms.<fn>()   (LIVE preview, hits Neon)
   │       └── else            → unstable_cache(...)    (PUBLIC visit, no Neon)
   │                                       └── tag: "cms:redirects"
   │
   └──► CMS edit fires afterChange hook ─► revalidateTag(tag, "max") [+ revalidatePath]
```

**Rules:**

- **Always import from `@/lib/cms`**, never directly from `./cms/payload`. The
  export `cms` is the cached adapter; `uncachedCms` exists for fresh reads.
- **Pages MAY call `await draftMode()`** and pass `{ draft: isDraft }` into cms
  methods that accept it. The cached adapter bypasses cache when draft is true.
- **NEVER call other dynamic Next APIs** (`cookies()`, `headers()`,
  `unstable_noStore()`) in public-page server components — same dynamic-render
  side effect, no draft-bypass escape hatch.
- **`afterChange` hooks must call `revalidateTag(tag, "max")`** (busts the data
  cache); add `revalidatePath(path)` when prerendered HTML must flush too. Path
  alone won't flush `unstable_cache`.
- **Collections/globals with drafts enabled** must gate revalidation on
  `doc._status === 'published'` — without it, every autosave keystroke
  (~375ms interval) busts the cache and wakes Neon.
- **Always include a `req.context.disableRevalidate` escape hatch** so bulk
  imports / migrations / scripts can skip the cache-bust storm.

If you ever see `cache-control: max-age=0, must-revalidate` on a public page
response, a dynamic API was called somewhere and the cache wrapper isn't doing
its job. Trace it down before shipping.

### Draft Mode + Live Preview

The starter wires the routes but ships no draft-enabled collection. When you add
one (e.g. a `Pages` or `Posts` collection with `versions: { drafts: { autosave } }`):

- Route Live Preview through `/api/draft?secret=$PAYLOAD_SECRET&url=<path>` — it
  enables Next.js `draftMode` (sets a cookie), so the cached adapter falls
  through to the raw Payload local API and the editor sees the latest autosaved
  draft instantly.
- `/api/exit-draft` disables draft mode for users who want to opt out.
- Both routes have a same-origin guard on the redirect target; `/api/draft` also
  requires the `PAYLOAD_SECRET` env var.

### Adding Revalidation to New Collections / Globals

```typescript
afterChange: [
  async ({ doc, req }) => {
    if (req.context.disableRevalidate) return doc;
    try {
      const { revalidatePath, revalidateTag } = await import("next/cache");
      // Tag bust: flushes the cms.* unstable_cache so the next read hits Payload.
      revalidateTag("cms:your-collection", "max");
      // Path bust: flushes prerendered HTML on affected pages (when applicable).
      revalidatePath("/");
      revalidatePath("/your-page");
      if (doc.slug) revalidatePath(`/your-page/${doc.slug}`);
    } catch {}
    return doc;
  },
],
```

For collections/globals **with drafts enabled**, add a status gate (critical for
autosave — otherwise every keystroke busts the cache and wakes Neon):

```typescript
afterChange: [
  async ({ doc, previousDoc, req }) => {
    if (req.context.disableRevalidate) return doc;
    const justPublished = doc._status === "published";
    const justUnpublished =
      previousDoc?._status === "published" && doc._status !== "published";
    if (!justPublished && !justUnpublished) return doc;
    // ...revalidateTag + revalidatePath as above
    return doc;
  },
],
```

### Edge-404 middleware for dynamic routes (extend when needed)

`src/middleware.ts` already exists for redirect enforcement. The moment you add a
`[slug]`/`[id]` route under `(frontend)/` that fetches from a CMS collection,
**extend the middleware to also 410 unknown slugs** at the same time.

**The problem.** Crawlers discover URLs that no longer exist (slug rename, item
deleted). Each dead-slug hit fires a lambda, opens a Neon connection through the
pooler, and pgbouncer holds the backend warm for ~10 minutes — so compute never
suspends. The cache layer doesn't help: dead slugs have no cache entry to hit.

**The fix.** Add a `force-static` `src/app/api/<resource>/valid-slugs/route.ts`
that returns `[slug, …]` (edge-cached, busted by the source collection's
`afterChange` via `revalidatePath("/api/<resource>/valid-slugs")`), then have the
middleware fetch it and return a **410 Gone** for unknown slugs without firing the
page lambda. Use 410, not 404 — Google deindexes 410s faster. Fail open so a
brief slug-list outage never 404s valid pages.

## Neon Connection Tuning

Use Neon's **pooled** endpoint, per Payload's recommendation for serverless
deployments. The `unstable_cache` layer (see "Cache + Draft Mode pattern" above)
is what keeps compute suspended — not the connection-string choice. Two settings
to know:

1. **`POSTGRES_URL` host: use the POOLED endpoint (`-pooler`)**

   ```env
   POSTGRES_URL="postgresql://user:pass@ep-XXX-pooler.region.aws.neon.tech/neondb?sslmode=require"
   ```

   The pooled host routes through Neon's internal pgbouncer in transaction mode,
   which multiplexes many short-lived serverless function connections onto a
   smaller pool of backend Postgres connections. This is what Payload recommends
   for Vercel-style deployments.

   Caveat: Neon's pgbouncer holds each backend connection open for ~10 minutes
   after the last query (its `server_idle_timeout` default), which can delay
   `suspend_timeout` from firing if queries are happening regularly. **In practice
   this doesn't matter** — the cache scheme means public visitors never hit Neon,
   and CMS edits happen in bursts with long quiet periods, so compute suspends
   cleanly between editing sessions.

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

   Default is ~10s. Setting to 1s means a connection used for one request closes
   ~immediately on the **app side**. Neon's pgbouncer keeps its own backend
   connection longer regardless, but closing app-side fast helps with serverless
   cold-restart hygiene and avoids the app-side pool accumulating dead handles.

**Why not the `@neondatabase/serverless` HTTP driver directly:** Payload requires
transactions for atomic writes; the HTTP-only driver doesn't support them.
`@vercel/postgres` (used by the adapter) already imports `@neondatabase/serverless`
under the hood and uses its WebSocket Pool mode, which IS the right call.

**Optional: `idle_session_timeout` on the database**

```sql
ALTER DATABASE neondb SET idle_session_timeout = '5s';
```

Forces Postgres itself to kill backend connections idle >5s. A belt-and-suspenders
measure on low-traffic deployments; not required if the cache layer is solid.

**Verification:** the real cache-health signal is `pg_stat_activity`. During quiet
periods you should see zero application connections holding Neon open (only
Neon-internal `pgbouncer`). If a long-lived backend with an app `application_name`
shows up, something is bypassing the cache layer (a server component calling a
non-cached method, a stray `cookies()`/`headers()` forcing dynamic rendering).

```sql
SELECT application_name, state, COUNT(*),
       MAX(EXTRACT(EPOCH FROM (NOW() - state_change)))::int AS max_idle_s
FROM pg_stat_activity WHERE datname = 'neondb'
GROUP BY application_name, state ORDER BY 3 DESC;
```

## Performance

- Critical-CH headers are scoped to `/admin` only via a post-`withPayload` config
  override (prevents an ~800ms Chromium first-visit penalty on public pages)
- Image formats: avif + webp via next.config; use `quality={60}` on large/LCP images
- Below-fold client components should be lazy-loaded with `next/dynamic`

### Cron alignment (when adding daily crons)

`vercel.json` ships with `crons: []`. When a project adds multiple daily crons
(sync jobs, blob cleanup, etc.), **align them to the same UTC hour** — each cron
wakes Neon and pgbouncer holds compute warm ~10 minutes, so spreading them across
hours means multiple wake windows per day.

```json
"crons": [
  { "path": "/api/cron/clean-blobs", "schedule": "0 6 * * *" }
]
```

`0 6 * * *` (06:00 UTC) is a sensible default for North American audiences
(midnight Mountain). Pick any quiet hour; the principle is "all the same hour."

## Environment Variables

- Never commit secrets to git
- All env vars are documented in `.env.example`. Pull from Vercel with
  `bun run env:pull` (wraps `vercel env pull .env.local`)
- `NEXT_PUBLIC_`-prefixed vars are exposed to the browser — only use for
  non-sensitive values
- **Analytics is configured via env vars**, not a CMS global. Each integration
  enables only when its key is set: `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID`,
  `NEXT_PUBLIC_FB_PIXEL_ID`, `NEXT_PUBLIC_POSTHOG_KEY` (+ `NEXT_PUBLIC_POSTHOG_HOST`).
  Vercel Analytics + Speed Insights are always on.

## ESLint

- Pinned to `^9`. Do not bump to ESLint 10 — `eslint-plugin-react@7.37.x` (pulled
  in transitively by `eslint-config-next`) still calls the deprecated
  `context.getFilename()` API that ESLint 10 removed, so every filename-based rule
  throws on load and `bun run lint` dies before checking a single file. Stay on 9
  until the upstream plugin ecosystem catches up.

## Git

- Do not commit `.env.local` or any `.env` files (except `.env.example`)
- Do not commit `node_modules/` or `.next/`
- Use descriptive commit messages
- Batch pushes to reduce Vercel build minutes — commit frequently, push in batches
