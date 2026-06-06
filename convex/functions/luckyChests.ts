import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { getCurrentUser } from "./users";
import { creditBonus } from "./wallets";
import { assertOwnedBy } from "../lib/auth";
import {
  pickLuckyChestAmount,
  clampLuckyChestMax,
} from "../lib/luckyChestMath";
import { LUCKY_CHEST_COOLDOWN_MS } from "../lib/inputValidation";

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
  },
) {
  const scheduled = [];
  for (const date of args.weekDates) {
    const entries = await ctx.db
      .query("scheduledJobs")
      .withIndex("by_child_date", (q) =>
        q.eq("childId", args.childId).eq("date", date),
      )
      .collect();
    scheduled.push(...entries);
  }

  const mustDo = scheduled.filter(
    (entry) => entry.userId === args.userId && entry.priority === "mustDo",
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
          instance.userId === args.userId && instance.status === "approved",
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
  weekStart: string,
) {
  return await ctx.db
    .query("luckyChests")
    .withIndex("by_child_week", (q) =>
      q.eq("childId", childId).eq("weekStart", weekStart),
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
    }),
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
    // QA-2026-06-06 (F2): clamp legacy/out-of-range stored values at read.
    const maxAmount = clampLuckyChestMax(user.luckyChestMaxAmount ?? 100);
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
      }),
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

    // MED-1 (wave 3a): per-user button-mash cooldown. Week-level
    // idempotency (the `by_child_week` unique lookup below at line ~178)
    // remains the security boundary that guarantees one open per week.
    // This cooldown is purely a UX guard against rapid double-tap on a
    // flaky network — it throws a distinct structured error so the client
    // can show a "wait a moment / 少し待ってからもう一度" toast instead of
    // surfacing the harsher "already opened this week" copy.
    const now = Date.now();
    if (
      user.lastLuckyChestAttemptAt !== undefined &&
      now - user.lastLuckyChestAttemptAt < LUCKY_CHEST_COOLDOWN_MS
    ) {
      throw new Error("LUCKY_CHEST_COOLDOWN");
    }
    // Stamp the attempt timestamp BEFORE doing any DB writes / random work
    // so even if downstream throws (e.g. lock-state changed mid-flight),
    // the next call still observes the cooldown. Convex serializes
    // mutations per document, so this patch+read sequence is safe.
    await ctx.db.patch(user._id, { lastLuckyChestAttemptAt: now });

    // QA-2026-06-06 (F2): clamp at read so a legacy stored value > 10_000
    // (written before the setter enforced the cap) can never make
    // `pickLuckyChestAmount` throw a raw out-of-bounds error to the kid.
    const maxAmount = clampLuckyChestMax(user.luckyChestMaxAmount ?? 100);
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

    const amount = pickLuckyChestAmount(maxAmount);
    const chestId = await ctx.db.insert("luckyChests", {
      userId: user._id,
      childId: args.childId,
      weekStart,
      amount,
      openedAt: now,
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
