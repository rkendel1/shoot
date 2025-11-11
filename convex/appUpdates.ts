import { mutation, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

// Update app with new code (for iterative modifications)
export const updateApp = mutation({
  args: {
    id: v.id("generatedApps"),
    code: v.string(),
  },
  handler: async (ctx: MutationCtx, args) => {
    await ctx.db.patch(args.id, {
      code: args.code,
    });
    return { success: true };
  },
});