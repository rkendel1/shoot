import React, { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import './CodeViewer.css';

interface CodeViewerProps {
  appId: Id<'generatedApps'>;
  onClose: () => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ appId, onClose }) => {
  const app = useQuery(api.apps.getApp, { id: appId });
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (app?.code && Object.keys(app.code).length > 0) {
      // Select the first file by default
      setSelectedFile(Object.keys(app.code)[0]);
    }
  }, [app]);

  if (!app) {
    return (
      <div className="code-viewer loading">
        <p>Loading app...</p>
      </div>
    );
  }

  const files = Object.keys(app.code);
  const currentCode = selectedFile ? app.code[selectedFile] : '';

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    // Download all files as individual downloads
    Object.entries(app.code).forEach(([filename, content]) => {
      setTimeout(() => downloadFile(filename, content), 100);
    });
  };

  const copyToClipboard = () => {
    if (currentCode) {
      navigator.clipboard.writeText(currentCode);
      alert('Code copied to clipboard!');
    }
  };

  return (
    <div className="code-viewer">
      <div className="code-viewer-header">
        <div className="header-left">
          <h2>📝 {app.name}</h2>
          <span className="framework-tag">{app.framework}</span>
        </div>
        <div className="header-actions">
          <button onClick={() => setShowPreview(!showPreview)} className="btn-preview">
            {showPreview ? '📝 Code' : '👁️ Preview'}
          </button>
          <button onClick={downloadAll} className="btn-download">
            ⬇️ Download All
          </button>
          <button onClick={onClose} className="btn-close">
            ✕
          </button>
        </div>
      </div>

      {!showPreview ? (
        <div className="code-viewer-content">
          <div className="file-tree">
            <h3>📁 Files ({files.length})</h3>
            <ul>
              {files.map((file) => (
                <li
                  key={file}
                  className={selectedFile === file ? 'selected' : ''}
                  onClick={() => setSelectedFile(file)}
                >
                  <span className="file-icon">
                    {file.endsWith('.tsx') || file.endsWith('.ts') ? '📘' :
                     file.endsWith('.jsx') || file.endsWith('.js') ? '📙' :
                     file.endsWith('.json') ? '📋' :
                     file.endsWith('.css') ? '🎨' :
                     file.endsWith('.md') ? '📝' : '📄'}
                  </span>
                  {file}
                </li>
              ))}
            </ul>
          </div>

          <div className="code-editor">
            <div className="editor-toolbar">
              <span className="file-name">{selectedFile}</span>
              <div className="toolbar-actions">
                <button onClick={copyToClipboard} className="btn-copy">
                  📋 Copy
                </button>
                <button 
                  onClick={() => downloadFile(selectedFile, currentCode)} 
                  className="btn-download-file"
                >
                  ⬇️ Download
                </button>
              </div>
            </div>
            <pre className="code-content">
              <code>{currentCode}</code>
            </pre>
          </div>
        </div>
      ) : (
        <div className="preview-container">
          <div className="preview-info">
            <h3>🚀 App Preview</h3>
            <p>To run this app:</p>
            <ol>
              <li>Download all files</li>
              <li>Run <code>npm install</code></li>
              <li>Run <code>npm run dev</code> (React) or <code>npm start</code> (Node)</li>
            </ol>
            
            <div className="preview-instructions">
              <h4>📦 Package Information</h4>
              {app.code['package.json'] && (
                <pre className="package-info">
                  {JSON.stringify(JSON.parse(app.code['package.json']), null, 2)}
                </pre>
              )}
            </div>

            <div className="preview-readme">
              <h4>📖 Documentation</h4>
              {app.code['README.md'] ? (
                <div className="readme-content">
                  <pre>{app.code['README.md']}</pre>
                </div>
              ) : (
                <p>No README available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};