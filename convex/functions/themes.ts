import { ThemeJSON } from "./../../lib/themes";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

function wilsonScore(
  likes: number,
  dislikes: number,
  downloads: number,
  alpha: number = 0.03
) {
  const n = likes + dislikes + alpha * downloads;
  if (n === 0) return 0;

  const z = 1.96; // 95% confidence
  const p = likes / n;
  const numerator =
    p +
    (z * z) / (2 * n) -
    z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  const denominator = 1 + (z * z) / n;
  return numerator / denominator;
}

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

    if (args.sort === "downloads") {
      themes.sort((a, b) => b.downloads.length - a.downloads.length);
    } else if (args.sort === "rating") {
      const themesWithRatings = themes.map((theme) => ({
        ...theme,
        rating: wilsonScore(
          theme.likes.length,
          theme.dislikes.length,
          theme.downloads.length
        ),
      }));
      themesWithRatings.sort((a, b) => b.rating - a.rating);
    } else if (args.sort === "date") {
      themes.sort(
        (a, b) => (a?.updatedAt || Date.now()) - (b?.updatedAt || Date.now())
      );
    }

    if (args.order === "desc") {
      themes.reverse();
    }

    if (!isMe)
      return themes.map((theme) => ({
        id: theme._id,
        name: theme.name,
        description: theme.description,
        data: theme.data,
        preview: false,
        likes: theme.likes.length,
        dislikes: theme.dislikes.length,
        downloads: theme.downloads.length,
      }));
    else {
      return await Promise.all(
        themes.map(async (theme) => {
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

    if (args.sort === "downloads") {
      themes.sort((a, b) => b.downloads.length - a.downloads.length);
    } else if (args.sort === "rating") {
      const themesWithRatings = themes.map((theme) => ({
        ...theme,
        rating: wilsonScore(
          theme.likes.length,
          theme.dislikes.length,
          theme.downloads.length
        ),
      }));
      themesWithRatings.sort((a, b) => b.rating - a.rating);
    } else if (args.sort === "date") {
      themes.sort(
        (a, b) => (a?.updatedAt || Date.now()) - (b?.updatedAt || Date.now())
      );
    }

    if (args.order === "desc") {
      themes.reverse();
    }

    const users = await Promise.all(
      themes.map(async (theme) => {
        const user = await ctx.db.get(theme.user);
        return user;
      })
    );

    return themes.map((theme, index) => ({
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
      throw new ConvexError("Je bent niet ingelogd");
    }

    const theme = await ctx.db.get(args.id);
    if (!theme) {
      throw new ConvexError("Thema niet gevonden");
    }

    if (!theme.published) {
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
    if (!theme.published) {
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
