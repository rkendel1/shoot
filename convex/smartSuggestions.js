"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRemix = exports.suggestApiExtensions = exports.generateWorkflow = exports.analyzeApiCapabilities = void 0;
const server_1 = require("./_generated/server");
const values_1 = require("convex/values");
const api_1 = require("./_generated/api");
// Comprehensive AI analysis of API capabilities and creative suggestions
exports.analyzeApiCapabilities = (0, server_1.action)({
    args: {
        specId: values_1.v.id("apiSpecs"),
    },
    handler: async (ctx, args) => {
        const spec = await ctx.runQuery(api_1.api.specs.getSpec, { id: args.specId });
        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) {
            return {
                success: false,
                message: "OpenAI API key required for AI suggestions",
                basicSuggestions: generateBasicSuggestions(spec),
            };
        }
        try {
            const endpointDetails = spec.endpoints.map((e) => ({
                method: e.method,
                path: e.path,
                summary: e.summary || e.description,
                parameters: e.parameters?.length || 0,
                hasBody: !!e.requestBody,
            }));
            const prompt = `You are an expert API architect and creative technologist. Analyze this API and provide comprehensive, actionable insights:

API: ${spec.name}
Description: ${spec.description || 'Not provided'}
Version: ${spec.version}
Endpoints (${spec.endpoints.length}):
${endpointDetails.map((e) => `- ${e.method} ${e.path}: ${e.summary || 'No description'}`).join('\n')}

Provide a JSON response with:

1. **capabilities**: Array of core capabilities this API provides
2. **useCases**: Array of 5-7 practical use cases with: 
   - title: Clear name
   - description: What it does
   - endpoints: Which endpoints to use
   - complexity: "simple" | "medium" | "complex"
   - value: Business value it provides

3. **remixes**: Array of 3-5 creative ways to remix/combine endpoints:
   - title: Creative name
   - description: The innovative approach
   - endpoints: Endpoints involved
   - innovation: What makes this unique

4. **missingFeatures**: Array of features the API SHOULD have but doesn't:
   - feature: Feature name
   - description: What it would do
   - workaround: How to achieve it with current API
   - apiChangesNeeded: Minimal changes to API to support it

5. **workflows**: Array of 3-5 complete multi-step workflows:
   - name: Workflow name
   - description: What the workflow accomplishes
   - steps: Array of {step, endpoint, action, output}
   - automationPotential: "high" | "medium" | "low"

6. **integrations**: Suggestions for integrating with other popular services:
   - service: Service name
   - purpose: Why integrate
   - approach: How to integrate

7. **improvements**: Suggestions to make the API better:
   - category: "performance" | "security" | "usability" | "features"
   - suggestion: What to improve
   - impact: Expected impact

Return ONLY valid JSON.`;
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
                            content: "You are a creative API expert who thinks beyond obvious uses. You see patterns, opportunities, and innovative combinations. Return only valid JSON.",
                        },
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                    temperature: 0.9, // Higher temperature for creativity
                    max_tokens: 4000,
                }),
            });
            const data = await response.json();
            const content = data.choices[0].message.content;
            // Extract JSON
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);
                // Store insights for future use
                await ctx.runMutation(api_1.api.insights.saveInsights, {
                    specId: args.specId,
                    insights: JSON.stringify(analysis),
                });
                return {
                    success: true,
                    ...analysis,
                };
            }
            throw new Error("Failed to parse AI response");
        }
        catch (error) {
            console.error("API capabilities analysis error:", error);
            return {
                success: false,
                error: error.message,
                basicSuggestions: generateBasicSuggestions(spec),
            };
        }
    },
});
// Generate a complete workflow/flow based on user's goal
exports.generateWorkflow = (0, server_1.action)({
    args: {
        specId: values_1.v.id("apiSpecs"),
        goal: values_1.v.string(),
    },
    handler: async (ctx, args) => {
        const spec = await ctx.runQuery(api_1.api.specs.getSpec, { id: args.specId });
        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) {
            return {
                success: false,
                error: "OpenAI API key required",
            };
        }
        try {
            const prompt = `Create a detailed workflow to achieve this goal using the API:

Goal: ${args.goal}

Available API: ${spec.name}
Endpoints:
${spec.endpoints.map((e) => `- ${e.method} ${e.path}: ${e.summary || ''}`).join('\n')}

Create a step-by-step workflow that:
1. Uses the available endpoints creatively
2. Handles errors gracefully
3. Chains requests when needed
4. Provides clear success criteria

Return JSON with:
{
  "workflowName": "Clear name",
  "description": "What this achieves",
  "steps": [
    {
      "stepNumber": 1,
      "action": "What happens",
      "endpoint": "Which endpoint to call",
      "method": "HTTP method",
      "input": "What input is needed",
      "output": "What you get back",
      "errorHandling": "How to handle failures",
      "nextStep": "What happens next"
    }
  ],
  "successCriteria": "How to know it worked",
  "estimatedTime": "How long it takes",
  "complexity": "simple|medium|complex",
  "code": {
    "typescript": "Complete TypeScript implementation",
    "python": "Complete Python implementation"
  }
}`;
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
                            content: "You are a workflow automation expert. Create practical, production-ready workflows. Return only valid JSON.",
                        },
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                    temperature: 0.7,
                    max_tokens: 3000,
                }),
            });
            const data = await response.json();
            const content = data.choices[0].message.content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const workflow = JSON.parse(jsonMatch[0]);
                return {
                    success: true,
                    workflow,
                };
            }
            throw new Error("Failed to parse workflow");
        }
        catch (error) {
            console.error("Workflow generation error:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    },
});
// Suggest API improvements and extensions
exports.suggestApiExtensions = (0, server_1.action)({
    args: {
        specId: values_1.v.id("apiSpecs"),
        focus: values_1.v.optional(values_1.v.string()), // Optional: "performance", "features", "security", etc.
    },
    handler: async (ctx, args) => {
        const spec = await ctx.runQuery(api_1.api.specs.getSpec, { id: args.specId });
        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) {
            return {
                success: false,
                error: "OpenAI API key required",
            };
        }
        try {
            const focusArea = args.focus || "all areas";
            const prompt = `As an API design expert, analyze this API and suggest improvements focused on ${focusArea}:

API: ${spec.name}
Current Endpoints: ${spec.endpoints.length}
${spec.endpoints.map((e) => `- ${e.method} ${e.path}`).join('\n')}

Suggest:
1. **New Endpoints** that would add value
2. **Missing Functionality** that users likely need
3. **Better Patterns** for common operations
4. **Webhook/Event Support** if applicable
5. **Batch Operations** to improve efficiency
6. **Search/Filter Enhancements**
7. **Versioning Strategy**

For each suggestion provide:
- title: Clear name
- description: What it does
- implementation: How to implement (be specific)
- endpoints: New endpoints to add (with methods and paths)
- benefits: Why this is valuable
- effort: "low" | "medium" | "high"
- backwardCompatible: boolean

Return as JSON array of suggestions.`;
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
                            content: "You are an expert API architect with years of experience designing scalable, user-friendly APIs. Be specific and practical.",
                        },
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                    temperature: 0.8,
                    max_tokens: 3000,
                }),
            });
            const data = await response.json();
            const content = data.choices[0].message.content;
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const suggestions = JSON.parse(jsonMatch[0]);
                return {
                    success: true,
                    suggestions,
                };
            }
            throw new Error("Failed to parse suggestions");
        }
        catch (error) {
            console.error("API extensions error:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    },
});
// Generate a creative "remix" - combining endpoints in novel ways
exports.generateRemix = (0, server_1.action)({
    args: {
        specId: values_1.v.id("apiSpecs"),
        theme: values_1.v.optional(values_1.v.string()), // e.g., "social", "analytics", "automation"
    },
    handler: async (ctx, args) => {
        const spec = await ctx.runQuery(api_1.api.specs.getSpec, { id: args.specId });
        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) {
            return {
                success: false,
                error: "OpenAI API key required",
            };
        }
        try {
            const theme = args.theme || "innovative use";
            const prompt = `Create a creative "remix" of this API - a novel way to combine its capabilities around the theme: ${theme}

API: ${spec.name}
Endpoints:
${spec.endpoints.map((e) => `- ${e.method} ${e.path}: ${e.summary || ''}`).join('\n')}

Think creatively about:
- Combining endpoints in unexpected ways
- Creating new user experiences
- Solving problems the API wasn't designed for
- Building features that seem "magical"

Return JSON with:
{
  "remixName": "Catchy name",
  "tagline": "One-liner description",
  "description": "Full description of what this does",
  "innovation": "What makes this unique/creative",
  "endpointsUsed": ["List of endpoints"],
  "workflow": "Step-by-step how it works",
  "userExperience": "What the user sees/does",
  "implementation": {
    "overview": "How to build it",
    "key_components": ["Component 1", "Component 2"],
    "challenges": ["Challenge 1", "Challenge 2"],
    "solutions": ["Solution 1", "Solution 2"]
  },
  "potentialImpact": "Why this could be game-changing",
  "codeExample": "TypeScript code showing the remix in action"
}`;
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
                            content: "You are a creative technologist who sees possibilities others miss. Think like a startup founder finding innovative uses for existing tools.",
                        },
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                    temperature: 1.0, // Maximum creativity
                    max_tokens: 2500,
                }),
            });
            const data = await response.json();
            const content = data.choices[0].message.content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const remix = JSON.parse(jsonMatch[0]);
                return {
                    success: true,
                    remix,
                };
            }
            throw new Error("Failed to parse remix");
        }
        catch (error) {
            console.error("Remix generation error:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    },
});
// Basic suggestions when AI is not available
function generateBasicSuggestions(spec) {
    const suggestions = {
        capabilities: ["API interaction", "Data management"],
        useCases: [
            {
                title: "Basic CRUD Operations",
                description: "Create, read, update, and delete operations",
                complexity: "simple",
            },
        ],
        workflows: [
            {
                name: "Simple Data Flow",
                description: "Fetch and display data",
                steps: ["Get data", "Process", "Display"],
            },
        ],
    };
    return suggestions;
}
