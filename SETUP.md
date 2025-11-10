# Shoot - Setup Guide

## Quick Setup Instructions

### 1. Install Dependencies

```bash
# Install root dependencies (includes Convex)
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Set Up Convex

```bash
# Initialize Convex (creates deployment and starts dev server)
npx convex dev
```

This command will:
- Ask you to log in to Convex (or create a free account)
- Create a new project or link to an existing one
- Generate the Convex deployment URL
- Start watching your `convex/` directory for changes
- Generate TypeScript types in `convex/_generated/`

**Important:** Keep this terminal running - it's your Convex dev server!

### 3. Configure Frontend

After running `npx convex dev`, you'll see a deployment URL like:
```
https://your-project.convex.cloud
```

Create `frontend/.env.local` and add your URL:

```bash
# frontend/.env.local
VITE_CONVEX_URL=https://your-project.convex.cloud
```

### 4. Configure OpenAI (Optional but Recommended)

For AI-enhanced features:

1. Go to your Convex dashboard: https://dashboard.convex.dev
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - Key: `OPENAI_API_KEY`
   - Value: `your-openai-api-key-here`
5. Save and redeploy

### 5. Start Frontend

In a **new terminal** (keep Convex dev running in the first):

```bash
npm run dev:frontend
```

### 6. Open the App

Navigate to: http://localhost:5173

You should see the Shoot chat interface ready to use!

## Testing the Conversational Interface

Try these commands:

1. **Get Help:**
   - "What can you do?"
   - "Help me get started"

2. **Upload a Spec:**
   - "Upload https://petstore.swagger.io/v2/swagger.json"
   - "I want to add an API spec"

3. **Generate Apps:**
   - "Generate a React app"
   - "Create a Node.js backend"

4. **Analyze:**
   - "Analyze this API"
   - "Show me the endpoints"

## Troubleshooting

### "Convex client not found" error
- Make sure `npx convex dev` is running
- Check that `VITE_CONVEX_URL` is set correctly in `frontend/.env.local`
- Restart the frontend dev server after adding the env variable

### Types not generated
- Convex generates types automatically when you run `npx convex dev`
- They appear in `convex/_generated/`
- If missing, stop and restart `npx convex dev`

### OpenAI features not working
- Check that `OPENAI_API_KEY` is set in Convex dashboard
- Redeploy with: `npx convex deploy`
- AI features are optional - basic functionality works without them

### Port already in use
- Frontend uses port 5173
- Change in `frontend/vite.config.ts` if needed

## Development Workflow

### Making Changes

1. **Convex Functions** (`convex/*.ts`):
   - Edit files in `convex/` directory
   - Convex dev server auto-reloads
   - Types auto-regenerate

2. **Frontend** (`frontend/src/`):
   - Edit React components
   - Vite hot-reloads automatically

### Deploying to Production

```bash
# Deploy Convex functions to production
npx convex deploy

# Build frontend
npm run build:frontend

# Deploy frontend to your hosting (Vercel, Netlify, etc.)
# The built files are in frontend/dist/
```

### Environment Variables in Production

1. **Convex Dashboard:**
   - Set `OPENAI_API_KEY` in production environment

2. **Frontend Hosting:**
   - Set `VITE_CONVEX_URL` to your production Convex URL
   - Most platforms (Vercel, Netlify) handle this automatically

## Architecture Overview

```
┌─────────────────────────────────────────┐
│          Frontend (React)               │
│  - Chat Interface                       │
│  - Real-time updates                    │
│  - Convex React hooks                   │
└─────────────────┬───────────────────────┘
                  │
                  │ Convex React Client
                  │
┌─────────────────▼───────────────────────┐
│       Convex Backend (Serverless)       │
│  ┌─────────────────────────────────┐   │
│  │  Functions (mutations/queries)  │   │
│  │  - chat.ts (conversations)      │   │
│  │  - specs.ts (API specs)         │   │
│  │  - apps.ts (code generation)    │   │
│  │  - utils.ts (parsing, AI)       │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │    Real-time Database           │   │
│  │  - Automatic reactivity         │   │
│  │  - Type-safe schema             │   │
│  └─────────────────────────────────┘   │
└─────────────────┬───────────────────────┘
                  │
                  │ External APIs
                  │
        ┌─────────▼──────────┐
        │   OpenAI API       │
        │   (Optional)       │
        └────────────────────┘
```

## Next Steps

1. Try uploading an API spec
2. Generate your first app
3. Explore AI-enhanced features (if OpenAI is configured)
4. Customize app generation templates in `convex/utils.ts`
5. Add more conversational intents in `convex/chat.ts`

## Support

- Convex Docs: https://docs.convex.dev
- Convex Discord: https://convex.dev/community
- Project Issues: https://github.com/rkendel1/shoot/issues

Happy building! 🚀
