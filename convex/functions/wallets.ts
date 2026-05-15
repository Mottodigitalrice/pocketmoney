import { v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { getCurrentUser } from "./users";
import { assertOwnedBy } from "../lib/auth";
import { splitEarning as splitEarningPure } from "../lib/walletMath";

const jars = ["spend", "save", "give"] as const;
type Jar = (typeof jars)[number];
const SAVE_INTEREST_APR = 0.1;
const WEEKS_PER_YEAR = 52;

// Re-export so existing import sites (`import { splitEarning } from "./wallets"`)
// continue to work. The lib is the authoritative implementation now.
export const splitEarning = (amount: number): Record<Jar, number> =>
  splitEarningPure(amount);

const jarValidator = v.union(
  v.literal("spend"),
  v.literal("save"),
  v.literal("give")
);

const walletDocValidator = v.object({
  _id: v.id("wallets"),
  _creationTime: v.number(),
  userId: v.id("users"),
  childId: v.id("children"),
  jar: jarValidator,
  balance: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

async function assertChildOwner(ctx: MutationCtx, childId: Id<"children">) {
  const user = await getCurrentUser(ctx);
  const child = assertOwnedBy(await ctx.db.get(childId), user._id, "child");
  return { user, child };
}

export async function ensureWalletsForChild(
  ctx: MutationCtx,
  userId: Id<"users">,
  childId: Id<"children">
) {
  const now = Date.now();
  const wallets = [];

  for (const jar of jars) {
    const existing = await ctx.db
      .query("wallets")
      .withIndex("by_child_jar", (q) => q.eq("childId", childId).eq("jar", jar))
      .unique();

    if (existing) {
      wallets.push(existing);
      continue;
    }

    const walletId = await ctx.db.insert("wallets", {
      userId,
      childId,
      jar,
      balance: 0,
      createdAt: now,
      updatedAt: now,
    });
    const wallet = await ctx.db.get(walletId);
    if (wallet) wallets.push(wallet);
  }

  return wallets;
}

export async function creditApprovedJob(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    childId: Id<"children">;
    jobInstanceId: Id<"jobInstances">;
    amount: number;
    note?: string;
  }
) {
  const wallets = await ensureWalletsForChild(ctx, args.userId, args.childId);
  const split = splitEarning(args.amount);
  const now = Date.now();

  for (const wallet of wallets) {
    const amount = split[wallet.jar];
    if (amount === 0) continue;

    await ctx.db.patch(wallet._id, {
      balance: wallet.balance + amount,
      updatedAt: now,
    });
    await ctx.db.insert("transactions", {
      userId: args.userId,
      childId: args.childId,
      walletId: wallet._id,
      jar: wallet.jar,
      amount,
      type: "earning",
      note: args.note,
      jobInstanceId: args.jobInstanceId,
      createdAt: now,
    });
  }
}

async function creditWallet(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    childId: Id<"children">;
    walletId: Id<"wallets">;
    jar: Jar;
    currentBalance: number;
    amount: number;
    type: "interest" | "migration";
    note: string;
    createdAt?: number;
  }
) {
  if (args.amount <= 0) return;

  const now = args.createdAt ?? Date.now();
  await ctx.db.patch(args.walletId, {
    balance: args.currentBalance + args.amount,
    updatedAt: now,
  });
  await ctx.db.insert("transactions", {
    userId: args.userId,
    childId: args.childId,
    walletId: args.walletId,
    jar: args.jar,
    amount: args.amount,
    type: args.type,
    note: args.note,
    createdAt: now,
  });
}

export async function creditBonus(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    childId: Id<"children">;
    amount: number;
    note?: string;
    type?: "bonus" | "luckyChest";
  }
) {
  const wallets = await ensureWalletsForChild(ctx, args.userId, args.childId);
  const split = splitEarning(args.amount);
  const now = Date.now();

  for (const wallet of wallets) {
    const amount = split[wallet.jar];
    if (amount === 0) continue;

    await ctx.db.patch(wallet._id, {
      balance: wallet.balance + amount,
      updatedAt: now,
    });
    await ctx.db.insert("transactions", {
      userId: args.userId,
      childId: args.childId,
      walletId: wallet._id,
      jar: wallet.jar,
      amount,
      type: args.type ?? "bonus",
      note: args.note,
      createdAt: now,
    });
  }
}

function getJstWeekStart(timestamp: number) {
  const jstOffsetMs = 9 * 60 * 60 * 1000;
  const jstDate = new Date(timestamp + jstOffsetMs);
  const day = jstDate.getUTCDay();
  const diff = jstDate.getUTCDate() - day + (day === 0 ? -6 : 1);
  jstDate.setUTCDate(diff);
  jstDate.setUTCHours(0, 0, 0, 0);
  return jstDate.getTime() - jstOffsetMs;
}

async function getApprovedLifetimeEarnings(
  ctx: MutationCtx,
  childId: Id<"children">
) {
  const instances = await ctx.db
    .query("jobInstances")
    .withIndex("by_child_status", (q) =>
      q.eq("childId", childId).eq("status", "approved")
    )
    .collect();

  let total = 0;
  for (const instance of instances) {
    const job = await ctx.db.get(instance.jobId);
    total += job?.yenAmount ?? 0;
  }
  return total;
}

async function getChildEarningTransactionsTotal(
  ctx: MutationCtx,
  childId: Id<"children">
) {
  const transactions = await ctx.db
    .query("transactions")
    .withIndex("by_child", (q) => q.eq("childId", childId))
    .collect();

  return transactions
    .filter((transaction) => transaction.type === "earning")
    .reduce((sum, transaction) => sum + Math.max(0, transaction.amount), 0);
}

export const getByChild = query({
  args: { childId: v.id("children") },
  returns: v.array(walletDocValidator),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const child = await ctx.db.get(args.childId);
    if (!child) return [];
    assertOwnedBy(child, user._id, "child");

    return await ctx.db
      .query("wallets")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .collect();
  },
});

export const getByFamily = query({
  args: {},
  returns: v.array(walletDocValidator),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const ensureForChild = mutation({
  args: { childId: v.id("children") },
  returns: v.array(walletDocValidator),
  handler: async (ctx, args) => {
    const { user } = await assertChildOwner(ctx, args.childId);
    return await ensureWalletsForChild(ctx, user._id, args.childId);
  },
});

export const migrateLegacyEarnings = mutation({
  args: {},
  returns: v.array(
    v.object({
      childId: v.id("children"),
      migratedAmount: v.number(),
      skipped: v.boolean(),
    })
  ),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const children = await ctx.db
      .query("children")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const results = [];

    for (const child of children) {
      const existingMigration = (
        await ctx.db
          .query("transactions")
          .withIndex("by_child", (q) => q.eq("childId", child._id))
          .collect()
      ).some((transaction) => transaction.type === "migration");

      if (existingMigration) {
        results.push({ childId: child._id, migratedAmount: 0, skipped: true });
        continue;
      }

      const lifetimeEarnings = await getApprovedLifetimeEarnings(ctx, child._id);
      const alreadyCredited = await getChildEarningTransactionsTotal(ctx, child._id);
      const amountToMigrate = Math.max(0, lifetimeEarnings - alreadyCredited);
      const wallets = await ensureWalletsForChild(ctx, user._id, child._id);
      const split = splitEarning(amountToMigrate);

      for (const wallet of wallets) {
        await creditWallet(ctx, {
          userId: user._id,
          childId: child._id,
          walletId: wallet._id,
          jar: wallet.jar,
          currentBalance: wallet.balance,
          amount: split[wallet.jar],
          type: "migration",
          note: "Opening deposit from approved jobs before wallets",
        });
      }

      results.push({
        childId: child._id,
        migratedAmount: amountToMigrate,
        skipped: false,
      });
    }

    return results;
  },
});

export const awardBonus = mutation({
  args: {
    childId: v.id("children"),
    amount: v.number(),
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.amount <= 0) {
      throw new Error("Bonus amount must be positive");
    }

    const { user } = await assertChildOwner(ctx, args.childId);
    await creditBonus(ctx, {
      userId: user._id,
      childId: args.childId,
      amount: Math.round(args.amount),
      note: args.note,
    });
    return null;
  },
});

export const creditWeeklySaveInterest = internalMutation({
  args: {},
  returns: v.object({ credited: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    const weekStart = getJstWeekStart(now);
    const wallets = await ctx.db.query("wallets").collect();
    let credited = 0;

    for (const wallet of wallets) {
      if (wallet.jar !== "save" || wallet.balance <= 0) continue;

      const alreadyCreditedThisWeek = (
        await ctx.db
          .query("transactions")
          .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
          .collect()
      ).some(
        (transaction) =>
          transaction.type === "interest" && transaction.createdAt >= weekStart
      );

      if (alreadyCreditedThisWeek) continue;

      const amount = Math.floor((wallet.balance * SAVE_INTEREST_APR) / WEEKS_PER_YEAR);
      if (amount <= 0) continue;

      await creditWallet(ctx, {
        userId: wallet.userId,
        childId: wallet.childId,
        walletId: wallet._id,
        jar: wallet.jar,
        currentBalance: wallet.balance,
        amount,
        type: "interest",
        note: "Weekly Save jar interest",
        createdAt: now,
      });
      credited += amount;
    }

    return { credited };
  },
});
