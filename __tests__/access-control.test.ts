/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";
import { convexTest, type TestConvex } from "convex-test";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

/**
 * QA-2026-06-06 — Wave 2: access control + input validation (F7 backend, F9).
 *
 * Cross-family negative tests: a caller from family B must never read or mutate
 * family A's child / wallet / job / goal. The scoping already exists
 * (`getCurrentUser` + `assertOwnedBy`); these tests LOCK it so a future refactor
 * can't silently regress it. Plus F9 child/goal input bounds.
 */

const modules = import.meta.glob("../convex/**/*.ts");
type T = TestConvex<typeof schema>;

async function seedUser(t: T, subject: string) {
  const userId = await t.run(async (ctx) =>
    ctx.db.insert("users", {
      clerkId: subject,
      email: `${subject}@test.local`,
      captainCodeEnabled: false,
      luckyChestMaxAmount: 100,
      createdAt: Date.now(),
    }),
  );
  return { userId, asUser: t.withIdentity({ subject }) };
}

async function seedChildJobGoal(t: T, userId: Id<"users">) {
  return await t.run(async (ctx) => {
    const now = Date.now();
    const childId = await ctx.db.insert("children", {
      userId,
      name: "A Kid",
      icon: "shark",
      rankMultiplier: 1,
      createdAt: now,
    });
    await ctx.db.insert("wallets", {
      userId,
      childId,
      jar: "spend",
      balance: 500,
      createdAt: now,
      updatedAt: now,
    });
    const jobId = await ctx.db.insert("jobs", {
      userId,
      title: "A Job",
      yenAmount: 100,
      icon: "star",
      createdAt: now,
    });
    const goalId = await ctx.db.insert("goals", {
      userId,
      childId,
      title: "A Goal",
      targetAmount: 1000,
      emoji: "🎯",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    return { childId, jobId, goalId };
  });
}

describe("cross-family access control (family B cannot touch family A)", () => {
  it("blocks reading and mutating another family's child/wallet/job/goal", async () => {
    const t = convexTest(schema, modules);
    const { userId: aId } = await seedUser(t, "family_A");
    const { asUser: asB } = await seedUser(t, "family_B");
    const { childId, jobId, goalId } = await seedChildJobGoal(t, aId);

    // Reads.
    await expect(
      asB.query(api.functions.wallets.getByChild, { childId }),
    ).rejects.toThrow(/Not your child/);
    await expect(
      asB.query(api.functions.transactions.getByChild, { childId }),
    ).rejects.toThrow(/Not your child/);
    await expect(
      asB.query(api.functions.goals.getByChild, { childId }),
    ).rejects.toThrow(/Not your child/);
    await expect(
      asB.query(api.functions.jobs.getById, { jobId }),
    ).rejects.toThrow(/Not your job/);

    // Mutations.
    await expect(
      asB.mutation(api.functions.children.update, {
        childId,
        name: "hacked",
      }),
    ).rejects.toThrow(/Not your child/);
    await expect(
      asB.mutation(api.functions.children.remove, { childId }),
    ).rejects.toThrow(/Not your child/);
    await expect(
      asB.mutation(api.functions.transactions.withdraw, {
        childId,
        jar: "spend",
        amount: 100,
        reason: "cashOut",
      }),
    ).rejects.toThrow(/Not your child/);
    await expect(
      asB.mutation(api.functions.wallets.awardBonus, { childId, amount: 100 }),
    ).rejects.toThrow(/Not your child/);
    await expect(
      asB.mutation(api.functions.jobs.update, { jobId, title: "hacked" }),
    ).rejects.toThrow(/Not your job/);
    await expect(
      asB.mutation(api.functions.goals.create, {
        childId,
        title: "x",
        targetAmount: 100,
        emoji: "🎯",
      }),
    ).rejects.toThrow(/Not your child/);

    // And A's data is untouched.
    void goalId;
    const stillThere = await t.run(async (ctx) => ctx.db.get(childId));
    expect(stillThere).not.toBeNull();
    expect(stillThere?.name).toBe("A Kid");
  });
});

describe("F9 child input validation", () => {
  it("rejects empty/whitespace name, over-long name, and bad ages", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await seedUser(t, "f9_child");

    await expect(
      asUser.mutation(api.functions.children.create, {
        name: "",
        icon: "shark",
      }),
    ).rejects.toThrow(/INPUT_OUT_OF_BOUNDS/);
    await expect(
      asUser.mutation(api.functions.children.create, {
        name: "   ",
        icon: "shark",
      }),
    ).rejects.toThrow(/INPUT_OUT_OF_BOUNDS/);
    await expect(
      asUser.mutation(api.functions.children.create, {
        name: "x".repeat(41),
        icon: "shark",
      }),
    ).rejects.toThrow(/INPUT_OUT_OF_BOUNDS/);
    await expect(
      asUser.mutation(api.functions.children.create, {
        name: "OK",
        icon: "shark",
        age: 99,
      }),
    ).rejects.toThrow(/INPUT_OUT_OF_BOUNDS/);
    await expect(
      asUser.mutation(api.functions.children.create, {
        name: "OK",
        icon: "shark",
        age: 5.5,
      }),
    ).rejects.toThrow(/INPUT_OUT_OF_BOUNDS/);

    // A valid child goes through.
    const id = await asUser.mutation(api.functions.children.create, {
      name: "Momo",
      icon: "shark",
      age: 7,
    });
    expect(id).toBeTruthy();
  });
});

describe("F9 goal input validation", () => {
  it("rejects non-positive / fractional target, empty title and emoji", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUser(t, "f9_goal");
    const childId = await t.run(async (ctx) =>
      ctx.db.insert("children", {
        userId,
        name: "Kid",
        icon: "crab",
        rankMultiplier: 1,
        createdAt: Date.now(),
      }),
    );

    await expect(
      asUser.mutation(api.functions.goals.create, {
        childId,
        title: "Bike",
        targetAmount: 0,
        emoji: "🚲",
      }),
    ).rejects.toThrow(/AMOUNT_OUT_OF_BOUNDS/);
    await expect(
      asUser.mutation(api.functions.goals.create, {
        childId,
        title: "Bike",
        targetAmount: 10.5,
        emoji: "🚲",
      }),
    ).rejects.toThrow(/AMOUNT_NOT_INTEGER/);
    await expect(
      asUser.mutation(api.functions.goals.create, {
        childId,
        title: "  ",
        targetAmount: 1000,
        emoji: "🚲",
      }),
    ).rejects.toThrow(/INPUT_OUT_OF_BOUNDS/);
    await expect(
      asUser.mutation(api.functions.goals.create, {
        childId,
        title: "Bike",
        targetAmount: 1000,
        emoji: "",
      }),
    ).rejects.toThrow(/INPUT_OUT_OF_BOUNDS/);

    const id = await asUser.mutation(api.functions.goals.create, {
      childId,
      title: "Bike",
      targetAmount: 1000,
      emoji: "🚲",
    });
    expect(id).toBeTruthy();
  });
});
