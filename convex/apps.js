"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteApp = exports.getApp = exports.getAllApps = exports.generateApp = void 0;
const values_1 = require("convex/values");
const server_1 = require("./_generated/server");
// Generate an app from a spec
exports.generateApp = (0, server_1.mutation)({
    args: {
        specId: values_1.v.id("apiSpecs"),
        name: values_1.v.string(),
        description: values_1.v.optional(values_1.v.string()),
        framework: values_1.v.string(),
        code: values_1.v.string(), // JSON stringified
        metadata: values_1.v.optional(values_1.v.string()),
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
exports.getAllApps = (0, server_1.query)({
    args: {
        specId: values_1.v.optional(values_1.v.id("apiSpecs")),
    },
    handler: async (ctx, args) => {
        let appsQuery = ctx.db.query("generatedApps");
        if (args.specId) {
            appsQuery = appsQuery.withIndex("by_spec", (q) => q.eq("specId", args.specId));
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
exports.getApp = (0, server_1.query)({
    args: { id: values_1.v.id("generatedApps") },
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
exports.deleteApp = (0, server_1.mutation)({
    args: { id: values_1.v.id("generatedApps") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
        return { success: true };
    },
});
