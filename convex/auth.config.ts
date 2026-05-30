// Convex auth provider config. `domain` is the Clerk Frontend API URL, which is
// the issuer (`iss`) of the JWTs Convex validates. `applicationID` MUST match
// the `aud` (audience) claim of the Clerk "convex" JWT template — both are the
// literal string "convex".
//
// IMPORTANT: a Clerk JWT template named exactly "convex" (audience "convex")
// must exist in this Clerk instance. Without it, `getToken({ template: "convex" })`
// returns nothing, Convex receives requests as `identityType: "unknown"`, and
// every auth-gated function (e.g. users.upsertFromClerk) throws "Not authenticated".
//
// `domain` is env-driven so dev and prod can point at their own Clerk
// instances; it falls back to the current dev instance so behavior is
// unchanged when CLERK_JWT_ISSUER_DOMAIN is unset. Set it per Convex
// deployment with `npx convex env set CLERK_JWT_ISSUER_DOMAIN https://...`.
const authConfig = {
  providers: [
    {
      domain:
        process.env.CLERK_JWT_ISSUER_DOMAIN ??
        "https://bursting-beagle-83.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};

export default authConfig;
