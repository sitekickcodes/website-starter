import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

/**
 * Enables Next.js draft mode for Payload Live Preview, then redirects to the
 * target page. Called by Payload's preview iframe via
 * /api/draft?url=<page-path>&secret=<PAYLOAD_SECRET>.
 *
 * Once draftMode is enabled (cookie set), the redirected page render bypasses
 * the ISR cache and the CMS adapter fetches the latest draft revision.
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const url = request.nextUrl.searchParams.get("url") || "/";

  if (!process.env.PAYLOAD_SECRET || secret !== process.env.PAYLOAD_SECRET) {
    return new Response("Invalid secret", { status: 401 });
  }

  // Same-origin guard: refuse anything that could escape to an external host.
  if (!url.startsWith("/") || url.startsWith("//")) {
    return new Response("Invalid url", { status: 400 });
  }

  const draft = await draftMode();
  draft.enable();
  redirect(url);
}
