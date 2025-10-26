import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
const http = httpRouter();

auth.addHttpRoutes(http);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function replyJSON(body: object, status: number = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
    status,
  });
}

http.route({
  path: "/updatePicture",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      headers: corsHeaders,
    });
  }),
});

http.route({
  path: "/updatePicture",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return replyJSON({ error: "Not logged in" }, 401);
    }
    const blob = await request.blob();
    //check if size is less than 1mb
    if (blob.size > 1024 * 1024) {
      return replyJSON({ error: "Picture too large" }, 400);
    }
    await ctx.runMutation(internal.functions.user.removeExistingPicture, {
      id: userId,
    });

    const storageId = await ctx.storage.store(blob);

    await ctx.runMutation(internal.functions.user.setPicture, {
      id: userId,
      image: storageId,
    });

    return replyJSON({ success: true });
  }),
});

http.route({
  path: "/previewData",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      headers: corsHeaders,
    });
  }),
});

http.route({
  path: "/previewData",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const urlParsed = new URL(request.url);
    const themeId = urlParsed.searchParams.get("id") as Id<"themes">;
    if (!themeId) {
      return replyJSON({ error: "No theme id provided" }, 400);
    }

    const theme = await ctx.runQuery(api.functions.themes.data, {
      id: themeId,
    });

    if (!theme) {
      return replyJSON({ error: "Theme not found" }, 404);
    }

    return replyJSON(theme);
  }),
});

export default http;
