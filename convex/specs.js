"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSpec = exports.getEndpoints = exports.getSpec = exports.getAllSpecs = exports.uploadSpec = void 0;
const values_1 = require("convex/values");
const server_1 = require("./_generated/server");
// Upload a new API spec
exports.uploadSpec = (0, server_1.mutation)({
    args: {
        name: values_1.v.string(),
        description: values_1.v.optional(values_1.v.string()),
        version: values_1.v.optional(values_1.v.string()),
        specType: values_1.v.union(values_1.v.literal("openapi"), values_1.v.literal("swagger"), values_1.v.literal("postman"), values_1.v.literal("other")),
        content: values_1.v.string(),
        endpoints: values_1.v.array(values_1.v.object({
            path: values_1.v.string(),
            method: values_1.v.string(),
            summary: values_1.v.optional(values_1.v.string()),
            description: values_1.v.optional(values_1.v.string()),
            parameters: values_1.v.optional(values_1.v.string()),
            requestBody: values_1.v.optional(values_1.v.string()),
            responses: values_1.v.optional(values_1.v.string()),
        })),
    },
    handler: async (ctx, args) => {
        const { endpoints, ...specData } = args;
        // Create the spec
        const specId = await ctx.db.insert("apiSpecs", specData);
        // Create endpoints
        for (const endpoint of endpoints) {
            await ctx.db.insert("apiEndpoints", {
                specId,
                ...endpoint,
            });
        }
        return {
            id: specId,
            name: args.name,
            endpointCount: endpoints.length,
        };
    },
});
// Get all specs
exports.getAllSpecs = (0, server_1.query)({
    args: {},
    handler: async (ctx) => {
        const specs = await ctx.db
            .query("apiSpecs")
            .order("desc")
            .collect();
        // Get endpoint counts for each spec
        const specsWithCounts = await Promise.all(specs.map(async (spec) => {
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
        }));
        return specsWithCounts;
    },
});
// Get a specific spec with endpoints
exports.getSpec = (0, server_1.query)({
    args: { id: values_1.v.id("apiSpecs") },
    handler: async (ctx, args) => {
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
exports.getEndpoints = (0, server_1.query)({
    args: { specId: values_1.v.id("apiSpecs") },
    handler: async (ctx, args) => {
        const endpoints = await ctx.db
            .query("apiEndpoints")
            .withIndex("by_spec", (q) => q.eq("specId", args.specId))
            .collect();
        return endpoints;
    },
});
// Delete a spec
exports.deleteSpec = (0, server_1.mutation)({
    args: { id: values_1.v.id("apiSpecs") },
    handler: async (ctx, args) => {
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
