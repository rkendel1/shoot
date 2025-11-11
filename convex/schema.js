"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("convex/server");
const values_1 = require("convex/values");
exports.default = (0, server_1.defineSchema)({
    // API Specifications
    apiSpecs: (0, server_1.defineTable)({
        name: values_1.v.string(),
        description: values_1.v.optional(values_1.v.string()),
        version: values_1.v.optional(values_1.v.string()),
        specType: values_1.v.union(values_1.v.literal("openapi"), values_1.v.literal("swagger"), values_1.v.literal("postman"), values_1.v.literal("other")),
        content: values_1.v.string(), // JSON stringified spec
    }),
    // API Endpoints
    apiEndpoints: (0, server_1.defineTable)({
        specId: values_1.v.id("apiSpecs"),
        path: values_1.v.string(),
        method: values_1.v.string(),
        summary: values_1.v.optional(values_1.v.string()),
        description: values_1.v.optional(values_1.v.string()),
        parameters: values_1.v.optional(values_1.v.string()), // JSON stringified
        requestBody: values_1.v.optional(values_1.v.string()), // JSON stringified
        responses: values_1.v.optional(values_1.v.string()), // JSON stringified
    })
        .index("by_spec", ["specId"]),
    // Generated Apps
    generatedApps: (0, server_1.defineTable)({
        specId: values_1.v.id("apiSpecs"),
        name: values_1.v.string(),
        description: values_1.v.optional(values_1.v.string()),
        framework: values_1.v.string(),
        code: values_1.v.string(), // JSON stringified code files
        metadata: values_1.v.optional(values_1.v.string()), // JSON stringified metadata
    })
        .index("by_spec", ["specId"]),
    // API Keys
    apiKeys: (0, server_1.defineTable)({
        specId: values_1.v.id("apiSpecs"),
        keyName: values_1.v.string(),
        keyValue: values_1.v.string(),
        description: values_1.v.optional(values_1.v.string()),
    }).index("by_spec", ["specId"]),
    // Learned Patterns
    learnedPatterns: (0, server_1.defineTable)({
        patternType: values_1.v.string(),
        patternData: values_1.v.string(), // JSON stringified
        frequency: values_1.v.number(),
        successRate: values_1.v.number(),
    }).index("by_pattern_type", ["patternType"]),
    // Chat Conversations
    conversations: (0, server_1.defineTable)({
        conversationId: values_1.v.string(),
        currentSpecId: values_1.v.optional(values_1.v.id("apiSpecs")),
        currentAppId: values_1.v.optional(values_1.v.id("generatedApps")),
        lastAction: values_1.v.optional(values_1.v.string()),
    }).index("by_conversation_id", ["conversationId"]),
    // Chat Messages
    messages: (0, server_1.defineTable)({
        conversationId: values_1.v.string(),
        role: values_1.v.union(values_1.v.literal("user"), values_1.v.literal("assistant"), values_1.v.literal("system")),
        content: values_1.v.string(),
    })
        .index("by_conversation", ["conversationId"]),
    // AI-Generated Insights and Suggestions
    insights: (0, server_1.defineTable)({
        specId: values_1.v.id("apiSpecs"),
        insights: values_1.v.string(), // JSON stringified AI analysis
        createdAt: values_1.v.number(),
    }).index("by_spec", ["specId"]),
    // Saved Workflows
    workflows: (0, server_1.defineTable)({
        specId: values_1.v.id("apiSpecs"),
        name: values_1.v.string(),
        description: values_1.v.string(),
        steps: values_1.v.string(), // JSON stringified workflow steps
        complexity: values_1.v.string(),
        code: values_1.v.optional(values_1.v.string()), // JSON stringified code implementations
    }).index("by_spec", ["specId"]),
    // Remixes - Creative combinations
    remixes: (0, server_1.defineTable)({
        specId: values_1.v.id("apiSpecs"),
        name: values_1.v.string(),
        description: values_1.v.string(),
        innovation: values_1.v.string(),
        endpointsUsed: values_1.v.string(), // JSON stringified array
        implementation: values_1.v.string(), // JSON stringified implementation details
    }).index("by_spec", ["specId"]),
});
