import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx, action, ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";

// Upload a new API spec
export const uploadSpec = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    version: v.optional(v.string()),
    specType: v.union(
      v.literal("openapi"),
      v.literal("swagger"),
      v.literal("postman"),
      v.literal("other")
    ),
    content: v.string(),
    endpoints: v.any(), // Simplified to prevent type generation issues
  },
  handler: async (ctx: MutationCtx, args) => {
    const { endpoints, ...specData } = args;

    // Create the spec
    const specId = await ctx.db.insert("apiSpecs", specData);

    // Create endpoints
    for (const endpoint of endpoints as any[]) {
      await ctx.db.insert("apiEndpoints", {
        specId,
        ...endpoint,
      });
    }

    return {
      id: specId,
      name: args.name,
      endpointCount: (endpoints as any[]).length,
    };
  },
});

// Get all specs
export const getAllSpecs = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    const specs = await ctx.db.query("apiSpecs").order("desc").collect();

    const specsWithCounts = await Promise.all(
      specs.map(async (spec) => {
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
      })
    );

    return specsWithCounts;
  },
});

// Get a specific spec with endpoints
export const getSpec = query({
  args: { id: v.id("apiSpecs") },
  handler: async (ctx: QueryCtx, args) => {
    const spec = await ctx.db.get(args.id);
    
    if (!spec) {
      return null;
    }

    const endpoints = await ctx.db
      .query("apiEndpoints")
      .withIndex("by_spec", (q) => q.eq("specId", args.id))
      .collect();

    // Return a plain object to avoid type generation issues
    return {
      _id: spec._id,
      _creationTime: spec._creationTime,
      name: spec.name,
      description: spec.description,
      version: spec.version,
      specType: spec.specType,
      content: spec.content,
      overrideBaseUrl: spec.overrideBaseUrl,
      endpoints: endpoints.map(e => ({ ...e })),
    };
  },
});

// Get endpoints for a spec
export const getEndpoints = query({
  args: { specId: v.id("apiSpecs") },
  handler: async (ctx: QueryCtx, args) => {
    const endpoints = await ctx.db
      .query("apiEndpoints")
      .withIndex("by_spec", (q) => q.eq("specId", args.specId))
      .collect();

    return endpoints.map(e => ({ ...e }));
  },
});

// Delete a spec
export const deleteSpec = mutation({
  args: { id: v.id("apiSpecs") },
  handler: async (ctx: MutationCtx, args) => {
    const endpoints = await ctx.db
      .query("apiEndpoints")
      .withIndex("by_spec", (q) => q.eq("specId", args.id))
      .collect();
    for (const endpoint of endpoints) await ctx.db.delete(endpoint._id);

    const apps = await ctx.db
      .query("generatedApps")
      .withIndex("by_spec", (q) => q.eq("specId", args.id))
      .collect();
    for (const app of apps) await ctx.db.delete(app._id);

    const apiKeys = await ctx.db
      .query("apiKeys")
      .withIndex("by_spec", (q) => q.eq("specId", args.id))
      .collect();
    for (const key of apiKeys) await ctx.db.delete(key._id);

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Update spec settings
export const updateSpecSettings = mutation({
  args: {
    id: v.id("apiSpecs"),
    overrideBaseUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { overrideBaseUrl: args.overrideBaseUrl });
    return { success: true };
  },
});

// Securely proxy API requests from the backend
export const proxyApiRequest = action({
  args: {
    endpointPath: v.string(),
    method: v.string(),
    pathParams: v.string(), // JSON string
    queryParams: v.string(), // JSON string
    body: v.optional(v.string()),
    baseUrl: v.string(),
    auth: v.optional(v.object({
      apiKeyId: v.id("apiKeys"),
      scheme: v.any(), // The security scheme object from the spec
    })),
  },
  handler: async (ctx: ActionCtx, args) => {
    const headers: HeadersInit = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    const queryParams = JSON.parse(args.queryParams);

    if (args.auth) {
      const keyRecord = await ctx.runQuery(internal.apiKeys.getApiKeyInternal, { id: args.auth.apiKeyId });
      const apiKey = keyRecord?.keyValue;
      const scheme = args.auth.scheme;

      if (apiKey && scheme) {
        if (scheme.type === 'apiKey') {
          if (scheme.in === 'header') {
            headers[scheme.name] = apiKey;
          } else if (scheme.in === 'query') {
            queryParams[scheme.name] = apiKey;
          }
        } else if (scheme.type === 'http' && scheme.scheme === 'bearer') {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
      }
    }

    let path = args.endpointPath;
    const pathParams = JSON.parse(args.pathParams);
    Object.entries(pathParams).forEach(([key, value]) => {
      path = path.replace(`{${key}}`, encodeURIComponent(value as string));
    });

    const finalBaseUrl = args.baseUrl.endsWith('/') ? args.baseUrl.slice(0, -1) : args.baseUrl;
    let url = `${finalBaseUrl}${path}`;

    const queryString = new URLSearchParams(queryParams).toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const options: RequestInit = {
      method: args.method.toUpperCase(),
      headers,
    };
    if (['POST', 'PUT', 'PATCH'].includes(args.method.toUpperCase()) && args.body) {
      options.body = args.body;
    }

    const startTime = Date.now();
    const response = await fetch(url, options);
    const endTime = Date.now();

    const responseBody = await (response.headers.get('content-type')?.includes('application/json') 
      ? response.json() 
      : response.text());

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseBody,
      time: endTime - startTime,
      url: url,
    };
  },
});