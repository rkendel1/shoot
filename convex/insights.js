"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRemixes = exports.saveRemix = exports.getWorkflows = exports.saveWorkflow = exports.getInsights = exports.saveInsights = void 0;
const server_1 = require("./_generated/server");
const values_1 = require("convex/values");
// Save AI-generated insights
exports.saveInsights = (0, server_1.mutation)({
    args: {
        specId: values_1.v.id("apiSpecs"),
        insights: values_1.v.string(),
    },
    handler: async (ctx, args) => {
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
exports.getInsights = (0, server_1.query)({
    args: { specId: values_1.v.id("apiSpecs") },
    handler: async (ctx, args) => {
        const insights = await ctx.db
            .query("insights")
            .withIndex("by_spec", (q) => q.eq("specId", args.specId))
            .first();
        if (!insights)
            return null;
        return {
            ...insights,
            insights: JSON.parse(insights.insights),
        };
    },
});
// Save a workflow
exports.saveWorkflow = (0, server_1.mutation)({
    args: {
        specId: values_1.v.id("apiSpecs"),
        name: values_1.v.string(),
        description: values_1.v.string(),
        steps: values_1.v.string(),
        complexity: values_1.v.string(),
        code: values_1.v.optional(values_1.v.string()),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("workflows", args);
        return { id };
    },
});
// Get workflows for a spec
exports.getWorkflows = (0, server_1.query)({
    args: { specId: values_1.v.id("apiSpecs") },
    handler: async (ctx, args) => {
        const workflows = await ctx.db
            .query("workflows")
            .withIndex("by_spec", (q) => q.eq("specId", args.specId))
            .collect();
        return workflows.map((w) => ({
            ...w,
            steps: JSON.parse(w.steps),
            code: w.code ? JSON.parse(w.code) : null,
        }));
    },
});
// Save a remix
exports.saveRemix = (0, server_1.mutation)({
    args: {
        specId: values_1.v.id("apiSpecs"),
        name: values_1.v.string(),
        description: values_1.v.string(),
        innovation: values_1.v.string(),
        endpointsUsed: values_1.v.string(),
        implementation: values_1.v.string(),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("remixes", args);
        return { id };
    },
});
// Get remixes for a spec
exports.getRemixes = (0, server_1.query)({
    args: { specId: values_1.v.id("apiSpecs") },
    handler: async (ctx, args) => {
        const remixes = await ctx.db
            .query("remixes")
            .withIndex("by_spec", (q) => q.eq("specId", args.specId))
            .collect();
        return remixes.map((r) => ({
            ...r,
            endpointsUsed: JSON.parse(r.endpointsUsed),
            implementation: JSON.parse(r.implementation),
        }));
    },
});
