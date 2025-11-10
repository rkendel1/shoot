import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Add an API key
export const addApiKey = mutation({
  args: {
    specId: v.id("apiSpecs"),
    keyName: v.string(),
    keyValue: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
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
  handler: async (ctx, args) => {
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

// Delete an API key
export const deleteApiKey = mutation({
  args: { id: v.id("apiKeys") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

function maskKey(key: string): string {
  if (key.length <= 8) return "***";
  return key.substring(0, 4) + "..." + key.substring(key.length - 4);
}
