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

    await ctx.scheduler.runAfter(0, internal.functions.myThemes.notifyMe, {
      themeName: theme.name,
      status: args.status,
    });
  },
});

export const notifyMe = internalAction({
  args: {
    themeName: v.string(),
    status: v.boolean(),
  },
  handler: async (ctx, args) => {
    await fetch(
      "https://discord.com/api/channels/" +
        process.env.DISCORD_CHANNEL_ID +
        "/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bot " + process.env.DISCORD_TOKEN,
        },
        body: JSON.stringify({
          embeds: [
            {
              description: `Review status ${args.status ? "ingestuurd" : "ingetrokken"} voor ${args.themeName}`,
              color: 0x00ff00,
              author: {
                name: "StudyTools",
              },
            },
          ],
        }),
      }
    )
      .then((res) => res.json())
      .then((res) => {
        console.log(res);
        return res;
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
