import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import './ApiPlayground.css';

interface ApiPlaygroundProps {
  specId: Id<'apiSpecs'>;
}

export const ApiPlayground: React.FC<ApiPlaygroundProps> = ({ specId }) => {
  const spec = useQuery(api.specs.getSpec, { id: specId });
  const apiKeys = useQuery(api.apiKeys.getApiKeys, { specId });
  const addApiKey = useMutation(api.apiKeys.addApiKey);
  const deleteApiKey = useMutation(api.apiKeys.deleteApiKey);
  
  const [selectedEndpoint, setSelectedEndpoint] = useState<any>(null);
  const [baseUrl, setBaseUrl] = useState('https://api.example.com');
  const [selectedApiKey, setSelectedApiKey] = useState('');
  const [authType, setAuthType] = useState<'bearer' | 'apikey' | 'basic' | 'none'>('bearer');
  const [pathParams, setPathParams] = useState<{[key: string]: string}>({});
  const [queryParams, setQueryParams] = useState<{[key: string]: string}>({});
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // API Key management
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [keyDescription, setKeyDescription] = useState('');

  if (!spec) {
    return <div className="api-playground loading">Loading...</div>;
  }

  // Extract base URL from spec if available
  useEffect(() => {
    if (spec.content?.servers?.[0]?.url) {
      setBaseUrl(spec.content.servers[0].url);
    }
  }, [spec]);

  // Extract path parameters from selected endpoint
  useEffect(() => {
    if (selectedEndpoint) {
      const params: {[key: string]: string} = {};
      const matches = selectedEndpoint.path.match(/{([^}]+)}/g);
      if (matches) {
        matches.forEach((match: string) => {
          const paramName = match.replace(/[{}]/g, '');
          params[paramName] = '';
        });
      }
      setPathParams(params);
      
      // Extract query parameters
      if (selectedEndpoint.parameters) {
        const qParams: {[key: string]: string} = {};
        selectedEndpoint.parameters
          .filter((p: any) => p.in === 'query')
          .forEach((p: any) => {
            qParams[p.name] = '';
          });
        setQueryParams(qParams);
      }
    }
  }, [selectedEndpoint]);

  const handleAddApiKey = async () => {
    if (!newKeyName || !newKeyValue) {
      alert('Please provide key name and value');
      return;
    }

    try {
      await addApiKey({
        specId,
        keyName: newKeyName,
        keyValue: newKeyValue,
        description: keyDescription || undefined,
      });
      setNewKeyName('');
      setNewKeyValue('');
      setKeyDescription('');
      setShowKeyForm(false);
    } catch (error) {
      console.error('Failed to add API key:', error);
      alert('Failed to add API key');
    }
  };

  const handleDeleteApiKey = async (keyId: Id<'apiKeys'>) => {
    if (!confirm('Delete this API key?')) return;
    try {
      await deleteApiKey({ id: keyId });
      if (selectedApiKey === keyId) {
        setSelectedApiKey('');
      }
    } catch (error) {
      console.error('Failed to delete key:', error);
    }
  };

  const buildUrl = () => {
    let url = baseUrl;
    let path = selectedEndpoint.path;
    
    // Replace path parameters
    Object.entries(pathParams).forEach(([key, value]) => {
      path = path.replace(`{${key}}`, encodeURIComponent(value));
    });
    
    url += path;
    
    // Add query parameters
    const queryString = Object.entries(queryParams)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    if (queryString) {
      url += '?' + queryString;
    }
    
    return url;
  };

  const executeRequest = async () => {
    if (!selectedEndpoint) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const url = buildUrl();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add authentication
      if (authType === 'bearer' && selectedApiKey) {
        const key = apiKeys?.find((k: any) => k.id === selectedApiKey);
        if (key) {
          // In real scenario, we'd need to fetch the actual key value securely
          headers['Authorization'] = `Bearer ${key.keyValue}`;
        }
      } else if (authType === 'apikey' && selectedApiKey) {
        const key = apiKeys?.find((k: any) => k.id === selectedApiKey);
        if (key) {
          headers['X-API-Key'] = key.keyValue;
        }
      }

      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers,
        mode: 'cors',
      };

      if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && requestBody) {
        try {
          // Validate JSON
          JSON.parse(requestBody);
          options.body = requestBody;
        } catch (e) {
          setError('Invalid JSON in request body');
          setLoading(false);
          return;
        }
      }

      const startTime = Date.now();
      const res = await fetch(url, options);
      const endTime = Date.now();
      
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data,
        time: endTime - startTime,
        url,
      });
    } catch (err: any) {
      console.error('Request error:', err);
      setError(err.message || 'Request failed. Check CORS or network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="api-playground">
      <div className="playground-header">
        <h2>🧪 API Playground - {spec.name}</h2>
        <p>Test your API endpoints with real authentication</p>
      </div>

      <div className="playground-content">
        <div className="endpoints-panel">
          <h3>Endpoints ({spec.endpoints.length})</h3>
          <div className="endpoints-list">
            {spec.endpoints.map((endpoint: any, idx: number) => (
              <div
                key={idx}
                className={`endpoint-item ${selectedEndpoint === endpoint ? 'selected' : ''}`}
                onClick={() => setSelectedEndpoint(endpoint)}
              >
                <span className={`method-badge ${endpoint.method.toLowerCase()}`}>
                  {endpoint.method}
                </span>
                <span className="endpoint-path">{endpoint.path}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="request-panel">
          {selectedEndpoint ? (
            <>
              <div className="request-config">
                <h3>📡 Request Configuration</h3>
                
                {/* API Keys Section */}
                <div className="api-keys-section">
                  <div className="section-header">
                    <h4>🔑 API Keys</h4>
                    <button 
                      className="btn-small"
                      onClick={() => setShowKeyForm(!showKeyForm)}
                    >
                      {showKeyForm ? 'Cancel' : '+ Add Key'}
                    </button>
                  </div>

                  {showKeyForm && (
                    <div className="key-form">
                      <input
                        type="text"
                        placeholder="Key Name (e.g., Production API Key)"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                      />
                      <input
                        type="password"
                        placeholder="API Key Value"
                        value={newKeyValue}
                        onChange={(e) => setNewKeyValue(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Description (optional)"
                        value={keyDescription}
                        onChange={(e) => setKeyDescription(e.target.value)}
                      />
                      <button className="btn-primary" onClick={handleAddApiKey}>
                        Save Key
                      </button>
                    </div>
                  )}

                  {apiKeys && apiKeys.length > 0 && (
                    <div className="saved-keys">
                      {apiKeys.map((key: any) => (
                        <div key={key.id} className="key-item">
                          <input
                            type="radio"
                            name="apiKey"
                            value={key.id}
                            checked={selectedApiKey === key.id}
                            onChange={() => setSelectedApiKey(key.id)}
                          />
                          <label>
                            <strong>{key.keyName}</strong>
                            <code>{key.keyValue}</code>
                          </label>
                          <button
                            className="btn-delete-small"
                            onClick={() => handleDeleteApiKey(key.id)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Base URL */}
                <div className="form-group">
                  <label>Base URL</label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.example.com"
                  />
                </div>

                {/* Authentication Type */}
                <div className="form-group">
                  <label>Authentication Type</label>
                  <select value={authType} onChange={(e) => setAuthType(e.target.value as any)}>
                    <option value="none">None</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="apikey">API Key (X-API-Key header)</option>
                    <option value="basic">Basic Auth</option>
                  </select>
                </div>

                {/* Endpoint Info */}
                <div className="endpoint-info">
                  <div className="info-row">
                    <strong>Method:</strong> 
                    <span className={`method-badge ${selectedEndpoint.method.toLowerCase()}`}>
                      {selectedEndpoint.method}
                    </span>
                  </div>
                  <div className="info-row">
                    <strong>Path:</strong> 
                    <code>{selectedEndpoint.path}</code>
                  </div>
                  {selectedEndpoint.summary && (
                    <div className="info-row">
                      <strong>Description:</strong> 
                      <p>{selectedEndpoint.summary}</p>
                    </div>
                  )}
                </div>

                {/* Path Parameters */}
                {Object.keys(pathParams).length > 0 && (
                  <div className="form-group">
                    <label>Path Parameters</label>
                    {Object.entries(pathParams).map(([key, value]) => (
                      <div key={key} className="param-input">
                        <label>{key}</label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setPathParams({...pathParams, [key]: e.target.value})}
                          placeholder={`Value for ${key}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Query Parameters */}
                {Object.keys(queryParams).length > 0 && (
                  <div className="form-group">
                    <label>Query Parameters</label>
                    {Object.entries(queryParams).map(([key, value]) => (
                      <div key={key} className="param-input">
                        <label>{key}</label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setQueryParams({...queryParams, [key]: e.target.value})}
                          placeholder={`Value for ${key}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Request Body */}
                {['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && (
                  <div className="form-group">
                    <label>Request Body (JSON)</label>
                    <textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      placeholder='{"key": "value"}'
                      rows={8}
                      className="code-input"
                    />
                  </div>
                )}

                {/* Final URL Preview */}
                <div className="url-preview">
                  <strong>Request URL:</strong>
                  <code>{selectedEndpoint && buildUrl()}</code>
                </div>

                <button
                  className="btn-execute"
                  onClick={executeRequest}
                  disabled={loading}
                >
                  {loading ? '⏳ Sending...' : '🚀 Send Live Request'}
                </button>
              </div>

              <div className="response-panel">
                <h3>📥 Response</h3>
                {error && (
                  <div className="response-error">
                    <strong>Error:</strong> {error}
                    <p className="error-hint">💡 Tip: Check CORS settings, API key, and URL</p>
                  </div>
                )}
                {response && (
                  <div className="response-content">
                    <div className="response-meta">
                      <span className={`status-badge status-${Math.floor(response.status / 100)}xx`}>
                        {response.status} {response.statusText}
                      </span>
                      <span className="response-time">⏱️ {response.time}ms</span>
                    </div>
                    
                    <div className="response-url">
                      <strong>URL:</strong>
                      <code>{response.url}</code>
                    </div>

                    <div className="response-headers">
                      <strong>Response Headers:</strong>
                      <pre>{JSON.stringify(response.headers, null, 2)}</pre>
                    </div>

                    <div className="response-body">
                      <strong>Response Body:</strong>
                      <pre>{JSON.stringify(response.data, null, 2)}</pre>
                    </div>
                  </div>
                )}
                {!response && !error && (
                  <div className="response-placeholder">
                    Configure your request and click "Send Live Request"
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-endpoint-selected">
              <p>👈 Select an endpoint to test</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};