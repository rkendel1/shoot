# Conversational Interface Examples

This guide shows you how to interact with Shoot's conversational AI interface.

## Basic Conversations

### Starting Out

**User:** "What can you do?"

**Shoot:** Shows a comprehensive overview of capabilities including:
- Uploading API specs
- Generating apps
- Analyzing APIs
- Pattern detection

### Getting Help

**User:** "Help me get started"

**Shoot:** Provides step-by-step guidance and suggestions for first actions.

## Uploading API Specifications

### From URL

**User:** "Upload https://petstore.swagger.io/v2/swagger.json"

**Shoot:** 
- Fetches the spec from the URL
- Parses and validates it
- Extracts all endpoints
- Stores it in the database
- Responds with spec details and suggests next actions

**Example Response:**
```
Great! I've successfully loaded the API spec "Swagger Petstore" (version 1.0.7). 
I found 20 endpoints. Would you like me to:

1. Show you the endpoints
2. Analyze the API for patterns
3. Generate an app from this spec
4. Tell you more about the API
```

### Pasting Content

**User:** "I want to paste my API spec"

**Shoot:** Guides you through pasting the spec content directly.

### From Another URL

**User:** "Can you load https://api.example.com/openapi.json"

**Shoot:** Automatically detects the URL and fetches the spec.

## Generating Applications

### Simple Request

**User:** "Generate a React app"

**Shoot:** 
- Checks if a spec is currently loaded
- If yes, generates a React app with TypeScript
- If no, asks which spec to use

**Example Response:**
```
Perfect! I'll generate a REACT app for "Swagger Petstore".

The app will include:
✓ API client with all 20 endpoints
✓ TypeScript types and interfaces
✓ Error handling and loading states
✓ Clean, production-ready code

Would you like me to use AI to enhance the code generation?
```

### Specifying Framework

**User:** "Create a Node.js backend"

**Shoot:** Generates an Express/Node.js server implementation

**User:** "Build me a Node server with TypeScript"

**Shoot:** Recognizes the backend request and generates appropriate code

### With AI Enhancement

**User:** "Generate a React app with AI"

**Shoot:** 
- Uses GPT-4 to generate more sophisticated code
- Creates context-aware components
- Adds advanced error handling
- Includes best practices

## Analyzing APIs

### Basic Analysis

**User:** "Analyze this API"

**Shoot:** Provides analysis including:
- Endpoint count
- HTTP methods used
- Authentication detected
- Pagination patterns
- Sample endpoints
- Best practice suggestions (with AI)

**Example Response:**
```
Here's my analysis of "Swagger Petstore":

📊 **Overview**
- Endpoints: 20
- Spec Type: SWAGGER
- Version: 1.0.7

🔧 **HTTP Methods**
- GET
- POST
- PUT
- DELETE

🛤️ **Sample Endpoints**
- `/pet`
- `/pet/{petId}`
- `/pet/findByStatus`
- `/store/order`
- `/user`

**What would you like to do next?**
```

### Pattern Detection

**User:** "What patterns do you see in this API?"

**Shoot:** Identifies:
- Authentication schemes
- Pagination strategies
- Error handling patterns
- Common response structures

## Listing and Exploring

### List Specs

**User:** "Show me my specs"

**Shoot:** Lists all uploaded API specifications with details

**Example Response:**
```
Here are your 3 API spec(s):

1. **Swagger Petstore** (1.0.7) - 20 endpoints
2. **GitHub API** (v3) - 150 endpoints
3. **Stripe API** (2023-10-16) - 300 endpoints
```

### List Endpoints

**User:** "List all endpoints"

or

**User:** "Show me the endpoints for this API"

**Shoot:** Displays all endpoints with methods and descriptions

**Example Response:**
```
Here are all 20 endpoints for "Swagger Petstore":

1. **POST** `/pet` - Add a new pet to the store
2. **PUT** `/pet` - Update an existing pet
3. **GET** `/pet/findByStatus` - Finds Pets by status
4. **GET** `/pet/findByTags` - Finds Pets by tags
5. **GET** `/pet/{petId}` - Find pet by ID
... and 15 more
```

## Advanced Conversations

### Context Awareness

The AI maintains context throughout the conversation:

**User:** "Upload https://petstore.swagger.io/v2/swagger.json"
**Shoot:** *(loads spec)* "Spec loaded successfully!"

**User:** "Now analyze it"
**Shoot:** *(knows which spec to analyze)* "Here's the analysis..."

**User:** "Generate a React app"
**Shoot:** *(uses the same spec)* "Generating React app for Petstore..."

### Natural Language

You can ask in various ways:

- "Can you help me upload an API?"
- "I'd like to create an application"
- "What's in this API?"
- "Build me something with React"
- "Show me what I have"

### Follow-up Questions

**User:** "Generate a React app with AI"
**Shoot:** "I'll generate an AI-enhanced React app..."

**User:** "Can you also make a Node.js version?"
**Shoot:** "Sure! Generating Node.js backend..."

**User:** "Tell me more about the AI features"
**Shoot:** *(explains AI capabilities)*

## Tips for Best Results

### Be Specific When Needed

Instead of: "Generate an app"
Try: "Generate a React TypeScript app with AI enhancement"

### Use Natural Language

The AI understands casual conversation:
- "Hey, can you help me?"
- "I want to build something"
- "Let's analyze this API"

### Follow Suggestions

Shoot provides contextual suggestions - clicking them often leads to the best experience.

### Ask for Clarification

If you're unsure:
- "What can I do with this spec?"
- "What's the difference between AI and regular generation?"
- "How do I use the generated code?"

## Complete Example Workflow

```
User: "Hi! What can you do?"

Shoot: *Explains capabilities and shows suggestions*

User: "Upload https://petstore.swagger.io/v2/swagger.json"

Shoot: "Great! I've loaded Swagger Petstore with 20 endpoints. 
       What would you like to do?"

User: "Analyze it first"

Shoot: *Shows comprehensive analysis*
       "Would you like to generate an app?"

User: "Yes, create a React app with AI"

Shoot: "Perfect! Generating AI-enhanced React app...
       The app includes all 20 endpoints with full TypeScript support."

User: "Can you also make a Node.js backend?"

Shoot: "Sure! Generating Node.js Express backend...
       The backend includes routes for all endpoints."

User: "Show me what I have now"

Shoot: "You have:
       - 1 API spec: Swagger Petstore
       - 2 generated apps: React app, Node.js backend"
```

## Error Handling

If something goes wrong:

**User:** "Upload http://invalid-url.com/spec"

**Shoot:** "I had trouble loading that spec from the URL. Could you:
1. Paste the spec content directly
2. Check if the URL is accessible
3. Make sure it's a valid OpenAPI/Swagger spec"

## Get Creative!

The conversational interface is designed to understand intent, so feel free to:
- Ask questions
- Request modifications
- Explore different options
- Chat naturally

Shoot will guide you through the process! 🚀
