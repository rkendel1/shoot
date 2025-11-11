import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import './ApiPlayground.css';

interface ApiPlaygroundProps {
  specId: Id<'apiSpecs'>;
}

interface EndpointHistory {
  pathParams: Record<string, string>;
  queryParams: Record<string, string>;
  requestBody: string;
}

export const ApiPlayground: React.FC<ApiPlaygroundProps> = ({ specId }) => {
  const spec = useQuery(api.specs.getSpec, { id: specId });
  const apiKeys = useQuery(api.apiKeys.getApiKeys, { specId });
  const addApiKey = useMutation(api.apiKeys.addApiKey);
  const deleteApiKey = useMutation(api.apiKeys.deleteApiKey);
  const proxyRequest = useAction(api.specs.proxyApiRequest);
  
  const [selectedEndpoint, setSelectedEndpoint] = useState<any>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [selectedApiKey, setSelectedApiKey] = useState<Id<'apiKeys'> | ''>('');
  const [securitySchemes, setSecuritySchemes] = useState<any[]>([]);
  const [pathParams, setPathParams] = useState<{[key: string]: string}>({});
  const [queryParams, setQueryParams] = useState<{[key: string]: string}>({});
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [keyDescription, setKeyDescription] = useState('');

  const [endpointHistory, setEndpointHistory] = useState<Record<string, EndpointHistory>>({});

  // Auto-select first API key
  useEffect(() => {
    if (apiKeys && apiKeys.length > 0 && !selectedApiKey) {
      setSelectedApiKey(apiKeys[0].id);
    }
  }, [apiKeys, selectedApiKey]);

  // Parse spec for base URL and security schemes
  useEffect(() => {
    if (spec?.content) {
      try {
        const parsedContent = JSON.parse(spec.content);
        let url = '';
        // OpenAPI 3.x
        if (parsedContent?.servers?.[0]?.url) {
          url = parsedContent.servers[0].url;
        } 
        // Swagger 2.0
        else if (parsedContent?.host) {
          const scheme = parsedContent.schemes?.[0] || 'https';
          url = `${scheme}://${parsedContent.host}${parsedContent.basePath || ''}`;
        }
        
        if (url) {
            setBaseUrl(url);
        }

        const schemes = parsedContent.components?.securitySchemes || parsedContent.securityDefinitions || {};
        const securityReqs = parsedContent.security || [];

        if (securityReqs.length > 0) {
          const requiredSchemeNames = Object.keys(securityReqs[0]);
          const activeSchemes = requiredSchemeNames.map(name => {
            if (schemes[name]) {
              return { keyName: name, ...schemes[name] };
            }
            return null;
          }).filter(Boolean);
          setSecuritySchemes(activeSchemes);
        } else {
          setSecuritySchemes([]);
        }
      } catch (e) {
        console.error("Failed to parse spec content in ApiPlayground", e);
      }
    }
  }, [spec?.content]);

  if (!spec) {
    return <div className="api-playground loading">Loading...</div>;
  }

  const handleSelectEndpoint = (endpoint: any) => {
    setSelectedEndpoint(endpoint);
    const history = endpointHistory[endpoint._id];

    if (history) {
      // Pre-populate from history
      setPathParams(history.pathParams);
      setQueryParams(history.queryParams);
      setRequestBody(history.requestBody);
    } else {
      // Initialize as empty
      const pathP: {[key: string]: string} = {};
      const matches = endpoint.path.match(/{([^}]+)}/g);
      if (matches) {
        matches.forEach((match: string) => {
          const paramName = match.replace(/[{}]/g, '');
          pathP[paramName] = '';
        });
      }
      setPathParams(pathP);
      
      const parameters = endpoint.parameters ? JSON.parse(endpoint.parameters) : [];
      if (parameters) {
        const qParams: {[key: string]: string} = {};
        parameters
          .filter((p: any) => p.in === 'query')
          .forEach((p: any) => {
            qParams[p.name] = '';
          });
        setQueryParams(qParams);
      }
      setRequestBody('');
    }
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
    if (selectedApiKey === keyId) setSelectedApiKey('');
  };

  const buildUrl = () => {
    if (!selectedEndpoint) return baseUrl;
    let path = selectedEndpoint.path;
    Object.entries(pathParams).forEach(([key, value]) => {
      path = path.replace(`{${key}}`, encodeURIComponent(value));
    });
    
    const filteredQueryParams = Object.fromEntries(Object.entries(queryParams).filter(([_, v]) => v !== ''));
    const queryString = new URLSearchParams(filteredQueryParams).toString();
    
    const finalBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${finalBaseUrl}${path}${queryString ? '?' + queryString : ''}`;
  };

  const executeRequest = async () => {
    if (!selectedEndpoint) return;
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      let authPayload: any = undefined;
      if (selectedApiKey && securitySchemes.length > 0) {
        authPayload = { apiKeyId: selectedApiKey, scheme: securitySchemes[0] };
      }

      const res = await proxyRequest({
        endpointPath: selectedEndpoint.path,
        method: selectedEndpoint.method,
        pathParams: JSON.stringify(pathParams),
        queryParams: JSON.stringify(Object.fromEntries(Object.entries(queryParams).filter(([_, v]) => v !== ''))),
        body: requestBody || undefined,
        baseUrl: baseUrl,
        auth: authPayload,
      });
      
      if (res.status >= 200 && res.status < 300) {
        // Save successful request to history
        setEndpointHistory(prev => ({
          ...prev,
          [selectedEndpoint._id]: { pathParams, queryParams, requestBody }
        }));
      }
      
      if (res.status >= 400) {
        setError(`Request failed with status ${res.status}`);
      }
      setResponse(res);
    } catch (err: any) {
      setError(err.message || 'Proxy request failed.');
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
              <div key={idx} className={`endpoint-item ${selectedEndpoint?._id === endpoint._id ? 'selected' : ''}`} onClick={() => handleSelectEndpoint(endpoint)}>
                <span className={`method-badge ${endpoint.method.toLowerCase()}`}>{endpoint.method}</span>
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
                <div className="api-keys-section">
                  <div className="section-header">
                    <h4>🔑 API Keys</h4>
                    <button className="btn-small" onClick={() => setShowKeyForm(!showKeyForm)}>{showKeyForm ? 'Cancel' : '+ Add Key'}</button>
                  </div>
                  {showKeyForm && (
                    <div className="key-form">
                      <input type="text" placeholder="Key Name" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
                      <input type="password" placeholder="API Key Value" value={newKeyValue} onChange={(e) => setNewKeyValue(e.target.value)} />
                      <input type="text" placeholder="Description (optional)" value={keyDescription} onChange={(e) => setKeyDescription(e.target.value)} />
                      <button className="btn-primary" onClick={handleAddApiKey}>Save Key</button>
                    </div>
                  )}
                  {apiKeys && apiKeys.length > 0 && (
                    <div className="saved-keys">
                      {apiKeys.map((key: any) => (
                        <div key={key.id} className="key-item">
                          <input type="radio" id={`key-${key.id}`} name="apiKey" value={key.id} checked={selectedApiKey === key.id} onChange={() => setSelectedApiKey(key.id)} />
                          <label htmlFor={`key-${key.id}`}><strong>{key.keyName}</strong><code>{key.keyValue}</code></label>
                          <button className="btn-delete-small" onClick={() => handleDeleteApiKey(key.id)}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {securitySchemes.length > 0 && (
                  <div className="form-group">
                    <label>Authentication ({securitySchemes[0].type})</label>
                    <div className="auth-info">
                      <p>This API requires a key sent via <strong>{securitySchemes[0].in}</strong> with the name <code>{securitySchemes[0].name}</code>.</p>
                      <p>Select a saved key above to authenticate.</p>
                    </div>
                  </div>
                )}
                <div className="form-group">
                  <label>Base URL</label>
                  <input type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
                </div>
                <div className="endpoint-info">
                  <div className="info-row"><strong>Method:</strong> <span className={`method-badge ${selectedEndpoint.method.toLowerCase()}`}>{selectedEndpoint.method}</span></div>
                  <div className="info-row"><strong>Path:</strong> <code>{selectedEndpoint.path}</code></div>
                  {selectedEndpoint.summary && <div className="info-row"><strong>Description:</strong> <p>{selectedEndpoint.summary}</p></div>}
                </div>
                {Object.keys(pathParams).length > 0 && (
                  <div className="form-group">
                    <label>Path Parameters</label>
                    {Object.entries(pathParams).map(([key, value]) => (
                      <div key={key} className="param-input">
                        <label>{key}</label>
                        <input type="text" value={value} onChange={(e) => setPathParams({...pathParams, [key]: e.target.value})} />
                      </div>
                    ))}
                  </div>
                )}
                {Object.keys(queryParams).length > 0 && (
                  <div className="form-group">
                    <label>Query Parameters</label>
                    {Object.entries(queryParams).map(([key, value]) => (
                      <div key={key} className="param-input">
                        <label>{key}</label>
                        <input type="text" value={value} onChange={(e) => setQueryParams({...queryParams, [key]: e.target.value})} />
                      </div>
                    ))}
                  </div>
                )}
                {['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method.toUpperCase()) && (
                  <div className="form-group">
                    <label>Request Body (JSON)</label>
                    <textarea value={requestBody} onChange={(e) => setRequestBody(e.target.value)} rows={8} className="code-input" />
                  </div>
                )}
                <div className="url-preview"><strong>Request URL:</strong><code>{buildUrl()}</code></div>
                <button className="btn-execute" onClick={executeRequest} disabled={loading}>{loading ? '⏳ Sending...' : '🚀 Send Live Request'}</button>
              </div>
              <div className="response-panel">
                <h3>📥 Response</h3>
                {error && <div className="response-error"><strong>Error:</strong> {error}<p className="error-hint">💡 Tip: Check API key, parameters, and server status.</p></div>}
                {response && (
                  <div className="response-content">
                    <div className="response-meta">
                      <span className={`status-badge status-${Math.floor(response.status / 100)}xx`}>{response.status} {response.statusText}</span>
                      <span className="response-time">⏱️ {response.time}ms</span>
                    </div>
                    <div className="response-url"><strong>URL:</strong><code>{response.url}</code></div>
                    <div className="response-headers"><strong>Response Headers:</strong><pre>{JSON.stringify(response.headers, null, 2)}</pre></div>
                    <div className="response-body"><strong>Response Body:</strong><pre>{JSON.stringify(response.data, null, 2)}</pre></div>
                  </div>
                )}
                {!response && !error && !loading && <div className="response-placeholder">Configure and send a request</div>}
                {loading && <div className="response-placeholder">Loading...</div>}
              </div>
            </>
          ) : <div className="no-endpoint-selected"><p>👈 Select an endpoint to test</p></div>}
        </div>
      </div>
    </div>
  );
};