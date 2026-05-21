import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

/**
 * LIGHTHOUSE_AUDIT=1 bypass — when set, this middleware short-circuits and
 * returns NextResponse.next() without running Clerk. Use only for headless
 * audits (Lighthouse, PageSpeed) where Clerk's dev-browser handshake blocks
 * scraping. NEVER set in production. See README "Running Lighthouse locally".
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
  if (process.env.LIGHTHOUSE_AUDIT === "1") {
    return NextResponse.next(); // bypass Clerk auth for headless Lighthouse runs
  }
  return clerkHandler(req, event);
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
