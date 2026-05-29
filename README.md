# Sitekick Payload Starter

A minimal, **un-opinionated** Next.js + Payload CMS starter. It ships the
infrastructure — migrations, a Neon-friendly cache/draft architecture, Vercel
Blob uploads with AI alt text, redirects, and analytics wiring — and gets out of
the way on schema and design. Clone it, connect your services, and build.

> **What's intentionally not here:** no content collections beyond `Users` +
> `Media`, no globals, no header/footer/nav, no typography system, no fonts
> beyond **Inter**, and no preinstalled shadcn components. Add schema and design
> per project. See `CLAUDE.md` for the full rationale and conventions.

## Quick Start

```bash
git clone https://github.com/sitekickcodes/payload-starter.git my-site
cd my-site

bun install

# Pull env vars from a linked Vercel project…
bun run env:pull            # wraps `vercel env pull .env.local`
# …or copy the template and fill it in by hand:
# cp .env.example .env.local

bun dev
```

Open [localhost:3000](http://localhost:3000) for the site and
[localhost:3000/admin](http://localhost:3000/admin) for the Payload admin. On
first visit to the admin you'll create your first user.

## Stack

- **Next.js 16** — App Router, RSC, TypeScript (Node 24)
- **Payload CMS 3** — admin at `/admin`, dark theme
- **Neon Postgres** — via `@payloadcms/db-vercel-postgres`
- **Vercel Blob** — file/image storage
- **Tailwind CSS v4** — with **Inter** as the only typeface
- **shadcn/ui** — installed per project (`bunx shadcn@latest add <x>`)
- **Resend** — transactional/auth email
- **Bun** — package manager and runtime

## Connecting Services

| Service | What to set | Notes |
|---|---|---|
| **Neon Postgres** | `POSTGRES_URL` | Use the **pooled** host (`…-pooler.<region>.aws.neon.tech`). The Vercel Neon integration sets this automatically. |
| **Vercel Blob** | `BLOB_READ_WRITE_TOKEN` | Add Blob storage in the Vercel dashboard. |
| **Payload** | `PAYLOAD_SECRET` | Generate with `openssl rand -base64 32`. |
| **Resend** (optional) | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Powers Payload auth/transactional email. |
| **Anthropic** (optional) | `ANTHROPIC_API_KEY` | Auto-generates media alt text. |
| **Analytics** (optional) | `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_FB_PIXEL_ID`, `NEXT_PUBLIC_POSTHOG_KEY` | Each enables only when its key is set. Vercel Analytics + Speed Insights are always on. |

See `.env.example` for the full list.

## First-Time Database Setup

This starter ships with **no committed migrations** (they're project-specific).
On a fresh project database:

```bash
bunx payload migrate:create   # generates the baseline (Users + Media + Redirects)
```

Commit the generated file in `src/migrations/`. From then on, `bun run build`
runs `payload migrate` before `next build`, so deploys apply migrations
automatically. Local dev against an empty DB auto-creates tables via Drizzle
push, so you can start building before generating the first migration.

> **Never** run `bun dev` against your production database — it writes a
> `batch = -1` marker that blocks the next build. Use a dev/staging DB.

## Collections

| Collection | Description |
|---|---|
| **Users** | Auth-enabled (admin login). |
| **Media** | Uploads to Vercel Blob, AI-generated alt text, responsive sizes. |
| **Redirects** | From `@payloadcms/plugin-redirects` — manage 301/302 redirects in /admin; enforced by `src/middleware.ts`. |

Add your own collections in `src/collections/` and register them in
`src/payload.config.ts`, then run `bun run generate:types`.

## Architecture Highlights

- **CMS layer** (`src/lib/cms/`) — import from `@/lib/cms`, never Payload
  directly. Reads are wrapped in `unstable_cache` so public traffic doesn't wake
  Neon; CMS edits invalidate via `revalidateTag`.
- **Redirects** — managed in /admin, enforced in `src/middleware.ts` via a cached
  `/api/redirects` lookup.
- **Draft mode / Live Preview** — `/api/draft` + `/api/exit-draft` are wired for
  when you add a draft-enabled collection.
- **Neon tuning** — pooled endpoint + aggressive idle timeouts so compute
  suspends between editing sessions.

The full conventions — caching, migrations, Neon tuning, redirects, adding
collections — live in **`CLAUDE.md`**.

## Adding UI

```bash
bunx shadcn@latest add button card dialog
```

Components install to `src/components/ui/`. Style with Tailwind utilities and the
shadcn color tokens; there's no prebuilt typography system to fight.

## Scripts

| Command | Description |
|---|---|
| `bun dev` | Start dev server |
| `bun run build` | Run migrations + production build |
| `bun start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run generate:types` | Regenerate Payload types |
| `bun run migrate:create` | Create a migration from schema changes |
| `bun run env:pull` | Pull env vars from Vercel |

## Deploying to Vercel

1. Push to GitHub and import the project in Vercel
2. Add the **Neon Postgres** + **Blob** integrations
3. Set `PAYLOAD_SECRET` (and any optional keys)
4. Commit your baseline migration (see above)
5. Deploy — migrations run automatically before each build

## License

MIT
