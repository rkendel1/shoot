import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import './AppsList.css';

interface AppsListProps {
  specId?: Id<'apiSpecs'>;
  onSelectApp: (appId: Id<'generatedApps'>) => void;
  selectedAppId?: Id<'generatedApps'>;
}

export const AppsList: React.FC<AppsListProps> = ({ specId, onSelectApp, selectedAppId }) => {
  const apps = useQuery(api.apps.getAllApps, specId ? { specId } : {});
  const deleteApp = useMutation(api.apps.deleteApp);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (appId: Id<'generatedApps'>, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this generated app?')) return;

    setDeleting(appId);
    try {
      await deleteApp({ id: appId });
    } catch (error) {
      console.error('Failed to delete app:', error);
      alert('Failed to delete app');
    } finally {
      setDeleting(null);
    }
  };

  if (!apps) {
    return (
      <div className="apps-list loading">
        <p>Loading apps...</p>
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="apps-list empty">
        <div className="empty-state">
          <h3>No Generated Apps Yet</h3>
          <p>Generate your first app from an API spec!</p>
          <p className="hint">Try saying: "Generate a React app"</p>
        </div>
      </div>
    );
  }

  return (
    <div className="apps-list">
      <h2>🛠️ Generated Apps ({apps.length})</h2>
      <div className="apps-grid">
        {apps.map((app: typeof apps[number]) => (
          <div
            key={app.id}
            className={`app-card ${selectedAppId === app.id ? 'selected' : ''}`}
            onClick={() => onSelectApp(app.id)}
          >
            <div className="app-header">
              <h3>{app.name}</h3>
              <button
                className="delete-btn"
                onClick={(e) => handleDelete(app.id, e)}
                disabled={deleting === app.id}
                title="Delete app"
              >
                {deleting === app.id ? '⏳' : '🗑️'}
              </button>
            </div>
            <div className="app-info">
              <span className={`framework-badge ${app.framework}`}>
                {app.framework === 'react' ? '⚛️ React' : '📦 Node.js'}
              </span>
              {app.metadata?.useAI && (
                <span className="ai-badge">🤖 AI Enhanced</span>
              )}
            </div>
            {app.description && (
              <p className="app-description">{app.description}</p>
            )}
            <div className="app-footer">
              <span className="file-count">
                📄 {app.fileCount} file{app.fileCount !== 1 ? 's' : ''}
              </span>
              <span className="created-date">
                {new Date(app.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};