# 🎯 Shoot - Complete User Experience Guide

## Overview

Shoot is a conversational, AI-powered API spec to app generator with **context-aware interactions**. Once you select an API spec, it becomes the active context for your entire session, making the experience seamless and intuitive.

## 🚀 The Complete Flow

### 1. **First Time Experience**

**Landing:** You see the Chat Assistant with a welcome message
```
Options:
- Upload an API spec
- Show me an example  
- What can you do?
```

### 2. **Upload an API Spec**

**Three Ways to Upload:**
1. **Paste URL in chat:** "Upload https://petstore.swagger.io/v2/swagger.json"
2. **Paste content directly:** Just paste the JSON/YAML
3. **Through conversation:** "I want to add an API spec"

**What Happens:**
- ✅ Spec is parsed and validated
- ✅ All endpoints are extracted (method, path, parameters, body, responses)
- ✅ Metadata is stored (name, version, description)
- ✅ Spec appears in "API Specs" view

### 3. **Select a Spec (Sets Global Context)** 🎯

**Go to API Specs tab → Click any spec card**

**Context Indicator Appears:**
```
📌 Active Context
Swagger Petstore
20 endpoints
All actions will use this spec
```

**Now the entire app knows which API you're working with!**

### 4. **Explore Your Spec with Tabs**

Once a spec is selected, you have access to rich tabbed views:

#### **📊 Overview Tab**
- Spec name, version, description
- Stats: endpoint count, HTTP methods, spec type
- Server URLs
- **Action:** "Get AI Suggestions" button

#### **📡 Endpoints Tab**
- All endpoints in cards with:
  - Method + Path
  - Summary/description
  - Parameters (path, query, header)
  - Request body schema
  - Response codes

#### **🤖 AI Suggestions Tab**
Click "Get AI Suggestions" and AI analyzes your API to provide:

**✨ Core Capabilities**
- What this API can do

**💡 Practical Use Cases**
- 5-7 real-world applications with:
  - Title & description
  - Complexity level (simple/medium/complex)
  - Business value
  - Which endpoints to use

**🔧 Missing Features & Workarounds**
- Features the API should have
- How to achieve them with current endpoints
- What minimal API changes would enable them

**🔗 Integration Opportunities**
- Suggestions for integrating with other services
- Purpose and approach for each

**📈 Improvement Recommendations**
- Performance, security, usability, features
- Specific actionable suggestions

#### **🔄 Workflows Tab**
- View saved multi-step workflows
- Step-by-step process flows
- Complexity ratings
- Code implementations

#### **✨ Remixes Tab**
- Creative combinations of endpoints
- Novel use cases not originally intended
- Innovation explanations

### 5. **Test Live API Calls** 🧪

**Go to API Playground tab:**

**Features:**
- 🔑 **API Key Management**
  - Add multiple API keys with names
  - Select which key to use
  - Keys are stored securely
  - Delete keys you don't need

- 📡 **Live Testing**
  - Select any endpoint
  - Choose authentication type (Bearer, API Key, Basic, None)
  - Fill in path parameters (e.g., `{id}`)
  - Fill in query parameters
  - Add custom headers
  - Write request body (JSON validated)
  - See URL preview before sending

- 📥 **Real Responses**
  - Status code with color coding
  - Response time in milliseconds
  - Full headers
  - Formatted JSON response
  - CORS error detection

**Example Flow:**
```
1. Select: GET /pet/{petId}
2. Add API key: "Production Key" = "abc123..."
3. Set petId: "42"
4. Click "Send Live Request"
5. Get real response: { "id": 42, "name": "Fluffy", ... }
```

### 6. **Chat to Generate Apps** 💬

**With context set, chat becomes super powerful:**

**User:** "Generate a React app"

**AI knows your context and responds:**
```
Perfect! I'll generate a REACT app for "Swagger Petstore".

The app will include:
✓ API client with all 20 endpoints
✓ TypeScript types and interfaces
✓ Error handling and loading states
✓ Clean, production-ready code

Would you like me to use AI to enhance the code generation?
```

**Suggestions appear:**
- "Use AI enhancement"
- "Use standard templates"
- "Tell me more about AI features"

### 7. **View & Manage Generated Apps** 🛠️

**Go to Generated Apps tab:**

**See all your apps:**
- App name
- Framework (React/Node)
- AI-enhanced badge
- File count
- Creation date

**Click any app → Full Code Viewer opens**

### 8. **Code Viewer with Tabs**

**When viewing an app:**

#### **📝 Code Tab** (Default)
- File tree on left
- Code editor on right
- Syntax highlighted
- Copy code button
- Download individual files
- Download all files

#### **👁️ Preview Tab**
- Installation instructions
- Package.json details
- README documentation
- How to run the app

**Actions:**
- Download all files
- Copy to clipboard
- Close viewer

### 9. **Infinite Iterative Refinement** ♾️

**The Magic: Chat to modify generated code!**

**With context + selected app:**

**User:** "Add loading spinners to all API calls"

**AI:**
- Understands which app you mean
- Knows the code structure
- Modifies the components
- Updates the database
- You see changes instantly

**User:** "Make the colors purple instead of blue"

**AI:**
- Updates CSS/styling
- Applies changes
- Shows updated code

**You can keep refining forever through conversation!**

### 10. **Advanced AI Features**

#### **Request Workflows**
**User:** "Create a workflow to add a new pet, upload an image, and mark it as available"

**AI generates:**
- Step-by-step workflow
- Which endpoints to call
- Data flow between steps
- Error handling
- Complete TypeScript implementation
- Complete Python implementation

#### **Request Remixes**
**User:** "Show me creative ways to use this API"

**AI suggests:**
- "Pet Adoption Tinder" - swipe interface using findByStatus + image URLs
- "Pet Health Tracker" - combining user data with pet data
- "Virtual Pet Store Analytics" - aggregate endpoints for dashboards

#### **Request Missing Features**
**User:** "What's missing from this API?"

**AI identifies:**
- "Bulk operations" - needs batch endpoint
- "Webhooks" - needs event notifications
- "Search" - needs full-text search endpoint

With workarounds for each!

### 11. **Come Back Anytime** 💾

**Everything is saved in Convex:**
- ✅ All uploaded specs
- ✅ All generated apps
- ✅ All API keys
- ✅ AI suggestions and insights
- ✅ Workflows
- ✅ Remixes
- ✅ Conversation history

**Next time you open Shoot:**
1. See all your specs
2. Click one to set context
3. Continue where you left off
4. Generate more apps
5. Refine existing apps
6. Test new endpoints

## 🎨 UI Components

### **Sidebar Navigation**
```
🎯 Shoot
API to App Generator

📌 Active Context (when spec selected)
  Spec Name
  20 endpoints
  ✕ clear

💬 Chat Assistant
📋 API Specs
🛠️ Generated Apps
🧪 API Playground (disabled without context)

Quick Actions:
  ➕ Upload Spec
  🚀 Generate App
  🧪 Test API
```

### **Main Content Area**
- Changes based on selected view
- Full-screen code viewer when viewing apps
- Tabbed interface for spec details
- Chat interface with markdown support
- Playground with live testing

## 💡 Pro Tips

1. **Always select a spec first** - It sets context for everything
2. **Use AI suggestions** - They're incredibly creative
3. **Save API keys** - Test with real data
4. **Chat naturally** - Ask for changes, it understands
5. **Download code** - Use it in your projects
6. **Create workflows** - Automate complex processes
7. **Explore remixes** - Find novel use cases

## 🔄 Typical Session Flow

```
1. Open Shoot
2. Upload API spec (or select existing)
3. Spec is selected → context set
4. Get AI suggestions
5. Explore use cases and remixes
6. Add API key
7. Test endpoints live
8. Generate a React app (AI enhanced)
9. View code, download files
10. Chat: "Add dark mode"
11. AI updates code
12. Download again
13. Chat: "Now generate a Node.js backend"
14. AI creates backend
15. Test backend endpoints
16. Come back tomorrow, continue working!
```

## 🚀 What Makes This Special

1. **Context-Aware** - Select once, use everywhere
2. **Conversational** - Natural language, no forms
3. **AI-Powered** - Creative suggestions, smart generation
4. **Live Testing** - Real API calls with your keys
5. **Iterative** - Infinite refinement through chat
6. **Persistent** - Everything saved, resume anytime
7. **Complete** - From spec to deployed app

## 🎯 The Vision

**Traditional Flow:**
1. Read API docs
2. Write code manually
3. Debug
4. Deploy
5. Repeat for changes

**Shoot Flow:**
1. Upload spec
2. Chat about what you want
3. Get AI-suggested approaches
4. Generate code
5. Test live
6. Chat to refine
7. Download and deploy

**Result:** 10x faster development with better code quality and creative solutions you wouldn't have thought of!
