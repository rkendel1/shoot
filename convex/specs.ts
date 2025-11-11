import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";

// Upload a new API spec
export const uploadSpec = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    version: v.optional(v.string()),
    specType: v.union(
      v.literal("openapi"),
      v.literal("swagger"),
      v.literal("postman"),
      v.literal("other")
    ),
    content: v.string(),
    endpoints: v.any(), // Simplified from a complex object to fix type generation
  },
  handler: async (ctx: MutationCtx, args) => {
    const { endpoints, ...specData } = args;

    // Create the spec
    const specId = await ctx.db.insert("apiSpecs", specData);

    // Create endpoints
    for (const endpoint of endpoints as any[]) {
      await ctx.db.insert("apiEndpoints", {
        specId,
        ...endpoint,
      });
    }

    return {
      id: specId,
      name: args.name,
      endpointCount: (endpoints as any[]).length,
    };
  },
});

// Get all specs
export const getAllSpecs = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    const specs = await ctx.db
      .query("apiSpecs")
      .order("desc")
      .collect();

    // Get endpoint counts for each spec
    const specsWithCounts = await Promise.all(
      specs.map(async (spec) => {
        const endpoints = await ctx.db
          .query("apiEndpoints")
          .withIndex("by_spec", (q) => q.eq("specId", spec._id))
          .collect();

        return {
          id: spec._id,
          name: spec.name,
          description: spec.description,
          version: spec.version,
          specType: spec.specType,
          endpointCount: endpoints.length,
          createdAt: spec._creationTime,
        };
      })
    );

    return specsWithCounts;
  },
});

// Get a specific spec with endpoints
export const getSpec = query({
  args: { id: v.id("apiSpecs") },
  handler: async (ctx: QueryCtx, args) => {
    const spec = await ctx.db.get(args.id);
    
    if (!spec) {
      throw new Error("Spec not found");
    }

    const endpoints = await ctx.db
      .query("apiEndpoints")
      .withIndex("by_spec", (q) => q.eq("specId", args.id))
      .collect();

    return {
      ...spec,
      id: spec._id,
      content: JSON.parse(spec.content),
      endpoints: endpoints.map((e) => ({
        id: e._id,
        path: e.path,
        method: e.method,
        summary: e.summary,
        description: e.description,
        parameters: e.parameters ? JSON.parse(e.parameters) : null,
        requestBody: e.requestBody ? JSON.parse(e.requestBody) : null,
        responses: e.responses ? JSON.parse(e.responses) : null,
      })),
    };
  },
});

// Get endpoints for a spec
export const getEndpoints = query({
  args: { specId: v.id("apiSpecs") },
  handler: async (ctx: QueryCtx, args) => {
    const endpoints = await ctx.db
      .query("apiEndpoints")
      .withIndex("by_spec", (q) => q.eq("specId", args.specId))
      .collect();

    return endpoints;
  },
});

// Delete a spec
export const deleteSpec = mutation({
  args: { id: v.id("apiSpecs") },
  handler: async (ctx: MutationCtx, args) => {
    // Delete all endpoints
    const endpoints = await ctx.db
      .query("apiEndpoints")
      .withIndex("by_spec", (q) => q.eq("specId", args.id))
      .collect();

    for (const endpoint of endpoints) {
      await ctx.db.delete(endpoint._id);
    }

    // Delete all generated apps
    const apps = await ctx.db
      .query("generatedApps")
      .withIndex("by_spec", (q) => q.eq("specId", args.id))
      .collect();

    for (const app of apps) {
      await ctx.db.delete(app._id);
    }

    // Delete all API keys
    const apiKeys = await ctx.db
      .query("apiKeys")
      .withIndex("by_spec", (q) => q.eq("specId", args.id))
      .collect();

    for (const key of apiKeys) {
      await ctx.db.delete(key._id);
    }

    // Delete the spec
    await ctx.db.delete(args.id);

    return { success: true };
  },
});