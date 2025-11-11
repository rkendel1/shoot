import React, { useState } from 'react';
import { useQuery, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useAppContext } from '../App';
import './SpecDetails.css';

type TabType = 'overview' | 'endpoints' | 'suggestions' | 'workflows' | 'remixes';

interface SpecDetailsProps {
  specId?: Id<'apiSpecs'>;
}

export const SpecDetails: React.FC<SpecDetailsProps> = ({ specId: propSpecId }) => {
  const { selectedSpecId } = useAppContext();
  const specId = propSpecId || selectedSpecId;
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  const spec = useQuery(api.specs.getSpec, specId ? { id: specId } : 'skip');
  const insightsData = useQuery(api.insights.getInsights, specId ? { specId } : 'skip');
  const workflowsData = useQuery(api.insights.getWorkflows, specId ? { specId } : 'skip');
  const remixesData = useQuery(api.insights.getRemixes, specId ? { specId } : 'skip');
  
  const analyzeCapabilities = useAction(api.smartSuggestions.analyzeApiCapabilities);

  if (!specId) {
    return (
      <div className="spec-details empty">
        <div className="empty-state">
          <h3>No Spec Selected</h3>
          <p>Select an API spec to view details</p>
        </div>
      </div>
    );
  }

  if (!spec) {
    return <div className="spec-details loading">Loading spec details...</div>;
  }

  const handleAnalyze = async () => {
    if (!specId) return;
    setLoadingSuggestions(true);
    try {
      await analyzeCapabilities({ specId });
      setActiveTab('suggestions');
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze API. Make sure OpenAI API key is configured.');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const renderTabContent = () => {
    const parsedContent = spec.content ? JSON.parse(spec.content) : null;

    switch (activeTab) {
      case 'overview':
        const serverUrl = parsedContent?.servers?.[0]?.url || (parsedContent?.host ? `${parsedContent.schemes?.[0] || 'https'}://${parsedContent.host}${parsedContent.basePath || ''}` : 'Not found');
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
          <div className="tab-content overview">
            <div className="spec-header">
              <h2>{spec.name}</h2>
              {spec.version && <span className="version-badge">v{spec.version}</span>}
            </div>
            {spec.description && <p className="spec-description">{spec.description}</p>}
            <div className="spec-stats">
              <div className="stat-card"><span className="stat-value">{spec.endpoints.length}</span><span className="stat-label">Endpoints</span></div>
              <div className="stat-card"><span className="stat-value">{spec.specType.toUpperCase()}</span><span className="stat-label">Type</span></div>
              <div className="stat-card"><span className="stat-value">{new Set(spec.endpoints.map((e: any) => e.method)).size}</span><span className="stat-label">HTTP Methods</span></div>
            </div>
            
            <div className="spec-config-section">
              <h3>⚙️ Configuration</h3>
              <div className="config-item">
                <strong>Base URL:</strong>
                <code>{serverUrl}</code>
              </div>
              <div className="config-item">
                <strong>Authentication:</strong>
                <span>{authInfo}</span>
              </div>
            </div>

            <div className="actions-section">
              <button className="action-btn primary" onClick={handleAnalyze} disabled={loadingSuggestions}>
                {loadingSuggestions ? '⏳ Analyzing...' : '🤖 Get AI Suggestions'}
              </button>
            </div>
          </div>
        );

      case 'endpoints':
        return (
          <div className="tab-content endpoints">
            <h3>API Endpoints ({spec.endpoints.length})</h3>
            <div className="endpoints-grid">
              {spec.endpoints.map((endpoint: any, idx: number) => {
                const parameters = endpoint.parameters ? JSON.parse(endpoint.parameters) : [];
                return (
                  <div key={idx} className="endpoint-card">
                    <div className="endpoint-header">
                      <span className={`method-badge ${endpoint.method.toLowerCase()}`}>{endpoint.method}</span>
                      <code className="endpoint-path">{endpoint.path}</code>
                    </div>
                    {endpoint.summary && <p className="endpoint-summary">{endpoint.summary}</p>}
                    {parameters && parameters.length > 0 && (
                      <div className="endpoint-params">
                        <strong>Parameters:</strong>
                        <ul>
                          {parameters.slice(0, 3).map((param: any, i: number) => (
                            <li key={i}>{param.name}{param.required && <span className="required">*</span>}{param.in && <span className="param-in">({param.in})</span>}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'suggestions':
        const insights = insightsData ? JSON.parse(insightsData.insights) : null;
        if (!insights) {
          return (
            <div className="tab-content suggestions empty">
              <p>No AI suggestions yet.</p>
              <button onClick={handleAnalyze} disabled={loadingSuggestions}>{loadingSuggestions ? '⏳ Analyzing...' : '🤖 Generate Suggestions'}</button>
            </div>
          );
        }
        return (
          <div className="tab-content suggestions">
            <h3>🤖 AI-Powered Suggestions</h3>
            {insights.capabilities && (
              <section className="suggestion-section">
                <h4>✨ Core Capabilities</h4>
                <div className="capabilities-list">{insights.capabilities.map((cap: string, idx: number) => <div key={idx} className="capability-badge">{cap}</div>)}</div>
              </section>
            )}
            {insights.useCases && (
              <section className="suggestion-section">
                <h4>💡 Practical Use Cases</h4>
                <div className="use-cases-grid">{insights.useCases.map((useCase: any, idx: number) => <div key={idx} className="use-case-card"><h5>{useCase.title}</h5><p>{useCase.description}</p><div className="use-case-meta"><span className={`complexity ${useCase.complexity}`}>{useCase.complexity}</span>{useCase.value && <span className="value">{useCase.value}</span>}</div></div>)}</div>
              </section>
            )}
          </div>
        );

      case 'workflows':
        const workflows = workflowsData || [];
        return (
          <div className="tab-content workflows">
            <h3>🔄 Saved Workflows</h3>
            {workflows.length > 0 ? (
              <div className="workflows-grid">{workflows.map((workflow: any) => {
                const steps = JSON.parse(workflow.steps);
                return (<div key={workflow._id} className="workflow-card"><h4>{workflow.name}</h4><p>{workflow.description}</p><span className={`complexity ${workflow.complexity}`}>{workflow.complexity}</span><div className="workflow-steps">{steps.map((step: any, idx: number) => <div key={idx} className="step">{idx + 1}. {step.action}</div>)}</div></div>)
              })}</div>
            ) : <div className="empty-state"><p>No workflows yet. Generate workflows through chat!</p></div>}
          </div>
        );

      case 'remixes':
        const remixes = remixesData || [];
        return (
          <div className="tab-content remixes">
            <h3>✨ Creative Remixes</h3>
            {remixes.length > 0 ? (
              <div className="remixes-grid">{remixes.map((remix: any) => {
                const endpointsUsed = JSON.parse(remix.endpointsUsed);
                return (<div key={remix._id} className="remix-card"><h4>{remix.name}</h4><p className="remix-description">{remix.description}</p><div className="remix-innovation"><strong>Innovation:</strong> {remix.innovation}</div><div className="remix-endpoints"><strong>Uses:</strong> {endpointsUsed.join(', ')}</div></div>)
              })}</div>
            ) : <div className="empty-state"><p>No remixes yet. Ask AI for creative combinations!</p></div>}
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="spec-details">
      <div className="tabs-container">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>📊 Overview</button>
        <button className={`tab ${activeTab === 'endpoints' ? 'active' : ''}`} onClick={() => setActiveTab('endpoints')}>📡 Endpoints</button>
        <button className={`tab ${activeTab === 'suggestions' ? 'active' : ''}`} onClick={() => setActiveTab('suggestions')}>🤖 AI Suggestions</button>
        <button className={`tab ${activeTab === 'workflows' ? 'active' : ''}`} onClick={() => setActiveTab('workflows')}>🔄 Workflows</button>
        <button className={`tab ${activeTab === 'remixes' ? 'active' : ''}`} onClick={() => setActiveTab('remixes')}>✨ Remixes</button>
      </div>
      <div className="tab-content-container">{renderTabContent()}</div>
    </div>
  );
};