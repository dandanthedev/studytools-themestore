import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "../_generated/dataModel";

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
        ...theme,
        preview: !theme.published,
      }));
    else {
      return await Promise.all(
        themes.map(async (theme) => {
          const update = await ctx.db
            .query("themeUpdates")
            .withIndex("theme", (q) => q.eq("theme", theme._id))
            .first();
          return {
            ...theme,
            name: theme.name || update?.name || "",
            description: theme.description || update?.description || "",
            data: theme.data || update?.data || "{}",
            preview: !theme.published,
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
      ...theme,
      userName: users[index]?.name,
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

    if (theme.downloads.includes(userId)) {
      return;
    }

    await ctx.db.patch(args.id, {
      downloads: [...theme.downloads, userId],
    });
  },
});
