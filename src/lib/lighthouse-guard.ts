/**
 * Pure guard for the `LIGHTHOUSE_AUDIT` auth bypass — NO Next/Clerk imports so
 * it is unit-testable by manipulating `process.env`.
 *
 * QA-2026-06-06 (F7a): headless Lighthouse / PageSpeed audits cannot complete
 * Clerk's dev-browser handshake, so `LIGHTHOUSE_AUDIT=1` short-circuits the
 * middleware and serves pages without auth. That is a DEV / PREVIEW affordance
 * only and MUST be impossible on a production deployment — even if the env var
 * is accidentally set there. Previously the middleware honored the bypass on
 * `LIGHTHOUSE_AUDIT === "1"` with no environment-tier guard, so a leaked var in
 * prod would have disabled authentication for the entire app.
 *
 * Vercel sets `VERCEL_ENV="production"` on production deployments; we refuse the
 * bypass whenever that is the case. Local audits (no `VERCEL_ENV`) and Vercel
 * preview deploys (`VERCEL_ENV="preview"`) still work.
 */
export function isLighthouseBypassEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  // Hard stop: never bypass auth on a Vercel production deployment.
  if (env.VERCEL_ENV === "production") return false;
  return env.LIGHTHOUSE_AUDIT === "1";
}
