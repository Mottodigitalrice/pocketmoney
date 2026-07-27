/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";
import { convexTest, type TestConvex } from "convex-test";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

/**
 * SEC-2026-07-18 (CRITICAL) — Lucky Chest mint-forge regression.
 *
 * `luckyChests.open` keys its once-per-week guard on `weekStart =
 * weekDates[0]`. It used to validate only `weekDates.length === 7`, so a client
 * could rotate/permute/pad the 7 client-supplied dates to produce a different
 * `weekStart` on every call — each one missing the `by_child_week` lookup — and
 * mint an unbounded number of Lucky Chest bonuses per real week. `creditBonus`
 * moved real (virtual) yen on each call.
 *
 * These tests drive the REAL mutation (not a predicate) and prove:
 *   1. a legit open works once,
 *   2. re-opening the SAME week is rejected (the guard still holds),
 *   3. the forge (rotated/padded/non-Monday week) is now rejected up front,
 *   4. exactly ONE luckyChests row + one credit ever exists for the week.
 *
 * Before the fix, tests 2-forge and 4 fail (a 2nd chest is minted).
 */

const modules = import.meta.glob("../convex/**/*.ts");
type T = TestConvex<typeof schema>;

/** Canonical Mon→Sun week (7 UTC date strings) containing `iso`. */
function mondayWeek(iso: string): string[] {
  const d = new Date(`${iso}T00:00:00.000Z`);
  const day = d.getUTCDay();
  const toMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + toMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday);
    x.setUTCDate(monday.getUTCDate() + i);
    return x.toISOString().slice(0, 10);
  });
}

const WEEK = mondayWeek("2026-06-03"); // Mon 2026-06-01 … Sun 2026-06-07

/**
 * Seed a family with a child whose Lucky Chest is UNLOCKED for WEEK: one
 * mustDo job scheduled on WEEK[0] with an approved jobInstance.
 */
async function seedUnlockedChest(t: T, subject: string) {
  const { userId, childId } = await t.run(async (ctx) => {
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      clerkId: subject,
      email: `${subject}@test.local`,
      captainCodeEnabled: false,
      luckyChestMaxAmount: 100,
      createdAt: now,
    });
    const childId = await ctx.db.insert("children", {
      userId,
      name: "Chest Kid",
      icon: "shark",
      rankMultiplier: 1,
      createdAt: now,
    });
    const jobId = await ctx.db.insert("jobs", {
      userId,
      title: "Tidy room",
      yenAmount: 100,
      icon: "star",
      createdAt: now,
    });
    const scheduledJobId = await ctx.db.insert("scheduledJobs", {
      userId,
      jobId,
      childId,
      date: WEEK[0]!,
      priority: "mustDo",
      createdAt: now,
    });
    await ctx.db.insert("jobInstances", {
      userId,
      jobId,
      childId,
      scheduledJobId,
      status: "approved",
      approvedAt: now,
      createdAt: now,
    });
    return { userId, childId };
  });
  return { userId, childId, asUser: t.withIdentity({ subject }) };
}

/** Clear the per-user 5s button-mash cooldown so it doesn't mask the week guard. */
async function resetCooldown(t: T, userId: Id<"users">) {
  await t.run(async (ctx) => {
    await ctx.db.patch(userId, { lastLuckyChestAttemptAt: 0 });
  });
}

async function countChests(t: T, childId: Id<"children">) {
  return await t.run(async (ctx) =>
    (
      await ctx.db
        .query("luckyChests")
        .withIndex("by_child", (q) => q.eq("childId", childId))
        .collect()
    ).length,
  );
}

describe("luckyChests.open — mint-forge regression (SEC-2026-07-18)", () => {
  it("opens once for a legit unlocked week", async () => {
    const t = convexTest(schema, modules);
    const { childId, asUser } = await seedUnlockedChest(t, "fam-happy");

    const chest = await asUser.mutation(api.functions.luckyChests.open, {
      childId,
      weekDates: WEEK,
    });

    expect(chest).not.toBeNull();
    expect(chest?.weekStart).toBe(WEEK[0]);
    expect(await countChests(t, childId)).toBe(1);
  });

  it("rejects a second open of the SAME week (guard holds)", async () => {
    const t = convexTest(schema, modules);
    const { userId, childId, asUser } = await seedUnlockedChest(t, "fam-again");

    await asUser.mutation(api.functions.luckyChests.open, {
      childId,
      weekDates: WEEK,
    });
    await resetCooldown(t, userId);

    await expect(
      asUser.mutation(api.functions.luckyChests.open, {
        childId,
        weekDates: WEEK,
      }),
    ).rejects.toThrow(/LUCKY_CHEST_ALREADY_OPENED_THIS_WEEK/);

    expect(await countChests(t, childId)).toBe(1);
  });

  it("BLOCKS the forge: rotating weekDates cannot mint a second chest", async () => {
    const t = convexTest(schema, modules);
    const { userId, childId, asUser } = await seedUnlockedChest(t, "fam-forge");

    // Legit first open.
    await asUser.mutation(api.functions.luckyChests.open, {
      childId,
      weekDates: WEEK,
    });
    await resetCooldown(t, userId);

    // The exploit: same 7 real dates, rotated so weekDates[0] differs. The real
    // approved-mustDo date (WEEK[0]) is still present in the array, so the
    // unlock check would pass — the ONLY thing stopping a re-mint is that the
    // week is no longer canonical (day 0 is not a Monday).
    const rotated = [...WEEK.slice(1), WEEK[0]!];
    await expect(
      asUser.mutation(api.functions.luckyChests.open, {
        childId,
        weekDates: rotated,
      }),
    ).rejects.toThrow(/INVALID_WEEK/);

    // ...and padding the array with fabricated dates is rejected too.
    await resetCooldown(t, userId);
    const padded = [WEEK[0]!, "2026-07-01", ...WEEK.slice(1, 6)];
    await expect(
      asUser.mutation(api.functions.luckyChests.open, {
        childId,
        weekDates: padded,
      }),
    ).rejects.toThrow(/INVALID_WEEK/);

    // Exactly one chest ever minted for the week.
    expect(await countChests(t, childId)).toBe(1);
  });

  it("rejects a malformed (non-Monday, length!=7, impossible-date) week before any mint", async () => {
    const t = convexTest(schema, modules);
    const { childId, asUser } = await seedUnlockedChest(t, "fam-malformed");

    for (const bad of [
      WEEK.slice(0, 6), // wrong length
      [...WEEK.slice(1), "2026-06-08"], // Tue-started
      (() => {
        const b = [...WEEK];
        b[3] = "2026-02-30";
        return b;
      })(), // impossible date inside
    ]) {
      await expect(
        asUser.mutation(api.functions.luckyChests.open, {
          childId,
          weekDates: bad,
        }),
      ).rejects.toThrow(/INVALID_/);
    }

    expect(await countChests(t, childId)).toBe(0);
  });
});
