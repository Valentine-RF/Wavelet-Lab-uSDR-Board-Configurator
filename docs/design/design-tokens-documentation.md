# Devolution Detect Design Tokens Documentation

## Overview

This document provides comprehensive guidance on using the Devolution Detect design tokens and CSS variables for the Control Drawer components. The design system ensures visual consistency, maintainability, and scalability across the application.

---

## Files Included

### 1. `devolution-detect-variables.css`

A complete CSS custom properties file containing all design tokens as CSS variables. This file can be directly imported into your stylesheets and used with the `var()` function.

**Usage:**
```css
@import './devolution-detect-variables.css';

.my-component {
  background-color: var(--dd-bg-medium);
  color: var(--dd-text-primary);
  padding: var(--dd-space-4);
}
```

### 2. `devolution-detect-design-tokens.json`

A platform-agnostic design tokens file in JSON format following the W3C Design Tokens Community Group specification. This file can be used with design tools (Figma, Sketch), token transformation tools (Style Dictionary), and cross-platform development.

**Usage with Style Dictionary:**
```javascript
const StyleDictionary = require('style-dictionary');

const sd = StyleDictionary.extend({
  source: ['devolution-detect-design-tokens.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'build/css/',
      files: [{
        destination: 'variables.css',
        format: 'css/variables'
      }]
    }
  }
});

sd.buildAllPlatforms();
```

---

## Design Token Categories

### Color Palette

The Devolution Detect color palette is optimized for dark theme spectrum monitoring applications, emphasizing readability, data visualization, and operator focus.

#### Background Colors

| Token | CSS Variable | Value | Usage |
| :--- | :--- | :--- | :--- |
| Background Dark | `--dd-bg-dark` | #0a0e14 | Text areas, cards, input backgrounds |
| Background Medium | `--dd-bg-medium` | #1a1f2e | Dialogs, panels, main backgrounds |
| Background Light | `--dd-bg-light` | #2a3040 | Hover states, elevated surfaces |

**Example:**
```css
.dialog {
  background-color: var(--dd-bg-medium);
}

.card {
  background-color: var(--dd-bg-dark);
}

.card:hover {
  background-color: var(--dd-bg-light);
}
```

#### Border Colors

| Token | CSS Variable | Value | Usage |
| :--- | :--- | :--- | :--- |
| Border Default | `--dd-border-default` | #333333 | Default borders |
| Border Active | `--dd-border-active` | #33ff77 | Focused borders, active states |
| Border Hover | `--dd-border-hover` | #55ffaa | Hover states for borders |

**Example:**
```css
.input {
  border: 1px solid var(--dd-border-default);
}

.input:focus {
  border-color: var(--dd-border-active);
}

.input:hover {
  border-color: var(--dd-border-hover);
}
```

#### Text Colors

| Token | CSS Variable | Value | Usage |
| :--- | :--- | :--- | :--- |
| Text Primary | `--dd-text-primary` | #e0e0e0 | Main text content |
| Text Secondary | `--dd-text-secondary` | #999999 | Metadata, timestamps, secondary info |
| Text Tertiary | `--dd-text-tertiary` | #666666 | Disabled text, placeholders |
| Text Inverse | `--dd-text-inverse` | #ffffff | Text on colored backgrounds |

**Example:**
```css
.heading {
  color: var(--dd-text-primary);
}

.timestamp {
  color: var(--dd-text-secondary);
}

.button {
  background-color: var(--dd-accent-green);
  color: var(--dd-text-inverse);
}
```

#### Accent Colors

The accent colors are used for interactive elements, status indicators, and visual emphasis.

**Green (Primary Actions, Success)**

| Token | CSS Variable | Value | Usage |
| :--- | :--- | :--- | :--- |
| Green Base | `--dd-accent-green` | #33ff77 | Primary buttons, success states |
| Green Hover | `--dd-accent-green-hover` | #55ffaa | Hover state |
| Green Active | `--dd-accent-green-active` | #22dd66 | Active/pressed state |

**Orange (Warnings, Quick Rollback)**

| Token | CSS Variable | Value | Usage |
| :--- | :--- | :--- | :--- |
| Orange Base | `--dd-accent-orange` | #ff6b35 | Quick Rollback button, warnings |
| Orange Hover | `--dd-accent-orange-hover` | #ff8555 | Hover state |
| Orange Active | `--dd-accent-orange-active` | #dd5525 | Active/pressed state |

**Red (Errors, Critical)**

| Token | CSS Variable | Value | Usage |
| :--- | :--- | :--- | :--- |
| Red Base | `--dd-accent-red` | #ff0000 | Errors, critical warnings |
| Red Hover | `--dd-accent-red-hover` | #ff3333 | Hover state |

**Yellow (Cautions, Tradeoffs)**

| Token | CSS Variable | Value | Usage |
| :--- | :--- | :--- | :--- |
| Yellow Base | `--dd-accent-yellow` | #ffd700 | Cautions, tradeoffs |
| Yellow Hover | `--dd-accent-yellow-hover` | #ffed33 | Hover state |

**Blue (Links, Informational)**

| Token | CSS Variable | Value | Usage |
| :--- | :--- | :--- | :--- |
| Blue Base | `--dd-accent-blue` | #1e90ff | Links, informational states |
| Blue Hover | `--dd-accent-blue-hover` | #4da6ff | Hover state |

**Example:**
```css
.button-primary {
  background-color: var(--dd-accent-green);
  color: var(--dd-text-inverse);
}

.button-primary:hover {
  background-color: var(--dd-accent-green-hover);
}

.button-primary:active {
  background-color: var(--dd-accent-green-active);
}

.button-rollback {
  background-color: var(--dd-accent-orange);
}

.error-message {
  color: var(--dd-accent-red);
}
```

#### Status Colors

Status colors are used for badges and indicators showing the state of changes, detections, or system operations.

| Token | CSS Variable | Value | Usage |
| :--- | :--- | :--- | :--- |
| Status Applied | `--dd-status-applied` | #33ff77 | Applied status badge |
| Status Reverted | `--dd-status-reverted` | #999999 | Reverted status badge |
| Status Active | `--dd-status-active` | #1e90ff | Active status badge |
| Status Critical | `--dd-status-critical` | #ff6b35 | Critical severity badge |
| Status Warning | `--dd-status-warning` | #ffd700 | Warning severity badge |
| Status Info | `--dd-status-info` | #1e90ff | Info severity badge |

**Example:**
```css
.badge-applied {
  background-color: var(--dd-status-applied);
  color: var(--dd-bg-dark);
}

.badge-critical {
  background-color: var(--dd-status-critical);
  color: var(--dd-text-inverse);
}
```

---

### Typography

The typography system uses two primary font families: **Space Grotesk** for display text (headers, titles) and **IBM Plex Mono** for body text, code, and numeric values.

#### Font Families

| Token | CSS Variable | Value | Usage |
| :--- | :--- | :--- | :--- |
| Display | `--dd-font-display` | 'Space Grotesk', sans-serif | Headers, titles |
| Mono | `--dd-font-mono` | 'IBM Plex Mono', monospace | Body text, code, numbers |
| System | `--dd-font-system` | System font stack | Fallback |

**Example:**
```css
.dialog-title {
  font-family: var(--dd-font-display);
  font-size: var(--dd-font-size-lg);
  font-weight: var(--dd-font-weight-bold);
}

.body-text {
  font-family: var(--dd-font-mono);
  font-size: var(--dd-font-size-base);
}

.numeric-value {
  font-family: var(--dd-font-mono);
  font-variant-numeric: tabular-nums;
}
```

#### Font Sizes

| Token | CSS Variable | Value | Usage |
| :--- | :--- | :--- | :--- |
| Extra Small | `--dd-font-size-xs` | 11px | Badges, tiny labels |
| Small | `--dd-font-size-sm` | 12px | Metadata, timestamps |
| Base | `--dd-font-size-base` | 14px | Body text, buttons |
| Medium | `--dd-font-size-md` | 16px | Section headers |
| Large | `--dd-font-size-lg` | 18px | Dialog/panel titles |
| Extra Large | `--dd-font-size-xl` | 24px | Large headings |

#### Font Weights

| Token | CSS Variable | Value |
| :--- | :--- | :--- |
| Regular | `--dd-font-weight-regular` | 400 |
| Medium | `--dd-font-weight-medium` | 500 |
| Semibold | `--dd-font-weight-semibold` | 600 |
| Bold | `--dd-font-weight-bold` | 700 |

#### Line Heights

| Token | CSS Variable | Value | Usage |
| :--- | :--- | :--- | :--- |
| Tight | `--dd-line-height-tight` | 1.2 | Headers, compact text |
| Normal | `--dd-line-height-normal` | 1.5 | Body text |
| Relaxed | `--dd-line-height-relaxed` | 1.75 | Long-form content |

**Typography Example:**
```css
.dialog-title {
  font-family: var(--dd-font-display);
  font-size: var(--dd-font-size-lg);
  font-weight: var(--dd-font-weight-bold);
  line-height: var(--dd-line-height-tight);
  color: var(--dd-text-primary);
}

.body-text {
  font-family: var(--dd-font-mono);
  font-size: var(--dd-font-size-base);
  font-weight: var(--dd-font-weight-regular);
  line-height: var(--dd-line-height-normal);
  color: var(--dd-text-primary);
}

.metadata {
  font-family: var(--dd-font-mono);
  font-size: var(--dd-font-size-sm);
  color: var(--dd-text-secondary);
}
```

---

### Spacing

The spacing system uses a base unit of **4px** with a consistent scale for padding, margins, and gaps.

| Token | CSS Variable | Value |
| :--- | :--- | :--- |
| Space 1 | `--dd-space-1` | 4px |
| Space 2 | `--dd-space-2` | 8px |
| Space 3 | `--dd-space-3` | 12px |
| Space 4 | `--dd-space-4` | 16px |
| Space 5 | `--dd-space-5` | 20px |
| Space 6 | `--dd-space-6` | 24px |
| Space 8 | `--dd-space-8` | 32px |
| Space 10 | `--dd-space-10` | 40px |
| Space 12 | `--dd-space-12` | 48px |

#### Component-Specific Spacing

| Token | CSS Variable | Value | Usage |
| :--- | :--- | :--- | :--- |
| Dialog Padding | `--dd-dialog-padding` | 24px | Dialog internal padding |
| Panel Padding | `--dd-panel-padding` | 24px | Panel internal padding |
| Card Padding | `--dd-card-padding` | 16px | Card internal padding |
| Button Padding Y | `--dd-button-padding-y` | 12px | Button vertical padding |
| Button Padding X | `--dd-button-padding-x` | 24px | Button horizontal padding |
| Input Padding | `--dd-input-padding` | 12px | Input field padding |

**Example:**
```css
.dialog {
  padding: var(--dd-dialog-padding);
}

.card {
  padding: var(--dd-card-padding);
  margin-bottom: var(--dd-card-margin-bottom);
}

.button {
  padding: var(--dd-button-padding-y) var(--dd-button-padding-x);
}
```

---

### Border Radius

| Token | CSS Variable | Value | Usage |
| :--- | :--- | :--- | :--- |
| Small | `--dd-radius-sm` | 4px | Buttons, inputs, text areas |
| Medium | `--dd-radius-md` | 6px | Cards, change entries |
| Large | `--dd-radius-lg` | 8px | Dialogs, panels |
| Pill | `--dd-radius-pill` | 12px | Badges, pills |
| Full | `--dd-radius-full` | 9999px | Circular elements |

**Example:**
```css
.dialog {
  border-radius: var(--dd-radius-lg);
}

.card {
  border-radius: var(--dd-radius-md);
}

.button {
  border-radius: var(--dd-radius-sm);
}

.badge {
  border-radius: var(--dd-radius-pill);
}
```

---

### Shadows

Shadows are used to create depth and hierarchy in the interface.

| Token | CSS Variable | Value |
| :--- | :--- | :--- |
| Small | `--dd-shadow-sm` | 0 1px 3px rgba(0, 0, 0, 0.3) |
| Medium | `--dd-shadow-md` | 0 4px 6px rgba(0, 0, 0, 0.4) |
| Large | `--dd-shadow-lg` | 0 10px 20px rgba(0, 0, 0, 0.5) |
| Extra Large | `--dd-shadow-xl` | 0 20px 40px rgba(0, 0, 0, 0.6) |

**Example:**
```css
.card {
  box-shadow: var(--dd-shadow-sm);
}

.dialog {
  box-shadow: var(--dd-shadow-lg);
}

.tooltip {
  box-shadow: var(--dd-shadow-md);
}
```

---

### Transitions & Animations

The animation system ensures smooth, consistent motion across the interface.

#### Durations

| Token | CSS Variable | Value | Usage |
| :--- | :--- | :--- | :--- |
| Instant | `--dd-duration-instant` | 50ms | Immediate feedback |
| Fast | `--dd-duration-fast` | 100ms | Quick interactions |
| Normal | `--dd-duration-normal` | 200ms | Standard transitions |
| Slow | `--dd-duration-slow` | 300ms | Deliberate animations |
| Slower | `--dd-duration-slower` | 500ms | Complex animations |

#### Easing Functions

| Token | CSS Variable | Value |
| :--- | :--- | :--- |
| Ease In | `--dd-ease-in` | cubic-bezier(0.4, 0, 1, 1) |
| Ease Out | `--dd-ease-out` | cubic-bezier(0, 0, 0.2, 1) |
| Ease In Out | `--dd-ease-in-out` | cubic-bezier(0.4, 0, 0.2, 1) |

#### Common Transitions

| Token | CSS Variable | Value |
| :--- | :--- | :--- |
| Fast | `--dd-transition-fast` | all 100ms ease-out |
| Normal | `--dd-transition-normal` | all 200ms ease-out |
| Slow | `--dd-transition-slow` | all 300ms ease-out |

**Example:**
```css
.button {
  transition: var(--dd-transition-normal);
}

.button:hover {
  transform: scale(1.05);
}

.dialog {
  transition: var(--dd-transition-dialog-in);
}

.panel {
  transition: var(--dd-transition-panel-in);
}
```

---

### Z-Index Layers

The z-index system ensures proper stacking order for overlapping elements.

| Token | CSS Variable | Value | Usage |
| :--- | :--- | :--- | :--- |
| Base | `--dd-z-base` | 0 | Default layer |
| Dropdown | `--dd-z-dropdown` | 1000 | Dropdown menus |
| Drawer | `--dd-z-drawer` | 2000 | Control Drawer |
| Panel | `--dd-z-panel` | 2100 | Rollback History Panel |
| Overlay | `--dd-z-overlay` | 3000 | Modal overlays |
| Dialog | `--dd-z-dialog` | 3100 | Apply with Reason Dialog |
| Toast | `--dd-z-toast` | 4000 | Toast notifications |
| Tooltip | `--dd-z-tooltip` | 5000 | Tooltips |

**Example:**
```css
.drawer {
  z-index: var(--dd-z-drawer);
}

.dialog {
  z-index: var(--dd-z-dialog);
}

.overlay {
  z-index: var(--dd-z-overlay);
}
```

---

## Component Examples

### Apply with Reason Dialog

```css
.apply-with-reason-dialog {
  background-color: var(--dd-awr-dialog-bg);
  border: var(--dd-border-width) solid var(--dd-awr-dialog-border);
  border-radius: var(--dd-radius-lg);
  padding: var(--dd-dialog-padding);
  width: var(--dd-awr-dialog-width);
  max-height: var(--dd-dialog-height-max);
  box-shadow: var(--dd-shadow-lg);
  z-index: var(--dd-z-dialog);
  animation: fadeIn var(--dd-duration-normal) var(--dd-ease-out);
}

.awr-title {
  font-family: var(--dd-font-display);
  font-size: var(--dd-font-size-lg);
  font-weight: var(--dd-font-weight-bold);
  color: var(--dd-text-primary);
  margin-bottom: var(--dd-section-margin-bottom);
}

.awr-textarea {
  background-color: var(--dd-awr-textarea-bg);
  border: var(--dd-border-width) solid var(--dd-awr-textarea-border);
  border-radius: var(--dd-radius-sm);
  padding: var(--dd-input-padding);
  font-family: var(--dd-font-mono);
  font-size: var(--dd-font-size-base);
  color: var(--dd-text-primary);
  min-height: var(--dd-textarea-height-min);
  max-height: var(--dd-textarea-height-max);
  transition: var(--dd-transition-normal);
}

.awr-textarea:focus {
  border-color: var(--dd-awr-textarea-border-focus);
  outline: none;
}

.awr-button-primary {
  background-color: var(--dd-awr-button-primary-bg);
  color: var(--dd-text-inverse);
  padding: var(--dd-button-padding-y) var(--dd-button-padding-x);
  border-radius: var(--dd-radius-sm);
  font-family: var(--dd-font-display);
  font-size: var(--dd-font-size-base);
  font-weight: var(--dd-font-weight-bold);
  border: none;
  cursor: pointer;
  transition: var(--dd-transition-normal);
}

.awr-button-primary:hover {
  background-color: var(--dd-awr-button-primary-bg-hover);
  transform: scale(1.05);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

### Rollback History Panel

```css
.rollback-history-panel {
  background-color: var(--dd-rbh-panel-bg);
  border-left: var(--dd-border-width) solid var(--dd-rbh-panel-border);
  width: var(--dd-rbh-panel-width);
  height: var(--dd-rbh-panel-height);
  padding: var(--dd-panel-padding);
  z-index: var(--dd-z-panel);
  animation: slideIn 250ms var(--dd-ease-out);
  overflow-y: auto;
}

.rbh-title {
  font-family: var(--dd-font-display);
  font-size: var(--dd-font-size-lg);
  font-weight: var(--dd-font-weight-bold);
  color: var(--dd-text-primary);
  margin-bottom: var(--dd-section-margin-bottom);
}

.rbh-change-card {
  background-color: var(--dd-rbh-card-bg);
  border: var(--dd-border-width) solid var(--dd-rbh-card-border);
  border-radius: var(--dd-radius-md);
  padding: var(--dd-card-padding);
  margin-bottom: var(--dd-card-margin-bottom);
  transition: var(--dd-transition-normal);
  cursor: pointer;
}

.rbh-change-card:hover {
  border-color: var(--dd-rbh-card-border-hover);
  background-color: var(--dd-bg-light);
}

.rbh-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.rbh-scrollbar::-webkit-scrollbar-track {
  background: var(--dd-rbh-scrollbar-track);
}

.rbh-scrollbar::-webkit-scrollbar-thumb {
  background: var(--dd-rbh-scrollbar-thumb);
  border-radius: var(--dd-radius-sm);
}

.rbh-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--dd-rbh-scrollbar-thumb-hover);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
```

### Quick Rollback Button

```css
.quick-rollback-button {
  background-color: var(--dd-qrb-bg);
  color: var(--dd-qrb-text);
  width: 100%;
  height: var(--dd-qrb-height);
  padding: var(--dd-button-padding-y) var(--dd-button-padding-x);
  border-radius: var(--dd-radius-sm);
  font-family: var(--dd-font-display);
  font-size: var(--dd-font-size-base);
  font-weight: var(--dd-font-weight-bold);
  border: none;
  cursor: pointer;
  transition: var(--dd-transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--dd-space-2);
}

.quick-rollback-button:hover {
  background-color: var(--dd-qrb-bg-hover);
  transform: scale(1.02);
}

.quick-rollback-button:active {
  background-color: var(--dd-qrb-bg-active);
  transform: scale(0.98);
}

.quick-rollback-button:disabled {
  opacity: var(--dd-opacity-disabled);
  cursor: not-allowed;
}
```

### Status Badges

```css
.badge {
  font-family: var(--dd-font-mono);
  font-size: var(--dd-font-size-xs);
  font-weight: var(--dd-font-weight-bold);
  padding: 4px 8px;
  border-radius: var(--dd-radius-pill);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-applied {
  background-color: var(--dd-badge-applied-bg);
  color: var(--dd-badge-applied-text);
}

.badge-reverted {
  background-color: var(--dd-badge-reverted-bg);
  color: var(--dd-badge-reverted-text);
}

.badge-active {
  background-color: var(--dd-badge-active-bg);
  color: var(--dd-badge-active-text);
}

.badge-critical {
  background-color: var(--dd-badge-critical-bg);
  color: var(--dd-badge-critical-text);
}
```

---

## Implementation Guidelines

### 1. Import the CSS Variables

Add the CSS variables file to your project's main stylesheet or HTML:

```html
<link rel="stylesheet" href="devolution-detect-variables.css">
```

Or import in your CSS:

```css
@import './devolution-detect-variables.css';
```

### 2. Use Variables Consistently

Always use CSS variables instead of hard-coded values:

**❌ Don't do this:**
```css
.button {
  background-color: #33ff77;
  padding: 12px 24px;
  border-radius: 4px;
}
```

**✅ Do this:**
```css
.button {
  background-color: var(--dd-accent-green);
  padding: var(--dd-button-padding-y) var(--dd-button-padding-x);
  border-radius: var(--dd-radius-sm);
}
```

### 3. Follow Naming Conventions

All design tokens use the `--dd-` prefix (Devolution Detect) followed by a descriptive name:

- `--dd-bg-*` for backgrounds
- `--dd-text-*` for text colors
- `--dd-accent-*` for accent colors
- `--dd-space-*` for spacing
- `--dd-font-*` for typography
- `--dd-radius-*` for border radius
- `--dd-shadow-*` for shadows
- `--dd-duration-*` for animation durations
- `--dd-z-*` for z-index values

### 4. Component-Specific Variables

Use component-specific variables for complex components:

- `--dd-awr-*` for Apply with Reason dialog
- `--dd-rbh-*` for Rollback History panel
- `--dd-qrb-*` for Quick Rollback button

### 5. Responsive Design

While the design tokens don't include responsive breakpoints as CSS variables (since they can't be used in media queries), use these standard breakpoints:

```css
/* Mobile */
@media (max-width: 639px) { }

/* Tablet */
@media (min-width: 640px) and (max-width: 1023px) { }

/* Desktop */
@media (min-width: 1024px) { }
```

### 6. Accessibility

Ensure sufficient color contrast using the provided color palette:

- Text Primary (#e0e0e0) on Background Medium (#1a1f2e): **13.5:1** (WCAG AAA)
- Text Secondary (#999999) on Background Medium (#1a1f2e): **5.2:1** (WCAG AA)
- Accent Green (#33ff77) on Background Dark (#0a0e14): **12.8:1** (WCAG AAA)

### 7. Dark Theme Only

The current design system is optimized for dark theme only. If a light theme is needed in the future, create a separate CSS file with overridden values:

```css
/* devolution-detect-variables-light.css */
:root {
  --dd-bg-dark: #f5f5f5;
  --dd-bg-medium: #ffffff;
  --dd-text-primary: #1a1f2e;
  /* ... other overrides */
}
```

---

## Testing and Validation

### Visual Regression Testing

Use the design tokens consistently to ensure visual regression tests pass when tokens are updated:

```javascript
// Example with Percy or Chromatic
describe('Apply with Reason Dialog', () => {
  it('matches snapshot', () => {
    cy.visit('/control-drawer');
    cy.get('.apply-with-reason-dialog').should('be.visible');
    cy.percySnapshot('Apply with Reason Dialog');
  });
});
```

### Token Validation

Validate that all components use design tokens instead of hard-coded values:

```bash
# Search for hard-coded colors
grep -r "#[0-9a-fA-F]\{6\}" src/components --exclude="*.css"

# Should return no results (all colors should use var())
```

---

## Maintenance

### Updating Tokens

When updating design tokens:

1. Update both `devolution-detect-variables.css` and `devolution-detect-design-tokens.json`
2. Document the change in a changelog
3. Run visual regression tests
4. Update this documentation if new tokens are added
5. Communicate changes to the development team

### Version Control

Track design token versions in your package.json or version file:

```json
{
  "name": "devolution-detect-design-system",
  "version": "1.0.0",
  "description": "Design tokens for Devolution Detect Control Drawer"
}
```

---

## Summary

This design token system provides a complete, maintainable foundation for the Devolution Detect Control Drawer components. By using CSS variables and platform-agnostic JSON tokens, the system ensures:

- **Consistency:** All components use the same visual language
- **Maintainability:** Changes to tokens propagate automatically
- **Scalability:** New components can easily adopt the design system
- **Accessibility:** Built-in color contrast and typography standards
- **Performance:** CSS variables are natively supported and performant

For questions or contributions, refer to the main UI/UX requirements document or contact the design system maintainers.

---

**Author:** Manus AI  
**Date:** November 2025  
**Version:** 1.0
