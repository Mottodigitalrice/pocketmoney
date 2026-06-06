import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { getCurrentUser } from "./users";
import { ensureWalletsForChild } from "./wallets";
import { deleteJobInstanceAndProof } from "./jobInstances";
import { assertOwnedByOrNull } from "../lib/auth";
import {
  CHILD_CASCADE_TABLES,
  type ChildCascadeTable,
} from "../lib/childCascade";
import {
  assertChildName,
  assertChildIcon,
  assertChildAge,
} from "../lib/inputValidation";

const childDocValidator = v.object({
  _id: v.id("children"),
  _creationTime: v.number(),
  userId: v.id("users"),
  name: v.string(),
  icon: v.string(),
  age: v.optional(v.number()),
  rankMultiplier: v.optional(v.number()),
  createdAt: v.number(),
});

// Get all children for a family, sorted by creation date
export const getByFamily = query({
  args: {},
  returns: v.array(childDocValidator),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db
      .query("children")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("asc")
      .collect();
  },
});

// Create a new child
export const create = mutation({
  args: {
    name: v.string(),
    icon: v.string(),
    age: v.optional(v.number()),
  },
  returns: v.id("children"),
  handler: async (ctx, args) => {
    // QA-2026-06-06 (F9): bound name/icon/age (defense-in-depth; the UI
    // validates too). `assertChildAge` also stops a fractional/absurd age
    // from poisoning the `rankMultiplier` division below.
    assertChildName(args.name);
    assertChildIcon(args.icon);
    if (args.age !== undefined) assertChildAge(args.age);

    const user = await getCurrentUser(ctx);
    const siblings = await ctx.db
      .query("children")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const ages = siblings
      .map((sibling) => sibling.age)
      .filter((age): age is number => typeof age === "number" && age > 0);
    const oldestAge =
      args.age && args.age > 0 ? Math.max(args.age, ...ages) : undefined;
    const rankMultiplier =
      args.age && args.age > 0 && oldestAge ? oldestAge / args.age : 1;

    const childId = await ctx.db.insert("children", {
      userId: user._id,
      name: args.name,
      icon: args.icon,
      ...(args.age !== undefined ? { age: args.age } : {}),
      rankMultiplier,
      createdAt: Date.now(),
    });
    await ensureWalletsForChild(ctx, user._id, childId);
    return childId;
  },
});

// Update a child's name, icon, or age
export const update = mutation({
  args: {
    childId: v.id("children"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
    age: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // QA-2026-06-06 (F9): validate any field actually supplied in the patch.
    if (args.name !== undefined) assertChildName(args.name);
    if (args.icon !== undefined) assertChildIcon(args.icon);
    if (args.age !== undefined) assertChildAge(args.age);

    const user = await getCurrentUser(ctx);
    const child = assertOwnedByOrNull(
      await ctx.db.get(args.childId),
      user._id,
      "child",
    );
    if (!child) return null;

    const { childId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined),
    );
    await ctx.db.patch(childId, filteredUpdates);
    return null;
  },
});

// Remove a child and all their job instances, scheduled jobs, wallets,
// transactions, goals and lucky chests. Idempotent.
export const remove = mutation({
  args: { childId: v.id("children") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const child = assertOwnedByOrNull(
      await ctx.db.get(args.childId),
      user._id,
      "child",
    );
    if (!child) return null;

    // Delete all job instances for this child
    const instances = await ctx.db
      .query("jobInstances")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .collect();

    for (const instance of instances) {
      const exists = await ctx.db.get(instance._id);
      if (exists) await deleteJobInstanceAndProof(ctx, exists);
    }

    // Delete all scheduled jobs for this child (no by_child index on
    // scheduledJobs alone, so iterate by_user and filter)
    const scheduled = await ctx.db
      .query("scheduledJobs")
      .withIndex("by_user", (q) => q.eq("userId", child.userId))
      .collect();

    for (const sj of scheduled) {
      if (sj.childId === args.childId) {
        const exists = await ctx.db.get(sj._id);
        if (exists) await ctx.db.delete(sj._id);
      }
    }

    // (a) Track-B cascade: wallets, transactions, goals, luckyChests.
    // Single source of truth = `CHILD_CASCADE_TABLES` from
    // `convex/lib/childCascade.ts`. If you add a per-child table, append
    // it there and the loop below picks it up — the corresponding test
    // in `__tests__/edge-cases.test.ts` will fail until both update.
    await cascadeChildSimpleTables(ctx, args.childId);

    await ctx.db.delete(args.childId);
    return null;
  },
});

/**
 * Walk every table in `CHILD_CASCADE_TABLES` by its `by_child` index and
 * delete each row keyed on `childId`. Idempotent: re-running after a
 * partial failure simply finds nothing on the second pass.
 *
 * Tables in scope (Track B + earlier): wallets, transactions, goals,
 * luckyChests. jobInstances + scheduledJobs are handled separately in
 * `children.remove` because they need proof-storage cleanup and a
 * non-`by_child` index walk respectively.
 *
 * Note: we dispatch per-table rather than looping with a dynamic table
 * name because Convex's `ctx.db.query(tableName)` is strongly typed and
 * a generic loop would lose the index-key relationship at compile time.
 * The order tracks `CHILD_CASCADE_TABLES` and the test pins it.
 */
async function cascadeChildSimpleTables(
  ctx: MutationCtx,
  childId: Id<"children">,
) {
  // Compile-time guard: if a new table is added to CHILD_CASCADE_TABLES,
  // this switch must be updated. The default-case `assertNever` enforces
  // exhaustiveness.
  for (const table of CHILD_CASCADE_TABLES) {
    await cascadeOneTable(ctx, table, childId);
  }
}

async function cascadeOneTable(
  ctx: MutationCtx,
  table: ChildCascadeTable,
  childId: Id<"children">,
) {
  switch (table) {
    case "wallets": {
      const rows = await ctx.db
        .query("wallets")
        .withIndex("by_child", (q) => q.eq("childId", childId))
        .collect();
      for (const row of rows) await ctx.db.delete(row._id);
      return;
    }
    case "transactions": {
      const rows = await ctx.db
        .query("transactions")
        .withIndex("by_child", (q) => q.eq("childId", childId))
        .collect();
      for (const row of rows) await ctx.db.delete(row._id);
      return;
    }
    case "goals": {
      const rows = await ctx.db
        .query("goals")
        .withIndex("by_child", (q) => q.eq("childId", childId))
        .collect();
      for (const row of rows) await ctx.db.delete(row._id);
      return;
    }
    case "luckyChests": {
      const rows = await ctx.db
        .query("luckyChests")
        .withIndex("by_child", (q) => q.eq("childId", childId))
        .collect();
      for (const row of rows) await ctx.db.delete(row._id);
      return;
    }
    default: {
      const _exhaustive: never = table;
      throw new Error(`Unhandled cascade table: ${_exhaustive}`);
    }
  }
}
