"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApp = void 0;
const server_1 = require("./_generated/server");
const values_1 = require("convex/values");
// Update app with new code (for iterative modifications)
exports.updateApp = (0, server_1.mutation)({
    args: {
        id: values_1.v.id("generatedApps"),
        code: values_1.v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            code: args.code,
        });
        return { success: true };
    },
});
