# 🎯 AI Development Rules for Shoot

This document outlines the technical stack and rules for the AI assistant (Dyad) to follow when developing the Shoot application. The goal is to maintain code quality, consistency, and architectural integrity.

## 🚀 Tech Stack

The Shoot application is built on a modern, real-time, serverless architecture.

-   **Backend**: **Convex** is the exclusive backend platform. It provides the serverless functions, real-time database, and schema management. All backend logic resides in the `convex/` directory.
-   **Frontend**: **React** with **TypeScript** is the framework for the user interface. The frontend is built and served using **Vite**.
-   **Real-time Data Layer**: **Convex React Hooks** (`useQuery`, `useMutation`, `useAction`) are used for all client-server communication, ensuring a reactive and real-time user experience.
-   **AI Integration**: **OpenAI GPT-4** is used via server-side `fetch` calls within Convex actions for all AI-powered features, including conversational chat, code generation, and API analysis.
-   **Styling**: **Standard CSS** with per-component stylesheets. Each component has a corresponding `.css` file (e.g., `Chat.css`, `Dashboard.css`) for scoped styling.
-   **Global State Management**: **React Context API** (`AppContext`) is used for simple, global state needs like managing the active API spec context.
-   **Language**: **TypeScript** is used for both the frontend and backend, providing end-to-end type safety.

## 📋 Library Usage Rules

To maintain consistency, please adhere to the following rules when adding or modifying code.

1.  **Backend Logic**:
    -   **DO**: Implement all backend logic, database operations, and third-party API calls (like OpenAI) within Convex functions (`query`, `mutation`, `action`).
    -   **DO NOT**: Write any backend logic outside of the `convex/` directory.

2.  **Data Fetching (Frontend)**:
    -   **DO**: Use the official Convex React hooks (`useQuery`, `useMutation`, `useAction`) for all communication with the backend.
    -   **DO NOT**: Use `fetch`, `axios`, or any other data-fetching library on the client-side to communicate with the Convex backend.

3.  **State Management**:
    -   **DO**: Use the existing `AppContext` for managing global state that needs to be shared across the application (e.g., `selectedSpecId`).
    -   **DO**: Use React's built-in `useState` and `useEffect` hooks for local component state.
    -   **DO NOT**: Introduce complex state management libraries like Redux, MobX, or Zustand.

4.  **Styling**:
    -   **DO**: Create a separate `.css` file for each new component to keep styles scoped and organized.
    -   **DO**: Follow the existing CSS conventions and naming patterns.
    -   **DO NOT**: Introduce utility-first CSS frameworks (like Tailwind CSS) or CSS-in-JS libraries (like styled-components) without explicit instruction.

5.  **UI Components**:
    -   **DO**: Build custom, reusable React components for all UI elements to match the application's unique design.
    -   **DO NOT**: Install or use third-party component libraries like Material-UI, Ant Design, or Chakra UI.

6.  **Icons**:
    -   **DO**: Use emoji characters for icons to maintain the current lightweight and clean aesthetic (e.g., `💬`, `📋`, `🛠️`).
    -   **DO NOT**: Install a dedicated icon library (like `lucide-react` or `react-icons`) unless specifically requested.

7.  **Markdown Rendering**:
    -   **DO**: Use the `react-markdown` library for rendering any Markdown content within the UI, especially in the chat interface.
    -   **DO NOT**: Implement custom Markdown parsing logic.