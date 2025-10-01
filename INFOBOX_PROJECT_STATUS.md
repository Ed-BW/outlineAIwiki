# Infobox Feature - Project Status

**Last Updated:** 2025-10-01
**Objective:** Create a Wikipedia-style floating infobox system that works on any page and is fully editable

---

## Current Status: IN PROGRESS

### What's Working Now ✅
- **Hardcoded TORTUS infobox** showing on TORTUS page only
- Located in: `/Users/e/Projects/outlineAIwiki/app/scenes/Document/components/Editor.tsx` (lines 189-261)
- Styled components defined (lines 334-410)
- Visual design proven: floats right, 300px wide, dark mode support, responsive
- Detection logic: `document.title?.toLowerCase().includes("tortus")`

### What's NOT Working ❌
- **Not reusable** - hardcoded for TORTUS only
- **Not editable** - data is hardcoded in React component
- **Not persistent** - changes require code modifications
- **Not scalable** - would need separate code for each page

---

## Architecture Attempts & Lessons Learned

### Attempt 1: CSS-only approach with HTML divs
- **File:** `shared/editor/components/Styles.ts` (lines 2007-2075)
- **Status:** FAILED
- **Reason:** ProseMirror schema strips arbitrary HTML divs
- **Learning:** Need a proper ProseMirror node type

### Attempt 2: Enable HTML in markdown parser
- **File:** `shared/editor/lib/markdown/rules.ts` (line 21)
- **Changed:** `html: false` → `html: true`
- **Status:** INSUFFICIENT
- **Reason:** ProseMirror still needs schema definition for divs

### Attempt 3: Create HTMLBlock node
- **Files:**
  - `shared/editor/nodes/HTMLBlock.ts` (created)
  - `shared/editor/rules/htmlblock.ts` (created)
  - Added to `shared/editor/nodes/index.ts`
- **Status:** INCOMPLETE
- **Reason:** Markdown-it plugin didn't properly parse nested content
- **Learning:** Need different approach for container nodes

### Attempt 4: Hardcoded React component (CURRENT)
- **File:** `app/scenes/Document/components/Editor.tsx`
- **Status:** WORKING BUT TEMPORARY
- **Purpose:** Prove visual concept works while building real solution

---

## Next Steps: Proper Solution

### Phase 1: Create Infobox ProseMirror Node ⏳
**Goal:** Make infobox a first-class editor node type like Table or Notice

**Tasks:**
1. [ ] Create `shared/editor/nodes/Infobox.ts` node definition
   - Define schema with fields (type, developer, status, etc.)
   - Support parseDOM for loading existing infoboxes
   - Support toDOM for rendering
   - Markdown serialization/parsing

2. [ ] Create `shared/editor/components/InfoboxComponent.tsx`
   - React component for rendering the infobox
   - Editable fields with click-to-edit functionality
   - Use NodeView API for integration

3. [ ] Add Infobox to extensions list
   - Enable in `shared/editor/nodes/index.ts`
   - Add to richExtensions array

### Phase 2: Make It Insertable 🔲
**Goal:** Add infobox to slash menu

**Tasks:**
1. [ ] Create insert command in Infobox.ts
   - Add to commands() method
   - Define default empty structure

2. [ ] Add menu item
   - Check how Notice/Table adds menu items
   - Add "Infobox" to slash menu options

### Phase 3: Make Fields Editable 🔲
**Goal:** Click any field to edit in-place

**Tasks:**
1. [ ] Implement NodeView for interactive editing
   - Each field should be editable
   - Update ProseMirror state on changes

2. [ ] Add field management
   - Add/remove fields
   - Reorder fields
   - Image upload for logo

### Phase 4: Remove Hardcoded Version 🔲
**Goal:** Clean up temporary code

**Tasks:**
1. [ ] Remove hardcoded infobox from Editor.tsx
2. [ ] Remove unused styled components
3. [ ] Update TORTUS document to use new infobox node

---

## Key Files Reference

### Core Editor Files
- `app/scenes/Document/components/Editor.tsx` - Main document editor component (TEMP hardcoded infobox here)
- `app/editor/index.tsx` - Base editor implementation
- `shared/editor/nodes/index.ts` - Node registry (add new nodes here)

### Existing Similar Nodes (Reference)
- `shared/editor/nodes/Table.ts` - Complex editable node with cells
- `shared/editor/nodes/Notice.ts` - Simpler container node with styling
- `shared/editor/nodes/Embed.ts` - Node with interactive component

### Styling
- `shared/editor/components/Styles.ts` - Global editor CSS (infobox CSS at lines 2007-2075)
- Styled components in individual React files

### Document Storage
- Documents stored in database via Outline API
- Content is ProseMirror JSON + Markdown
- API endpoint: `https://outlineaiwiki-production-c240.up.railway.app/api/`

---

## Technical Constraints

1. **ProseMirror Schema:** Must define all node types explicitly
2. **Markdown Round-trip:** Must serialize to/from markdown cleanly
3. **React Integration:** NodeViews for interactive components
4. **Theme Support:** Must work in light/dark mode
5. **Responsive:** Must adapt to mobile screens

---

## Success Criteria

✅ Can insert infobox on any page via `/infobox` command
✅ Can edit all fields in-place (no code changes needed)
✅ Fields persist across page reloads
✅ Floats right on desktop, full-width on mobile
✅ Works in both light and dark themes
✅ Exports to markdown properly
✅ Can have multiple infoboxes on one page

---

## Current Working Directory
`/Users/e/Projects/outlineAIwiki`

## Deployment
- **Platform:** Railway
- **Build time:** ~90-95 seconds
- **URL:** Check Railway dashboard for live URL
- **Dockerfile:** Uses multi-stage build (builder + runner)

---

## Notes

- Railway was deploying from old commits - FIXED by updating Dockerfile to build from source
- Test banner (red/cyan) was used to verify React changes deploy correctly
- Table of contents navigation was broken - FIXED by adding onClick handler with scrollIntoView
- Dark mode support added to all infobox styling

---

## Next Session Reminder

**BEFORE starting work:**
1. Read this file completely
2. Check what phase we're in
3. Review what's been attempted before
4. Don't repeat failed approaches

**AFTER completing work:**
1. Update this file with progress
2. Mark completed tasks with [x]
3. Add any new learnings
4. Note any blockers encountered
