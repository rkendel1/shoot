import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Generate an app from a spec
export const generateApp = mutation({
  args: {
    specId: v.id("apiSpecs"),
    name: v.string(),
    description: v.optional(v.string()),
    framework: v.string(),
    code: v.string(), // JSON stringified
    metadata: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const appId = await ctx.db.insert("generatedApps", args);

    return {
      id: appId,
      name: args.name,
      framework: args.framework,
    };
  },
});

// Get all generated apps
export const getAllApps = query({
  args: {
    specId: v.optional(v.id("apiSpecs")),
  },
  handler: async (ctx: QueryCtx, args) => {
    const apps = args.specId
      ? await ctx.db
          .query("generatedApps")
          .withIndex("by_spec", (q) => q.eq("specId", args.specId as Id<"apiSpecs">))
          .order("desc")
          .collect()
      : await ctx.db.query("generatedApps").order("desc").collect();

    // Return simpler objects, avoid parsing JSON here
    return apps.map((app) => ({
      id: app._id,
      specId: app.specId,
      name: app.name,
      description: app.description,
      framework: app.framework,
      code: app.code, // Pass the raw code string
      metadata: app.metadata,
      createdAt: app._creationTime,
    }));
  },
});

// Get a specific app
export const getApp = query({
  args: { id: v.id("generatedApps") },
  handler: async (ctx: QueryCtx, args) => {
    const app = await ctx.db.get(args.id);

    if (!app) {
      return null;
    }

    // Return a plain object to avoid type generation issues
    return { ...app };
  },
});

// Delete an app
export const deleteApp = mutation({
  args: { id: v.id("generatedApps") },
  handler: async (ctx: MutationCtx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});