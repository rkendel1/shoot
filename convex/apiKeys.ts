import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx, internalQuery } from "./_generated/server";

// Add an API key
export const addApiKey = mutation({
  args: {
    specId: v.id("apiSpecs"),
    keyName: v.string(),
    keyValue: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const id = await ctx.db.insert("apiKeys", args);
    return {
      id,
      keyName: args.keyName,
      message: "API key added successfully",
    };
  },
});

// Get API keys for a spec
export const getApiKeys = query({
  args: { specId: v.id("apiSpecs") },
  handler: async (ctx: QueryCtx, args) => {
    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_spec", (q) => q.eq("specId", args.specId))
      .collect();

    // Mask the key values for security
    return keys.map((k) => ({
      id: k._id,
      keyName: k.keyName,
      keyValue: maskKey(k.keyValue),
      description: k.description,
      createdAt: k._creationTime,
    }));
  },
});

// Internal query to get the raw key value, not exposed to the client
export const getApiKeyInternal = internalQuery({
  args: { id: v.id("apiKeys") },
  handler: async (ctx, args) => {
    const key = await ctx.db.get(args.id);
    return key ? { ...key } : null;
  },
});

// Delete an API key
export const deleteApiKey = mutation({
  args: { id: v.id("apiKeys") },
  handler: async (ctx: MutationCtx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

function maskKey(key: string): string {
  if (key.length <= 8) return "***";
  return key.substring(0, 4) + "..." + key.substring(key.length - 4);
}