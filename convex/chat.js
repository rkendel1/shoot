"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMessage = exports.clearConversation = exports.getMessages = exports.saveMessage = exports.updateConversation = exports.createConversation = exports.getConversation = exports.sendMessage = void 0;
const values_1 = require("convex/values");
const server_1 = require("./_generated/server");
const api_1 = require("./_generated/api");
// Send a chat message
exports.sendMessage = (0, server_1.action)({
    args: {
        message: values_1.v.string(),
        conversationId: values_1.v.optional(values_1.v.string()),
        specId: values_1.v.optional(values_1.v.id("apiSpecs")),
    },
    handler: async (ctx, args) => {
        const convId = args.conversationId || crypto.randomUUID();
        // Get or create conversation context
        let conversation = await ctx.runQuery(api_1.api.chat.getConversation, {
            conversationId: convId,
        });
        if (!conversation && args.specId) {
            // Create new conversation
            await ctx.runMutation(api_1.api.chat.createConversation, {
                conversationId: convId,
                currentSpecId: args.specId,
            });
        }
        // Save user message
        await ctx.runMutation(api_1.api.chat.saveMessage, {
            conversationId: convId,
            role: "user",
            content: args.message,
        });
        // Process message and get response
        const response = await ctx.runAction(api_1.internal.chat.processMessage, {
            message: args.message,
            conversationId: convId,
            currentSpecId: conversation?.currentSpecId || args.specId,
        });
        // Save assistant response
        await ctx.runMutation(api_1.api.chat.saveMessage, {
            conversationId: convId,
            role: "assistant",
            content: response.message,
        });
        return {
            conversationId: convId,
            ...response,
        };
    },
});
// Get conversation context
exports.getConversation = (0, server_1.query)({
    args: { conversationId: values_1.v.string() },
    handler: async (ctx, args) => {
        const conversation = await ctx.db
            .query("conversations")
            .withIndex("by_conversation_id", (q) => q.eq("conversationId", args.conversationId))
            .first();
        return conversation;
    },
});
// Create conversation
exports.createConversation = (0, server_1.mutation)({
    args: {
        conversationId: values_1.v.string(),
        currentSpecId: values_1.v.optional(values_1.v.id("apiSpecs")),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("conversations", args);
        return id;
    },
});
// Update conversation context
exports.updateConversation = (0, server_1.mutation)({
    args: {
        conversationId: values_1.v.string(),
        currentSpecId: values_1.v.optional(values_1.v.id("apiSpecs")),
        currentAppId: values_1.v.optional(values_1.v.id("generatedApps")),
        lastAction: values_1.v.optional(values_1.v.string()),
    },
    handler: async (ctx, args) => {
        const conversation = await ctx.db
            .query("conversations")
            .withIndex("by_conversation_id", (q) => q.eq("conversationId", args.conversationId))
            .first();
        if (conversation) {
            await ctx.db.patch(conversation._id, {
                currentSpecId: args.currentSpecId,
                currentAppId: args.currentAppId,
                lastAction: args.lastAction,
            });
        }
    },
});
// Save message to conversation
exports.saveMessage = (0, server_1.mutation)({
    args: {
        conversationId: values_1.v.string(),
        role: values_1.v.union(values_1.v.literal("user"), values_1.v.literal("assistant"), values_1.v.literal("system")),
        content: values_1.v.string(),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("messages", args);
        return id;
    },
});
// Get conversation messages
exports.getMessages = (0, server_1.query)({
    args: {
        conversationId: values_1.v.string(),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .order("asc")
            .collect();
        if (args.limit) {
            return messages.slice(-args.limit);
        }
        return messages;
    },
});
// Clear conversation
exports.clearConversation = (0, server_1.mutation)({
    args: { conversationId: values_1.v.string() },
    handler: async (ctx, args) => {
        // Delete messages
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .collect();
        for (const message of messages) {
            await ctx.db.delete(message._id);
        }
        // Delete conversation
        const conversation = await ctx.db
            .query("conversations")
            .withIndex("by_conversation_id", (q) => q.eq("conversationId", args.conversationId))
            .first();
        if (conversation) {
            await ctx.db.delete(conversation._id);
        }
        return { success: true };
    },
});
// Internal action to process messages with AI
exports.processMessage = (0, server_1.action)({
    args: {
        message: values_1.v.string(),
        conversationId: values_1.v.string(),
        currentSpecId: values_1.v.optional(values_1.v.id("apiSpecs")),
    },
    handler: async (ctx, args) => {
        const lowerMessage = args.message.toLowerCase();
        // Intent detection - prioritize specific intents first
        if (detectBuildIntent(lowerMessage) && args.currentSpecId) {
            return await handleBuildCustomerApp(ctx, args);
        }
        else if (detectAddFeatureIntent(lowerMessage)) {
            return await handleAddFeature(ctx, args);
        }
        else if (detectRefineIntent(lowerMessage)) {
            return await handleRefineUI(ctx, args);
        }
        else if (detectUploadIntent(lowerMessage)) {
            return handleUploadIntent(args.message, args.currentSpecId);
        }
        else if (detectGenerateIntent(lowerMessage)) {
            return await handleGenerateIntent(ctx, args.message, args.currentSpecId);
        }
        else if (detectAnalyzeIntent(lowerMessage)) {
            return await handleAnalyzeIntent(ctx, args.currentSpecId);
        }
        else if (detectListIntent(lowerMessage)) {
            return await handleListIntent(ctx, args.message, args.currentSpecId);
        }
        else if (detectHelpIntent(lowerMessage)) {
            return handleHelpIntent();
        }
        else {
            return await handleGeneralConversation(ctx, args.message, args.currentSpecId);
        }
    },
});
// Intent detection functions
function detectUploadIntent(message) {
    return /upload|add|paste|spec|openapi|swagger|https?:\/\//.test(message);
}
function detectGenerateIntent(message) {
    return /generate|create|build|make.*app|code/.test(message);
}
function detectBuildIntent(message) {
    return /build.*dashboard|build.*for customers|build.*beautiful|create.*ui|make.*frontend/.test(message);
}
function detectRefineIntent(message) {
    return /make.*more|add.*to|change.*color|refine|improve|update|modify/.test(message);
}
function detectAddFeatureIntent(message) {
    return /add.*feature|add.*search|add.*filter|add.*cart|add.*auth/.test(message);
}
function detectAnalyzeIntent(message) {
    return /analyze|examine|check|review|inspect/.test(message);
}
function detectListIntent(message) {
    return /list|show.*all|what.*have|display|endpoints/.test(message);
}
function detectHelpIntent(message) {
    return /help|what.*can.*do|how.*work|guide/.test(message);
}
// Intent handlers
function handleUploadIntent(message, currentSpecId) {
    const urlMatch = message.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
        return {
            message: `I found a URL in your message! To upload this spec, please use the upload form or paste the spec content directly. I'll parse it and extract all the endpoints for you.\n\nURL detected: ${urlMatch[0]}\n\nWould you like me to guide you through uploading it?`,
            suggestions: [
                "Yes, help me upload",
                "I'll paste the content",
                "Show me my existing specs",
            ],
            action: "upload_spec",
            data: { url: urlMatch[0] },
        };
    }
    return {
        message: `I can help you upload an API spec! You can:\n\n1. **Paste a URL** to your OpenAPI/Swagger spec\n2. **Send me the spec content** directly (JSON or YAML)\n3. **Upload a file** using the upload interface\n\nJust send me any of these and I'll process it for you!`,
        suggestions: [
            "https://petstore.swagger.io/v2/swagger.json",
            "Let me paste the spec content",
            "Show me an example",
        ],
    };
}
async function handleGenerateIntent(ctx, message, currentSpecId) {
    if (!currentSpecId) {
        const specs = await ctx.runQuery(api_1.api.specs.getAllSpecs, {});
        if (specs.length === 0) {
            return {
                message: `I'd love to generate an app for you! But first, I need an API spec to work with.\n\nLet's upload one now. You can:\n1. Paste a URL to your spec\n2. Send me the spec content\n3. Upload a file`,
                suggestions: [
                    "Upload https://petstore.swagger.io/v2/swagger.json",
                    "Show me an example",
                ],
            };
        }
        return {
            message: `Great! I can generate an app for you. You have ${specs.length} spec(s) available:\n\n${specs
                .slice(0, 5)
                .map((s, i) => `${i + 1}. **${s.name}** (${s.endpointCount} endpoints)`)
                .join("\n")}\n\nWhich one would you like to use?`,
            suggestions: specs.slice(0, 3).map((s) => `Use ${s.name}`),
            data: { specs: specs.slice(0, 5) },
        };
    }
    // Detect framework
    let framework = "react";
    if (/node|express|backend|server/.test(message.toLowerCase())) {
        framework = "node";
    }
    const spec = await ctx.runQuery(api_1.api.specs.getSpec, { id: currentSpecId });
    return {
        message: `Perfect! I'll generate a **${framework.toUpperCase()}** app for "${spec.name}".\n\nThe app will include:\n\n✓ API client with all ${spec.endpoints.length} endpoints\n✓ TypeScript types and interfaces\n✓ Error handling and loading states\n✓ Clean, production-ready code\n\nWould you like me to use AI to enhance the code generation?`,
        suggestions: [
            "Yes, use AI enhancement",
            "No, use standard templates",
            "Tell me more about AI features",
        ],
        action: "generate_app",
        data: {
            specId: currentSpecId,
            framework,
            endpointCount: spec.endpoints.length,
        },
    };
}
async function handleAnalyzeIntent(ctx, currentSpecId) {
    if (!currentSpecId) {
        const specs = await ctx.runQuery(api_1.api.specs.getAllSpecs, {});
        if (specs.length === 0) {
            return {
                message: `I don't have any specs to analyze yet. Let's upload one first!\n\nYou can paste a URL or the spec content.`,
                suggestions: [
                    "Upload a spec",
                    "https://petstore.swagger.io/v2/swagger.json",
                ],
            };
        }
        return {
            message: `I can analyze your API specs! Here are your specs:\n\n${specs
                .map((s, i) => `${i + 1}. **${s.name}** (${s.endpointCount} endpoints)`)
                .join("\n")}\n\nWhich one would you like me to analyze?`,
            suggestions: specs.slice(0, 3).map((s) => `Analyze ${s.name}`),
            data: { specs },
        };
    }
    const spec = await ctx.runQuery(api_1.api.specs.getSpec, { id: currentSpecId });
    const endpoints = spec.endpoints;
    let analysisMessage = `Here's my analysis of **"${spec.name}"**:\n\n`;
    analysisMessage += `📊 **Overview**\n`;
    analysisMessage += `- Endpoints: ${endpoints.length}\n`;
    analysisMessage += `- Spec Type: ${spec.specType.toUpperCase()}\n`;
    analysisMessage += `- Version: ${spec.version || "N/A"}\n\n`;
    // Analyze methods
    const methods = endpoints.map((e) => e.method);
    const uniqueMethods = [...new Set(methods)];
    analysisMessage += `🔧 **HTTP Methods**\n`;
    analysisMessage += uniqueMethods.map((m) => `- ${m}`).join("\n") + "\n\n";
    // Analyze paths
    const paths = endpoints.map((e) => e.path);
    analysisMessage += `🛤️ **Sample Endpoints**\n`;
    paths.slice(0, 5).forEach((p) => {
        analysisMessage += `- \`${p}\`\n`;
    });
    if (paths.length > 5) {
        analysisMessage += `- ... and ${paths.length - 5} more\n`;
    }
    analysisMessage += `\n**What would you like to do next?**`;
    return {
        message: analysisMessage,
        suggestions: [
            "Generate an app",
            "Show me all endpoints",
            "Analyze another spec",
        ],
        data: {
            specId: currentSpecId,
            endpointCount: endpoints.length,
        },
    };
}
async function handleListIntent(ctx, message, currentSpecId) {
    if (/endpoint|api|route/.test(message.toLowerCase()) && currentSpecId) {
        const spec = await ctx.runQuery(api_1.api.specs.getSpec, { id: currentSpecId });
        const endpoints = spec.endpoints;
        let endpointList = `Here are all **${endpoints.length}** endpoints for **"${spec.name}"**:\n\n`;
        endpoints.slice(0, 15).forEach((e, i) => {
            endpointList += `${i + 1}. **${e.method}** \`${e.path}\`${e.summary ? ` - ${e.summary}` : ""}\n`;
        });
        if (endpoints.length > 15) {
            endpointList += `\n... and ${endpoints.length - 15} more\n`;
        }
        return {
            message: endpointList,
            suggestions: [
                "Generate an app",
                "Analyze this API",
                "Show more details",
            ],
            data: { endpoints: endpoints.slice(0, 20) },
        };
    }
    // List specs
    const specs = await ctx.runQuery(api_1.api.specs.getAllSpecs, {});
    if (specs.length === 0) {
        return {
            message: `You don't have any API specs yet. Let's get started by uploading one!\n\nYou can:\n- Paste a URL\n- Send me the spec content\n- Upload a file`,
            suggestions: [
                "Upload a spec URL",
                "Paste spec content",
                "Show me an example",
            ],
        };
    }
    let specList = `Here are your **${specs.length}** API spec(s):\n\n`;
    specs.forEach((s, i) => {
        specList += `${i + 1}. **${s.name}** (${s.version || "v1"}) - ${s.endpointCount} endpoints\n`;
    });
    return {
        message: specList,
        suggestions: [
            "Analyze a spec",
            "Generate an app",
            "Upload another spec",
        ],
        data: { specs },
    };
}
function handleHelpIntent() {
    return {
        message: `# Welcome to Shoot! 🚀

I'm your AI assistant for building apps from API specifications. Here's what I can do:

## 📤 Upload & Parse
- Upload API specs (OpenAPI, Swagger)
- Parse from URLs or pasted content
- Extract and analyze endpoints

## 🔍 Analyze
- Detect authentication patterns
- Identify pagination strategies
- Suggest best practices
- Understand your API structure

## 🛠️ Generate Apps
- React apps with TypeScript
- Node.js/Express backends
- Clean, production-ready code
- AI-enhanced generation (optional)

## 💬 Natural Conversation
- Just chat with me naturally
- I'll understand what you want to do
- Step-by-step guidance

**Try saying things like:**
- "Upload https://petstore.swagger.io/v2/swagger.json"
- "Generate a React app"
- "Show me my specs"
- "Analyze this API"

What would you like to do?`,
        suggestions: [
            "Upload an API spec",
            "Show me an example",
            "Generate a demo app",
        ],
    };
}
async function handleGeneralConversation(ctx, message, currentSpecId) {
    // Use OpenAI if available
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
        return {
            message: `I'm here to help you build apps from API specs!\n\nI can help with:\n- 📤 Uploading API specs\n- 🛠️ Generating apps\n- 🔍 Analyzing APIs\n- 📋 Listing your specs\n\nWhat would you like to do?`,
            suggestions: [
                "Upload a spec",
                "Generate an app",
                "Analyze an API",
                "Help",
            ],
        };
    }
    // Call OpenAI for natural conversation
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${openaiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: `You are an expert AI assistant for an API spec to app generator called Shoot. 
You help users upload API specifications, analyze them, and generate applications.
Be conversational, helpful, and guide users through the process.
Keep responses concise but informative.
${currentSpecId ? `The user is currently working with a spec.` : "No spec is currently loaded."}`,
                    },
                    {
                        role: "user",
                        content: message,
                    },
                ],
                temperature: 0.7,
                max_tokens: 500,
            }),
        });
        const data = await response.json();
        const aiMessage = data.choices[0].message.content;
        return {
            message: aiMessage,
            suggestions: [
                "Upload a spec",
                "Generate an app",
                "Analyze my API",
            ],
        };
    }
    catch (error) {
        console.error("OpenAI error:", error);
        return {
            message: `I'm here to help! What would you like to do?\n\n- Upload an API spec\n- Generate an app\n- Analyze an API\n- List your specs`,
            suggestions: [
                "Upload a spec",
                "Generate an app",
                "Help",
            ],
        };
    }
}
// New: Handle building beautiful customer-facing apps
async function handleBuildCustomerApp(ctx, args) {
    if (!args.currentSpecId) {
        return {
            message: `I'd love to build a beautiful customer-facing app! But first, I need an API spec to work with.\n\nLet's upload one now.`,
            suggestions: [
                "Upload a spec",
                "Show me an example",
            ],
        };
    }
    const spec = await ctx.runQuery(api_1.api.specs.getSpec, { id: args.currentSpecId });
    return {
        message: `🎨 Perfect! I'll build a beautiful, customer-ready app for **"${spec.name}"**.\n\nI'll:\n✨ Design a modern, professional UI\n🎯 Select the right endpoints\n⚡ Make it fully functional\n📱 Ensure it's responsive\n🚀 Make it deployment-ready\n\n**Building now...** This will take a moment as I craft something beautiful!`,
        action: "building_customer_app",
        data: {
            specId: args.currentSpecId,
            description: args.message,
        },
    };
}
// New: Handle adding features to existing apps
async function handleAddFeature(ctx, args) {
    // This would need additional context about which app to modify
    return {
        message: `I can add that feature! Which app would you like me to update?\n\nYou can say:\n- "Add it to my latest app"\n- "Add it to [app name]"\n- Or select an app from the Generated Apps tab`,
        suggestions: [
            "Add to latest app",
            "Show my apps",
        ],
    };
}
// New: Handle UI refinement requests
async function handleRefineUI(ctx, args) {
    return {
        message: `I can refine the UI! Which app should I update?\n\nYou can:\n- Select an app from the Generated Apps tab\n- Say "refine my latest app"\n- Tell me the app name`,
        suggestions: [
            "Refine latest app",
            "Show my apps",
        ],
    };
}
