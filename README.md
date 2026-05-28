# Sitekick Payload Starter

A pre-configured Next.js + Payload CMS starter for Sitekick projects. Clone it, connect your services, and start building.

## Quick Start

```bash
# Clone the repo
git clone https://github.com/sitekickcodes/payload-starter.git my-site
cd my-site

# Install dependencies
bun install

# Pull environment variables from Vercel
bun run env:pull   # wraps `vercel env pull .env.local`

# Start dev server
bun dev
```

> **No Vercel project linked yet?** Copy the template instead: `cp .env.example .env.local` and fill in the values by hand.

Open [http://localhost:3000](http://localhost:3000) for the site, and [http://localhost:3000/admin](http://localhost:3000/admin) for the Payload admin panel.

On first visit to the admin, you'll be prompted to create your first user.

## Stack

- **Next.js 16** — App Router, React Server Components, TypeScript
- **Payload CMS 3** — Headless CMS at `/admin`, dark theme
- **Neon Postgres** — Database via `@payloadcms/db-vercel-postgres`
- **Vercel Blob** — File/image storage
- **Tailwind CSS v4** — Utility-first styling with CSS variables
- **shadcn/ui** — Component library using Base UI
- **Resend** — Transactional email
- **Bun** — Package manager and runtime
- **Deployed on Vercel**

## Connecting Services

### Neon Postgres
1. Create a Neon project at [neon.tech](https://neon.tech)
2. Copy the connection string into `POSTGRES_URL` in `.env.local`
3. Or add the Neon integration in your Vercel project (auto-sets `POSTGRES_URL`)

> **Use the pooler endpoint.** Point `POSTGRES_URL` at the host that ends in
> `-pooler.<region>.aws.neon.tech` (Neon's PgBouncer endpoint), not the direct
> compute endpoint. The Vercel integration does this automatically. PgBouncer
> 1.21+ supports prepared statements in transaction mode, so Drizzle works
> against the pooler with no extra config — and you get warm connections,
> which materially shortens cold-start latency on serverless. See Neon's
> [connection pooling docs](https://neon.tech/docs/connect/connection-pooling).

### Vercel Blob
1. Add Blob storage in your Vercel project dashboard
2. Copy the token into `BLOB_READ_WRITE_TOKEN` in `.env.local`

### Payload Secret
Generate one with: `openssl rand -base64 32`

## Collections & Globals

### Collections

| Collection | Description |
|------------|-------------|
| **Pages** | SEO metadata for each route — auto-synced from filesystem on init |
| **Media** | Image/PDF uploads with auto-generated alt text, thumbnail/card/desktop sizes |
| **Contact Submissions** | Contact form entries (read-only card view in admin) |
| **Newsletter Submissions** | Email subscribers (read-only in admin) |
| **Users** | Auth-enabled. Fields: email, name, role (admin/editor) |

### Globals

| Global | Description |
|--------|-------------|
| **Site Settings** | Site name, contact info, analytics, social links, scripts, redirects |

## CMS Layer

Frontend pages import from `@/lib/cms` — never directly from Payload:

```tsx
import { cms } from "@/lib/cms";

export default async function Home() {
  const settings = await cms.getSiteSettings();
  return <h1>{settings.siteName}</h1>;
}
```

| File | Purpose |
|------|---------|
| `src/lib/cms/types.ts` | Content interfaces (`Page`, `SiteSettings`, `CMSImage`, etc.) |
| `src/lib/cms/payload.ts` | Data-fetching functions using Payload's local API |
| `src/lib/cms/index.ts` | Re-exports from payload.ts |

## Fonts

| Token | Font | Usage |
|-------|------|-------|
| `font-sans` | Geist Sans | Body text, UI elements |
| `font-mono` | Geist Mono | Code, technical content |
| `font-display` | Instrument Serif | Headings, quotes, display text |

## Typography Classes

Pre-built utility classes in `globals.css`. All sizes are 12px minimum for accessibility.

| Class | Size | Font |
|-------|------|------|
| `.h1`–`.h6` | 64px → 18px | Instrument Serif |
| `.body-lg` | 18px | Geist Sans |
| `.body-md` | 16px | Geist Sans |
| `.body-sm` | 14px | Geist Sans |
| `.type-lead` | 20px | Geist Sans |
| `.type-button` | 14px | Geist Sans (medium) |
| `.type-eyebrow` | 12px | Geist Sans (uppercase) |
| `.type-caption` | 12px | Geist Sans |
| `.type-overline` | 12px | Geist Sans (uppercase) |
| `.type-quote` | 20px | Instrument Serif (italic) |

## Adding Components

```bash
bunx shadcn@latest add button dialog dropdown-menu
```

Components are installed to `src/components/ui/`.

## Form Protection

| Layer | What it does |
|-------|-------------|
| **Cloudflare Turnstile** | Invisible CAPTCHA — verifies humans server-side |
| **Honeypot field** | Hidden field that bots fill in — silently swallowed |
| **Rate limiting** | Per-IP throttling (5/min contact, 10/min newsletter) |

Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` to enable. Forms work without keys in local dev.

## Project Structure

```
src/
  app/
    (frontend)/         # Site pages, layout, globals.css
    (payload)/          # Payload admin & API routes (auto-generated)
    api/                # Custom API routes (forms, cron, etc.)
  collections/          # Payload CMS collection configs
  globals/              # Payload CMS global configs
  components/
    layout/             # Header, footer, nav
    marketing/          # Newsletter form
    contact/            # Contact form
    tracking/           # PostHog, analytics
    payload/            # Payload admin customizations
    ui/                 # shadcn/ui components
  lib/
    cms/                # CMS layer (types, payload adapter, re-export)
    utils.ts            # cn() class merge utility
  hooks/                # Custom React hooks
  payload.config.ts     # Payload CMS configuration
  payload-types.ts      # Auto-generated Payload types
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start dev server |
| `bun run build` | Run migrations + production build |
| `bun start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run generate:types` | Regenerate Payload TypeScript types |
| `bun run env:pull` | Pull env vars from Vercel (`vercel env pull .env.local`) |

## Deploying to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add integrations — **Neon Postgres** + **Blob Storage**
4. Set `PAYLOAD_SECRET` environment variable
5. Deploy — migrations run automatically before each build

## License

MIT
