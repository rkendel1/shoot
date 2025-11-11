import { action, ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import SwaggerParser from "swagger-parser";
import jsyaml from "js-yaml";

// Parse spec from URL or content
export const parseSpec = action({
  args: {
    content: v.optional(v.string()),
    specUrl: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx: ActionCtx, args) => {
    let parsedSpec: any;

    try {
      if (args.specUrl) {
        // swagger-parser can handle URLs directly, and it parses both JSON and YAML
        parsedSpec = await SwaggerParser.bundle(args.specUrl);
      } else if (args.content) {
        let parsedContent: any;
        try {
          // Try parsing as JSON
          parsedContent = JSON.parse(args.content);
        } catch (e) {
          // Fallback to parsing as YAML
          try {
            parsedContent = jsyaml.load(args.content);
            if (typeof parsedContent !== 'object' || parsedContent === null) {
              throw new Error("YAML content did not parse to an object.");
            }
          } catch (yamlError: any) {
            throw new Error(`Failed to parse content as JSON or YAML: ${yamlError.message}`);
          }
        }
        // Bundle to resolve any references
        parsedSpec = await SwaggerParser.bundle(parsedContent);
      } else {
        throw new Error("Either content or specUrl is required");
      }

      // Extract metadata
      const metadata = {
        title: parsedSpec.info?.title || args.name || "Untitled API",
        version: parsedSpec.info?.version || "1.0.0",
        description: parsedSpec.info?.description,
      };

      // Detect spec type
      let specType: "openapi" | "swagger" | "other" = "other";
      if (parsedSpec.openapi) {
        specType = "openapi";
      } else if (parsedSpec.swagger) {
        specType = "swagger";
      }

      // Extract endpoints
      const endpoints: any[] = [];
      if (parsedSpec.paths) {
        for (const [path, pathItem] of Object.entries(parsedSpec.paths)) {
          const methods = ["get", "post", "put", "delete", "patch", "options", "head"];

          for (const method of methods) {
            const operation = (pathItem as any)[method];
            if (operation) {
              endpoints.push({
                path,
                method: method.toUpperCase(),
                summary: operation.summary,
                description: operation.description,
                parameters: JSON.stringify(operation.parameters || []),
                requestBody: operation.requestBody
                  ? JSON.stringify(operation.requestBody)
                  : undefined,
                responses: JSON.stringify(operation.responses || {}),
              });
            }
          }
        }
      }

      // Store the spec
      const result = await ctx.runMutation(internal.specs.uploadSpec, {
        name: metadata.title,
        description: metadata.description,
        version: metadata.version,
        specType,
        content: JSON.stringify(parsedSpec),
        endpoints,
      });

      return {
        success: true,
        ...result,
        metadata,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to parse spec",
      };
    }
  },
});

// Generate app code
export const generateAppCode = action({
  args: {
    specId: v.id("apiSpecs"),
    framework: v.string(),
    useAI: v.boolean(),
  },
  handler: async (ctx: ActionCtx, args) => {
    try {
      const spec = await ctx.runQuery(internal.specs.getSpec, { id: args.specId });
      const endpoints = spec.endpoints;

      let generatedCode: { [filename: string]: string } = {};

      // Use AI if requested and API key is available
      if (args.useAI && process.env.OPENAI_API_KEY) {
        generatedCode = await generateWithAI(
          args.framework,
          spec.name,
          endpoints,
          process.env.OPENAI_API_KEY
        );
      } else {
        // Use templates
        generatedCode = generateWithTemplates(args.framework, spec.name, endpoints);
      }

      // Store the generated app
      const result = await ctx.runMutation(internal.apps.generateApp, {
        specId: args.specId,
        name: `${spec.name} ${args.framework} App`,
        description: `Generated ${args.framework} application`,
        framework: args.framework,
        code: JSON.stringify(generatedCode),
        metadata: JSON.stringify({
          useAI: args.useAI,
          fileCount: Object.keys(generatedCode).length,
        }),
      });

      return {
        success: true,
        ...result,
        fileCount: Object.keys(generatedCode).length,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to generate app",
      };
    }
  },
});

// Helper: Generate with AI
async function generateWithAI(
  framework: string,
  specName: string,
  endpoints: any[],
  apiKey: string
): Promise<{ [filename: string]: string }> {
  const prompt = `Generate a complete ${framework} application for the API: ${specName}

Endpoints:
${endpoints.map((e) => `- ${e.method} ${e.path}: ${e.summary || e.description || ""}`).join("\n")}

Requirements:
- Use TypeScript
- Include proper error handling
- Add loading states
- Use modern best practices
- Include types/interfaces
- Add documentation comments

Generate the main files needed for this application.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are an expert code generator that creates production-ready applications from API specifications.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    const data: any = await response.json();
    const generatedContent = data.choices[0].message.content;

    // Parse code blocks from response
    return parseGeneratedCode(generatedContent);
  } catch (error) {
    console.error("AI generation error:", error);
    // Fallback to templates
    return generateWithTemplates(framework, specName, endpoints);
  }
}

// Helper: Parse generated code
function parseGeneratedCode(content: string): { [filename: string]: string } {
  const files: { [filename: string]: string } = {};
  const codeBlockRegex = /```(?:\w+)?\s*(?:\/\/|#)\s*([^\n]+)\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const filename = match[1].trim();
    const code = match[2].trim();
    files[filename] = code;
  }

  if (Object.keys(files).length === 0) {
    files["generated.tsx"] = content;
  }

  return files;
}

// Helper: Generate with templates
function generateWithTemplates(
  framework: string,
  specName: string,
  endpoints: any[]
): { [filename: string]: string } {
  if (framework === "react") {
    return generateReactApp(specName, endpoints);
  } else if (framework === "node" || framework === "express") {
    return generateNodeApp(specName, endpoints);
  }
  
  return {
    "README.md": `# ${specName}\n\nGenerated app for ${framework}`,
  };
}

function generateReactApp(specName: string, endpoints: any[]): { [filename: string]: string } {
  return {
    "src/api/client.ts": `import axios, { AxiosInstance } from 'axios';

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string, apiKey?: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': \`Bearer \${apiKey}\` }),
      },
    });
  }

  async get<T>(url: string): Promise<T> {
    const response = await this.client.get<T>(url);
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

export default new ApiClient('https://api.example.com');
`,
    "src/App.tsx": `import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>${specName}</h1>
      <p>Generated React app with ${endpoints.length} endpoints</p>
    </div>
  );
}

export default App;
`,
    "package.json": JSON.stringify(
      {
        name: specName.toLowerCase().replace(/\s+/g, "-"),
        version: "1.0.0",
        dependencies: {
          react: "^18.2.0",
          "react-dom": "^18.2.0",
          axios: "^1.6.2",
        },
      },
      null,
      2
    ),
    "README.md": `# ${specName}\n\nGenerated React app with ${endpoints.length} endpoints.\n\n## Installation\n\`\`\`bash\nnpm install\n\`\`\`\n\n## Development\n\`\`\`bash\nnpm start\n\`\`\``,
  };
}

function generateNodeApp(specName: string, endpoints: any[]): { [filename: string]: string } {
  return {
    "src/index.ts": `import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: '${specName} API' });
});

app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});
`,
    "package.json": JSON.stringify(
      {
        name: specName.toLowerCase().replace(/\s+/g, "-"),
        version: "1.0.0",
        dependencies: {
          express: "^4.18.2",
          cors: "^2.8.5",
        },
      },
      null,
      2
    ),
    "README.md": `# ${specName}\n\nGenerated Node.js app with ${endpoints.length} endpoints.\n\n## Installation\n\`\`\`bash\nnpm install\n\`\`\`\n\n## Development\n\`\`\`bash\nnpm start\n\`\`\``,
  };
}