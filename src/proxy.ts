import { NextResponse, type NextRequest } from "next/server";
import type { Redirect } from "@/lib/cms/types";

/**
 * Enforces the redirects managed in /admin (via @payloadcms/plugin-redirects).
 *
 * Fetches the cached `/api/redirects` list (backed by unstable_cache, so no
 * Neon hit) and matches the request path. Fails open — a transient error never
 * blocks a request.
 *
 * Next.js 16 renamed the `middleware` file convention to `proxy`; the exported
 * function is `proxy` and the matcher `config` export is unchanged.
 */
export async function proxy(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;

  try {
    const res = await fetch(`${origin}/api/redirects`, {
      next: { tags: ["cms:redirects"] },
    });
    if (res.ok) {
      const redirects = (await res.json()) as Redirect[];
      const match = redirects.find((r) => r.from === pathname);
      if (match) {
        const destination = /^https?:\/\//.test(match.to)
          ? match.to
          : new URL(match.to, origin).toString();
        return NextResponse.redirect(
          destination,
          match.type === "302" ? 302 : 301,
        );
      }
    }
  } catch {
    // fail open — never block a request because redirects couldn't load
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals, static files, the admin panel, and API routes
  // (which includes /api/redirects itself — prevents a fetch loop).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|admin|api/).*)"],
};
