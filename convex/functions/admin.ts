import { getAuthUserId } from "@convex-dev/auth/server";
import { internalMutation, mutation, query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";

export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return false;
    }

    return user.role === "admin";
  },
});

export const themesToReview = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Je bent niet ingelogd");
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError("Je bent niet ingelogd");
    }

    if (user.role !== "admin") throw new ConvexError("Je bent geen admin");

    const updates = await ctx.db
      .query("themeUpdates")
      .withIndex("sentForApproval", (q) => q.eq("sentForApproval", true))
      .collect();

    const originals = await Promise.all(
      updates.map(async (update) => {
        const theme = await ctx.db.get(update.theme);
        return theme;
      })
    );

    return updates.map((update, index) => ({
      update,
      original: originals[index],
    }));
  },
});

export const sendResponse = mutation({
  args: {
    id: v.id("themeUpdates"),
    accepted: v.boolean(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Je bent niet ingelogd");
    }

    const update = await ctx.db.get(args.id);
    if (!update) {
      throw new ConvexError("Update niet gevonden");
    }

    if (!args.accepted) {
      await ctx.db.patch(update.theme, {
        updateNote: args.reason,
      });
      await ctx.db.patch(args.id, {
        sentForApproval: false,
      });
    } else {
      await ctx.runMutation(internal.functions.admin.acceptTheme, {
        id: args.id,
      });
    }
  },
});

export const acceptTheme = internalMutation({
  args: {
    id: v.id("themeUpdates"),
  },
  handler: async (ctx, args) => {
    const update = await ctx.db.get(args.id);
    if (!update) {
      throw new ConvexError("Update niet gevonden");
    }
    console.log(update);

    const edits: Record<string, string> = {};
    if (update.name) edits.name = update.name;
    if (update.description) edits.description = update.description;
    if (update.data) edits.data = update.data;

    await ctx.db.patch(update.theme, {
      ...edits,
      updateNote: "Automatisch goedgekeurd op " + new Date().toLocaleString(),
      updatedAt: Date.now(),
      published: true,
    });
    await ctx.db.delete(args.id);
  },
});
