import React from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { Chat } from './components/Chat';
import './App.css';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function App() {
  return (
    <ConvexProvider client={convex}>
      <div className="App">
        <Chat />
      </div>
    </ConvexProvider>
  );
}

export default App;
