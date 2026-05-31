# 2026-05-24 — Chart Images: Drag-and-Drop + Copy-Paste Upload

## What Changed

### New shared component — `ChartImageSlot.jsx`

Created `frontend/src/components/analysis/ChartImageSlot.jsx` to replace the local
`ImageSlot` component in `AnalysisForm.jsx` and the inline image rendering in
`AnalysisDetailPage.jsx`. All three upload paths are handled in one place:

| Path | How it works |
|---|---|
| **Browse** | Click an empty slot (opens file picker) or "Replace" button on a filled slot |
| **Drag-and-drop** | Drag any JPG/PNG/WEBP file onto any slot — empty or filled (replace) |
| **Paste (clipboard)** | Click a slot to select it (brand ring appears), then Ctrl+V / ⌘V |

#### Paste coordination — one slot at a time

A `CustomEvent` named `chartSlot:select` is dispatched on `window` whenever a slot is
activated. All four siblings listen for this event and deselect themselves when
`event.detail !== slot`. This keeps exactly one slot "paste-ready" at a time without
needing a shared parent state or context.

The paste `window` event listener is only registered while `isSelected === true` and
removed immediately on deselect — so pasting outside a selected slot is a no-op.

Deselection happens automatically on:
- Pressing **Escape**
- Clicking anywhere **outside** the slot container (`mousedown` on document)
- A **sibling slot** being selected (via the CustomEvent)
- The **upload completing** successfully

#### Drag-leave guard

`onDragLeave` uses `e.relatedTarget` against `containerRef.current.contains()` to avoid
flickering when the pointer passes over child elements inside the slot while dragging.

#### File validation (client-side)

`ALLOWED_MIME = Set(['image/jpeg', 'image/png', 'image/webp'])` — checked before the
API call. An error banner appears on the slot (click to dismiss) rather than `alert()`.

The backend already validates extension server-side too (no changes to backend needed).

#### UX states (empty slot)

| State | Visual |
|---|---|
| Default | Dashed grey border, upload icon, "Click to browse · drag or paste" |
| Hover | Dashed brand border, light brand background |
| Drag-over | Solid brand border + ring, "Drop image here" text, scale-up |
| Selected | Solid brand border + ring, "Ctrl+V / ⌘V to paste · Esc to cancel" |
| Uploading | "Uploading…" text spinner |

#### UX states (filled slot)

| State | Visual |
|---|---|
| Default | Image thumbnail, "Chart N" badge top-left |
| Hover | Black overlay, View / Replace / Remove buttons |
| Selected | Brand ring + "Ctrl+V / ⌘V to replace · Esc to cancel" footer bar; hover shows Browse / Remove buttons |
| Drag-over | Brand overlay + "Drop to replace" label, backdrop blur |

### Files modified

- **Created**: `frontend/src/components/analysis/ChartImageSlot.jsx`
- **`AnalysisForm.jsx`**: removed local `ImageSlot` + `useRef`, `PhotoIcon`, `XMarkIcon`,
  `uploadAnalysisImage`, `deleteAnalysisImage` imports; replaced with `<ChartImageSlot>`;
  updated hint text
- **`AnalysisDetailPage.jsx`**: added `ChartImageSlot` import; replaced inline chart image
  rendering (filled slot + empty `<label>`) with `<ChartImageSlot>`; added hint text

### No backend changes

The existing `POST /analyses/{id}/images/{slot}` endpoint already accepts multipart file
uploads. Drag-and-drop and clipboard paste both produce `File` objects on the client that
are sent via `FormData` exactly like a file-browser selection — no new endpoints needed.

## Why

Users frequently have chart screenshots on their clipboard from trading platforms and wanted
to paste them directly rather than navigating the file browser. Drag-and-drop support was
also missing, making it cumbersome when images are already arranged in a file explorer.
Both workflows are common in trading analysis tools.
