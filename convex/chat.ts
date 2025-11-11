import { v } from "convex/values";
import { action, mutation, query, ActionCtx, QueryCtx, MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Send a chat message
export const sendMessage = action({
  args: {
    message: v.string(),
    conversationId: v.optional(v.string()),
    specId: v.optional(v.id("apiSpecs")),
  },
  handler: async (ctx: ActionCtx, args) => {
    const convId = args.conversationId || crypto.randomUUID();

    // Get or create conversation context
    let conversation = await ctx.runQuery(internal.chat.getConversation, {
      conversationId: convId,
    });

    if (!conversation && args.specId) {
      // Create new conversation
      await ctx.runMutation(internal.chat.createConversation, {
        conversationId: convId,
        currentSpecId: args.specId,
      });
    }

    // Save user message
    await ctx.runMutation(internal.chat.saveMessage, {
      conversationId: convId,
      role: "user",
      content: args.message,
    });

    // Process message and get response
    const response: any = await ctx.runAction(internal.chat.processMessage, {
      message: args.message,
      conversationId: convId,
      currentSpecId: conversation?.currentSpecId || args.specId,
    });

    // Save assistant response
    await ctx.runMutation(internal.chat.saveMessage, {
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
export const getConversation = query({
  args: { conversationId: v.string() },
  handler: async (ctx: QueryCtx, args) => {
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_conversation_id", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .first();

    return conversation ? { ...conversation } : null;
  },
});

// Create conversation
export const createConversation = mutation({
  args: {
    conversationId: v.string(),
    currentSpecId: v.optional(v.id("apiSpecs")),
  },
  handler: async (ctx: MutationCtx, args) => {
    const id = await ctx.db.insert("conversations", args);
    return id;
  },
});

// Update conversation context
export const updateConversation = mutation({
  args: {
    conversationId: v.string(),
    currentSpecId: v.optional(v.id("apiSpecs")),
    currentAppId: v.optional(v.id("generatedApps")),
    lastAction: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_conversation_id", (q) =>
        q.eq("conversationId", args.conversationId)
      )
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
export const saveMessage = mutation({
  args: {
    conversationId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
  },
  handler: async (ctx: MutationCtx, args) => {
    const id = await ctx.db.insert("messages", args);
    return id;
  },
});

// Get conversation messages
export const getMessages = query({
  args: {
    conversationId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: QueryCtx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    const plainMessages = messages.map((m) => ({ ...m }));
    if (args.limit) {
      return plainMessages.slice(-args.limit);
    }

    return plainMessages;
  },
});

// Clear conversation
export const clearConversation = mutation({
  args: { conversationId: v.string() },
  handler: async (ctx: MutationCtx, args) => {
    // Delete messages
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete conversation
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_conversation_id", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .first();

    if (conversation) {
      await ctx.db.delete(conversation._id);
    }

    return { success: true };
  },
});

// Internal action to process messages with AI
export const processMessage = action({
  args: {
    message: v.string(),
    conversationId: v.string(),
    currentSpecId: v.optional(v.id("apiSpecs")),
  },
  handler: async (ctx: ActionCtx, args) => {
    const lowerMessage = args.message.toLowerCase();

    // Intent detection - prioritize specific intents first
    if (detectUploadIntent(lowerMessage)) {
      return await handleUploadIntent(ctx, args.message, args.conversationId);
    } else if (detectBuildIntent(lowerMessage) && args.currentSpecId) {
      return await handleBuildCustomerApp(ctx, args);
    } else if (detectAddFeatureIntent(lowerMessage)) {
      return await handleAddFeature();
    } else if (detectRefineIntent(lowerMessage)) {
      return await handleRefineUI();
    } else if (detectGenerateIntent(lowerMessage)) {
      return await handleGenerateIntent(ctx, args.message, args.currentSpecId);
    } else if (detectAnalyzeIntent(lowerMessage)) {
      return await handleAnalyzeIntent(ctx, args.currentSpecId);
    } else if (detectListIntent(lowerMessage)) {
      return await handleListIntent(ctx, args.message, args.currentSpecId);
    } else if (detectHelpIntent(lowerMessage)) {
      return handleHelpIntent();
    } else {
      return await handleGeneralConversation(args.message, args.currentSpecId);
    }
  },
});

// Intent detection functions
function detectUploadIntent(message: string): boolean {
  return /upload|add|paste|spec|openapi|swagger|https?:\/\//.test(message);
}

function detectGenerateIntent(message: string): boolean {
  return /generate|create|build|make.*app|code/.test(message);
}

function detectBuildIntent(message: string): boolean {
  return /build.*dashboard|build.*for customers|build.*beautiful|create.*ui|make.*frontend/.test(message);
}

function detectRefineIntent(message: string): boolean {
  return /make.*more|add.*to|change.*color|refine|improve|update|modify/.test(message);
}

function detectAddFeatureIntent(message: string): boolean {
  return /add.*feature|add.*search|add.*filter|add.*cart|add.*auth/.test(message);
}

function detectAnalyzeIntent(message: string): boolean {
  return /analyze|examine|check|review|inspect/.test(message);
}

function detectListIntent(message: string): boolean {
  return /list|show.*all|what.*have|display|endpoints/.test(message);
}

function detectHelpIntent(message: string): boolean {
  return /help|what.*can.*do|how.*work|guide/.test(message);
}

// Intent handlers
async function handleUploadIntent(ctx: ActionCtx, message: string, conversationId: string) {
  const urlMatch = message.match(/https?:\/\/[^\s]+/);

  if (urlMatch) {
    const specUrl = urlMatch[0];
    try {
      const result = await ctx.runAction(internal.utils.parseSpec, { specUrl });

      if (result.success) {
        await ctx.runMutation(internal.chat.updateConversation, {
          conversationId: conversationId,
          currentSpecId: result.id,
        });
        
        return {
          message: `✅ Success! I've loaded the API spec **"${result.name}"** with ${result.endpointCount} endpoints.\n\nIt's now the active context. What would you like to do next?`,
          suggestions: [
            "Analyze this API",
            "Generate a React app",
            "Show me the endpoints",
          ],
          action: "spec_uploaded",
          data: { newSpecId: result.id },
        };
      } else {
        return {
          message: `❌ Oops! I had trouble parsing that spec.\n\n**Error:** ${result.error}\n\nPlease check the URL or try pasting the spec content directly.`,
          suggestions: ["Let me paste the content", "Help me with uploads"],
        };
      }
    } catch (error: any) {
      console.error("Spec parsing error:", error);
      return {
        message: `❌ An unexpected error occurred while trying to fetch the spec: ${error.message}`,
        suggestions: ["Try a different URL", "Let me paste the content"],
      };
    }
  }

  // Fallback for "upload spec" without a URL
  return {
    message: `I can help you upload an API spec! You can:\n\n1. **Paste a URL** to your OpenAPI/Swagger spec\n2. **Paste the spec content** directly (JSON or YAML)\n\nJust send me any of these and I'll process it for you!`,
    suggestions: [
      "https://petstore.swagger.io/v2/swagger.json",
      "Let me paste the content",
      "Show me an example",
    ],
  };
}

async function handleGenerateIntent(
  ctx: ActionCtx,
  message: string,
  currentSpecId?: Id<"apiSpecs">
) {
  if (!currentSpecId) {
    const specs = await ctx.runQuery(internal.specs.getAllSpecs, {});

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
        .map((s: any, i: number) => `${i + 1}. **${s.name}** (${s.endpointCount} endpoints)`)
        .join("\n")}\n\nWhich one would you like to use?`,
      suggestions: specs.slice(0, 3).map((s: any) => `Use ${s.name}`),
      data: { specs: specs.slice(0, 5) },
    };
  }

  // Detect framework
  let framework = "react";
  if (/node|express|backend|server/.test(message.toLowerCase())) {
    framework = "node";
  }

  const spec = await ctx.runQuery(internal.specs.getSpec, { id: currentSpecId });

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

async function handleAnalyzeIntent(ctx: ActionCtx, currentSpecId?: Id<"apiSpecs">) {
  if (!currentSpecId) {
    const specs = await ctx.runQuery(internal.specs.getAllSpecs, {});

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
        .map((s: any, i: number) => `${i + 1}. **${s.name}** (${s.endpointCount} endpoints)`)
        .join("\n")}\n\nWhich one would you like me to analyze?`,
      suggestions: specs.slice(0, 3).map((s: any) => `Analyze ${s.name}`),
      data: { specs },
    };
  }

  const spec = await ctx.runQuery(internal.specs.getSpec, { id: currentSpecId });
  const endpoints = spec.endpoints;

  let analysisMessage = `Here's my analysis of **"${spec.name}"**:\n\n`;
  analysisMessage += `📊 **Overview**\n`;
  analysisMessage += `- Endpoints: ${endpoints.length}\n`;
  analysisMessage += `- Spec Type: ${spec.specType.toUpperCase()}\n`;
  analysisMessage += `- Version: ${spec.version || "N/A"}\n\n`;

  // Analyze methods
  const methods = endpoints.map((e: any) => e.method);
  const uniqueMethods = [...new Set(methods)];
  analysisMessage += `🔧 **HTTP Methods**\n`;
  analysisMessage += uniqueMethods.map((m) => `- ${m}`).join("\n") + "\n\n";

  // Analyze paths
  const paths = endpoints.map((e: any) => e.path);
  analysisMessage += `🛤️ **Sample Endpoints**\n`;
  paths.slice(0, 5).forEach((p: any) => {
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

async function handleListIntent(
  ctx: ActionCtx,
  message: string,
  currentSpecId?: Id<"apiSpecs">
) {
  if (/endpoint|api|route/.test(message.toLowerCase()) && currentSpecId) {
    const spec = await ctx.runQuery(internal.specs.getSpec, { id: currentSpecId });
    const endpoints = spec.endpoints;

    let endpointList = `Here are all **${endpoints.length}** endpoints for **"${spec.name}"**:\n\n`;
    endpoints.slice(0, 15).forEach((e: any, i: number) => {
      endpointList += `${i + 1}. **${e.method}** \`${e.path}\`${
        e.summary ? ` - ${e.summary}` : ""
      }\n`;
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
  const specs = await ctx.runQuery(internal.specs.getAllSpecs, {});

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
  specs.forEach((s: any, i: number) => {
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

async function handleGeneralConversation(
  message: string,
  currentSpecId?: Id<"apiSpecs">
) {
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

    const data: any = await response.json();
    const aiMessage = data.choices[0].message.content;

    return {
      message: aiMessage,
      suggestions: [
        "Upload a spec",
        "Generate an app",
        "Analyze my API",
      ],
    };
  } catch (error) {
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
async function handleBuildCustomerApp(ctx: ActionCtx, args: any) {
  if (!args.currentSpecId) {
    return {
      message: `I'd love to build a beautiful customer-facing app! But first, I need an API spec to work with.\n\nLet's upload one now.`,
      suggestions: [
        "Upload a spec",
        "Show me an example",
      ],
    };
  }

  const spec = await ctx.runQuery(internal.specs.getSpec, { id: args.currentSpecId });

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
async function handleAddFeature() {
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
async function handleRefineUI() {
  return {
    message: `I can refine the UI! Which app should I update?\n\nYou can:\n- Select an app from the Generated Apps tab\n- Say "refine my latest app"\n- Tell me the app name`,
    suggestions: [
      "Refine latest app",
      "Show my apps",
    ],
  };
}