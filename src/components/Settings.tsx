import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import './Settings.css';

export const Settings: React.FC = () => {
  const configStatus = useQuery(api.config.getOpenAIConfigStatus);

  const isConfigured = configStatus?.isConfigured;

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>⚙️ Settings</h2>
        <p>Configure your Shoot environment and integrations.</p>
      </div>

      <div className="settings-card">
        <h3>OpenAI API Key</h3>
        
        <div className="status-section">
          <span className="status-label">AI Features Status:</span>
          {isConfigured === undefined ? (
            <span>Loading...</span>
          ) : isConfigured ? (
            <span className="status-badge configured">✅ Enabled</span>
          ) : (
            <span className="status-badge not-configured">❌ Not Configured</span>
          )}
        </div>

        <div className="instructions-section">
          <p>
            To unlock powerful AI features like intelligent app generation, smart suggestions, and code refinement, you need to add your OpenAI API key to your Convex project.
          </p>
          <p>
            Your key is stored securely as a server-side environment variable and is never exposed to the browser.
          </p>
          
          <h4>Configuration Steps:</h4>
          <ol>
            <li>Click the button below to go to your Convex project dashboard.</li>
            <li>Navigate to the <strong>Settings</strong> tab.</li>
            <li>Find the <strong>Environment Variables</strong> section.</li>
            <li>
              Add a new variable with the name <code>OPENAI_API_KEY</code> and paste your key as the value.
            </li>
            <li>Save the changes. The status above should update automatically.</li>
          </ol>

          <a 
            href="https://dashboard.convex.dev" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-link"
          >
            Go to Convex Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};