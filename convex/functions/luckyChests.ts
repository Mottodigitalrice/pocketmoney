import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { getCurrentUser } from "./users";
import { creditBonus } from "./wallets";
import { assertOwnedBy } from "../lib/auth";

const luckyChestDocValidator = v.object({
  _id: v.id("luckyChests"),
  _creationTime: v.number(),
  userId: v.id("users"),
  childId: v.id("children"),
  weekStart: v.string(),
  amount: v.number(),
  openedAt: v.number(),
});

async function getMustDoProgress(
  ctx: QueryCtx | MutationCtx,
  args: {
    userId: Id<"users">;
    childId: Id<"children">;
    weekDates: string[];
  }
) {
  const scheduled = [];
  for (const date of args.weekDates) {
    const entries = await ctx.db
      .query("scheduledJobs")
      .withIndex("by_child_date", (q) =>
        q.eq("childId", args.childId).eq("date", date)
      )
      .collect();
    scheduled.push(...entries);
  }

  const mustDo = scheduled.filter(
    (entry) => entry.userId === args.userId && entry.priority === "mustDo"
  );
  let approved = 0;

  for (const entry of mustDo) {
    const instances = await ctx.db
      .query("jobInstances")
      .withIndex("by_scheduled_job", (q) => q.eq("scheduledJobId", entry._id))
      .collect();
    if (
      instances.some(
        (instance) =>
          instance.userId === args.userId && instance.status === "approved"
      )
    ) {
      approved += 1;
    }
  }

  return {
    total: mustDo.length,
    approved,
    unlocked: mustDo.length > 0 && approved === mustDo.length,
  };
}

async function getOpenedChest(
  ctx: QueryCtx | MutationCtx,
  childId: Id<"children">,
  weekStart: string
) {
  return await ctx.db
    .query("luckyChests")
    .withIndex("by_child_week", (q) =>
      q.eq("childId", childId).eq("weekStart", weekStart)
    )
    .unique();
}

export const getStatusForFamily = query({
  args: {
    weekDates: v.array(v.string()),
  },
  returns: v.array(
    v.object({
      childId: v.id("children"),
      weekStart: v.string(),
      unlocked: v.boolean(),
      opened: v.boolean(),
      openedAmount: v.optional(v.number()),
      maxAmount: v.number(),
      mustDoTotal: v.number(),
      mustDoApproved: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    if (args.weekDates.length !== 7) {
      throw new Error("Expected a full week of dates");
    }

    const user = await getCurrentUser(ctx);
    const children = await ctx.db
      .query("children")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const maxAmount = user.luckyChestMaxAmount ?? 100;
    const weekStart = args.weekDates[0]!; // safe: length checked above

    return await Promise.all(
      children.map(async (child) => {
        const progress = await getMustDoProgress(ctx, {
          userId: user._id,
          childId: child._id,
          weekDates: args.weekDates,
        });
        const opened = await getOpenedChest(ctx, child._id, weekStart);

        return {
          childId: child._id,
          weekStart,
          unlocked: progress.unlocked,
          opened: Boolean(opened),
          ...(opened?.amount !== undefined
            ? { openedAmount: opened.amount }
            : {}),
          maxAmount,
          mustDoTotal: progress.total,
          mustDoApproved: progress.approved,
        };
      })
    );
  },
});

export const open = mutation({
  args: {
    childId: v.id("children"),
    weekDates: v.array(v.string()),
  },
  returns: v.union(luckyChestDocValidator, v.null()),
  handler: async (ctx, args) => {
    if (args.weekDates.length !== 7) {
      throw new Error("Expected a full week of dates");
    }

    const user = await getCurrentUser(ctx);
    assertOwnedBy(await ctx.db.get(args.childId), user._id, "child");

    const maxAmount = user.luckyChestMaxAmount ?? 100;
    if (maxAmount <= 0) {
      throw new Error("Lucky Chest max amount is not set");
    }

    const weekStart = args.weekDates[0]!; // safe: length checked above
    // (d) Single-open-per-week guard. The `by_child_week` index on
    // `luckyChests` makes this lookup O(1); we throw a structured error
    // here so the frontend can distinguish "already opened" from other
    // failure modes. Previously returned the existing chest silently,
    // which lost the signal that the second tap was a no-op.
    const existing = await getOpenedChest(ctx, args.childId, weekStart);
    if (existing) {
      throw new Error("LUCKY_CHEST_ALREADY_OPENED_THIS_WEEK");
    }

    const progress = await getMustDoProgress(ctx, {
      userId: user._id,
      childId: args.childId,
      weekDates: args.weekDates,
    });
    if (!progress.unlocked) {
      throw new Error("Lucky Chest is still locked");
    }

    const amount = Math.max(1, Math.floor(Math.random() * maxAmount) + 1);
    const openedAt = Date.now();
    const chestId = await ctx.db.insert("luckyChests", {
      userId: user._id,
      childId: args.childId,
      weekStart,
      amount,
      openedAt,
    });

    await creditBonus(ctx, {
      userId: user._id,
      childId: args.childId,
      amount,
      type: "luckyChest",
      note: `Lucky Chest opened for week of ${weekStart}`,
    });

    return await ctx.db.get(chestId);
  },
});
