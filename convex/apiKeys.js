"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteApiKey = exports.getApiKeys = exports.addApiKey = void 0;
const values_1 = require("convex/values");
const server_1 = require("./_generated/server");
// Add an API key
exports.addApiKey = (0, server_1.mutation)({
    args: {
        specId: values_1.v.id("apiSpecs"),
        keyName: values_1.v.string(),
        keyValue: values_1.v.string(),
        description: values_1.v.optional(values_1.v.string()),
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
exports.getApiKeys = (0, server_1.query)({
    args: { specId: values_1.v.id("apiSpecs") },
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
exports.deleteApiKey = (0, server_1.mutation)({
    args: { id: values_1.v.id("apiKeys") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
        return { success: true };
    },
});
function maskKey(key) {
    if (key.length <= 8)
        return "***";
    return key.substring(0, 4) + "..." + key.substring(key.length - 4);
}
