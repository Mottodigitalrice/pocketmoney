import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { MutationCtx, QueryCtx } from "../_generated/server";

const userDocValidator = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  clerkId: v.string(),
  email: v.string(),
  name: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  captainCodeEnabled: v.optional(v.boolean()),
  luckyChestMaxAmount: v.optional(v.number()),
  createdAt: v.number(),
});

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

// Get user by Clerk ID. Returns null if unauthenticated, looking up someone
// else's id, or no row yet — never throws so the client onboarding gate can
// run pre-row-creation.
export const getByClerkId = query({
  args: { clerkId: v.string() },
  returns: v.union(userDocValidator, v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.subject !== args.clerkId) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

// Get current user from session identity. Returns null when no session or no
// user row yet (pre-onboarding).
export const getCurrent = query({
  args: {},
  returns: v.union(userDocValidator, v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

// Check if user has completed onboarding (has at least one child).
export const hasCompletedOnboarding = query({
  args: { clerkId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.subject !== args.clerkId) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return false;

    const firstChild = await ctx.db
      .query("children")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return firstChild !== null;
  },
});

// Create or update user from Clerk. Implicitly self-owned (key = identity.subject).
export const upsertFromClerk = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
      });
      return existingUser._id;
    } else {
      return await ctx.db.insert("users", {
        clerkId: identity.subject,
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
        captainCodeEnabled: false,
        luckyChestMaxAmount: 100,
        createdAt: Date.now(),
      });
    }
  },
});

export const setCaptainCodeEnabled = mutation({
  args: {
    enabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    await ctx.db.patch(user._id, {
      captainCodeEnabled: args.enabled,
    });
    return null;
  },
});

export const setLuckyChestMaxAmount = mutation({
  args: {
    amount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (args.amount < 0) {
      throw new Error("Lucky Chest max must be zero or higher");
    }

    await ctx.db.patch(user._id, {
      luckyChestMaxAmount: Math.round(args.amount),
    });
    return null;
  },
});
