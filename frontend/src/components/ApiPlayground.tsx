import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import './ApiPlayground.css';

interface ApiPlaygroundProps {
  specId: Id<'apiSpecs'>;
}

export const ApiPlayground: React.FC<ApiPlaygroundProps> = ({ specId }) => {
  const spec = useQuery(api.specs.getSpec, { id: specId });
  const [selectedEndpoint, setSelectedEndpoint] = useState<any>(null);
  const [baseUrl, setBaseUrl] = useState('https://api.example.com');
  const [apiKey, setApiKey] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!spec) {
    return <div className="api-playground loading">Loading...</div>;
  }

  // Extract base URL from spec if available
  React.useEffect(() => {
    if (spec.content?.servers?.[0]?.url) {
      setBaseUrl(spec.content.servers[0].url);
    }
  }, [spec]);

  const executeRequest = async () => {
    if (!selectedEndpoint) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const url = baseUrl + selectedEndpoint.path;
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
        },
      };

      if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(url, options);
      const data = await res.json();

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data,
      });
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="api-playground">
      <div className="playground-header">
        <h2>🧪 API Playground - {spec.name}</h2>
        <p>Test your API endpoints in real-time</p>
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
                
                <div className="form-group">
                  <label>Base URL</label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.example.com"
                  />
                </div>

                <div className="form-group">
                  <label>API Key (Optional)</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Your API key"
                  />
                </div>

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

                {['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && (
                  <div className="form-group">
                    <label>Request Body (JSON)</label>
                    <textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      placeholder='{"key": "value"}'
                      rows={8}
                    />
                  </div>
                )}

                <button
                  className="btn-execute"
                  onClick={executeRequest}
                  disabled={loading}
                >
                  {loading ? '⏳ Sending...' : '🚀 Send Request'}
                </button>
              </div>

              <div className="response-panel">
                <h3>📥 Response</h3>
                {error && (
                  <div className="response-error">
                    <strong>Error:</strong> {error}
                  </div>
                )}
                {response && (
                  <div className="response-content">
                    <div className="response-status">
                      <span className={`status-badge status-${Math.floor(response.status / 100)}xx`}>
                        {response.status} {response.statusText}
                      </span>
                    </div>
                    <div className="response-body">
                      <strong>Response Body:</strong>
                      <pre>{JSON.stringify(response.data, null, 2)}</pre>
                    </div>
                  </div>
                )}
                {!response && !error && (
                  <div className="response-placeholder">
                    Click "Send Request" to see the response
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
