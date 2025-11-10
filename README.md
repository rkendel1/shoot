# 🎯 Shoot - AI-Powered API Spec to App Generator

Shoot is the world's most advanced **conversational** API specification to app generator, powered by **Convex**. Upload your API specs and chat with an AI assistant to build production-ready applications instantly.

## ✨ Features

### 🤖 Conversational AI Interface
- Natural language chat interface for building apps
- Step-by-step guidance through the entire process
- Intelligent intent detection and contextual responses
- Interactive suggestions and action recommendations
- **Real-time updates with Convex**

### 📤 Flexible API Spec Input
- Upload OpenAPI/Swagger specifications
- Paste spec content directly (JSON or YAML)
- Fetch specs from URLs
- Automatic parsing and validation

### 🔍 Intelligent Analysis
- Automatic endpoint extraction
- Authentication pattern detection
- Pagination strategy identification
- Best practices recommendations
- AI-powered spec analysis (when OpenAI API key is configured)

### 🛠️ App Generation
- React + TypeScript applications
- Node.js + Express backends
- Clean, production-ready code
- Full type safety
- Error handling and loading states
- AI-enhanced code generation

### 🧠 Pattern Learning
- Learns from generated apps
- Identifies common patterns
- Improves generation over time
- Applies learned patterns to new projects

### ⚡ Powered by Convex
- Real-time database with automatic reactivity
- Serverless functions with zero infrastructure
- Built-in authentication ready
- Automatic API generation
- Type-safe end-to-end

### 🔐 Security
- API key management per spec
- Secure storage with Convex
- Key masking in UI

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- A Convex account (free at [convex.dev](https://convex.dev))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rkendel1/shoot.git
cd shoot
```

2. Install dependencies:
```bash
npm install
cd frontend && npm install && cd ..
```

3. Set up Convex:
```bash
npx convex dev
```
This will:
- Create a new Convex project (or link to existing)
- Generate the Convex deployment URL
- Start the Convex development server
- Watch for changes in the `convex/` directory

4. Configure environment variables:

Copy the Convex URL from the previous step and create `frontend/.env.local`:
```bash
VITE_CONVEX_URL=https://your-deployment-url.convex.cloud
```

Optionally, configure OpenAI API key in your Convex dashboard for AI features:
- Go to your Convex dashboard
- Navigate to Settings > Environment Variables
- Add: `OPENAI_API_KEY=your-key-here`

5. Start the frontend (in a new terminal):
```bash
npm run dev:frontend
```

6. Open http://localhost:5173 in your browser

## 💬 Using the Conversational Interface

The chat interface understands natural language commands. Here are some examples:

### Upload a Spec
- "Upload https://petstore.swagger.io/v2/swagger.json"
- "I want to add an API spec"
- "Let me paste my OpenAPI spec"

### Generate Apps
- "Generate a React app from this spec"
- "Create a Node.js backend"
- "Build an app with AI enhancement"

### Analyze APIs
- "Analyze this API"
- "What patterns do you see?"
- "Check for best practices"

### General Queries
- "What can you do?"
- "Show me my specs"
- "List all endpoints"
- "Help me get started"

## 🏗️ Architecture

### Convex Backend
- **Functions**: Serverless mutations, queries, and actions
- **Database**: Real-time document database
- **Schema**: Type-safe data modeling
- **Real-time**: Automatic reactivity and subscriptions

### Frontend (React + TypeScript)
- **React 18** - UI library
- **Vite** - Build tool
- **Convex React** - Real-time hooks
- **React Markdown** - Markdown rendering

## 📁 Project Structure

```
shoot/
├── convex/                   # Convex backend
│   ├── schema.ts            # Database schema
│   ├── chat.ts              # Conversational AI functions
│   ├── specs.ts             # Spec management functions
│   ├── apps.ts              # App generation functions
│   ├── apiKeys.ts           # API key management
│   ├── utils.ts             # Utility functions
│   └── _generated/          # Auto-generated types
├── frontend/
│   └── src/
│       ├── components/      # React components
│       │   └── Chat.tsx     # Main chat interface
│       ├── services/        # (Minimal - Convex handles this)
│       └── main.tsx         # App entry with ConvexProvider
└── .env                     # Environment variables (gitignored)
```

## 🔌 Convex Functions

### Chat
- `sendMessage` - Send message to conversational AI
- `getMessages` - Get conversation history
- `clearConversation` - Clear conversation

### Specs
- `uploadSpec` - Upload API specification
- `getAllSpecs` - List all specs
- `getSpec` - Get spec details
- `deleteSpec` - Delete spec
- `getEndpoints` - Get endpoints for a spec

### Apps
- `generateApp` - Generate app from spec
- `getAllApps` - List generated apps
- `getApp` - Get app details
- `deleteApp` - Delete generated app

### API Keys
- `addApiKey` - Add API key
- `getApiKeys` - Get keys for spec
- `deleteApiKey` - Delete API key

### Utils
- `parseSpec` - Parse spec from URL or content
- `generateAppCode` - Generate app code with templates or AI

## 🤖 AI Features

When you configure an OpenAI API key in Convex environment variables, Shoot unlocks advanced features:

- **Enhanced Code Generation** - AI generates more sophisticated, context-aware code
- **Deep Spec Analysis** - Get intelligent suggestions and insights
- **Pattern Learning** - AI learns from successful implementations
- **Natural Conversation** - More natural and context-aware chat responses

To enable AI features:
1. Go to your Convex dashboard
2. Navigate to Settings > Environment Variables
3. Add: `OPENAI_API_KEY=your-key-here`
4. Redeploy with `npx convex deploy`

## 🔧 Configuration

### Environment Variables

**Convex Dashboard (for backend):**
- `OPENAI_API_KEY` - OpenAI API key (optional, for AI features)

**Frontend (.env.local):**
- `VITE_CONVEX_URL` - Your Convex deployment URL

## 🧪 Development

### Running in Development Mode
```bash
# Terminal 1: Start Convex dev server
npm run dev

# Terminal 2: Start frontend
npm run dev:frontend
```

### Deploying to Production
```bash
# Deploy Convex functions and build frontend
npm run deploy
```

Your Convex functions will be deployed and the frontend will be built for production.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

ISC

## 🙏 Acknowledgments

- Convex for the amazing backend platform
- OpenAI for GPT-4 API
- The open-source community

---

Built with ❤️ for developers who love automation and real-time collaboration