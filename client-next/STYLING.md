# Tailwind CSS Styling Guide

## Overview

This project uses Tailwind CSS for all styling. Tailwind allows us to build consistent, responsive designs with utility classes directly in our markup.

## Color Scheme

We've defined custom colors in our Tailwind configuration:

```js
colors: {
  'faceit-orange': '#FF5500',
  'faceit-dark': '#1F1F22',
  'level-1': '#AFAFAF', // Grey
  'level-2-3': '#4CBB17', // Green
  'level-4-7': '#3498db', // Blue
  'level-8-9': '#9b59b6', // Purple
  'level-10': '#F05A28', // Orange
  'gray-750': '#2D3748', // Additional gray shade
}
```

## Skill Level Colors

Skill levels in FaceIt have specific colors that we use consistently:

- Level 1: Grey (`text-level-1`, `bg-level-1`)
- Levels 2-3: Green (`text-level-2-3`, `bg-level-2-3`)
- Levels 4-7: Blue (`text-level-4-7`, `bg-level-4-7`)
- Levels 8-9: Purple (`text-level-8-9`, `bg-level-8-9`)
- Level 10: Orange (`text-level-10`, `bg-level-10`)

## CSS Best Practices

1. Use Tailwind utility classes directly in your JSX instead of custom CSS classes
2. For dynamic styling, use inline styles with style objects when necessary
3. For complex styling, use the @apply directive sparingly
4. Use the Tailwind theme configuration for customization
5. Organize class names by grouping related properties together:
   - Layout (display, position)
   - Box model (width, height, margin, padding)
   - Typography (font, text)
   - Visual (colors, backgrounds, borders)
   - Interactive (transitions, animations)

## Examples

### Button Styling
```jsx
<button className="px-4 py-2 bg-faceit-orange text-white font-medium rounded-md hover:bg-orange-600 transition-colors duration-200">
  Button Text
</button>
```

### Card Styling
```jsx
<div className="bg-gray-800 p-6 rounded-lg shadow-lg">
  <h3 className="text-lg font-medium mb-3">Card Title</h3>
  {/* Card content */}
</div>
```

### Dynamic Styling
```jsx
<div 
  className="h-full rounded-full" 
  style={{ 
    width: `${progressPercent}%`,
    backgroundColor: levelColor 
  }}
/>
```

## Important Note on Dynamic Classes

Tailwind uses a Just-In-Time (JIT) compiler that scans your code for class names at build time. This means that dynamically composed class names (using string interpolation) won't work as expected:

```jsx
// This won't work with Tailwind JIT
<div className={`bg-${dynamicColor}`}>...</div>
```

For dynamic styling based on variables, use inline styles instead:

```jsx
// This is the correct approach for dynamic colors
<div style={{ backgroundColor: dynamicColorValue }}>...</div>
```

In our project, we use inline styles for the skill level colors since they change based on the player's level. 