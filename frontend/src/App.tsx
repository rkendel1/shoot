import React, { createContext, useState, useContext } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { Dashboard } from './components/Dashboard';
import { Id } from '../../convex/_generated/dataModel';
import './App.css';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// Global context for selected spec and app
interface AppContextType {
  selectedSpecId: Id<'apiSpecs'> | undefined;
  setSelectedSpecId: (id: Id<'apiSpecs'> | undefined) => void;
  selectedAppId: Id<'generatedApps'> | undefined;
  setSelectedAppId: (id: Id<'generatedApps'> | undefined) => void;
}

const AppContext = createContext<AppContextType>({
  selectedSpecId: undefined,
  setSelectedSpecId: () => {},
  selectedAppId: undefined,
  setSelectedAppId: () => {},
});

export const useAppContext = () => useContext(AppContext);

function AppContent() {
  const [selectedSpecId, setSelectedSpecId] = useState<Id<'apiSpecs'> | undefined>();
  const [selectedAppId, setSelectedAppId] = useState<Id<'generatedApps'> | undefined>();

  return (
    <AppContext.Provider 
      value={{ 
        selectedSpecId, 
        setSelectedSpecId, 
        selectedAppId, 
        setSelectedAppId 
      }}
    >
      <div className="App">
        <Dashboard />
      </div>
    </AppContext.Provider>
  );
}

function App() {
  return (
    <ConvexProvider client={convex}>
      <AppContent />
    </ConvexProvider>
  );
}

export default App;
