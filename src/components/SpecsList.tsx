import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import './SpecsList.css';

interface SpecsListProps {
  onSelectSpec: (specId: Id<'apiSpecs'>) => void;
  selectedSpecId?: Id<'apiSpecs'>;
}

export const SpecsList: React.FC<SpecsListProps> = ({ onSelectSpec, selectedSpecId }) => {
  const specs = useQuery(api.specs.getAllSpecs);
  const deleteSpec = useMutation(api.specs.deleteSpec);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (specId: Id<'apiSpecs'>, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this spec and all associated apps?')) return;

    setDeleting(specId);
    try {
      await deleteSpec({ id: specId });
    } catch (error) {
      console.error('Failed to delete spec:', error);
      alert('Failed to delete spec');
    } finally {
      setDeleting(null);
    }
  };

  if (!specs) {
    return (
      <div className="specs-list loading">
        <p>Loading specs...</p>
      </div>
    );
  }

  if (specs.length === 0) {
    return (
      <div className="specs-list empty">
        <div className="empty-state">
          <h3>No API Specs Yet</h3>
          <p>Upload your first API specification to get started!</p>
          <p className="hint">Try saying: "Upload https://petstore.swagger.io/v2/swagger.json"</p>
        </div>
      </div>
    );
  }

  return (
    <div className="specs-list">
      <h2>📋 Your API Specs ({specs.length})</h2>
      <div className="specs-grid">
        {specs.map((spec) => (
          <div
            key={spec.id}
            className={`spec-card ${selectedSpecId === spec.id ? 'selected' : ''}`}
            onClick={() => onSelectSpec(spec.id)}
          >
            <div className="spec-header">
              <h3>{spec.name}</h3>
              <button
                className="delete-btn"
                onClick={(e) => handleDelete(spec.id, e)}
                disabled={deleting === spec.id}
                title="Delete spec"
              >
                {deleting === spec.id ? '⏳' : '🗑️'}
              </button>
            </div>
            <div className="spec-info">
              <span className="spec-type">{spec.specType.toUpperCase()}</span>
              {spec.version && <span className="spec-version">v{spec.version}</span>}
            </div>
            {spec.description && (
              <p className="spec-description">{spec.description}</p>
            )}
            <div className="spec-footer">
              <span className="endpoint-count">
                📡 {spec.endpointCount} endpoint{spec.endpointCount !== 1 ? 's' : ''}
              </span>
              <span className="created-date">
                {new Date(spec.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};