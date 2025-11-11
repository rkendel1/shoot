"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeApp = exports.generateComponent = exports.modifyComponent = exports.suggestFlows = void 0;
const server_1 = require("./_generated/server");
const values_1 = require("convex/values");
const api_1 = require("./_generated/api");
// AI-powered flow and app suggestions
exports.suggestFlows = (0, server_1.action)({
    args: {
        specId: values_1.v.id("apiSpecs"),
    },
    handler: async (ctx, args) => {
        const spec = await ctx.runQuery(api_1.api.specs.getSpec, { id: args.specId });
        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) {
            return {
                suggestions: [
                    {
                        name: "CRUD Dashboard",
                        description: "A full dashboard with create, read, update, delete operations",
                        framework: "react",
                        reason: "Basic pattern for data management",
                    },
                    {
                        name: "API Client Library",
                        description: "A reusable client library for this API",
                        framework: "node",
                        reason: "Useful for integration",
                    },
                ],
            };
        }
        try {
            const prompt = `Analyze this API spec and suggest 3-5 intelligent application flows or components that would be useful to build:

API: ${spec.name}
Endpoints (${spec.endpoints.length}):
${spec.endpoints.map((e) => `- ${e.method} ${e.path}: ${e.summary || e.description || ''}`).join('\n')}

For each suggestion, provide:
1. name: A clear, descriptive name
2. description: What it does (1-2 sentences)
3. framework: "react" or "node"
4. reason: Why this would be valuable
5. components: List of specific components/features it would include

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
                            content: "You are an expert software architect who suggests practical, well-designed applications based on API capabilities.",
                        },
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                    temperature: 0.8,
                    max_tokens: 2000,
                }),
            });
            const data = await response.json();
            const content = data.choices[0].message.content;
            // Try to extract JSON
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const suggestions = JSON.parse(jsonMatch[0]);
                return { suggestions };
            }
            // Fallback parsing
            return {
                suggestions: [
                    {
                        name: "AI-Suggested Application",
                        description: content.substring(0, 200),
                        framework: "react",
                        reason: "Based on AI analysis",
                    },
                ],
            };
        }
        catch (error) {
            console.error("AI suggestion error:", error);
            return {
                suggestions: [
                    {
                        name: "Custom Application",
                        description: "Build a custom app for this API",
                        framework: "react",
                        reason: "Tailored to your needs",
                    },
                ],
            };
        }
    },
});
// AI-powered component modification
exports.modifyComponent = (0, server_1.action)({
    args: {
        appId: values_1.v.id("generatedApps"),
        fileName: values_1.v.string(),
        currentCode: values_1.v.string(),
        modificationRequest: values_1.v.string(),
    },
    handler: async (ctx, args) => {
        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) {
            return {
                success: false,
                error: "OpenAI API key not configured",
            };
        }
        try {
            const prompt = `Modify this code based on the user's request:

Current Code (${args.fileName}):
\`\`\`
${args.currentCode}
\`\`\`

User Request: ${args.modificationRequest}

Return ONLY the modified code without explanations.`;
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
                            content: "You are an expert developer. Modify code precisely based on requests. Return only the modified code.",
                        },
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                    temperature: 0.3,
                    max_tokens: 4000,
                }),
            });
            const data = await response.json();
            const modifiedCode = data.choices[0].message.content;
            // Extract code from markdown if present
            const codeMatch = modifiedCode.match(/```(?:\w+)?\n([\s\S]*?)\n```/);
            const cleanCode = codeMatch ? codeMatch[1] : modifiedCode;
            // Update the app in database
            const app = await ctx.runQuery(api_1.api.apps.getApp, { id: args.appId });
            const updatedCode = {
                ...app.code,
                [args.fileName]: cleanCode,
            };
            await ctx.runMutation(api_1.api.apps.updateApp, {
                id: args.appId,
                code: JSON.stringify(updatedCode),
            });
            return {
                success: true,
                modifiedCode: cleanCode,
                explanation: "Code modified successfully",
            };
        }
        catch (error) {
            console.error("Component modification error:", error);
            return {
                success: false,
                error: error.message || "Failed to modify component",
            };
        }
    },
});
// Generate specific component based on description
exports.generateComponent = (0, server_1.action)({
    args: {
        specId: values_1.v.id("apiSpecs"),
        componentDescription: values_1.v.string(),
        framework: values_1.v.string(),
    },
    handler: async (ctx, args) => {
        const spec = await ctx.runQuery(api_1.api.specs.getSpec, { id: args.specId });
        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) {
            return {
                success: false,
                error: "OpenAI API key not configured",
            };
        }
        try {
            const prompt = `Generate a ${args.framework} component based on this description:

Component Request: ${args.componentDescription}

API Context:
- API Name: ${spec.name}
- Available Endpoints:
${spec.endpoints.map((e) => `  - ${e.method} ${e.path}: ${e.summary || ''}`).join('\n')}

Requirements:
1. Use TypeScript
2. Include proper error handling
3. Add loading states
4. Follow ${args.framework} best practices
5. Make it production-ready
6. Include comments

Generate complete, working code.`;
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
                            content: "You are an expert developer who creates production-ready components.",
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
            const generatedCode = data.choices[0].message.content;
            return {
                success: true,
                code: generatedCode,
                componentName: args.componentDescription.split(' ').slice(0, 3).join(''),
            };
        }
        catch (error) {
            console.error("Component generation error:", error);
            return {
                success: false,
                error: error.message || "Failed to generate component",
            };
        }
    },
});
// Analyze and suggest improvements to existing app
exports.analyzeApp = (0, server_1.action)({
    args: {
        appId: values_1.v.id("generatedApps"),
    },
    handler: async (ctx, args) => {
        const app = await ctx.runQuery(api_1.api.apps.getApp, { id: args.appId });
        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) {
            return {
                suggestions: [
                    "Add error handling",
                    "Improve loading states",
                    "Add unit tests",
                ],
            };
        }
        try {
            const codeFiles = Object.entries(app.code)
                .slice(0, 5)
                .map(([name, code]) => `${name}:\n${code}`)
                .join('\n\n---\n\n');
            const prompt = `Analyze this ${app.framework} application and suggest 5 specific improvements:

App: ${app.name}
Files: ${Object.keys(app.code).join(', ')}

Sample Code:
${codeFiles.substring(0, 3000)}

Provide actionable suggestions for:
1. Code quality improvements
2. Performance optimizations
3. Better error handling
4. UI/UX enhancements
5. New features to add

Return as JSON array of objects with: title, description, priority (high/medium/low)`;
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
                            content: "You are a code review expert who provides constructive, actionable feedback.",
                        },
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                    temperature: 0.7,
                    max_tokens: 1500,
                }),
            });
            const data = await response.json();
            const content = data.choices[0].message.content;
            // Try to extract JSON
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const suggestions = JSON.parse(jsonMatch[0]);
                return { suggestions };
            }
            return {
                suggestions: [
                    {
                        title: "General Improvements",
                        description: content.substring(0, 200),
                        priority: "medium",
                    },
                ],
            };
        }
        catch (error) {
            console.error("App analysis error:", error);
            return {
                suggestions: [
                    {
                        title: "Review Code",
                        description: "Consider adding more error handling and tests",
                        priority: "medium",
                    },
                ],
            };
        }
    },
});
