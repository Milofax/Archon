# PRP: Serious UI-Improvements

## Overview
Cherry-picking premium UI features from archon-fly into the main Archon fork.

## Status
**Phase**: Planning
**Branch**: `feature/serious-ui-improvements`

---

## Phase 1: 3D Card Tilt Effect (Quick Win)

### What
Add interactive 3D perspective transformation to Knowledge Cards on hover.

### Files to Create
1. `archon-ui-main/src/hooks/useCardTilt.ts`
   - Source: `/Volumes/DATEN/Coding/archon-fly/archon-ui-main/src/hooks/useCardTilt.ts`
   - Hook for 3D tilt with reflection, glow tracking, bounce animation

### Files to Modify
2. `archon-ui-main/src/features/knowledge/components/KnowledgeCard.tsx`
   - Replace framer-motion `whileHover={{ scale: 1.02 }}` with useCardTilt hook
   - Add card-reflection div overlay
   - Wire up tilt handlers

### Already Present
- `card-animations.css` - Already identical to archon-fly

### Effort
~30 minutes

---

## Phase 2: Mermaid Diagram Support

### What
Render Mermaid diagrams (flowcharts, architecture, etc.) in knowledge content.

### Dependencies to Add
```bash
npm install mermaid
```

### Files to Create
1. `archon-ui-main/src/components/content/MermaidRenderer.tsx`
   - Source: archon-fly's `MermaidCDNRenderer.tsx`
   - Dark/light theme support
   - Glassmorphic container styling
   - Loading state, error fallback

### Integration Points
- Knowledge Inspector's `ContentViewer.tsx` - detect and render mermaid blocks
- Future: PRPViewer (Phase 3)

### Effort
~1 hour

---

## Phase 3: Knowledge Detail Modal with Edit Mode

### What
Full-screen modal for viewing/editing knowledge items with:
- **Beautiful** view (formatted PRP/markdown rendering)
- **Markdown** view (raw markdown with syntax highlighting)
- **Edit** mode (WYSIWYG markdown editor)

### Dependencies to Add
```bash
npm install @milkdown/crepe
```

### Files to Create

1. `archon-ui-main/src/components/content/MilkdownEditor.tsx`
   - Source: archon-fly's MilkdownEditor
   - Rich markdown editor with toolbar
   - Save/revert functionality

2. `archon-ui-main/src/components/content/MarkdownRenderer.tsx`
   - Render markdown with syntax highlighting
   - Support for Mermaid blocks (uses Phase 2)
   - Code block copy functionality

3. `archon-ui-main/src/features/knowledge/components/KnowledgeDetailModal.tsx`
   - Source: archon-fly's KnowledgeDetailModal
   - Three-mode toggle (Beautiful/Markdown/Edit)
   - Async loading of detailed summary
   - Glassmorphic header with accent glow

### Backend Changes

4. `python/src/server/api_routes/knowledge_api.py`
   - Add: `GET /api/knowledge/source/{id}/detailed-summary`
   - Add: `POST /api/knowledge/source/{id}/detailed-summary`

5. `python/src/server/services/source_management_service.py`
   - Add: `get_detailed_summary(source_id)`
   - Add: `update_detailed_summary(source_id, content)`

### Database Schema
- `sources` table already has `metadata` JSONB
- Store `detailed_summary` in metadata (no migration needed)

### Effort
~4-6 hours

---

## Implementation Order

```
Phase 1 ──► Phase 2 ──► Phase 3
  │           │           │
  │           │           └─► Knowledge Detail Modal
  │           │               MilkdownEditor
  │           │               Backend API
  │           │
  │           └─► Mermaid Renderer
  │               (standalone, no deps)
  │
  └─► useCardTilt Hook
      (standalone, no deps)
```

---

## Files Summary

### New Files (8)
| File | Phase | LOC Est. |
|------|-------|----------|
| `src/hooks/useCardTilt.ts` | 1 | ~90 |
| `src/components/content/MermaidRenderer.tsx` | 2 | ~150 |
| `src/components/content/MilkdownEditor.tsx` | 3 | ~200 |
| `src/components/content/MilkdownEditor.css` | 3 | ~100 |
| `src/components/content/MarkdownRenderer.tsx` | 3 | ~150 |
| `src/features/knowledge/components/KnowledgeDetailModal.tsx` | 3 | ~250 |
| Backend: knowledge_api.py additions | 3 | ~50 |
| Backend: service additions | 3 | ~40 |

### Modified Files (2)
| File | Phase | Changes |
|------|-------|---------|
| `KnowledgeCard.tsx` | 1 | Add useCardTilt integration |
| `package.json` | 2-3 | Add mermaid, @milkdown/crepe |

---

## Risks & Mitigations

### Risk 1: Milkdown bundle size
- **Impact**: Larger bundle
- **Mitigation**: Lazy load editor component

### Risk 2: Mermaid security
- **Impact**: XSS via diagram code
- **Mitigation**: Use `securityLevel: 'loose'` only for trusted content

### Risk 3: CSS conflicts
- **Impact**: Milkdown styles may conflict
- **Mitigation**: Scoped CSS, test thoroughly

---

## Success Criteria

- [ ] Knowledge cards have interactive 3D tilt on hover
- [ ] Mermaid diagrams render in knowledge content
- [ ] Users can view detailed summaries in Beautiful mode
- [ ] Users can edit detailed summaries with WYSIWYG editor
- [ ] Changes persist to backend
- [ ] No performance regression

---

## Testing Plan

### Phase 1
- Hover over knowledge cards, verify tilt effect
- Click card, verify bounce animation
- Test on different screen sizes

### Phase 2
- Add knowledge item with mermaid diagram
- Verify dark/light theme switching
- Test error fallback with invalid diagram

### Phase 3
- Open knowledge detail modal
- Switch between Beautiful/Markdown/Edit modes
- Edit content, save, verify persistence
- Test with various markdown content (code, lists, tables)
