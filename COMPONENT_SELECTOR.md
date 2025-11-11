# Component Selector Feature

## Overview

The Component Selector is a powerful new feature that allows users to visually inspect and select any DOM element on the page. When an element is selected, detailed information including CSS selectors, classes, computed styles, and HTML structure is automatically extracted and formatted for easy copying into the chat interface.

## Features

### 🎯 Visual Element Selection
- **Hover Highlighting**: As you move your mouse over elements, they are highlighted with a blue border and semi-transparent overlay
- **Element Tooltip**: Shows the element's tag name, ID, and first class in a tooltip above the highlighted element
- **Click to Select**: Click any highlighted element to open the preview modal with detailed information

### 📋 Element Information Extraction
The selector automatically extracts and formats:
- **CSS Selector**: Generates a unique, specific CSS selector path for the element
- **Element Tag**: Shows the HTML tag name (e.g., `<div>`, `<button>`, `<h1>`)
- **ID & Classes**: Displays the element's ID attribute and class names
- **Text Content**: Shows the first 100 characters of the element's text content
- **Computed Styles**: Extracts relevant CSS properties including:
  - Layout: display, position, width, height
  - Spacing: padding, margin
  - Visual: border, background, color
  - Typography: font-size, font-family, font-weight
  - Flexbox/Grid: flex-direction, justify-content, align-items, grid-template-*
- **HTML Structure**: Shows up to 300 characters of the element's outer HTML

### 🖥️ User Interface

#### Activation Methods
1. **Chat View**: Click the "🎯 Selector" button in the chat input area
2. **Dashboard Sidebar**: Click the "🎯 Component Selector" button in the Quick Actions section

#### While Active
- A prominent control bar appears at the top of the screen showing "Component Selector Active"
- The close button changes to red ("✕ Close Selector")
- The cursor changes to indicate selector mode
- Press `Escape` key to quickly exit selector mode

#### Preview Modal
When you click an element:
1. A modal appears showing all extracted information
2. Review the details before copying
3. Click "📋 Copy to Chat" to insert the formatted information into the chat input
4. Or click "Cancel" to close the modal and select a different element

### 💬 Chat Integration
The selected element information is formatted in Markdown and automatically inserted into the chat input field:

```markdown
## Selected Component

**CSS Selector:** `.nav-button.active`

**Element:** `<button>`

**ID:** `home-button`

**Classes:** `nav-button active`

**Text Content:** Home

**Computed Styles:**
\```css
.nav-button.active {
  display: flex;
  padding: 12px 15px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 15px;
  border-radius: 10px;
}
\```

**HTML:**
\```html
<button class="nav-button active" id="home-button">
  <span class="nav-icon">🏠</span>
  <span class="nav-label">Home</span>
</button>
\```
```

## Use Cases

### 1. Precise Component Updates
"Update the styling of this specific button" - Select the button and the AI will know exactly which element to modify.

### 2. Debugging Styles
Quickly extract computed styles to understand why an element looks a certain way.

### 3. Component Documentation
Generate documentation by selecting components and asking the AI to explain them.

### 4. Refactoring Assistance
"Move this component to a separate file" - Select the component to provide context.

### 5. Accessibility Improvements
"Make this element more accessible" - Select it and the AI can see its current structure.

## Technical Implementation

### Component Architecture
```
ComponentSelector.tsx
├── State Management (selectorActive, highlightedElement, selectedElement)
├── Event Handlers (mousemove, click, keydown)
├── CSS Selector Generation
│   ├── ID-based selector (highest priority)
│   ├── Class-based selector with tag
│   └── nth-child for disambiguation
├── Style Extraction (getElementStyles)
└── Formatting (formatForChat)
```

### Key Functions

#### `generateSelector(element: HTMLElement): string`
Creates a unique CSS selector for the element by traversing up the DOM tree and building a path of selectors.

#### `getElementStyles(element: HTMLElement): Record<string, string>`
Extracts computed styles from the element, filtering for relevant properties.

#### `extractElementInfo(element: HTMLElement): SelectedElement`
Combines all element information into a structured object.

#### `formatForChat(info: SelectedElement): string`
Formats the element information as Markdown for insertion into chat.

### Styling
- Uses fixed positioning for overlays (z-index: 999999+)
- Blue gradient highlighting (#667eea) consistent with app theme
- Smooth transitions and hover effects
- Responsive modal design with scrollable content

## Browser Compatibility

The Component Selector uses standard DOM APIs and should work in all modern browsers:
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+

## Future Enhancements

Potential improvements for future versions:
- [ ] Multi-element selection for batch operations
- [ ] Visual diff showing before/after style changes
- [ ] Screenshot capture of selected element
- [ ] Export element info to clipboard in different formats (JSON, CSS, HTML)
- [ ] Element tree view showing parent/child relationships
- [ ] Keyboard navigation for element selection
- [ ] Filter elements by type (buttons only, headings only, etc.)
- [ ] Save frequently selected elements as favorites

## Demo

A standalone demo is available at `/tmp/component-selector-demo.html` that demonstrates the core functionality without requiring the full application setup.

## Screenshots

### Initial State
![Initial State](https://github.com/user-attachments/assets/eab84973-4d7f-4227-bcc0-cdb1d67384f9)
*The application with the selector toggle button visible*

### Selector Active
![Selector Active](https://github.com/user-attachments/assets/514f0b4e-a67b-47e7-9658-923c54a4450d)
*Control bar appears when selector is activated*

### Hover Highlighting
![Hover Highlighting](https://github.com/user-attachments/assets/b1b43292-5918-4ed9-9355-ad195b099946)
*Elements are highlighted with tooltip as you hover*

### Element Selected
![Element Selected](https://github.com/user-attachments/assets/c849c4ad-e20c-4c24-9c3e-c77984e5e372)
*Detailed element information is displayed when clicked*
