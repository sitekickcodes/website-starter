import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

/**
 * Disables Next.js draft mode and redirects to the requested page (or home).
 * Hit from a public "Exit Preview" link or directly to opt out of preview.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url") || "/";

  if (!url.startsWith("/") || url.startsWith("//")) {
    return new Response("Invalid url", { status: 400 });
  }

  const draft = await draftMode();
  draft.disable();
  redirect(url);
}
