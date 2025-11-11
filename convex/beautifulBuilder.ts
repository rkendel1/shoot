import { action, ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Build beautiful, customer-ready frontend from natural language
export const buildCustomerFacingApp = action({
  args: {
    specId: v.id("apiSpecs"),
    userDescription: v.string(), // "Build a beautiful pet adoption dashboard with search and filters"
    conversationId: v.string(),
  },
  handler: async (ctx: ActionCtx, args) => {
    const spec = await ctx.runQuery(internal.specs.getSpec, { id: args.specId });
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      return {
        success: false,
        error: "OpenAI API key required for beautiful component generation",
      };
    }

    try {
      const prompt = `You are a world-class UI/UX designer and React developer. Create a BEAUTIFUL, PRODUCTION-READY, CUSTOMER-FACING application.

User Request: "${args.userDescription}"

API: ${spec.name}
Available Endpoints:
${spec.endpoints.map((e: any, i: number) => 
  `${i + 1}. ${e.method} ${e.path} - ${e.summary || e.description || 'No description'}`
).join('\n')}

Your mission:
1. Understand what the user wants to build for their CUSTOMERS
2. Design a BEAUTIFUL, modern UI that customers will love
3. Select the right endpoints to power it
4. Create a complete, working, deployable application
5. Make it look like it was designed by Apple/Airbnb/Stripe

Design Requirements:
- Modern, clean design with beautiful colors
- Responsive (mobile + desktop)
- Smooth animations and transitions
- Loading states with spinners/skeletons
- Error handling with friendly messages
- Empty states with helpful illustrations
- Success feedback with celebrations
- Professional typography
- Proper spacing and layout
- Accessible (ARIA labels, keyboard nav)
- Dark mode support (optional)

Technical Requirements:
- React + TypeScript
- Tailwind CSS for styling (generate complete config)
- Proper state management
- API integration with error handling
- Optimistic updates where applicable
- Debounced search if needed
- Pagination if needed
- Real-time updates if applicable

Generate a COMPLETE application with:

1. **App.tsx** - Main component with beautiful UI
   - Hero section if applicable
   - Navigation bar
   - Main content area
   - Footer if needed
   - All functionality working

2. **components/** - Reusable UI components
   - Button.tsx - Beautiful, accessible buttons
   - Card.tsx - Elegant cards for displaying items
   - Input.tsx - Styled form inputs
   - Modal.tsx - Polished modals if needed
   - LoadingSpinner.tsx - Smooth loading animation
   - EmptyState.tsx - Friendly empty states
   - ErrorBoundary.tsx - Graceful error handling

3. **api.ts** - API client with selected endpoints only
   - Only the endpoints needed for this app
   - Proper error handling
   - TypeScript types

4. **types.ts** - Complete TypeScript definitions

5. **styles.css** - Tailwind config + custom styles

6. **README.md** - Deployment instructions

Return as JSON:
{
  "understanding": "What you're building and why it's valuable",
  "design": {
    "colorPalette": {"primary": "#hex", "secondary": "#hex", ...},
    "typography": "Font choices",
    "layout": "Layout approach",
    "inspiration": "Design inspiration"
  },
  "selectedEndpoints": [
    {
      "endpoint": "GET /pets",
      "purpose": "Load initial data",
      "uiElement": "Card grid"
    }
  ],
  "files": {
    "src/App.tsx": "complete beautiful code with comments",
    "src/components/Button.tsx": "complete code",
    "src/components/Card.tsx": "complete code",
    "src/components/Input.tsx": "complete code",
    "src/components/LoadingSpinner.tsx": "complete code",
    "src/components/EmptyState.tsx": "complete code",
    "src/api.ts": "complete code",
    "src/types.ts": "complete code",
    "src/styles.css": "complete tailwind + custom css",
    "tailwind.config.js": "complete config",
    "package.json": "complete dependencies",
    "README.md": "deployment guide"
  },
  "features": ["Feature 1", "Feature 2", ...],
  "deploymentReady": true
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
              content: "You are a master UI/UX designer and React developer who creates stunning, production-ready applications. Your apps look professional, modern, and are ready for customers. Return only valid JSON.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.8, // Higher for creativity in design
          max_tokens: 4000,
        }),
      });

      const data: any = await response.json();
      const content = data.choices[0].message.content;
      
      // Extract JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse AI response");
      }

      const generated = JSON.parse(jsonMatch[0]);

      // Save the app
      const appName = `${args.userDescription.split(' ').slice(0, 5).join(' ')} - Customer App`;
      const appId = await ctx.runMutation(internal.apps.generateApp, {
        specId: args.specId,
        name: appName,
        description: generated.understanding,
        framework: "react",
        code: JSON.stringify(generated.files),
        metadata: JSON.stringify({
          userDescription: args.userDescription,
          design: generated.design,
          selectedEndpoints: generated.selectedEndpoints,
          features: generated.features,
          deploymentReady: true,
          customerFacing: true,
          beautiful: true,
        }),
      });

      return {
        success: true,
        appId,
        appName,
        understanding: generated.understanding,
        design: generated.design,
        selectedEndpoints: generated.selectedEndpoints,
        features: generated.features,
        fileCount: Object.keys(generated.files).length,
        message: `🎨 Created beautiful customer-facing app!\n\n**${appName}**\n\n${generated.understanding}\n\n**Design:**\n- Colors: ${JSON.stringify(generated.design.colorPalette)}\n- ${generated.design.typography}\n- ${generated.design.layout}\n\n**Features:**\n${generated.features.map((f: string) => `✓ ${f}`).join('\n')}\n\n**Using ${generated.selectedEndpoints.length} endpoints:**\n${generated.selectedEndpoints.map((e: any) => `- ${e.endpoint} → ${e.uiElement}`).join('\n')}\n\n✅ **Ready to deploy!**\n\nYou can:\n1. View the code\n2. Test it locally\n3. Deploy to Vercel/Netlify\n4. Ask me to refine it`,
      };
    } catch (error: any) {
      console.error("Beautiful app generation error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

// Refine the UI through conversation
export const refineUI = action({
  args: {
    appId: v.id("generatedApps"),
    refinementRequest: v.string(), // "Make it more colorful", "Add a search bar", "Make cards bigger"
  },
  handler: async (ctx: ActionCtx, args) => {
    const app = await ctx.runQuery(internal.apps.getApp, { id: args.appId });
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      return { success: false, error: "OpenAI API key required" };
    }

    try {
      const metadata = app.metadata || {};
      const currentDesign = metadata.design || {};

      const prompt = `You are refining a beautiful customer-facing application based on user feedback.

App: ${app.name}
Current Design: ${JSON.stringify(currentDesign, null, 2)}

User Request: "${args.refinementRequest}"

Current Files:
${Object.entries(app.code).map(([file, code]) => `\n// ${file}\n${code}`).join('\n\n---\n\n')}

Refine the application to address the user's request while maintaining:
- Professional, beautiful design
- All existing functionality
- Consistency across components
- Production-ready quality

Focus your changes on:
${args.refinementRequest.toLowerCase().includes('color') ? '- Update color palette and apply consistently' : ''}
${args.refinementRequest.toLowerCase().includes('layout') || args.refinementRequest.toLowerCase().includes('size') ? '- Adjust layout, spacing, and sizing' : ''}
${args.refinementRequest.toLowerCase().includes('add') || args.refinementRequest.toLowerCase().includes('new') ? '- Add new feature/component' : ''}
${args.refinementRequest.toLowerCase().includes('search') || args.refinementRequest.toLowerCase().includes('filter') ? '- Implement search/filter functionality' : ''}

Return as JSON:
{
  "files": {
    "src/App.tsx": "refined code",
    ...only files that changed
  },
  "designChanges": {
    "colorPalette": {...} if colors changed,
    "layout": "..." if layout changed
  },
  "changes": ["Specific change 1", "Specific change 2"],
  "explanation": "What was improved and why it's better",
  "visualDiff": "Description of visual changes user will see"
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
              content: "You are a master UI designer who makes precise, beautiful improvements based on feedback. Return only valid JSON.",
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
      const content = data.choices[0].message.content;
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse refinement");
      }

      const refined = JSON.parse(jsonMatch[0]);

      // Merge changes with existing files
      const updatedCode = { ...app.code, ...refined.files };

      // Save updates
      await ctx.runMutation(internal.appUpdates.updateApp, {
        id: args.appId,
        code: JSON.stringify(updatedCode),
      });

      return {
        success: true,
        changes: refined.changes,
        explanation: refined.explanation,
        visualDiff: refined.visualDiff,
        designChanges: refined.designChanges,
        message: `🎨 UI refined successfully!\n\n**Changes:**\n${refined.changes.map((c: string) => `✓ ${c}`).join('\n')}\n\n**Visual Impact:**\n${refined.visualDiff}\n\n**Explanation:**\n${refined.explanation}\n\nYour app is even more beautiful now! 🚀`,
      };
    } catch (error: any) {
      console.error("UI refinement error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

// Generate specific beautiful component
export const createBeautifulComponent = action({
  args: {
    specId: v.id("apiSpecs"),
    componentDescription: v.string(), // "A product card with image, price, and add to cart button"
    endpoints: v.array(v.string()), // ["GET /products/{id}"]
  },
  handler: async (ctx: ActionCtx, args) => {
    const spec = await ctx.runQuery(internal.specs.getSpec, { id: args.specId });
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      return { success: false, error: "OpenAI API key required" };
    }

    try {
      const selectedEndpoints = spec.endpoints.filter((e: any) =>
        args.endpoints.some(endpoint => `${e.method} ${e.path}` === endpoint)
      );

      const prompt = `Create a BEAUTIFUL, production-ready React component.

Component Request: "${args.componentDescription}"

API Endpoints to use:
${selectedEndpoints.map((e: any) => 
  `- ${e.method} ${e.path}: ${e.summary || e.description}`
).join('\n')}

Create a stunning component that:
- Uses modern design principles
- Has smooth animations
- Handles loading/error states beautifully
- Is fully responsive
- Uses Tailwind CSS
- Is accessible
- Looks professional

Return as JSON:
{
  "componentName": "ProductCard",
  "files": {
    "ProductCard.tsx": "complete component code",
    "ProductCard.types.ts": "typescript types",
    "api.ts": "api functions for this component"
  },
  "usage": "How to use this component",
  "props": "Props documentation",
  "preview": "Description of what it looks like"
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
              content: "You are a master React component designer. Create beautiful, reusable components. Return only valid JSON.",
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

      const data: any = await response.json();
      const content = data.choices[0].message.content;
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse component");
      }

      const component = JSON.parse(jsonMatch[0]);

      return {
        success: true,
        component: component,
        message: `🎨 Created beautiful component: **${component.componentName}**\n\n${component.preview}\n\n**Usage:**\n\`\`\`tsx\n${component.usage}\n\`\`\`\n\n**Files generated:**\n${Object.keys(component.files).join(', ')}`,
      };
    } catch (error: any) {
      console.error("Component creation error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

// Add feature to existing app through conversation
export const addFeature = action({
  args: {
    appId: v.id("generatedApps"),
    featureDescription: v.string(), // "Add a shopping cart", "Add user authentication"
  },
  handler: async (ctx: ActionCtx, args) => {
    const app = await ctx.runQuery(internal.apps.getApp, { id: args.appId });
    const spec = await ctx.runQuery(internal.specs.getSpec, { id: app.specId });
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      return { success: false, error: "OpenAI API key required" };
    }

    try {
      const metadata = app.metadata || {};

      const prompt = `Add a new feature to this customer-facing application.

Current App: ${app.name}
New Feature: "${args.featureDescription}"

Available API Endpoints:
${spec.endpoints.map((e: any) => `- ${e.method} ${e.path}: ${e.summary || e.description}`).join('\n')}

Current Files:
${Object.keys(app.code).join(', ')}

Current Design:
${JSON.stringify(metadata.design, null, 2)}

Add the feature by:
1. Selecting appropriate endpoints
2. Creating new components if needed
3. Updating existing components
4. Maintaining design consistency
5. Keeping it beautiful and professional

Return as JSON:
{
  "newFiles": {
    "src/components/NewComponent.tsx": "code if creating new files"
  },
  "updatedFiles": {
    "src/App.tsx": "updated code if modifying existing files"
  },
  "selectedEndpoints": ["GET /endpoint"],
  "features": ["New capability 1", "New capability 2"],
  "explanation": "How the feature works",
  "userInstructions": "How customers will use this feature"
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
              content: "You are an expert at adding features to existing apps while maintaining quality and design consistency. Return only valid JSON.",
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
      const content = data.choices[0].message.content;
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse feature addition");
      }

      const feature = JSON.parse(jsonMatch[0]);

      // Merge new and updated files
      const updatedCode = {
        ...app.code,
        ...feature.newFiles,
        ...feature.updatedFiles,
      };

      // Update the app
      await ctx.runMutation(internal.appUpdates.updateApp, {
        id: args.appId,
        code: JSON.stringify(updatedCode),
      });

      return {
        success: true,
        features: feature.features,
        explanation: feature.explanation,
        userInstructions: feature.userInstructions,
        filesAdded: Object.keys(feature.newFiles || {}).length,
        filesUpdated: Object.keys(feature.updatedFiles || {}).length,
        message: `✨ Feature added successfully!\n\n**New capabilities:**\n${feature.features.map((f: string) => `✓ ${f}`).join('\n')}\n\n**How it works:**\n${feature.explanation}\n\n**For your customers:**\n${feature.userInstructions}\n\n**Files changed:** ${Object.keys(feature.newFiles || {}).length} added, ${Object.keys(feature.updatedFiles || {}).length} updated`,
      };
    } catch (error: any) {
      console.error("Feature addition error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});