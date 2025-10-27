import { getAuthUserId } from "@convex-dev/auth/server";
import { internalAction, mutation, query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";

function validateData(data: string) {
  console.log("data to parse", data);
  try {
    JSON.parse(data);
    return true;
  } catch {
    return false;
  }
}

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Je bent niet ingelogd");
    }
    const theme = await ctx.db.insert("themes", {
      name: "",
      description: "",
      data: "",
      user: userId,
      published: false,
      downloads: [],
      likes: [],
      dislikes: [],
    });
    await ctx.db.insert("themeUpdates", {
      theme: theme,
      name: args.name,
      description: args.description,
      initial: true,
    });

    return theme;
  },
});

export const edit = mutation({
  args: {
    id: v.id("themes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    data: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Je bent niet ingelogd");
    }

    if (args.data && !validateData(args.data)) {
      throw new ConvexError("Thema bestand ongeldig");
    }

    const theme = await ctx.db.get(args.id);
    if (!theme) {
      throw new ConvexError("Thema niet gevonden");
    }

    if (theme.user !== userId) {
      throw new ConvexError(
        "Je hebt geen toestemming om dit thema te bewerken"
      );
    }

    const existingUpdate = await ctx.db
      .query("themeUpdates")
      .withIndex("theme", (q) => q.eq("theme", args.id))
      .first();
    if (!existingUpdate) {
      await ctx.db.insert("themeUpdates", {
        theme: args.id,
        name: args.name,
        description: args.description,
        data: args.data,
        initial: false,
      });
    } else {
      if (existingUpdate.sentForApproval)
        throw new ConvexError("Thema is in afwachting van goedkeuring");
      await ctx.db.patch(existingUpdate._id, {
        name: args.name,
        description: args.description,
        data: args.data,
      });
    }
  },
});

export const sendForApproval = mutation({
  args: {
    id: v.id("themes"),
    status: v.boolean(),
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

    if (theme.user !== userId) {
      throw new ConvexError(
        "Je hebt geen toestemming om dit thema te bewerken"
      );
    }

    const existingUpdate = await ctx.db
      .query("themeUpdates")
      .withIndex("theme", (q) => q.eq("theme", args.id))
      .first();
    if (!existingUpdate) {
      throw new ConvexError("Geen updates om te verzenden");
    }

    if (theme.data.length < 1) {
      if (!existingUpdate?.data || existingUpdate.data.length < 1)
        throw new ConvexError("Je moet nog een data bestand toevoegen");
    }

    await ctx.db.patch(existingUpdate._id, {
      sentForApproval: args.status,
    });

    await ctx.db.patch(args.id, {
      updateNote: "",
    });

    const user = await ctx.db.get(userId);
    if (user && (user.role === "admin" || user.role === "trusted")) {
      await ctx.runMutation(internal.functions.admin.acceptTheme, {
        id: existingUpdate._id,
      });
    } else {
      await ctx.scheduler.runAfter(0, internal.functions.myThemes.notifyMe, {
        //o wat prachtig
        themeName:
          theme.name.length > 0
            ? theme.name
            : existingUpdate?.name && existingUpdate.name.length > 0
              ? existingUpdate.name
              : "(Geen)",
        status: args.status,
      });
    }
  },
});
export const notifyMe = internalAction({
  args: {
    themeName: v.string(),
    status: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!process.env.DISCORD_WEBHOOK_URL) return;

    const color = args.status ? 0x57f287 : 0xed4245; // green for sent, red for withdrawn
    const statusText = args.status
      ? "✅ Review ingestuurd"
      : "❌ Review ingetrokken";

    const embed = {
      title: statusText,
      url: process.env.SITE_URL + "/admin",
      description: `**Thema:** ${args.themeName}`,
      color,

      timestamp: new Date().toISOString(),
      thumbnail: {
        url: args.status
          ? "https://cdn-icons-png.flaticon.com/512/845/845646.png"
          : "https://cdn-icons-png.flaticon.com/512/1828/1828843.png",
      },
    };

    await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: "[@everyone]",
        embeds: [embed],
      }),
    });
  },
});

export const canPublish = query({
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

    if (theme.user !== userId) {
      throw new ConvexError(
        "Je hebt geen toestemming om dit thema te bewerken"
      );
    }

    const existingUpdate = await ctx.db
      .query("themeUpdates")
      .withIndex("theme", (q) => q.eq("theme", args.id))
      .first();

    if (existingUpdate?.initial) return false;
    if (theme.name.length < 1) return false;
    if (theme.description.length < 1) return false;
    if (theme.data.length < 1) return false;

    return true;
  },
});

export const publish = mutation({
  args: {
    id: v.id("themes"),
    status: v.boolean(),
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

    if (theme.user !== userId) {
      throw new ConvexError(
        "Je hebt geen toestemming om dit thema te bewerken"
      );
    }

    const existingUpdate = await ctx.db
      .query("themeUpdates")
      .withIndex("theme", (q) => q.eq("theme", args.id))
      .first();

    if (existingUpdate && existingUpdate.initial) {
      throw new ConvexError("Thema moet goedgekeurd worden voor publicatie.");
    }

    await ctx.db.patch(args.id, {
      published: args.status,
    });
  },
});

export const remove = mutation({
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

    if (theme.user !== userId) {
      throw new ConvexError(
        "Je hebt geen toestemming om dit thema te verwijderen"
      );
    }
    const updates = await ctx.db
      .query("themeUpdates")
      .withIndex("theme", (q) => q.eq("theme", args.id))
      .collect();
    for (const update of updates) {
      await ctx.db.delete(update._id);
    }
    await ctx.db.delete(args.id);
  },
});

export const awaitingApproval = query({
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

    if (theme.user !== userId) {
      throw new ConvexError(
        "Je hebt geen toestemming om dit thema te bewerken"
      );
    }

    const existingUpdate = await ctx.db
      .query("themeUpdates")
      .withIndex("theme", (q) => q.eq("theme", args.id))
      .first();

    if (existingUpdate && existingUpdate.sentForApproval) {
      return true;
    }

    return false;
  },
});

export const get = query({
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
      return null;
    }

    if (theme.user !== userId) {
      throw new ConvexError(
        "Je hebt geen toestemming om dit thema te bewerken"
      );
    }

    const update = await ctx.db
      .query("themeUpdates")
      .withIndex("theme", (q) => q.eq("theme", args.id))
      .first();

    return {
      id: theme._id,
      name: {
        live: theme.name,
        updated: update?.name || null,
      },
      description: {
        live: theme.description,
        updated: update?.description || null,
      },
      data: {
        live: theme.data,
        updated: update?.data || null,
      },
      published: theme.published,

      updateNote: theme.updateNote || null,
    };
  },
});
