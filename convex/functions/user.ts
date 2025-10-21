import { getAuthUserId } from "@convex-dev/auth/server";
import { internalMutation, mutation, query } from "../_generated/server";
import { ConvexError, v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    const imageURL = user.image ? await ctx.storage.getUrl(user.image) : null;

    return {
      id: user._id,
      name: user.name as string,
      email: user.email as string,
      image: imageURL as string | null,
    };
  },
});

export const setupComplete = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }
    const user = await ctx.db.get(userId);
    if (!user?.name) return false;

    return true;
  },
});

export const getUsernameAvailability = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const found = await ctx.db
      .query("users")
      .withIndex("name", (q) => q.eq("name", args.username))
      .first();
    return !found;
  },
});

export const updateProfile = mutation({
  args: {
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Je bent niet ingelogd");
    }
    await ctx.db.patch(userId, {
      name: args.username,
    });
  },
});

export const removeExistingPicture = internalMutation({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) {
      throw new ConvexError("Gebruiker niet gevonden");
    }
    if (user.image) {
      await ctx.storage.delete(user.image);
    }
  },
});

export const setPicture = internalMutation({
  args: {
    id: v.id("users"),
    image: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      image: args.image,
    });
  },
});

export const getById = query({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) {
      throw new ConvexError("Gebruiker niet gevonden");
    }
    const imageURL = user.image ? await ctx.storage.getUrl(user.image) : null;
    return {
      id: user._id,
      name: user.name,
      image: imageURL,
    };
  },
});
