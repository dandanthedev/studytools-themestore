import { ThemeJSON } from "./../../lib/themes";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "../_generated/dataModel";
// --- Shared sorting helper ---
function sortThemes(
  themes: {
    downloads: string[];
    likes: string[];
    dislikes: string[];
    updatedAt?: number;
    _id: Id<"themes">;
    name: string;
    description: string;
    data: string;
    published: boolean;
    user: Id<"users">;
  }[],
  sort: string,
  order: string
) {
  // Clone so we don't mutate the original array
  const sorted = [...themes];

  if (sort === "downloads") {
    // ascending by downloads
    sorted.sort((a, b) => a.downloads.length - b.downloads.length);
  } else if (sort === "rating") {
    // ascending by rating (likes - dislikes)
    sorted.sort(
      (a, b) =>
        a.likes.length -
        a.dislikes.length -
        (b.likes.length - b.dislikes.length)
    );
  } else if (sort === "date") {
    // ascending by updated date (oldest first)
    sorted.sort((a, b) => (a?.updatedAt || 0) - (b?.updatedAt || 0));
  }

  // Reverse if descending order requested
  if (order === "desc") {
    sorted.reverse();
  }

  return sorted;
}

// --- getByUser query ---
export const getByUser = query({
  args: {
    userId: v.id("users"),
    sort: v.union(
      v.literal("downloads"),
      v.literal("rating"),
      v.literal("date")
    ),
    order: v.union(v.literal("desc"), v.literal("asc")),
  },
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) || null;
    const isMe = userId === args.userId;

    const themes = isMe
      ? await ctx.db
          .query("themes")
          .withIndex("user", (q) => q.eq("user", args.userId))
          .collect()
      : await ctx.db
          .query("themes")
          .withIndex("user", (q) => q.eq("user", args.userId))
          .filter((q) => q.eq(q.field("published"), true))
          .collect();

    // Apply shared sorting
    const filteredThemes = sortThemes(themes, args.sort, args.order);

    if (!isMe) {
      // Public view
      return filteredThemes.map((theme) => ({
        id: theme._id,
        name: theme.name,
        description: theme.description,
        data: theme.data,
        preview: false,
        likes: theme.likes.length,
        dislikes: theme.dislikes.length,
        downloads: theme.downloads.length,
      }));
    } else {
      // Owner view
      return await Promise.all(
        filteredThemes.map(async (theme) => {
          const update = await ctx.db
            .query("themeUpdates")
            .withIndex("theme", (q) => q.eq("theme", theme._id))
            .first();

          return {
            id: theme._id,
            name: theme.name || update?.name || "",
            description: theme.description || update?.description || "",
            data: theme.data || update?.data || "{}",
            preview: !theme.published,
            likes: theme.likes.length,
            dislikes: theme.dislikes.length,
            downloads: theme.downloads.length,
          };
        })
      );
    }
  },
});

// --- list query ---
export const list = query({
  args: {
    sort: v.union(
      v.literal("downloads"),
      v.literal("rating"),
      v.literal("date")
    ),
    order: v.union(v.literal("desc"), v.literal("asc")),
  },
  handler: async (ctx, args) => {
    const themes = await ctx.db
      .query("themes")
      .filter((q) => q.eq(q.field("published"), true))
      .collect();

    // Apply shared sorting
    const filteredThemes = sortThemes(themes, args.sort, args.order);

    // Attach user info
    const users = await Promise.all(
      filteredThemes.map(async (theme) => {
        const user = await ctx.db.get(theme.user);
        return user;
      })
    );

    // Return formatted results
    return filteredThemes.map((theme, index) => ({
      id: theme._id,
      name: theme.name,
      description: theme.description,
      user: {
        id: theme.user,
        name: users[index]?.name,
      },
      data: theme.data,
      likes: theme.likes.length,
      dislikes: theme.dislikes.length,
      downloads: theme.downloads.length,
    }));
  },
});

export const logDownload = mutation({
  args: {
    id: v.id("themes"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const theme = await ctx.db.get(args.id);
    if (!theme) {
      throw new ConvexError("Thema niet gevonden");
    }

    if (!theme.published && theme.user !== userId) {
      throw new ConvexError("Thema is niet gepubliceerd");
    }

    if (theme.downloads.includes(userId)) {
      return;
    }

    await ctx.db.patch(args.id, {
      downloads: [...theme.downloads, userId],
    });
  },
});

export const data = query({
  args: {
    id: v.id("themes"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const theme = await ctx.db.get(args.id);
    if (!theme) {
      throw new ConvexError("Theme niet gevonden");
    }
    if (!theme.published && theme.user !== userId) {
      throw new ConvexError("Thema is niet gepubliceerd");
    }

    if (theme.user === userId) {
      const update = await ctx.db
        .query("themeUpdates")
        .withIndex("theme", (q) => q.eq("theme", args.id))
        .first();
      if (update && update.data) {
        return JSON.parse(update.data);
      }
    }

    return theme.data.length > 0 ? JSON.parse(theme.data) : ({} as ThemeJSON);
  },
});

export const userRatingStatus = query({
  args: {
    id: v.id("themes"),
  },
  returns: v.union(v.literal("like"), v.literal("dislike"), v.null()),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const theme = await ctx.db.get(args.id);
    if (!theme) {
      return null;
    }

    if (theme.likes.includes(userId)) {
      return "like";
    }
    if (theme.dislikes.includes(userId)) {
      return "dislike";
    }

    return null;
  },
});

export const rate = mutation({
  args: {
    id: v.id("themes"),
    status: v.union(v.literal("like"), v.literal("dislike")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Je bent niet ingelogd");
    }

    const theme = await ctx.db.get(args.id);
    if (!theme) {
      throw new ConvexError("Thema niet gevonden");
    }

    if (args.status === "like") {
      if (theme.dislikes.includes(userId)) {
        theme.dislikes = theme.dislikes.filter((id) => id !== userId);
      }

      if (theme.likes.includes(userId)) {
        theme.likes = theme.likes.filter((id) => id !== userId);
      } else {
        theme.likes.push(userId);
      }
    } else if (args.status === "dislike") {
      if (theme.likes.includes(userId)) {
        theme.likes = theme.likes.filter((id) => id !== userId);
      }

      if (theme.dislikes.includes(userId)) {
        theme.dislikes = theme.dislikes.filter((id) => id !== userId);
      } else {
        theme.dislikes.push(userId);
      }
    }

    await ctx.db.patch(args.id, {
      likes: theme.likes,
      dislikes: theme.dislikes,
    });
  },
});
