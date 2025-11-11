import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import './SpecSettings.css';

interface SpecSettingsProps {
  specId: Id<'apiSpecs'>;
}

export const SpecSettings: React.FC<SpecSettingsProps> = ({ specId }) => {
  const spec = useQuery(api.specs.getSpec, { id: specId });
  const apiKeys = useQuery(api.apiKeys.getApiKeys, { specId });
  const updateSettings = useMutation(api.specs.updateSpecSettings);
  const addApiKey = useMutation(api.apiKeys.addApiKey);
  const deleteApiKey = useMutation(api.apiKeys.deleteApiKey);

  const [baseUrl, setBaseUrl] = useState('');
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [keyDescription, setKeyDescription] = useState('');

  useEffect(() => {
    if (spec) {
      const parsedContent = JSON.parse(spec.content);
      const specUrl = parsedContent?.servers?.[0]?.url || (parsedContent?.host ? `${parsedContent.schemes?.[0] || 'https'}://${parsedContent.host}${parsedContent.basePath || ''}` : '');
      setBaseUrl(spec.overrideBaseUrl || specUrl);
    }
  }, [spec]);

  const handleSaveSettings = async () => {
    await updateSettings({ id: specId, overrideBaseUrl: baseUrl });
    alert('Settings saved!');
  };

  const handleAddApiKey = async () => {
    if (!newKeyName || !newKeyValue) return alert('Please provide key name and value');
    await addApiKey({ specId, keyName: newKeyName, keyValue: newKeyValue, description: keyDescription || undefined });
    setNewKeyName('');
    setNewKeyValue('');
    setKeyDescription('');
    setShowKeyForm(false);
  };

  const handleDeleteApiKey = async (keyId: Id<'apiKeys'>) => {
    if (!confirm('Delete this API key?')) return;
    await deleteApiKey({ id: keyId });
  };

  if (!spec) {
    return <div>Loading settings...</div>;
  }

  const parsedContent = JSON.parse(spec.content);
  const securitySchemes = parsedContent?.components?.securitySchemes || parsedContent?.securityDefinitions || {};
  const securityReqs = parsedContent?.security || [];
  let authInfo = 'None';
  if (securityReqs.length > 0) {
      const schemeName = Object.keys(securityReqs[0])[0];
      const scheme = securitySchemes[schemeName];
      if (scheme) {
          if (scheme.type === 'apiKey') {
              authInfo = `API Key in ${scheme.in} (name: ${scheme.name})`;
          } else if (scheme.type === 'http') {
              authInfo = `HTTP ${scheme.scheme}`;
          } else {
              authInfo = scheme.type;
          }
      }
  }

  return (
    <div className="spec-settings">
      <div className="settings-section">
        <h3>🌐 Network</h3>
        <div className="form-group">
          <label>Base URL</label>
          <input type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          <p className="hint">This URL is the base for all API requests. It's usually detected from your spec, but you can override it here.</p>
        </div>
        <button className="btn-primary" onClick={handleSaveSettings}>Save Network Settings</button>
      </div>

      <div className="settings-section">
        <h3>🔑 Authentication</h3>
        <div className="auth-info-detected">
          <strong>Detected Auth Method:</strong>
          <span>{authInfo}</span>
        </div>
        <div className="api-keys-management">
          <div className="section-header">
            <h4>Your API Keys</h4>
            <button className="btn-small" onClick={() => setShowKeyForm(!showKeyForm)}>{showKeyForm ? 'Cancel' : '+ Add Key'}</button>
          </div>
          {showKeyForm && (
            <div className="key-form">
              <input type="text" placeholder="Key Name (e.g., 'Test Key')" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
              <input type="password" placeholder="API Key Value" value={newKeyValue} onChange={(e) => setNewKeyValue(e.target.value)} />
              <input type="text" placeholder="Description (optional)" value={keyDescription} onChange={(e) => setKeyDescription(e.target.value)} />
              <button className="btn-primary" onClick={handleAddApiKey}>Save Key</button>
            </div>
          )}
          {apiKeys && apiKeys.length > 0 ? (
            <div className="saved-keys-list">
              {apiKeys.map((key: any) => (
                <div key={key.id} className="key-item-display">
                  <div className="key-details">
                    <strong>{key.keyName}</strong>
                    <code>{key.keyValue}</code>
                    {key.description && <p>{key.description}</p>}
                  </div>
                  <button className="btn-delete-small" onClick={() => handleDeleteApiKey(key.id)}>🗑️</button>
                </div>
              ))}
            </div>
          ) : (
            <p>No API keys saved for this spec yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};