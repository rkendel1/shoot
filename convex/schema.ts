import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // API Specifications
  apiSpecs: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    version: v.optional(v.string()),
    specType: v.union(
      v.literal("openapi"),
      v.literal("swagger"),
      v.literal("postman"),
      v.literal("other")
    ),
    content: v.string(), // JSON stringified spec
  }).index("by_creation_time", ["_creationTime"]),

  // API Endpoints
  apiEndpoints: defineTable({
    specId: v.id("apiSpecs"),
    path: v.string(),
    method: v.string(),
    summary: v.optional(v.string()),
    description: v.optional(v.string()),
    parameters: v.optional(v.string()), // JSON stringified
    requestBody: v.optional(v.string()), // JSON stringified
    responses: v.optional(v.string()), // JSON stringified
  })
    .index("by_spec", ["specId"])
    .index("by_creation_time", ["_creationTime"]),

  // Generated Apps
  generatedApps: defineTable({
    specId: v.id("apiSpecs"),
    name: v.string(),
    description: v.optional(v.string()),
    framework: v.string(),
    code: v.string(), // JSON stringified code files
    metadata: v.optional(v.string()), // JSON stringified metadata
  })
    .index("by_spec", ["specId"])
    .index("by_creation_time", ["_creationTime"]),

  // API Keys
  apiKeys: defineTable({
    specId: v.id("apiSpecs"),
    keyName: v.string(),
    keyValue: v.string(),
    description: v.optional(v.string()),
  }).index("by_spec", ["specId"]),

  // Learned Patterns
  learnedPatterns: defineTable({
    patternType: v.string(),
    patternData: v.string(), // JSON stringified
    frequency: v.number(),
    successRate: v.number(),
  }).index("by_pattern_type", ["patternType"]),

  // Chat Conversations
  conversations: defineTable({
    conversationId: v.string(),
    currentSpecId: v.optional(v.id("apiSpecs")),
    currentAppId: v.optional(v.id("generatedApps")),
    lastAction: v.optional(v.string()),
  }).index("by_conversation_id", ["conversationId"]),

  // Chat Messages
  messages: defineTable({
    conversationId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_creation_time", ["_creationTime"]),
});
