import { query } from "./_generated/server";

export const getOpenAIConfigStatus = query({
  handler: async () => {
    return {
      isConfigured: !!process.env.OPENAI_API_KEY,
    };
  },
});