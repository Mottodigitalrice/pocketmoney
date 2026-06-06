import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import {
  NextResponse,
  type NextRequest,
  type NextFetchEvent,
} from "next/server";
import { isLighthouseBypassEnabled } from "@/lib/lighthouse-guard";

/**
 * LIGHTHOUSE_AUDIT=1 bypass — when set (and NOT on a Vercel production
 * deployment), this middleware short-circuits and returns NextResponse.next()
 * without running Clerk. Use only for headless audits (Lighthouse, PageSpeed)
 * where Clerk's dev-browser handshake blocks scraping. The production-tier
 * guard lives in `isLighthouseBypassEnabled` (`@/lib/lighthouse-guard`) so the
 * bypass is impossible in prod even if the env var leaks there.
 */

const isPublicRoute = createRouteMatcher([
  "/landing(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL("/landing", req.url));
    }
  }
});

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (isLighthouseBypassEnabled()) {
    return NextResponse.next(); // bypass Clerk auth for headless Lighthouse runs (never in prod)
  }
  return clerkHandler(req, event);
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
