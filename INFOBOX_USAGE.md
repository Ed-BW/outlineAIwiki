# Infobox Feature Documentation

## Overview
The Infobox feature adds Wikipedia-style floating information boxes to Outline documents. These boxes float to the right of the page content (by default) and provide a structured way to display key information about a topic.

## How to Create an Infobox

### Method 1: Using Markdown
Type the following in your document:
```markdown
:::infobox

| Field | Value |
|-------|-------|
| Type | AI Tool |
| Status | Live |
| Developer | Example Corp |

:::
```

### Method 2: Using the Editor Shortcut
Type `:::infobox` and press Enter. This will automatically create a 2x2 table inside an infobox container.

## Infobox Structure

The infobox is essentially a table wrapped in a special container that provides the floating behavior. You can add:
- Headers (use the first row)
- Key-value pairs (most common usage)
- Images or other content

### Example with Header
```markdown
:::infobox

| Tool Name |
|-----------|
| **Type** | Clinical AI |
| **Status** | Pilot |
| **Founded** | 2022 |

:::
```

## Features

### Floating Behavior
- **Default**: Floats to the right with text wrapping around it
- **Width**: Fixed at 280px for consistency
- **Responsive**: On mobile devices (< 768px), infoboxes become full-width and don't float

### Styling
- Light background to distinguish from main content
- Subtle border for definition
- Smaller font size (90% of body text)
- First column is styled as labels (bold, secondary color)

### Table Features
Within the infobox, you can:
- Add/remove rows and columns
- Resize columns (though the overall width stays at 280px)
- Use all standard table editing features

## Best Practices

1. **Keep it concise**: Infoboxes are for quick reference information
2. **Use consistent field names**: Helps users scan multiple pages
3. **Place at the top**: Usually positioned at the beginning of a document
4. **Key information only**: Don't duplicate content from the main text

## Common Fields for Different Types

### For Organizations/Companies
- Type
- Founded
- Status
- Headquarters
- Website
- Key People

### For Software/Tools
- Type
- Developer
- License
- Platform
- Version
- Website

### For Government AI Tools
- Use Case
- Status
- Organisation
- AI Methods
- Owning Team
- Contact

## Technical Implementation

The infobox is implemented as:
1. A custom ProseMirror node type (`Infobox`)
2. A custom view (`InfoboxView`) that handles the floating container
3. CSS styles in the editor stylesheet
4. Markdown parser/serializer support for `:::infobox` syntax

## Limitations

- Tables inside infoboxes don't support full-width layout
- Complex nested content may not render correctly
- Print styling maintains the float behavior

## Building and Testing

After making changes to the infobox implementation:

1. Build the project:
```bash
yarn build
```

2. Test in development:
```bash
yarn dev
```

3. Create a test document with an infobox to verify:
   - Floating behavior works
   - Table editing functions properly
   - Markdown import/export preserves the structure

## File Locations

- Node definition: `/shared/editor/nodes/Infobox.ts`
- View component: `/shared/editor/nodes/InfoboxView.ts`
- CSS styles: `/shared/editor/components/Styles.ts` (lines 1838-1918)
- Markdown rule: `/shared/editor/rules/infobox.ts`
- Registration: `/shared/editor/nodes/index.ts`