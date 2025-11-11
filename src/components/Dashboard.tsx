import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAppContext } from '../App';
import { Chat } from './Chat';
import { SpecsList } from './SpecsList';
import { AppsList } from './AppsList';
import { CodeViewer } from './CodeViewer';
import { ApiPlayground } from './ApiPlayground';
import { ComponentSelector } from './ComponentSelector';
import { Settings } from './Settings';
import { Id } from '../../convex/_generated/dataModel';
import './Dashboard.css';

type View = 'chat' | 'specs' | 'apps' | 'playground' | 'settings';

export const Dashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('chat');
  const [viewingApp, setViewingApp] = useState<Id<'generatedApps'> | undefined>();
  const [selectorActive, setSelectorActive] = useState(false);
  const { selectedSpecId, setSelectedSpecId, selectedAppId, setSelectedAppId } = useAppContext();

  // Get current spec details for context display
  const currentSpec = useQuery(
    api.specs.getSpec,
    selectedSpecId ? { id: selectedSpecId } : 'skip'
  );

  const handleSelectSpec = (specId: Id<'apiSpecs'>) => {
    setSelectedSpecId(specId);
    // Auto-switch to playground when spec is selected
    if (currentView === 'specs') {
      setCurrentView('playground');
    }
  };

  const handleSelectApp = (appId: Id<'generatedApps'>) => {
    setSelectedAppId(appId);
    setViewingApp(appId);
  };

  const clearContext = () => {
    setSelectedSpecId(undefined);
    setSelectedAppId(undefined);
  };

  const handleElementSelect = (elementInfo: string) => {
    // Navigate to chat and pass the element info
    setCurrentView('chat');
    // The Chat component will handle the element info insertion
    // We'll need to create a context or callback to pass this info
    console.log('Selected element:', elementInfo);
    // For now, copy to clipboard as a fallback
    navigator.clipboard.writeText(elementInfo);
  };

  const renderContent = () => {
    if (viewingApp) {
      return <CodeViewer appId={viewingApp} onClose={() => setViewingApp(undefined)} />;
    }

    switch (currentView) {
      case 'chat':
        return <Chat />;
      case 'specs':
        return <SpecsList onSelectSpec={handleSelectSpec} selectedSpecId={selectedSpecId} />;
      case 'apps':
        return (
          <AppsList
            specId={selectedSpecId}
            onSelectApp={handleSelectApp}
            selectedAppId={selectedAppId}
          />
        );
      case 'playground':
        return selectedSpecId ? (
          <ApiPlayground specId={selectedSpecId} />
        ) : (
          <div className="no-selection">
            <p>Select a spec first to use the playground</p>
            <button onClick={() => setCurrentView('specs')}>Go to Specs</button>
          </div>
        );
      case 'settings':
        return <Settings />;
      default:
        return <Chat />;
    }
  };

  return (
    <div className="dashboard">
      <ComponentSelector 
        isActive={selectorActive}
        onSelect={handleElementSelect}
        onClose={() => setSelectorActive(false)}
      />
      
      {!viewingApp && (
        <div className="dashboard-sidebar">
          <div className="sidebar-header">
            <h1>🎯 Shoot</h1>
            <p>API to App Generator</p>
          </div>

          {/* Context indicator */}
          {selectedSpecId && currentSpec && (
            <div className="context-indicator">
              <div className="context-header">
                <span className="context-label">📌 Active Context</span>
                <button className="clear-context" onClick={clearContext} title="Clear context">
                  ✕
                </button>
              </div>
              <div className="context-spec">
                <strong>{currentSpec.name}</strong>
                <span className="context-detail">{currentSpec.endpoints.length} endpoints</span>
              </div>
              <p className="context-hint">All actions will use this spec</p>
            </div>
          )}

          <nav className="sidebar-nav">
            <button
              className={`nav-button ${currentView === 'chat' ? 'active' : ''}`}
              onClick={() => setCurrentView('chat')}
            >
              <span className="nav-icon">💬</span>
              <span className="nav-label">Chat Assistant</span>
            </button>

            <button
              className={`nav-button ${currentView === 'specs' ? 'active' : ''}`}
              onClick={() => setCurrentView('specs')}
            >
              <span className="nav-icon">📋</span>
              <span className="nav-label">API Specs</span>
            </button>

            <button
              className={`nav-button ${currentView === 'apps' ? 'active' : ''}`}
              onClick={() => setCurrentView('apps')}
            >
              <span className="nav-icon">🛠️</span>
              <span className="nav-label">Generated Apps</span>
            </button>

            <button
              className={`nav-button ${currentView === 'playground' ? 'active' : ''}`}
              onClick={() => setCurrentView('playground')}
              disabled={!selectedSpecId}
            >
              <span className="nav-icon">🧪</span>
              <span className="nav-label">API Playground</span>
              {!selectedSpecId && <span className="nav-hint">Select a spec first</span>}
            </button>

            <button
              className={`nav-button ${currentView === 'settings' ? 'active' : ''}`}
              onClick={() => setCurrentView('settings')}
            >
              <span className="nav-icon">⚙️</span>
              <span className="nav-label">Settings</span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <button
                className="quick-action-btn selector-btn"
                onClick={() => setSelectorActive(!selectorActive)}
                title="Select component or CSS from the page"
              >
                🎯 Component Selector
              </button>
              <button
                className="quick-action-btn"
                onClick={() => setCurrentView('chat')}
              >
                ➕ Upload Spec
              </button>
              <button
                className="quick-action-btn"
                onClick={() => setCurrentView('chat')}
                disabled={!selectedSpecId}
              >
                🚀 Generate App
              </button>
              {selectedSpecId && (
                <button
                  className="quick-action-btn"
                  onClick={() => setCurrentView('playground')}
                >
                  🧪 Test API
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-content">
        {renderContent()}
      </div>
    </div>
  );
};