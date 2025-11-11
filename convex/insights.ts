import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

// Save AI-generated insights
export const saveInsights = mutation({
  args: {
    specId: v.id("apiSpecs"),
    insights: v.string(),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Delete old insights for this spec
    const oldInsights = await ctx.db
      .query("insights")
      .withIndex("by_spec", (q) => q.eq("specId", args.specId))
      .collect();

    for (const insight of oldInsights) {
      await ctx.db.delete(insight._id);
    }

    // Save new insights
    const id = await ctx.db.insert("insights", {
      specId: args.specId,
      insights: args.insights,
      createdAt: Date.now(),
    });

    return { id };
  },
});

// Get insights for a spec
export const getInsights = query({
  args: { specId: v.id("apiSpecs") },
  handler: async (ctx: QueryCtx, args) => {
    const insights = await ctx.db
      .query("insights")
      .withIndex("by_spec", (q) => q.eq("specId", args.specId))
      .first();

    if (!insights) return null;

    return {
      ...insights,
      insights: insights.insights, // Return as string
    };
  },
});

// Save a workflow
export const saveWorkflow = mutation({
  args: {
    specId: v.id("apiSpecs"),
    name: v.string(),
    description: v.string(),
    steps: v.string(),
    complexity: v.string(),
    code: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const id = await ctx.db.insert("workflows", args);
    return { id };
  },
});

// Get workflows for a spec
export const getWorkflows = query({
  args: { specId: v.id("apiSpecs") },
  handler: async (ctx: QueryCtx, args) => {
    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_spec", (q) => q.eq("specId", args.specId))
      .collect();

    return workflows.map((w) => ({
      ...w,
      steps: w.steps, // Return as string
      code: w.code, // Return as string
    }));
  },
});

// Save a remix
export const saveRemix = mutation({
  args: {
    specId: v.id("apiSpecs"),
    name: v.string(),
    description: v.string(),
    innovation: v.string(),
    endpointsUsed: v.string(),
    implementation: v.string(),
  },
  handler: async (ctx: MutationCtx, args) => {
    const id = await ctx.db.insert("remixes", args);
    return { id };
  },
});

// Get remixes for a spec
export const getRemixes = query({
  args: { specId: v.id("apiSpecs") },
  handler: async (ctx: QueryCtx, args) => {
    const remixes = await ctx.db
      .query("remixes")
      .withIndex("by_spec", (q) => q.eq("specId", args.specId))
      .collect();

    return remixes.map((r) => ({
      ...r,
      endpointsUsed: r.endpointsUsed, // Return as string
      implementation: r.implementation, // Return as string
    }));
  },
});