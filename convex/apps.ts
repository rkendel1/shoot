import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

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
  handler: async (ctx, args) => {
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
  handler: async (ctx, args) => {
    let appsQuery = ctx.db.query("generatedApps");

    if (args.specId) {
      appsQuery = appsQuery.withIndex("by_spec", (q) =>
        q.eq("specId", args.specId)
      );
    }

    const apps = await appsQuery.order("desc").collect();

    return apps.map((app) => ({
      id: app._id,
      specId: app.specId,
      name: app.name,
      description: app.description,
      framework: app.framework,
      fileCount: Object.keys(JSON.parse(app.code)).length,
      metadata: app.metadata ? JSON.parse(app.metadata) : null,
      createdAt: app._creationTime,
    }));
  },
});

// Get a specific app
export const getApp = query({
  args: { id: v.id("generatedApps") },
  handler: async (ctx, args) => {
    const app = await ctx.db.get(args.id);

    if (!app) {
      throw new Error("App not found");
    }

    return {
      ...app,
      id: app._id,
      code: JSON.parse(app.code),
      metadata: app.metadata ? JSON.parse(app.metadata) : null,
    };
  },
});

// Delete an app
export const deleteApp = mutation({
  args: { id: v.id("generatedApps") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
