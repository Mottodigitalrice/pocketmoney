/**
 * clerk-wipe.mjs — one-off script to delete ALL users from a Clerk instance.
 *
 * DESTRUCTIVE. Talks to the Clerk Backend REST API with plain `fetch` (no npm
 * dependency). It targets WHICHEVER instance the supplied secret key belongs
 * to — `sk_live_...` hits your PRODUCTION instance, `sk_test_...` hits your
 * test/dev instance. Read the secret-key prefix it prints before confirming.
 *
 * Usage:
 *
 *   # SAFE default — counts users + prints a few emails, deletes NOTHING:
 *   CLERK_SECRET_KEY=sk_test_... node scripts/clerk-wipe.mjs
 *
 *   # ACTUALLY delete every user (irreversible):
 *   CLERK_SECRET_KEY=sk_live_... node scripts/clerk-wipe.mjs --yes
 *
 * Or via npm: `npm run wipe:clerk` (dry-run) / `npm run wipe:clerk -- --yes`.
 *
 * Pairs with `convex/functions/admin.ts:clearAllUsers` — wipe Clerk users with
 * this script, wipe the Convex mirror + app data with that mutation.
 */

const CLERK_API = "https://api.clerk.com/v1";
const PAGE_SIZE = 100;
// Small delay between DELETEs to stay under Clerk's rate limits.
const DELETE_DELAY_MS = 120;

const secretKey = process.env.CLERK_SECRET_KEY;
const confirmed = process.argv.includes("--yes");

if (!secretKey) {
  console.error(
    "ERROR: CLERK_SECRET_KEY is not set.\n" +
      "Usage: CLERK_SECRET_KEY=sk_live_... node scripts/clerk-wipe.mjs [--yes]",
  );
  process.exit(1);
}

const keyPrefix = secretKey.startsWith("sk_live_")
  ? "sk_live_ (PRODUCTION)"
  : secretKey.startsWith("sk_test_")
    ? "sk_test_ (test/dev)"
    : `${secretKey.slice(0, 8)}… (unknown)`;

const authHeaders = {
  Authorization: `Bearer ${secretKey}`,
  "Content-Type": "application/json",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * GET the total user count from Clerk's dedicated count endpoint.
 * @returns {Promise<number>}
 */
async function fetchUserCount() {
  const res = await fetch(`${CLERK_API}/users/count`, { headers: authHeaders });
  if (!res.ok) {
    throw new Error(
      `GET /users/count failed: ${res.status} ${await res.text()}`,
    );
  }
  const body = await res.json();
  // Clerk returns { object: "total_count", total_count: N }.
  return typeof body.total_count === "number" ? body.total_count : 0;
}

/**
 * Paginate GET /users until the API returns fewer than PAGE_SIZE rows.
 * @returns {Promise<Array<{ id: string, email: string }>>}
 */
async function fetchAllUsers() {
  const users = [];
  let offset = 0;

  for (;;) {
    const url = `${CLERK_API}/users?limit=${PAGE_SIZE}&offset=${offset}`;
    const res = await fetch(url, { headers: authHeaders });
    if (!res.ok) {
      throw new Error(
        `GET /users (offset=${offset}) failed: ${res.status} ${await res.text()}`,
      );
    }

    const page = await res.json();
    if (!Array.isArray(page) || page.length === 0) {
      break;
    }

    for (const u of page) {
      const primaryId = u.primary_email_address_id;
      const emails = Array.isArray(u.email_addresses) ? u.email_addresses : [];
      const primary = emails.find((e) => e.id === primaryId) ?? emails[0];
      users.push({
        id: u.id,
        email: primary?.email_address ?? "(no email)",
      });
    }

    if (page.length < PAGE_SIZE) {
      break;
    }
    offset += PAGE_SIZE;
  }

  return users;
}

/**
 * DELETE a single user. Returns true on success, false on failure (logged).
 * @param {{ id: string, email: string }} user
 * @returns {Promise<boolean>}
 */
async function deleteUser(user) {
  const res = await fetch(`${CLERK_API}/users/${user.id}`, {
    method: "DELETE",
    headers: authHeaders,
  });
  if (!res.ok) {
    console.error(
      `  ✗ failed to delete ${user.email} (${user.id}): ${res.status} ${await res.text()}`,
    );
    return false;
  }
  return true;
}

async function main() {
  console.log(`Clerk instance key: ${keyPrefix}`);
  console.log(`Mode: ${confirmed ? "DELETE (--yes)" : "DRY RUN (default)"}\n`);

  const countBefore = await fetchUserCount();
  console.log(`Users reported by /users/count: ${countBefore}`);

  const users = await fetchAllUsers();
  console.log(`Users fetched via pagination:   ${users.length}`);

  if (users.length === 0) {
    console.log("\nNothing to delete. Done.");
    return;
  }

  const preview = users.slice(0, 5).map((u) => `  - ${u.email} (${u.id})`);
  console.log("\nFirst few users:");
  console.log(preview.join("\n"));
  if (users.length > 5) {
    console.log(`  …and ${users.length - 5} more`);
  }

  if (!confirmed) {
    console.log(
      "\nDRY RUN — no users were deleted. Re-run with --yes to delete them all.",
    );
    return;
  }

  console.log(`\nDeleting ${users.length} users…`);
  let deleted = 0;
  let failed = 0;

  for (const [i, user] of users.entries()) {
    const ok = await deleteUser(user);
    if (ok) {
      deleted += 1;
      console.log(`  ✓ [${i + 1}/${users.length}] ${user.email}`);
    } else {
      failed += 1;
    }
    await sleep(DELETE_DELAY_MS);
  }

  const countAfter = await fetchUserCount().catch(() => "unknown");
  console.log(
    `\nDone. Deleted ${deleted}, failed ${failed}.\n` +
      `Count before: ${countBefore} → after: ${countAfter}`,
  );

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("\nFATAL:", err.message ?? err);
  process.exit(1);
});
