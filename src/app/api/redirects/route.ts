import { cms } from "@/lib/cms";

/**
 * Published redirects as JSON, consumed by `src/proxy.ts` on each request.
 * Reads go through the cached adapter (unstable_cache, tag `cms:redirects`), so
 * this never wakes Neon except on a cache miss after a redirect is edited.
 */
export async function GET() {
  const redirects = await cms.getRedirects();
  return Response.json(redirects);
}
