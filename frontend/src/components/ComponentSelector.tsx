import React, { useState, useEffect, useCallback } from 'react';
import './ComponentSelector.css';

interface SelectedElement {
  selector: string;
  tagName: string;
  className: string;
  id: string;
  textContent: string;
  styles: Record<string, string>;
  html: string;
}

interface ComponentSelectorProps {
  isActive: boolean;
  onSelect: (elementInfo: string) => void;
  onClose: () => void;
}

export const ComponentSelector: React.FC<ComponentSelectorProps> = ({ 
  isActive, 
  onSelect, 
  onClose 
}) => {
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Generate a unique CSS selector for an element
  const generateSelector = useCallback((element: HTMLElement): string => {
    if (element.id) {
      return `#${element.id}`;
    }

    const path: string[] = [];
    let current: HTMLElement | null = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.className) {
        const classes = current.className.trim().split(/\s+/).filter(c => c);
        if (classes.length > 0) {
          selector += '.' + classes.join('.');
        }
      }

      // Add nth-child if there are siblings with same selector
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          child => child.tagName === current!.tagName
        );
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-child(${index})`;
        }
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }, []);

  // Extract computed styles for an element
  const getElementStyles = useCallback((element: HTMLElement): Record<string, string> => {
    const computedStyles = window.getComputedStyle(element);
    const relevantStyles = [
      'display', 'position', 'width', 'height', 
      'padding', 'margin', 'border', 'background', 'color',
      'font-size', 'font-family', 'font-weight',
      'flex-direction', 'justify-content', 'align-items',
      'grid-template-columns', 'grid-template-rows',
    ];

    const styles: Record<string, string> = {};
    relevantStyles.forEach(prop => {
      const value = computedStyles.getPropertyValue(prop);
      if (value && value !== 'none' && value !== 'normal') {
        styles[prop] = value;
      }
    });

    return styles;
  }, []);

  // Extract element information
  const extractElementInfo = useCallback((element: HTMLElement): SelectedElement => {
    const selector = generateSelector(element);
    const styles = getElementStyles(element);
    
    return {
      selector,
      tagName: element.tagName.toLowerCase(),
      className: element.className,
      id: element.id,
      textContent: element.textContent?.trim().substring(0, 100) || '',
      styles,
      html: element.outerHTML.substring(0, 500),
    };
  }, [generateSelector, getElementStyles]);

  // Format element info for chat
  const formatForChat = useCallback((info: SelectedElement): string => {
    let output = '## Selected Component\n\n';
    output += `**CSS Selector:** \`${info.selector}\`\n\n`;
    output += `**Element:** \`<${info.tagName}>\`\n\n`;
    
    if (info.id) {
      output += `**ID:** \`${info.id}\`\n\n`;
    }
    
    if (info.className) {
      output += `**Classes:** \`${info.className}\`\n\n`;
    }

    if (info.textContent) {
      output += `**Text Content:** ${info.textContent}${info.textContent.length === 100 ? '...' : ''}\n\n`;
    }

    output += '**Computed Styles:**\n```css\n';
    output += `${info.selector} {\n`;
    Object.entries(info.styles).forEach(([prop, value]) => {
      output += `  ${prop}: ${value};\n`;
    });
    output += '}\n```\n\n';

    output += '**HTML:**\n```html\n';
    output += info.html.substring(0, 300);
    if (info.html.length > 300) output += '...';
    output += '\n```\n';

    return output;
  }, []);

  // Mouse move handler
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isActive) return;

    const target = e.target as HTMLElement;
    
    // Ignore selector overlay elements
    if (target.closest('.component-selector-overlay') || 
        target.closest('.component-selector-controls')) {
      return;
    }

    setHighlightedElement(target);
  }, [isActive]);

  // Click handler
  const handleClick = useCallback((e: MouseEvent) => {
    if (!isActive) return;

    e.preventDefault();
    e.stopPropagation();

    const target = e.target as HTMLElement;
    
    // Ignore selector overlay elements
    if (target.closest('.component-selector-overlay') || 
        target.closest('.component-selector-controls')) {
      return;
    }

    const elementInfo = extractElementInfo(target);
    setSelectedElement(elementInfo);
    setShowPreview(true);
  }, [isActive, extractElementInfo]);

  // Keyboard handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isActive) return;

    if (e.key === 'Escape') {
      onClose();
    }
  }, [isActive, onClose]);

  // Handle copy to chat
  const handleCopyToChat = useCallback(() => {
    if (selectedElement) {
      const formatted = formatForChat(selectedElement);
      onSelect(formatted);
      setShowPreview(false);
      setSelectedElement(null);
      onClose();
    }
  }, [selectedElement, formatForChat, onSelect, onClose]);

  // Setup event listeners
  useEffect(() => {
    if (isActive) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('click', handleClick, true);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('click', handleClick, true);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isActive, handleMouseMove, handleClick, handleKeyDown]);

  if (!isActive) return null;

  return (
    <>
      {/* Highlight overlay */}
      {highlightedElement && !showPreview && (
        <div
          className="component-selector-highlight"
          style={{
            position: 'fixed',
            top: `${highlightedElement.getBoundingClientRect().top}px`,
            left: `${highlightedElement.getBoundingClientRect().left}px`,
            width: `${highlightedElement.getBoundingClientRect().width}px`,
            height: `${highlightedElement.getBoundingClientRect().height}px`,
            pointerEvents: 'none',
            zIndex: 999999,
          }}
        >
          <div className="selector-info-tooltip">
            {highlightedElement.tagName.toLowerCase()}
            {highlightedElement.id && `#${highlightedElement.id}`}
            {highlightedElement.className && `.${highlightedElement.className.split(' ')[0]}`}
          </div>
        </div>
      )}

      {/* Control bar */}
      <div className="component-selector-controls">
        <div className="selector-status">
          <span className="selector-icon">🎯</span>
          <span>Component Selector Active - Click any element to select</span>
        </div>
        <button className="selector-close-btn" onClick={onClose}>
          ✕ Close Selector
        </button>
      </div>

      {/* Preview modal */}
      {showPreview && selectedElement && (
        <div className="component-selector-preview">
          <div className="preview-content">
            <div className="preview-header">
              <h3>Selected Component</h3>
              <button className="preview-close" onClick={() => setShowPreview(false)}>✕</button>
            </div>
            
            <div className="preview-body">
              <div className="preview-section">
                <strong>Selector:</strong>
                <code>{selectedElement.selector}</code>
              </div>

              <div className="preview-section">
                <strong>Element:</strong>
                <code>&lt;{selectedElement.tagName}&gt;</code>
              </div>

              {selectedElement.id && (
                <div className="preview-section">
                  <strong>ID:</strong>
                  <code>{selectedElement.id}</code>
                </div>
              )}

              {selectedElement.className && (
                <div className="preview-section">
                  <strong>Classes:</strong>
                  <code>{selectedElement.className}</code>
                </div>
              )}

              <div className="preview-section">
                <strong>Key Styles:</strong>
                <pre className="styles-preview">
                  {Object.entries(selectedElement.styles).slice(0, 10).map(([prop, value]) => (
                    <div key={prop}>{prop}: {value}</div>
                  ))}
                </pre>
              </div>
            </div>

            <div className="preview-actions">
              <button className="btn-secondary" onClick={() => setShowPreview(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleCopyToChat}>
                📋 Copy to Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
